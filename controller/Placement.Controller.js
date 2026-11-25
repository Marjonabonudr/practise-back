const { Placement, Student, Company, User, WorkLog, sequelize } = require('../models');
const S = require('../validation/schemas');
const H = require('../utils/helpers');
const { placementScope, findAccessiblePlacement } = require('../middlewares/access');

const include = [
  { model: Student, as: 'student' },
  { model: Company, as: 'company' },
  { model: User, as: 'mentor', attributes: ['id', 'fullName', 'email', 'phone'] },
];
const ACTIVE = ['placed', 'ongoing', 'paused'];
const STATUSES = ['placed', 'ongoing', 'paused', 'terminated', 'completed'];

// ---------------- YARATISH ----------------
exports.createPlacement = async (req, res) => {
  const v = H.parse(S.placementCreate, req.body, res); if (!v) return;
  if (v.endDate < v.startDate) return H.fail(res, 400, 'Tugash sanasi boshlanishdan oldin bo‘lishi mumkin emas');
  if (H.daysBetween(v.startDate, v.endDate) > 731) return H.fail(res, 400, 'Amaliyot muddati 2 yildan oshmasligi kerak');

  const [student, company, mentor] = await Promise.all([Student.findByPk(v.studentId), Company.findByPk(v.companyId), User.findByPk(v.mentorId)]);
  if (!student || student.status !== 'active') return H.fail(res, 404, 'O‘quvchi topilmadi yoki arxivda');
  if (!company || company.status !== 'active') return H.fail(res, 404, 'Kompaniya topilmadi yoki arxivda');
  if (!mentor || mentor.role !== 'mentor' || mentor.status !== 'active') return H.fail(res, 400, 'Mentor topilmadi yoki faol emas');
  if (mentor.companyId !== company.id) return H.fail(res, 400, 'Mentor tanlangan kompaniyaga biriktirilmagan');

  // TZ: bir vaqtda ikkita faol joylashtirish taqiqlanadi (bazadagi unikal indeks ham himoya qiladi)
  if (await Placement.count({ where: { studentId: student.id, status: ACTIVE } })) {
    return H.fail(res, 409, 'O‘quvchida faol amaliyot mavjud. Avval uni yakunlang yoki to‘xtating.');
  }

  // TZ: jami reja soati jadvaldan hisoblanadi; qo'lda tuzatish uchun sabab majburiy (schema'da)
  const auto = H.computePlannedHours(v);
  if (auto <= 0) return H.fail(res, 400, 'Tanlangan jadval bo‘yicha birorta ish kuni topilmadi');
  const planned = v.plannedHours !== undefined ? v.plannedHours : auto;

  try {
    const p = await sequelize.transaction(async (t) => {
      const created = await Placement.create({
        studentId: v.studentId, companyId: v.companyId, mentorId: v.mentorId,
        startDate: v.startDate, endDate: v.endDate, workDays: v.workDays, dailyHours: v.dailyHours,
        excludedDates: v.excludedDates, format: v.format, goals: v.goals,
        plannedHours: planned, plannedHoursReason: v.plannedHours !== undefined && v.plannedHours !== auto ? v.plannedHoursReason : null,
      }, { transaction: t });
      await H.audit(req.user.id, 'PLACEMENT_CREATE', { placementId: created.id, studentId: v.studentId, plannedHours: planned, autoHours: auto }, 'Amaliyot yaratildi', t);
      return created;
    });
    H.ok(res, H.serializePlacement(await Placement.findByPk(p.id, { include })), 201);
  } catch (e) {
    if (e.name === 'SequelizeUniqueConstraintError') return H.fail(res, 409, 'O‘quvchida faol amaliyot mavjud');
    throw e;
  }
};

// ---------------- RO'YXAT / BITTA (rol bo'yicha cheklangan) ----------------
exports.getPlacements = async (req, res) => {
  const where = { ...(await placementScope(req.user)) };
  if (STATUSES.includes(req.query.status)) where.status = req.query.status;
  if (H.isUuid(req.query.companyId)) where.companyId = req.query.companyId;
  if (H.isUuid(req.query.studentId)) where.studentId = req.query.studentId;
  const { page, limit, offset } = H.paging(req.query, 25, 50);
  const { count, rows } = await Placement.findAndCountAll({ where, include, limit, offset, order: [['createdAt', 'DESC']], distinct: true });
  H.ok(res, rows.map(H.serializePlacement), 200, H.meta(count, page, limit));
};

