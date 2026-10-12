module.exports = (err, req, res, next) => {
  console.error(err.stack);
  
  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(400).json({ message: 'Ushbu ma’lumot tizimda allaqachon mavjud' });
  }
  
  if (err.name === 'SequelizeValidationError') {
    return res.status(400).json({ message: err.errors.map(e => e.message) });
  }

  res.status(err.status || 500).json({
    message: err.message || 'Serverda ichki xatolik yuz berdi'
  });
};
