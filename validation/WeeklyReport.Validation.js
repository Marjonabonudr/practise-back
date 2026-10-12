const Joi = require('joi');

const weeklyReportSchema = Joi.object({
  placementId: Joi.string().uuid().required(),
  weekStartDate: Joi.date().required(),
  reportText: Joi.string().min(20).required()
});

const mentorGradeSchema = Joi.object({
  discipline: Joi.number().integer().min(1).max(5).required(),
  workQuality: Joi.number().integer().min(1).max(5).required(),
  deadlineCompliance: Joi.number().integer().min(1).max(5).required(),
  learningIndependence: Joi.number().integer().min(1).max(5).required(),
  teamwork: Joi.number().integer().min(1).max(5).required(),
  mentorRecommendation: Joi.string().min(10).required(),
  lowScoreReason: Joi.string().allow('', null)
}).custom((value, helpers) => {
  // TZ: 1 yoki 2 ball uchun sabab va yaxshilash tavsiyasi majburiy
  const scores = [value.discipline, value.workQuality, value.deadlineCompliance, value.learningIndependence, value.teamwork];
  const hasLowScore = scores.some(score => score <= 2);
  if (hasLowScore && !value.lowScoreReason) {
    return helpers.message('1 yoki 2 ball berilganda yaxshilash tavsiyasi (lowScoreReason) majburiy!');
  }
  return value;
});

module.exports = { weeklyReportSchema, mentorGradeSchema };
