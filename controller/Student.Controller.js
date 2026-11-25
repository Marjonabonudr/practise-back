const { Op } = require('sequelize');
const { Student, User, Placement, Company } = require('../models');
const S = require('../validation/schemas');
const H = require('../utils/helpers');

const ACTIVE = ['placed', 'ongoing', 'paused'];

exports.createStudent = async (req, res) => {
  const v = H.parse(S.student, req.body, res); if (!v) return; // userId qabul qilinmaydi (stripUnknown)
  if ((await Student.findOne({ where: { email: v.email } })) || (await User.findOne({ where: { email: v.email } }))) {
    return H.fail(res, 409, 'Bu email bilan o‘quvchi yoki akkaunt allaqachon mavjud');
  }
  const s = await Student.create(v);
  await H.audit(req.user.id, 'STUDENT_CREATE', { studentId: s.id }, 'O‘quvchi profili yaratildi');
  H.ok(res, s, 201);
};

exports.getStudents = async (req, res) => {
  const where = {};
  if (req.query.status !== 'all') where.status = req.query.status === 'archive' ? 'archive' : 'active';
  if (req.query.search) {
    const q = `%${H.escapeLike(req.query.search)}%`;
    where[Op.or] = [{ fullName: { [Op.iLike]: q } }, { email: { [Op.iLike]: q } }, { phone: { [Op.iLike]: q } }, { group: { [Op.iLike]: q } }];
  }
  const { page, limit, offset } = H.paging(req.query, 50);
  const { count, rows } = await Student.findAndCountAll({ where, limit, offset, order: [['fullName', 'ASC']] });
  const busy = new Set((await Placement.findAll({
    where: { studentId: rows.map((r) => r.id), status: ACTIVE }, attributes: ['studentId'],
  })).map((p) => p.studentId));
  H.ok(res, rows.map((s) => ({ ...s.toJSON(), hasAccount: !!s.userId, hasActivePlacement: busy.has(s.id) })), 200, H.meta(count, page, limit));
};

// Q2: o'quvchi faqat o'zini, mentor faqat o'ziga biriktirilgan o'quvchini ko'radi
exports.getStudentById = async (req, res) => {
  const s = await Student.findByPk(req.params.id, { include: [{ model: User, as: 'user', attributes: ['id', 'email', 'status'] }] });
  if (!s) return H.fail(res, 404, 'O‘quvchi topilmadi');
  const pWhere = { studentId: s.id };
  if (req.user.role === 'intern' && s.userId !== req.user.id) return H.fail(res, 404, 'O‘quvchi topilmadi');
  if (req.user.role === 'mentor') {
    pWhere.mentorId = req.user.id; // mentor faqat o'zining joylashtirishlari doirasidagi tarixni ko'radi
    if (!(await Placement.count({ where: pWhere }))) return H.fail(res, 404, 'O‘quvchi topilmadi');
  }
  const placements = await Placement.findAll({
    where: pWhere, order: [['startDate', 'DESC']],
    include: [{ model: Company, as: 'company', attributes: ['id', 'name'] }, { model: User, as: 'mentor', attributes: ['id', 'fullName', 'email'] }],
  });
  H.ok(res, { ...s.toJSON(), placements: placements.map(H.serializePlacement) });
};

exports.updateStudent = async (req, res) => {
  const v = H.parse(S.studentUpdate, req.body, res); if (!v) return;
  const s = await Student.findByPk(req.params.id);
  if (!s) return H.fail(res, 404, 'O‘quvchi topilmadi');
  if (v.email && v.email !== s.email && (await Student.findOne({ where: { email: v.email } }))) return H.fail(res, 409, 'Bu email band');
  if (v.status === 'archive' && (await Placement.count({ where: { studentId: s.id, status: ACTIVE } }))) {
    return H.fail(res, 409, 'O‘quvchida faol amaliyot bor, avval uni yakunlang');
  }
  await s.update(v);
  await H.audit(req.user.id, 'STUDENT_UPDATE', { studentId: s.id, fields: Object.keys(v) }, 'Profil yangilandi');
  H.ok(res, s);
};

exports.deleteStudent = async (req, res) => { // arxivlash
  const s = await Student.findByPk(req.params.id);
  if (!s) return H.fail(res, 404, 'O‘quvchi topilmadi');
  if (await Placement.count({ where: { studentId: s.id, status: ACTIVE } })) return H.fail(res, 409, 'O‘quvchida faol amaliyot bor');
  await s.update({ status: 'archive' });
  await H.audit(req.user.id, 'STUDENT_ARCHIVE', { studentId: s.id }, 'O‘quvchi arxivlandi');
  H.ok(res, s);
};
