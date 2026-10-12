const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 daqiqa
  max: 10, // har bir IP dan maksimal 10 ta urinish
  message: 'Haddan tashqari ko‘p urinish bo‘ldi, iltimos 15 daqiqadan so‘ng qayta urining.'
});

const cleanBodyText = (req, res, next) => {
  if (req.body) {
    for (let key in req.body) {
      if (typeof req.body[key] === 'string') {
        // Skript teglari va zararli belgilarni qisman tozalash
        req.body[key] = req.body[key].replace(/<[^>]*>/g, '').trim();
      }
    }
  }
  next();
};

module.exports = { loginLimiter, cleanBodyText };
