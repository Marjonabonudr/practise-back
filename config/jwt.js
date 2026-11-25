// YAGONA JWT sozlamasi. Avval auth.js va User.Controller.js ikki xil "fallback" kalit ishlatgan,
// shuning uchun JWT_SECRET bo'sh bo'lsa har bir token 401 bilan rad etilardi.
const jwt = require('jsonwebtoken');

const getSecret = () => {
  if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET .env faylida (yoki hosting sozlamasida) belgilanmagan');
  return process.env.JWT_SECRET;
};
const signToken = (payload, expiresIn = '24h') => jwt.sign(payload, getSecret(), { expiresIn });
const verifyToken = (token) => jwt.verify(token, getSecret());

module.exports = { getSecret, signToken, verifyToken };
