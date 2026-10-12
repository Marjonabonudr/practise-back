const Joi = require('joi');

const auditLogSchema = Joi.object({
  action: Joi.string().required(), // Masalan: "UPDATE_PLACEMENT", "TERMINATE_INTERNSHIP"
  details: Joi.object().required(), // Eski va yangi o'zgarishlar obyekti
  reason: Joi.string().min(5).required() // TZ: Har bir muhim o‘zgarishda nima sababli o‘zgartirilgani majburiy
});

module.exports = { auditLogSchema };
