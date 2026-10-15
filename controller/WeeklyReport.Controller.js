const { Op } = require('sequelize');
const { WeeklyReport } = require('../models');
const validateWeeklyReport = require('../validation/WeeklyReport.Validation');

exports.createWeeklyReport = async (req, res) => {
    const { error } = validateWeeklyReport(req.body);
    if (error) return res.status(400).send(error.details[0].message);

    try {
        const report = await WeeklyReport.create(req.body);
        res.status(201).send(report);
    } catch (error) {
        res.status(500).send(error.message);
    }
};

exports.gradeWeeklyReport = async (req, res) => {
    try {
        const report = await WeeklyReport.findByPk(req.params.id);
        if (!report) return res.status(404).send('WeeklyReport not found');

        const { discipline, workQuality, deadlineCompliance, learningIndependence, teamwork, mentorRecommendation, lowScoreReason } = req.body;
        
        const scores = [discipline, workQuality, deadlineCompliance, learningIndependence, teamwork].filter(s => s !== null && s !== undefined);
        
        // TZ: Haftalik o‘rtacha = kiritilgan ballar yig‘indisi / baholangan mezonlar soni
        const sum = scores.reduce((a, b) => a + b, 0);
        const average = scores.length > 0 ? parseFloat((sum / scores.length).toFixed(1)) : null;

        // TZ: 1 yoki 2 ball uchun sabab va yaxshilash tavsiyasi majburiy
        const hasLowScore = scores.some(score => score <= 2);
        if (hasLowScore && !lowScoreReason) {
            return res.status(400).send('1 yoki 2 ball berilganda yaxshilash tavsiyasi (lowScoreReason) majburiy!');
        }

        await report.update({
            discipline, workQuality, deadlineCompliance, learningIndependence, teamwork,
            mentorRecommendation, lowScoreReason, averageScore: average
        });

        res.status(200).send(report);
    } catch (error) {
        res.status(500).send(error.message);
    }
};