exports.getPlacementById = async (req, res) => {
  const p = await findAccessiblePlacement(req.user, req.params.id, { include });
  if (!p) return H.fail(res, 404, 'Amaliyot topilmadi');
  H.ok(res, H.serializePlacement(p));
};

// ---------------- HOLAT O'ZGARTIRISH ----------------
const TRANSITIONS = {
  placed: ['ongoing', 'terminated'],
  ongoing: ['paused', 'terminated', 'completed'],
  paused: ['ongoing', 'terminated'],
  completed: ['ongoing'],   // qayta ochish: sabab bilan, faqat koordinator
  terminated: ['ongoing'],
};
exports.updatePlacementStatus = async (req, res) => {
  const v = H.parse(S.placementStatus, req.body, res); if (!v) return;
  const p = await Placement.findByPk(req.params.id);
  if (!p) return H.fail(res, 404, 'Amaliyot topilmadi');
  if (H.versionConflict(p, v.version)) return H.fail(res, 409, H.CONFLICT_MSG);
  if (!TRANSITIONS[p.status].includes(v.status)) return H.fail(res, 400, `"${p.status}" holatidan "${v.status}" holatiga o‘tib bo‘lmaydi`);

  const reopening = ['completed', 'terminated'].includes(p.status);
  if ((['paused', 'terminated'].includes(v.status) || reopening) && !v.reason) {
    return H.fail(res, 400, 'Holatni o‘zgartirish uchun sabab majburiy');
  }
  const changes = { status: v.status, statusReason: v.reason || null, closedAt: ['completed', 'terminated'].includes(v.status) ? new Date() : null };

  if (v.status === 'completed') {
    if (!v.conclusion) return H.fail(res, 400, 'Yakuniy xulosa majburiy');
    if (!p.finalAssessment) return H.fail(res, 400, 'Avval mentor yakuniy baholashni kiritishi kerak');
    const pending = await WorkLog.count({ where: { placementId: p.id, status: 'submitted' } });
    if (pending) return H.fail(res, 400, `${pending} ta tasdiq kutilayotgan qayd bor. Avval ularni ko‘rib chiqing`);
    if (p.approvedHours < p.plannedHours && !v.reason) return H.fail(res, 400, 'Reja soati to‘liq bajarilmagan: yopish sababi majburiy');
    changes.companyConclusion = v.conclusion;
  }
  if (p.status === 'paused' && v.status === 'ongoing') {
    if (!v.newEndDate || v.newEndDate < H.todayStr()) return H.fail(res, 400, 'Davom ettirish uchun yangi tugash sanasi (bugundan keyin) majburiy');
    changes.endDate = v.newEndDate;
    if (v.plannedHours !== undefined) {
      if (!v.reason) return H.fail(res, 400, 'Reja soatini o‘zgartirish sababi majburiy');
      changes.plannedHours = v.plannedHours; changes.plannedHoursReason = v.reason;
    }
  }
  const old = { status: p.status, endDate: p.endDate, plannedHours: p.plannedHours };
  await sequelize.transaction(async (t) => {
    await p.update(changes, { transaction: t });
    await H.audit(req.user.id, 'PLACEMENT_STATUS_CHANGE', { placementId: p.id, old, new: { status: p.status, endDate: p.endDate, plannedHours: p.plannedHours } }, v.reason || `Holat: ${v.status}`, t);
  });
  H.ok(res, H.serializePlacement(await Placement.findByPk(p.id, { include })));
};

