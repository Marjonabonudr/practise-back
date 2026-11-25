const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Haddan tashqari ko‘p urinish bo‘ldi, 15 daqiqadan so‘ng qayta urining.' },
});

// Parol va token maydonlariga tegmaymiz (aks holda "<" belgisi bor parol buziladi)
const SKIP_KEYS = ['password', 'token', 'newPassword', 'oldPassword'];
const cleanBodyText = (req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    for (const key of Object.keys(req.body)) {
      if (SKIP_KEYS.includes(key)) continue;
      if (typeof req.body[key] === 'string') req.body[key] = req.body[key].replace(/<[^>]*>/g, '').trim();
    }
  }
  next();
};

module.exports = { loginLimiter, cleanBodyText };
