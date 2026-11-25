const { Op } = require('sequelize');
const { WorkLog, Placement, Student, sequelize } = require('../models');
const S = require('../validation/schemas');
const H = require('../utils/helpers');
const { placementScope, findAccessiblePlacement } = require('../middlewares/access');

// TZ 4: kunlik qayd validatsiyasi (create va update uchun umumiy)
const checkRules = (p, d) => {
  const abs = ['absent_reasoned', 'absent_unreasoned', 'weekend'].includes(d.attendance);
  if (abs && Number(d.hours) !== 0) return 'Kelmagan yoki dam olish kunida soat 0 bo‘lishi kerak';
  if (d.attendance === 'absent_reasoned' && !d.comment) return 'Sababli kelmaganlikda izoh majburiy';
  if (d.attendance === 'present') {
    if (!(Number(d.hours) > 0)) return 'Kelgan kunda soat 0 dan katta bo‘lishi kerak';
    if (!d.task) return 'Bajarilgan vazifani kiriting';
    if (!H.isScheduled(p, d.date) && !d.comment) return 'Jadvaldan tashqari ish kuni uchun izoh majburiy (mentor tasdig‘i ham kerak)';
  }
  return null;
};
const onBehalfOk = (v) => v.onBehalfMentorName && v.onBehalfReason;

exports.createWorkLog = async (req, res) => {
  const v = H.parse(S.workLogCreate, req.body, res); if (!v) return;
  const p = await findAccessiblePlacement(req.user, v.placementId); // intern faqat o'z amaliyotiga
  if (!p) return H.fail(res, 404, 'Amaliyot topilmadi');
  if (p.status !== 'ongoing') return H.fail(res, 400, 'Qayd faqat "Davom etmoqda" holatidagi amaliyotga kiritiladi');
  if (v.date > H.todayStr()) return H.fail(res, 400, 'Kelajak sanaga qayd kiritib bo‘lmaydi');
  if (v.date < p.startDate || v.date > p.endDate) return H.fail(res, 400, 'Sana amaliyot muddati ichida bo‘lishi kerak');
  const rule = checkRules(p, v); if (rule) return H.fail(res, 400, rule);

  const data = {
    placementId: p.id, date: v.date, hours: v.hours, attendance: v.attendance, task: v.task || null,
    resultUrl: v.resultUrl || null, comment: v.comment || null, authorId: req.user.id,
  };
  const coord = req.user.role === 'coordinator';
  if (coord) { // mentorning og'zaki ma'lumoti asosida: mentor nomi va sabab majburiy, "koordinator kiritgan" deb belgilanadi
    if (!onBehalfOk(v)) return H.fail(res, 400, 'Koordinator nomidan kiritishda mentor nomi va sabab majburiy');
    Object.assign(data, { status: 'approved', createdByCoordinator: true, onBehalfMentorName: v.onBehalfMentorName, onBehalfReason: v.onBehalfReason, approvedAt: new Date() });
  } else {
    data.status = v.submit === false ? 'draft' : 'submitted';
  }
  try {
    const log = await sequelize.transaction(async (t) => {
      const l = await WorkLog.create(data, { transaction: t });
      if (coord) {
        await H.recalcApprovedHours(p.id, t);
        await H.audit(req.user.id, 'WORKLOG_ON_BEHALF', { workLogId: l.id, mentor: v.onBehalfMentorName }, v.onBehalfReason, t);
      }
      return l;
    });
    H.ok(res, log, 201);
  } catch (e) {
    if (e.name === 'SequelizeUniqueConstraintError') return H.fail(res, 409, 'Ushbu sanaga qayd allaqachon mavjud');
    throw e;
  }
};

