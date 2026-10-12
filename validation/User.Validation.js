const Joi = require('joi');

const registerUserSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  role: Joi.string().valid('coordinator', 'intern', 'mentor').required(),
  status: Joi.string().valid('active', 'inactive').default('active'),
  companyId: Joi.string().uuid().allow(null).when('role', {
    is: 'mentor',
    then: Joi.required() // TZ: Mentor yaratilganda kompaniyaga biriktirilishi shart
  })
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

// TZ: Koordinator foydalanuvchini taklif qilgandagi 72 soatlik havola tokeni
const inviteUserSchema = Joi.object({
  email: Joi.string().email().required(),
  role: Joi.string().valid('intern', 'mentor').required(),
  companyId: Joi.string().uuid().allow(null)
});

module.exports = { registerUserSchema, loginSchema, inviteUserSchema };
