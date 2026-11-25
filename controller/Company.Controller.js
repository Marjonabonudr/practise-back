const { Op } = require('sequelize');
const { Company, User, Placement, Student } = require('../models');
const S = require('../validation/schemas');
const H = require('../utils/helpers');

exports.createCompany = async (req, res) => {
  const v = H.parse(S.company, req.body, res); if (!v) return;
  const c = await Company.create(v);
  await H.audit(req.user.id, 'COMPANY_CREATE', { companyId: c.id }, 'Kompaniya yaratildi');
  H.ok(res, c, 201);
};

exports.getCompanies = async (req, res) => {
  const where = {};
  if (req.query.status !== 'all') where.status = req.query.status === 'archive' ? 'archive' : 'active';
  if (req.query.search) where.name = { [Op.iLike]: `%${H.escapeLike(req.query.search)}%` };
  const { page, limit, offset } = H.paging(req.query, 50);
  const { count, rows } = await Company.findAndCountAll({ where, limit, offset, order: [['name', 'ASC']] });
  H.ok(res, rows, 200, H.meta(count, page, limit));
};

// TZ: kompaniya kartochkasi — aloqa, mentorlar, biriktirilgan o'quvchilar va yakuniy natijalar
exports.getCompanyById = async (req, res) => {
  const c = await Company.findByPk(req.params.id, {
    include: [
      { model: User, as: 'mentors', attributes: ['id', 'fullName', 'email', 'phone', 'status'] },
      { model: Placement, as: 'placements', include: [{ model: Student, as: 'student', attributes: ['id', 'fullName', 'field'] }] },
    ],
  });
  if (!c) return H.fail(res, 404, 'Kompaniya topilmadi');
  const j = c.toJSON();
  j.placements = j.placements.map(H.serializePlacement);
  H.ok(res, j);
};

exports.updateCompany = async (req, res) => {
  const v = H.parse(S.companyUpdate, req.body, res); if (!v) return;
  const c = await Company.findByPk(req.params.id);
  if (!c) return H.fail(res, 404, 'Kompaniya topilmadi');
  if (v.status === 'archive' && c.status !== 'archive') {
    const active = await Placement.count({ where: { companyId: c.id, status: ['placed', 'ongoing', 'paused'] } });
    if (active) return H.fail(res, 409, `Kompaniyada ${active} ta faol amaliyot bor, avval ularni yakunlang`);
  }
  await c.update(v);
  await H.audit(req.user.id, 'COMPANY_UPDATE', { companyId: c.id, fields: Object.keys(v) }, 'Kompaniya yangilandi');
  H.ok(res, c);
};

// O'chirish o'rniga ARXIVLASH: tarix (joylashtirishlar, baholar) yo'qolmaydi
exports.deleteCompany = async (req, res) => {
  const c = await Company.findByPk(req.params.id);
  if (!c) return H.fail(res, 404, 'Kompaniya topilmadi');
  const active = await Placement.count({ where: { companyId: c.id, status: ['placed', 'ongoing', 'paused'] } });
  if (active) return H.fail(res, 409, `Kompaniyada ${active} ta faol amaliyot bor, avval ularni yakunlang`);
  await c.update({ status: 'archive' });
  await H.audit(req.user.id, 'COMPANY_ARCHIVE', { companyId: c.id }, 'Kompaniya arxivlandi');
  H.ok(res, c);
};
