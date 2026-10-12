const express = require('express');
const router = express.Router();
const weeklyReportController = require('../controller/WeeklyReport.Controller');

/**
 * @swagger
 * tags:
 *   name: WeeklyReport
 *   description: Haftalik yakuniy hisobotlar va mentor baholash tizimi
 */

/**
 * @swagger
 * /api/weekly-reports:
 *   post:
 *     tags: [WeeklyReport]
 *     summary: Amaliyotchi talaba tomonidan haftalik matnli progress hisobotini topshirish
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - placementId
 *               - weekStartDate
 *               - reportText
 *             properties:
 *               placementId:
 *                 type: string
 *                 format: uuid
 *               weekStartDate:
 *                 type: string
 *                 format: date
 *                 example: "2026-10-12"
 *               reportText:
 *                 type: string
 *                 example: "Ushbu haftada loyihaning ma'lumotlar bazasi to'liq yakunlandi va controllerlar yozildi."
 *     responses:
 *       '201':
 *         description: Haftalik hisobot tizimga muvaffaqiyatli qabul qilindi
 *       '500':
 *         description: Server xatosi
 */
router.post('/weekly-reports', weeklyReportController.createWeeklyReport);

/**
 * @swagger
 * /api/weekly-reports/:id/grade:
 *   put:
 *     tags: [WeeklyReport]
 *     summary: Mentor tomonidan haftalik 5 ta mezon bo'yicha baholash va o'rtacha ball chiqarish
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - discipline
 *               - workQuality
 *               - deadlineCompliance
 *               - learningIndependence
 *               - teamwork
 *               - mentorRecommendation
 *             properties:
 *               discipline:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 example: 5
 *               workQuality:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 example: 4
 *               deadlineCompliance:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 example: 2
 *               learningIndependence:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 example: 4
 *               teamwork:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 example: 5
 *               mentorRecommendation:
 *                 type: string
 *                 example: "Vaqtga rioya qilishni kuchaytirishi kerak, texnik bilimlar a'lo."
 *               lowScoreReason:
 *                 type: string
 *                 example: "Vaqt masalasida 2 ball olgani sababli dushanba kuni suhbat o'tkaziladi."
 *     responses:
 *       '200':
 *         description: Baholash muvaffaqiyatli saqlandi va kasrli o'rtacha ball hisoblandi
 *       '400':
 *         description: 1 yoki 2 ball qo'yilganda yaxshilash tavsiyasi (lowScoreReason) kiritilmadi
 *       '404':
 *         description: Haftalik hisobot topilmadi
 *       '500':
 *         description: Server xatosi
 */
router.put('/weekly-reports/:id/grade', weeklyReportController.gradeWeeklyReport);

module.exports = router;
