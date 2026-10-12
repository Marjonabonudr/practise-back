const Joi = require('joi');

const studentSchema = Joi.object({
  userId: Joi.string().uuid().required(), // User jadvalidagi akkaunt bilan bog'lash uchun
  fullName: Joi.string().min(3).max(100).required(),
  phone: Joi.string().regex(/^[\+][0-9]{9,15}$/).required() // O'zbekiston va xalqaro telefon formatlari uchun regex (+998901234567)
    .messages({ 'string.pattern.base': 'Telefon raqami noto‘g‘ri formatda (+998XXXXXXXXX)' }),
  field: Joi.string().min(2).max(50).required(), // TZ: Yo'nalishi (masalan: Frontend, Backend)
  group: Joi.string().min(2).max(30).required() // TZ: Guruh nomi yoki kodi
});

const updateStudentSchema = Joi.object({
  fullName: Joi.string().min(3).max(100),
  phone: Joi.string().regex(/^[\+][0-9]{9,15}$/)
    .messages({ 'string.pattern.base': 'Telefon raqami noto‘g‘ri formatda (+998XXXXXXXXX)' }),
  field: Joi.string().min(2).max(50),
  group: Joi.string().min(2).max(30)
});

module.exports = { studentSchema, updateStudentSchema };
