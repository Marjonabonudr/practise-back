const { Op } = require('sequelize');
const { WeeklyReport, Placement, Student } = require('../models');
const S = require('../validation/schemas');
const H = require('../utils/helpers');
const { placementScope, findAccessiblePlacement } = require('../middlewares/access');
const rules = require('../utils/rules');

const CRITERIA = ['discipline', 'workQuality', 'deadlineCompliance', 'learningIndependence', 'teamwork'];

// Hafta dushanbadan yakshanbagacha. Faqat amaliyotchi o'z amaliyoti uchun yuboradi.
exports.createWeeklyReport = async (req, res) => {
  const v = H.parse(S.weeklyCreate, req.body, res); if (!v) return;
  const p = await findAccessiblePlacement(req.user, v.placementId);
  if (!p) return H.fail(res, 404, 'Amaliyot topilmadi');
  if (p.status !== 'ongoing') return H.fail(res, 400, 'Hisobot faqat "Davom etmoqda" holatidagi amaliyot uchun yuboriladi');
  if (H.weekday(v.weekStartDate) !== 1) return H.fail(res, 400, 'Hafta boshi dushanba bo‘lishi kerak');
  if (v.weekStartDate > H.todayStr()) return H.fail(res, 400, 'Kelajak haftaga hisobot yuborib bo‘lmaydi');
  if (H.addDays(v.weekStartDate, 6) < p.startDate || v.weekStartDate > p.endDate) return H.fail(res, 400, 'Hafta amaliyot muddatiga tushmaydi');
  try {
    const r = await WeeklyReport.create({
      ...v, submittedAt: new Date(), isLate: new Date() > H.reportDeadline(v.weekStartDate),
    });
    H.ok(res, r, 201);
  } catch (e) {
    if (e.name === 'SequelizeUniqueConstraintError') return H.fail(res, 409, 'Bu hafta uchun hisobot allaqachon yuborilgan');
    throw e;
  }
};

// Mentor (o'z amaliyotchisi) baholaydi; koordinator faqat mentor nomi + sabab bilan
exports.gradeWeeklyReport = async (req, res) => {
  const v = H.parse(S.weeklyGrade, req.body, res); if (!v) return;
  const r = await WeeklyReport.findByPk(req.params.id);
  const p = r && (await findAccessiblePlacement(req.user, r.placementId));
  if (!r || !p) return H.fail(res, 404, 'Hisobot topilmadi');
  if (H.versionConflict(r, v.version)) return H.fail(res, 409, H.CONFLICT_MSG);
  const coord = req.user.role === 'coordinator';
  if (coord && !(v.onBehalfMentorName && v.onBehalfReason)) return H.fail(res, 400, 'Koordinator nomidan baholashda mentor nomi va sabab majburiy');

  const given = CRITERIA.map((k) => v[k]).filter((x) => x !== null && x !== undefined); // "Baholanmadi" (null) nol hisoblanmaydi
  const average = given.length ? H.round1(given.reduce((a, b) => a + b, 0) / given.length) : null; // hammasi bo'sh => baho yo'q
  if (given.some((s) => s <= 2) && !(v.lowScoreReason && v.mentorRecommendation)) {
    return H.fail(res, 400, '1 yoki 2 ball uchun sabab (lowScoreReason) va yaxshilash tavsiyasi (mentorRecommendation) majburiy');
  }
  await r.update({
    ...Object.fromEntries(CRITERIA.map((k) => [k, v[k] ?? null])),
    mentorRecommendation: v.mentorRecommendation || null, lowScoreReason: v.lowScoreReason || null,
    averageScore: average, evaluatedCount: given.length,
    gradedById: req.user.id, gradedAt: new Date(),
    gradedOnBehalfMentor: coord ? v.onBehalfMentorName : null, gradedOnBehalfReason: coord ? v.onBehalfReason : null,
  });
  if (coord) await H.audit(req.user.id, 'WEEKLY_GRADE_ON_BEHALF', { reportId: r.id, mentor: v.onBehalfMentorName }, v.onBehalfReason);
  rules.lowScoreFor(p.id).catch((e) => console.error('[qoida] past-baho:', e.message)); // darhol tekshiramiz
  H.ok(res, r);
};

exports.getWeeklyReports = async (req, res) => {
  const pWhere = { ...(await placementScope(req.user)) };
  if (H.isUuid(req.query.placementId)) pWhere.id = req.query.placementId;
  const ids = (await Placement.findAll({ where: pWhere, attributes: ['id'] })).map((p) => p.id);
  const where = { placementId: ids };
  if (req.query.ungraded === '1') where.gradedAt = null; // mentor: baholanmagan haftalar
  const { page, limit, offset } = H.paging(req.query, 50);
  const { count, rows } = await WeeklyReport.findAndCountAll({
    where, limit, offset, order: [['weekStartDate', 'DESC']],
    include: [{ model: Placement, as: 'placement', attributes: ['id'], include: [{ model: Student, as: 'student', attributes: ['id', 'fullName'] }] }],
  });
  H.ok(res, rows, 200, H.meta(count, page, limit));
};
