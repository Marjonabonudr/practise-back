const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
const { User, Student, Company, sequelize } = require('../models');
const { signToken, verifyToken } = require('../config/jwt');
const S = require('../validation/schemas');
const H = require('../utils/helpers');

// Koordinator: 72 soatlik taklif havolasi (ochiq ro'yxatdan o'tish YO'Q)
exports.createInviteLink = async (req, res) => {
  const v = H.parse(S.invite, req.body, res); if (!v) return;
  let email = v.email;
  const payload = { purpose: 'invite', role: v.role, invitedBy: req.user.id };

  if (v.role === 'mentor') {
    if (!email || !v.companyId || !v.fullName) return H.fail(res, 400, 'Mentor uchun email, F.I.Sh. va kompaniya majburiy');
    const c = await Company.findOne({ where: { id: v.companyId, status: 'active' } });
    if (!c) return H.fail(res, 404, 'Kompaniya topilmadi yoki arxivda');
    Object.assign(payload, { companyId: c.id, fullName: v.fullName, phone: v.phone || null });
  } else {
    if (!v.studentId) return H.fail(res, 400, 'Amaliyotchi uchun studentId majburiy');
    const s = await Student.findByPk(v.studentId);
    if (!s) return H.fail(res, 404, 'O‘quvchi profili topilmadi');
    if (s.userId) return H.fail(res, 409, 'Bu o‘quvchining akkaunti allaqachon ulangan');
    email = email || s.email;
    if (!email) return H.fail(res, 400, 'Email majburiy');
    Object.assign(payload, { studentId: s.id, fullName: s.fullName, phone: s.phone });
  }
  if (await User.findOne({ where: { email } })) return H.fail(res, 409, 'Bu email bilan akkaunt allaqachon mavjud');

  payload.email = email;
  const token = signToken(payload, '72h');
  const base = process.env.FRONTEND_URL || 'http://localhost:5173';
  await H.audit(req.user.id, 'USER_INVITE', { email, role: v.role }, 'Taklif havolasi yaratildi');
  H.ok(res, { inviteLink: `${base}/register?token=${token}`, email, expiresIn: '72 soat' });
};

exports.registerUser = async (req, res) => {
  const v = H.parse(S.accept, req.body, res); if (!v) return;
  let inv;
  try { inv = verifyToken(v.token); } catch { return H.fail(res, 400, 'Taklif havolasi yaroqsiz yoki muddati tugagan'); }
  if (inv.purpose !== 'invite') return H.fail(res, 400, 'Taklif havolasi yaroqsiz');
  if (await User.findOne({ where: { email: inv.email } })) return H.fail(res, 409, 'Bu havola allaqachon ishlatilgan');

  const hash = await bcrypt.hash(v.password, 10);
  const user = await sequelize.transaction(async (t) => {
    const u = await User.create({
      email: inv.email, password: hash, role: inv.role, status: 'active',
      companyId: inv.companyId || null, fullName: inv.fullName || null, phone: inv.phone || null,
    }, { transaction: t });
    if (inv.role === 'intern' && inv.studentId) {
      // faqat hali ulanmagan profilga ulanadi
      const [n] = await Student.update({ userId: u.id }, { where: { id: inv.studentId, userId: null }, transaction: t });
      if (!n) throw Object.assign(new Error('O‘quvchi profili topilmadi yoki allaqachon ulangan'), { status: 409 });
    }
    return u;
  });
  H.ok(res, { id: user.id, email: user.email, role: user.role }, 201); // parol hashi qaytarilmaydi
};

// Login javobi tekis (flat): { token, role, id, email } — frontend Login sahifasi shuni kutadi
exports.loginUser = async (req, res) => {
  const v = H.parse(S.login, req.body, res); if (!v) return;
  const user = await User.findOne({ where: { email: v.email } });
  const ok = user && user.status === 'active' && (await bcrypt.compare(v.password, user.password));
  if (!ok) return H.fail(res, 401, 'Email yoki parol noto‘g‘ri, yoki akkaunt faol emas'); // qaysi biri ekani aytilmaydi
  res.json({ token: signToken({ id: user.id, role: user.role }), role: user.role, id: user.id, email: user.email });
};

exports.me = async (req, res) => {
  const user = await User.findByPk(req.user.id, {
    attributes: { exclude: ['password'] },
    include: [{ model: Student, as: 'studentProfile' }, { model: Company, as: 'company' }],
  });
  H.ok(res, user);
};

exports.listUsers = async (req, res) => {
  const where = {};
  if (['coordinator', 'intern', 'mentor'].includes(req.query.role)) where.role = req.query.role;
  if (['active', 'inactive'].includes(req.query.status)) where.status = req.query.status;
  if (H.isUuid(req.query.companyId)) where.companyId = req.query.companyId;
  if (req.query.search) where[Op.or] = [
    { fullName: { [Op.iLike]: `%${H.escapeLike(req.query.search)}%` } },
    { email: { [Op.iLike]: `%${H.escapeLike(req.query.search)}%` } },
  ];
  const { page, limit, offset } = H.paging(req.query, 50);
  const { count, rows } = await User.findAndCountAll({
    where, attributes: { exclude: ['password'] }, limit, offset, order: [['createdAt', 'DESC']],
    include: [{ model: Company, as: 'company', attributes: ['id', 'name'] }],
  });
  H.ok(res, rows, 200, H.meta(count, page, limit));
};

exports.setUserStatus = async (req, res) => {
  const v = H.parse(S.userStatus, req.body, res); if (!v) return;
  if (req.params.id === req.user.id) return H.fail(res, 400, 'O‘zingizni faolsizlantira olmaysiz');
  const u = await User.findByPk(req.params.id);
  if (!u) return H.fail(res, 404, 'Foydalanuvchi topilmadi');
  const old = u.status;
  await u.update({ status: v.status });
  await H.audit(req.user.id, 'USER_STATUS_CHANGE', { userId: u.id, old, new: v.status }, v.reason);
  H.ok(res, { id: u.id, status: u.status });
};
