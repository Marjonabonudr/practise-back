const { verifyToken } = require('../config/jwt');
const { User } = require('../models');

// Har so'rovda foydalanuvchi bazadan tekshiriladi: faolsizlantirilgan akkaunt tokeni darhol ishlamay qoladi (TZ: kirish huquqi bekor qilinadi)
const protect = async (req, res, next) => {
  const h = req.headers.authorization || '';
  if (!h.startsWith('Bearer ')) return res.status(401).json({ message: 'Tizimga kirish uchun token topilmadi' });
  let decoded;
  try { decoded = verifyToken(h.split(' ')[1]); }
  catch { return res.status(401).json({ message: 'Token yaroqsiz yoki muddati tugagan' }); }
  if (decoded.purpose) return res.status(401).json({ message: 'Token yaroqsiz' }); // taklif tokeni kirish uchun emas
  const user = await User.findByPk(decoded.id, { attributes: ['id', 'role', 'status', 'companyId'] });
  if (!user || user.status !== 'active') return res.status(401).json({ message: 'Akkaunt topilmadi yoki faolsizlantirilgan' });
  req.user = { id: user.id, role: user.role, companyId: user.companyId };
  next();
};

const authorize = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ message: 'Ushbu amalni bajarish uchun sizda ruxsat yo‘q' });
  }
  next();
};

module.exports = { protect, authorize };
