const Joi = require('joi');

const workLogSchema = Joi.object({
  placementId: Joi.string().uuid().required(),
  date: Joi.date().less('now').required(), // TZ: Sana bugundan keyin bo'lmasligi kerak
  hours: Joi.number().min(0).max(24).multiple(0.5).required(), // TZ: 0.5 soat qadamda
  attendance: Joi.string().valid('present', 'absent_reasoned', 'absent_unreasoned', 'weekend').required(),
  task: Joi.string().min(10).required(),
  resultUrl: Joi.string().uri({ scheme: ['http', 'https'] }).required(), // TZ: Faqat http yoki https havola
  comment: Joi.string().allow('', null).when('attendance', {
    is: 'absent_reasoned',
    then: Joi.required() // TZ: Sababli kelmagan holatda izoh majburiy
  })
});

module.exports = { workLogSchema };