// Qaytarilgan yoki qoralama qaydni amaliyotchi tuzatadi. Tasdiqlangan qaydni bevosita o'zgartirib bo'lmaydi.
exports.updateWorkLog = async (req, res) => {
  const v = H.parse(S.workLogUpdate, req.body, res); if (!v) return;
  const log = await WorkLog.findByPk(req.params.id);
  const p = log && (await findAccessiblePlacement(req.user, log.placementId));
  if (!log || !p) return H.fail(res, 404, 'Qayd topilmadi');
  if (!['draft', 'rejected'].includes(log.status)) return H.fail(res, 403, 'Yuborilgan yoki tasdiqlangan qaydni o‘zgartirib bo‘lmaydi (tuzatish so‘rovi kerak)');
  if (H.versionConflict(log, v.version)) return H.fail(res, 409, H.CONFLICT_MSG);
  const merged = { ...log.toJSON(), ...v, date: log.date };
  const rule = checkRules(p, merged); if (rule) return H.fail(res, 400, rule);
  await log.update({
    hours: merged.hours, attendance: merged.attendance, task: merged.task || null, resultUrl: merged.resultUrl || null, comment: merged.comment || null,
    status: v.submit === false ? 'draft' : 'submitted', rejectionComment: null,
  });
  H.ok(res, log);
};

// Mentor (faqat o'z amaliyotchisi) yoki koordinator (mentor nomi + sabab bilan) tasdiqlaydi
const decide = (kind) => async (req, res) => {
  const v = H.parse(kind === 'approve' ? S.workLogApprove : S.workLogReject, req.body, res); if (!v) return;
  const log = await WorkLog.findByPk(req.params.id);
  const p = log && (await findAccessiblePlacement(req.user, log.placementId));
  if (!log || !p) return H.fail(res, 404, 'Qayd topilmadi');
  if (req.user.role === 'coordinator' && !onBehalfOk(v)) return H.fail(res, 400, 'Koordinator nomidan tasdiqlashda mentor nomi va sabab majburiy');
  if (log.status !== 'submitted') return H.fail(res, 400, 'Faqat "Yuborildi" holatidagi qaydni ko‘rib chiqish mumkin');
  if (H.versionConflict(log, v.version)) return H.fail(res, 409, H.CONFLICT_MSG);

  await sequelize.transaction(async (t) => {
    const by = req.user.role === 'coordinator'
      ? { createdByCoordinator: log.createdByCoordinator, onBehalfMentorName: v.onBehalfMentorName, onBehalfReason: v.onBehalfReason } : {};
    if (kind === 'approve') await log.update({ status: 'approved', approvedById: req.user.id, approvedAt: new Date(), ...by }, { transaction: t });
    else await log.update({ status: 'rejected', rejectionComment: v.comment, ...by }, { transaction: t });
    await H.recalcApprovedHours(log.placementId, t); // o'talgan soat = faqat tasdiqlanganlar yig'indisi
    if (req.user.role === 'coordinator') await H.audit(req.user.id, `WORKLOG_${kind.toUpperCase()}_ON_BEHALF`, { workLogId: log.id, mentor: v.onBehalfMentorName }, v.onBehalfReason, t);
  });
  H.ok(res, log);
};
exports.approveWorkLog = decide('approve');
exports.rejectWorkLog = decide('reject');

exports.getWorkLogs = async (req, res) => {
  const scope = await placementScope(req.user);
  const pWhere = { ...scope };
  if (H.isUuid(req.query.placementId)) pWhere.id = req.query.placementId;
  const ids = (await Placement.findAll({ where: pWhere, attributes: ['id'] })).map((p) => p.id);
  const where = { placementId: ids };
  if (['draft', 'submitted', 'approved', 'rejected'].includes(req.query.status)) where.status = req.query.status;
  if (req.query.from) where.date = { ...(where.date || {}), [Op.gte]: req.query.from };
  if (req.query.to) where.date = { ...(where.date || {}), [Op.lte]: req.query.to };
  const { page, limit, offset } = H.paging(req.query, 50);
  const { count, rows } = await WorkLog.findAndCountAll({
    where, limit, offset, order: [['date', 'DESC']],
    include: [{ model: Placement, as: 'placement', attributes: ['id'], include: [{ model: Student, as: 'student', attributes: ['id', 'fullName'] }] }],
  });
  H.ok(res, rows, 200, H.meta(count, page, limit));
};
