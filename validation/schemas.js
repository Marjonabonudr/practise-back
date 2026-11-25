const Joi = require('joi');

const uuid = Joi.string().uuid();
const isoDate = Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).messages({ 'string.pattern.base': 'Sana YYYY-MM-DD formatida bo‘lishi kerak' });
const text = (max = 1000) => Joi.string().trim().max(max);
const optText = (max = 1000) => text(max).allow('', null);
const httpUrl = Joi.string().trim().uri({ scheme: ['http', 'https'] }).max(500).messages({ 'string.uriCustomScheme': 'Havola faqat http yoki https bo‘lishi kerak', 'string.uri': 'Havola noto‘g‘ri' });
const version = Joi.number().integer().min(0);
const score = Joi.number().integer().min(1).max(5).allow(null); // null = "Baholanmadi"
const phone = Joi.string().trim().pattern(/^\+?[0-9]{9,15}$/).messages({ 'string.pattern.base': 'Telefon raqami noto‘g‘ri (masalan +998901234567)' });

const login = Joi.object({ email: Joi.string().email().required(), password: Joi.string().required() });
const invite = Joi.object({
  email: Joi.string().email(),
  role: Joi.string().valid('intern', 'mentor').required(),
  companyId: uuid.allow(null),
  studentId: uuid.allow(null),
  fullName: text(150), phone: phone.allow('', null),
});
const accept = Joi.object({ token: Joi.string().required(), password: Joi.string().min(8).max(100).required() });
const userStatus = Joi.object({ status: Joi.string().valid('active', 'inactive').required(), reason: text(500).required() });

const company = Joi.object({
  name: text(150).required(), field: text(150).required(), address: text(250).required(), contact: text(150).required(),
  status: Joi.string().valid('active', 'archive'),
});
const companyUpdate = company.fork(['name', 'field', 'address', 'contact'], (s) => s.optional());

const student = Joi.object({
  fullName: text(150).min(3).required(), email: Joi.string().email().required(), phone: phone.required(),
  field: text(150).required(), group: optText(50),
});
const studentUpdate = student.fork(['fullName', 'email', 'phone', 'field'], (s) => s.optional()).keys({ status: Joi.string().valid('active', 'archive') });

const placementCreate = Joi.object({
  studentId: uuid.required(), companyId: uuid.required(), mentorId: uuid.required(),
  startDate: isoDate.required(), endDate: isoDate.required(),
  workDays: Joi.array().items(Joi.number().integer().min(1).max(7)).min(1).unique().default([1, 2, 3, 4, 5]),
  dailyHours: Joi.number().min(0.5).max(12).multiple(0.5).required(),
  excludedDates: Joi.array().items(isoDate).default([]),
  format: Joi.string().valid('office', 'remote', 'hybrid').default('office'),
  goals: Joi.array().items(text(300).min(3)).min(3).max(5).required(), // TZ: 3–5 ta tekshiriladigan natija
  plannedHours: Joi.number().positive().max(5000),
  plannedHoursReason: text(500).when('plannedHours', { is: Joi.exist(), then: Joi.required() }),
});
const placementStatus = Joi.object({
  status: Joi.string().valid('ongoing', 'paused', 'terminated', 'completed').required(),
  reason: optText(500), conclusion: optText(2000), newEndDate: isoDate, plannedHours: Joi.number().positive().max(5000), version,
});
const placementHiring = Joi.object({
  hiringStatus: Joi.string().valid('not_discussed', 'under_review', 'offered', 'accepted', 'started', 'not_offered', 'rejected', 'canceled').required(),
  hiringPosition: optText(150), hiringCompany: optText(150), offerDate: isoDate.allow(null), acceptDate: isoDate.allow(null),
  workStartDate: isoDate.allow(null), hiringNote: optText(1000), reason: optText(500), version,
});
const mentorChange = Joi.object({ mentorId: uuid.required(), reason: text(500).required(), version });
const finalAssessment = Joi.object({
  discipline: score, workQuality: score, deadlineCompliance: score, learningIndependence: score, teamwork: score,
  skillsSummary: text(2000).required(), hireRecommendation: Joi.string().valid('recommend', 'not_recommend', 'undecided').required(),
});

const onBehalf = { onBehalfMentorName: text(150), onBehalfReason: text(500) };
const workLogCreate = Joi.object({
  placementId: uuid.required(), date: isoDate.required(),
  hours: Joi.number().min(0).max(24).multiple(0.5).required(),
  attendance: Joi.string().valid('present', 'absent_reasoned', 'absent_unreasoned', 'weekend').required(),
  task: optText(2000), resultUrl: httpUrl.allow('', null), comment: optText(1000),
  submit: Joi.boolean().default(true), ...onBehalf,
});
const workLogUpdate = workLogCreate.fork(['placementId', 'date'], (s) => s.optional()).keys({ version });
const workLogApprove = Joi.object({ version, ...onBehalf });
const workLogReject = Joi.object({ comment: text(1000).required(), version, ...onBehalf });

const weeklyCreate = Joi.object({
  placementId: uuid.required(), weekStartDate: isoDate.required(), reportText: text(4000).min(5).required(),
  skillsLearned: optText(3000), challenges: optText(3000), nextWeekPlan: optText(3000),
});
const weeklyGrade = Joi.object({
  discipline: score, workQuality: score, deadlineCompliance: score, learningIndependence: score, teamwork: score,
  mentorRecommendation: optText(2000), lowScoreReason: optText(2000), version, ...onBehalf,
});

const actionCreate = Joi.object({
  placementId: uuid.required(), description: text(2000).required(), responsibleId: uuid.allow(null), dueDate: isoDate.allow(null),
});
const actionUpdate = Joi.object({
  description: text(2000), responsibleId: uuid.allow(null), dueDate: isoDate.allow(null),
  status: Joi.string().valid('open', 'in_progress', 'resolved'), result: optText(2000),
});

module.exports = {
  login, invite, accept, userStatus, company, companyUpdate, student, studentUpdate,
  placementCreate, placementStatus, placementHiring, mentorChange, finalAssessment,
  workLogCreate, workLogUpdate, workLogApprove, workLogReject, weeklyCreate, weeklyGrade, actionCreate, actionUpdate,
};
