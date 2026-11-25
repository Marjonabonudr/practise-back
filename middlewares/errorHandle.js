module.exports = (err, req, res, next) => {
  if (res.headersSent) return next(err);
  if (err.type === 'entity.parse.failed') return res.status(400).json({ message: 'JSON noto‘g‘ri formatda' });
  if (err.name === 'SequelizeUniqueConstraintError') return res.status(409).json({ message: 'Ushbu ma’lumot tizimda allaqachon mavjud' });
  if (err.name === 'SequelizeOptimisticLockError') return res.status(409).json({ message: 'Yozuv boshqa foydalanuvchi tomonidan o‘zgartirilgan. Sahifani yangilang.' });
  if (err.name === 'SequelizeForeignKeyConstraintError') return res.status(409).json({ message: 'Bog‘liq yozuvlar mavjud yoki ID noto‘g‘ri' });
  if (err.name === 'SequelizeValidationError') return res.status(400).json({ message: err.errors.map((e) => e.message).join('; ') });

  // Maxfiy ma'lumotlar (parol, token, body) logga yozilmaydi — faqat metod, manzil va xabar
  console.error(`[xato] ${req.method} ${req.originalUrl} -> ${err.message}`);
  const status = err.status || 500;
  const prod = process.env.NODE_ENV === 'production';
  res.status(status).json({ message: status < 500 || !prod ? err.message : 'Serverda ichki xatolik yuz berdi' });
};
