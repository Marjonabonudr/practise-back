const Joi = require('joi');

const notificationSchema = Joi.object({
  userId: Joi.string().uuid().required(),
  title: Joi.string().min(3).max(100).required(),
  message: Joi.string().min(10).required(),
  type: Joi.string().valid('deadline_warning', 'absence_alert', 'low_score', 'general').required()
});

const markAsReadSchema = Joi.object({
  isRead: Joi.boolean().valid(true).required() // TZ: Tizim ichida "o‘qildi" holati mavjud
});

module.exports = { notificationSchema, markAsReadSchema };
