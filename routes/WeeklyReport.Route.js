const express = require('express');
const router = express.Router();
const c = require('../controller/WeeklyReport.Controller');
const { protect, authorize } = require('../middlewares/auth');
const { uuidParam } = require('../middlewares/access');
router.param('id', uuidParam);
router.use('/weekly-reports', protect);

/**
 * @swagger
 * /api/weekly-reports:
 *   get: { tags: [WeeklyReport], summary: "Rol bo'yicha hisobotlar (?ungraded=1)", security: [{ bearerAuth: [] }], responses: { '200': { description: OK } } }
 *   post: { tags: [WeeklyReport], summary: "Amaliyotchi: haftalik hisobot (weekStartDate = dushanba)", security: [{ bearerAuth: [] }], responses: { '201': { description: OK } } }
 * /api/weekly-reports/{id}/grade:
 *   put: { tags: [WeeklyReport], summary: "Mentor: 5 mezon (1-5 yoki null), 1-2 ball uchun sabab va tavsiya majburiy", security: [{ bearerAuth: [] }], parameters: [{ in: path, name: id, required: true, schema: { type: string } }], responses: { '200': { description: OK } } }
 */
router.get('/weekly-reports', c.getWeeklyReports);
router.post('/weekly-reports', authorize('intern'), c.createWeeklyReport);
router.put('/weekly-reports/:id/grade', authorize('mentor', 'coordinator'), c.gradeWeeklyReport);
module.exports = router;