// ---------------- ISHGA OLISH (TZ 5-bo'lim) ----------------
const RANK = { not_discussed: 0, under_review: 1, offered: 2, not_offered: 2, accepted: 3, rejected: 3, canceled: 3, started: 4 };
exports.updateHiring = async (req, res) => {
  const v = H.parse(S.placementHiring, req.body, res); if (!v) return;
  const p = await Placement.findByPk(req.params.id);
  if (!p) return H.fail(res, 404, 'Amaliyot topilmadi');
  if (H.versionConflict(p, v.version)) return H.fail(res, 409, H.CONFLICT_MSG);

  if (RANK[v.hiringStatus] < RANK[p.hiringStatus] && !v.reason) return H.fail(res, 400, 'Orqaga o‘zgartirish uchun sabab majburiy');
  const ch = { hiringStatus: v.hiringStatus, hiringNote: v.hiringNote ?? p.hiringNote };
  if (v.hiringStatus === 'offered') {
    const position = v.hiringPosition || p.hiringPosition, offerDate = v.offerDate || p.offerDate;
    if (!position || !offerDate) return H.fail(res, 400, 'Taklif uchun lavozim va taklif sanasi majburiy');
    Object.assign(ch, { hiringPosition: position, offerDate, hiringCompany: v.hiringCompany || p.hiringCompany || (await Company.findByPk(p.companyId)).name });
  }
  if (v.hiringStatus === 'accepted') {
    const acceptDate = v.acceptDate || p.acceptDate;
    if (!acceptDate) return H.fail(res, 400, 'Qabul sanasi majburiy');
    ch.acceptDate = acceptDate;
  }
  if (v.hiringStatus === 'started') {
    const d = v.workStartDate || p.workStartDate;
    if (!d) return H.fail(res, 400, 'Ish boshlagan haqiqiy sana majburiy');
    if (d > H.todayStr()) return H.fail(res, 400, 'Kelajak sanani "Ish boshlagan" deb kiritib bo‘lmaydi');
    // Faqat koordinator tasdiqlagach statistikaga kiradi
    Object.assign(ch, { workStartDate: d, hiringConfirmedById: req.user.id, hiringConfirmedAt: new Date() });
  } else {
    Object.assign(ch, { hiringConfirmedById: null, hiringConfirmedAt: null });
  }
  const old = { hiringStatus: p.hiringStatus };
  await sequelize.transaction(async (t) => {
    await p.update(ch, { transaction: t });
    await H.audit(req.user.id, 'PLACEMENT_HIRING_CHANGE', { placementId: p.id, old, new: { hiringStatus: v.hiringStatus } }, v.reason || 'Ishga olish holati yangilandi', t);
  });
  H.ok(res, H.serializePlacement(await Placement.findByPk(p.id, { include })));
};

// ---------------- MENTOR ALMASHTIRISH ----------------
exports.changeMentor = async (req, res) => {
  const v = H.parse(S.mentorChange, req.body, res); if (!v) return;
  const p = await Placement.findByPk(req.params.id);
  if (!p) return H.fail(res, 404, 'Amaliyot topilmadi');
  if (H.versionConflict(p, v.version)) return H.fail(res, 409, H.CONFLICT_MSG);
  if (!ACTIVE.includes(p.status)) return H.fail(res, 400, 'Faqat faol amaliyotning mentorini almashtirish mumkin');
  const m = await User.findByPk(v.mentorId);
  if (!m || m.role !== 'mentor' || m.status !== 'active' || m.companyId !== p.companyId) return H.fail(res, 400, 'Yangi mentor shu kompaniyaning faol mentori bo‘lishi kerak');
  const old = p.mentorId;
  await sequelize.transaction(async (t) => {
    await p.update({ mentorId: m.id }, { transaction: t }); // eski mentorning kirishi avtomatik yopiladi, yozuv mualliflari saqlanadi
    await H.audit(req.user.id, 'PLACEMENT_MENTOR_CHANGE', { placementId: p.id, oldMentorId: old, newMentorId: m.id }, v.reason, t);
  });
  H.ok(res, H.serializePlacement(await Placement.findByPk(p.id, { include })));
};

// ---------------- YAKUNIY BAHOLASH (mentor) ----------------
exports.setFinalAssessment = async (req, res) => {
  const v = H.parse(S.finalAssessment, req.body, res); if (!v) return;
  const p = await findAccessiblePlacement(req.user, req.params.id); // mentor faqat o'ziga biriktirilganini
  if (!p) return H.fail(res, 404, 'Amaliyot topilmadi');
  if (!['ongoing', 'paused'].includes(p.status)) return H.fail(res, 400, 'Yakuniy baholash faqat faol amaliyot uchun kiritiladi');
  // Yakuniy baho haftalik ballardan avtomatik chiqarilmaydi — mentor o'zi kiritadi
  const { skillsSummary, hireRecommendation, ...scores } = v;
  await p.update({ finalAssessment: { scores, skillsSummary, hireRecommendation, authorId: req.user.id, at: new Date().toISOString() } });
  await H.audit(req.user.id, 'PLACEMENT_FINAL_ASSESSMENT', { placementId: p.id }, 'Mentor yakuniy baholashni kiritdi');
  H.ok(res, H.serializePlacement(p));
};
