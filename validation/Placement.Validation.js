const Joi = require('joi');

const placementSchema = Joi.object({
  studentId: Joi.string().uuid().required(),
  companyId: Joi.string().uuid().required(),
  mentorId: Joi.string().uuid().required(),
  startDate: Joi.date().required(),
  endDate: Joi.date().greater(Joi.ref('startDate')).required(),
  plannedHours: Joi.number().integer().min(1).required(),
  goals: Joi.array().items(Joi.string()).min(3).max(5).required() // TZ: 3-5 ta tekshiriladigan natija
});

const changeStatusSchema = Joi.object({
  status: Joi.string().valid('placed', 'ongoing', 'paused', 'terminated', 'completed').required(),
  reason: Joi.string().allow('', null).when('status', {
    is: Joi.string().valid('paused', 'terminated'),
    then: Joi.required() // TZ: To‘xtatish va erta tugatishda sabab majburiy
  })
});

module.exports = { placementSchema, changeStatusSchema };
