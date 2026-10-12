const jwt = require('jsonwebtoken');

const protect = (req, res, next) => {
  let token = req.headers.authorization;
  if (token && token.startsWith('Bearer')) {
    try {
      token = token.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'algoritm_secret_key_2026');
      req.user = decoded;
      return next();
    } catch (error) {
      return res.status(401).json({ message: 'Avtorizatsiya xatosi, token yaroqsiz' });
    }
  }
  return res.status(401).json({ message: 'Tizimga kirish uchun token topilmadi' });
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Ushbu amalni bajarish uchun sizda ruxsat yo‘q' });
    }
    next();
  };
};

module.exports = { protect, authorize };
