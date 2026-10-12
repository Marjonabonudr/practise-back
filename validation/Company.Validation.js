const Joi = require('joi');

const companySchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  field: Joi.string().required(),
  address: Joi.string().required(),
  contact: Joi.string().required(),
  status: Joi.string().valid('active', 'archive').default('active')
});

module.exports = { companySchema };
