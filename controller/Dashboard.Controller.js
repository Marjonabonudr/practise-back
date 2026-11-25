const { Op } = require('sequelize');
const { Placement, Student, Company, User, WeeklyReport } = require('../models');
const H = require('../utils/helpers');

const STATUS_UZ = { placed: 'Joylashtirildi', ongoing: 'Davom etmoqda', paused: 'Vaqtincha to‘xtatildi', terminated: 'Muddatidan oldin tugatildi', completed: 'Yakunlandi' };
const HIRING_UZ = { not_discussed: 'Muhokama qilinmagan', under_review: 'Ko‘rib chiqilmoqda', offered: 'Taklif berilgan', accepted: 'Taklif qabul qilingan', started: 'Ish boshlagan', not_offered: 'Taklif berilmagan', rejected: 'O‘quvchi rad etgan', canceled: 'Taklif bekor qilingan' };

// ---- TZ 6: dashboard raqamlari ----
exports.getDashboardStats = async (req, res) => {
  const distinct = (where) => Placement.count({ distinct: true, col: 'studentId', where });
  const [uniqueStudents, activePlacements, completedPlacements, activeCompanies, offered, started] = await Promise.all([
    distinct({}),                                                   // bir o'quvchi ikki marta joylashsa ham 1 marta
    Placement.count({ where: { status: 'ongoing' } }),              // faol = faqat "Davom etmoqda"
    Placement.count({ where: { status: 'completed' } }),
    Company.count({ where: { status: 'active' } }),
    distinct({ hiringStatus: ['offered', 'accepted', 'started'] }), // taklif olganlar
    distinct({ hiringStatus: 'started', hiringConfirmedById: { [Op.ne]: null } }), // faqat koordinator tasdiqlagan
  ]);
  H.ok(res, { uniqueStudents, activePlacements, completedPlacements, activeCompanies, offeredStudents: offered, startedWork: started });
};

// Jadval va CSV bir xil filtrdan foydalanadi (TZ Q8: CSV filtrlangan ro'yxatga mos)
const buildFilter = (q) => {
  const where = {};
  if (STATUS_UZ[q.status]) where.status = q.status;
  if (HIRING_UZ[q.hiringStatus]) where.hiringStatus = q.hiringStatus;
  if (H.isUuid(q.companyId)) where.companyId = q.companyId;
  if (H.isUuid(q.mentorId)) where.mentorId = q.mentorId;
  const iso = /^\d{4}-\d{2}-\d{2}$/;
  if (iso.test(q.dateFrom || '')) where.endDate = { [Op.gte]: q.dateFrom };     // davr bilan kesishadigan amaliyotlar
  if (iso.test(q.dateTo || '')) where.startDate = { [Op.lte]: q.dateTo };
  const studentWhere = {};
  if (q.search) studentWhere.fullName = { [Op.iLike]: `%${H.escapeLike(q.search)}%` };
  if (q.field) studentWhere.field = { [Op.iLike]: `%${H.escapeLike(q.field)}%` };
  return { where, studentWhere };
};
const tableInclude = (studentWhere) => [
  { model: Student, as: 'student', where: studentWhere, required: Object.keys(studentWhere).length > 0 || undefined },
  { model: Company, as: 'company', attributes: ['id', 'name'] },
  { model: User, as: 'mentor', attributes: ['id', 'fullName', 'email'] },
];
const lastGrades = async (ids) => {
  const reps = await WeeklyReport.findAll({
    where: { placementId: ids, averageScore: { [Op.ne]: null } }, order: [['weekStartDate', 'DESC']],
    attributes: ['placementId', 'averageScore', 'evaluatedCount', 'weekStartDate'],
  });
  const map = {};
  for (const r of reps) if (!map[r.placementId]) map[r.placementId] = r;
  return map;
};

exports.getDashboardTable = async (req, res) => {
  const { where, studentWhere } = buildFilter(req.query);
  const { page, limit, offset } = H.paging(req.query, 25, 50); // 25 / 50
  const { count, rows } = await Placement.findAndCountAll({
    where, include: tableInclude(studentWhere), limit, offset, order: [['createdAt', 'DESC']], distinct: true,
  });
  const grades = await lastGrades(rows.map((r) => r.id));
  const data = rows.map((p) => {
    const j = H.serializePlacement(p);
    const g = grades[p.id];
    return {
      ...j, statusLabel: STATUS_UZ[p.status], hiringLabel: HIRING_UZ[p.hiringStatus],
      lastWeeklyAverage: g ? g.averageScore : null, lastWeeklyEvaluated: g ? g.evaluatedCount : null,
    };
  });
  H.ok(res, data, 200, H.meta(count, page, limit));
};

// CSV: formula injection himoyasi + qo'shtirnoq escape + davr va yaratilgan vaqt
const csvCell = (v) => {
  let s = v === null || v === undefined ? '' : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;          // Excel formulasi sifatida ishlashi mumkin bo'lgan kataklar
  return `"${s.replace(/"/g, '""')}"`;
};
exports.exportToCSV = async (req, res) => {
  const { where, studentWhere } = buildFilter(req.query);
  const rows = await Placement.findAll({ where, include: tableInclude(studentWhere), order: [['createdAt', 'DESC']], limit: 5000 });
  const grades = await lastGrades(rows.map((r) => r.id));
  const period = `${req.query.dateFrom || 'boshidan'} — ${req.query.dateTo || 'hozirgacha'}`;
  const lines = [
    ['Filtr davri', period].map(csvCell).join(','),
    ['Yaratilgan vaqt (Asia/Tashkent)', H.nowLocal()].map(csvCell).join(','),
    '',
    ['F.I.Sh.', 'Yo‘nalish', 'Kompaniya', 'Mentor', 'Boshlanish', 'Tugash', 'Reja soat', 'Tasdiqlangan soat', 'Progress %', 'Oxirgi haftalik baho', 'Amaliyot holati', 'Ishga olish holati'].map(csvCell).join(','),
  ];
  for (const p of rows) {
    const pr = H.progressOf(p);
    const g = grades[p.id];
    lines.push([
      p.student?.fullName, p.student?.field, p.company?.name, p.mentor?.fullName || p.mentor?.email, p.startDate, p.endDate,
      pr.plannedHours, pr.approvedHours, pr.completionPercent, g ? g.averageScore : '', STATUS_UZ[p.status], HIRING_UZ[p.hiringStatus],
    ].map(csvCell).join(','));
  }
  await H.audit(req.user.id, 'CSV_EXPORT', { filters: req.query, rows: rows.length }, 'CSV eksport');
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="amaliyot_monitoring.csv"');
  res.send('\uFEFF' + lines.join('\r\n')); // BOM: Excel'da o'zbekcha harflar buzilmaydi
};
