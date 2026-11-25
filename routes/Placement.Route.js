const express = require('express');
const router = express.Router();
const c = require('../controller/Placement.Controller');
const { protect, authorize } = require('../middlewares/auth');
const { uuidParam } = require('../middlewares/access');
router.param('id', uuidParam);
router.use('/placements', protect);

/**
 * @swagger
 * /api/placements:
 *   post: { tags: [Placement], summary: "Koordinator: studentId, companyId, mentorId, startDate, endDate, workDays[1-7], dailyHours, goals[3-5] (reja soati jadvaldan hisoblanadi)", security: [{ bearerAuth: [] }], responses: { '201': { description: OK } } }
 *   get: { tags: [Placement], summary: "Rol bo'yicha cheklangan ro'yxat", security: [{ bearerAuth: [] }], responses: { '200': { description: OK } } }
 * /api/placements/{id}:
 *   get: { tags: [Placement], summary: Bitta amaliyot (ruxsat tekshiriladi), security: [{ bearerAuth: [] }], parameters: [{ in: path, name: id, required: true, schema: { type: string } }], responses: { '200': { description: OK } } }
 * /api/placements/{id}/status:
 *   put: { tags: [Placement], summary: "Koordinator: holat o'tishlari (sabab/xulosa qoidalari bilan)", security: [{ bearerAuth: [] }], parameters: [{ in: path, name: id, required: true, schema: { type: string } }], responses: { '200': { description: OK } } }
 * /api/placements/{id}/hiring:
 *   put: { tags: [Placement], summary: "Koordinator: ishga olish natijasi", security: [{ bearerAuth: [] }], parameters: [{ in: path, name: id, required: true, schema: { type: string } }], responses: { '200': { description: OK } } }
 * /api/placements/{id}/mentor:
 *   put: { tags: [Placement], summary: "Koordinator: mentor almashtirish (sabab majburiy)", security: [{ bearerAuth: [] }], parameters: [{ in: path, name: id, required: true, schema: { type: string } }], responses: { '200': { description: OK } } }
 * /api/placements/{id}/final-assessment:
 *   put: { tags: [Placement], summary: "Mentor: yakuniy baholash", security: [{ bearerAuth: [] }], parameters: [{ in: path, name: id, required: true, schema: { type: string } }], responses: { '200': { description: OK } } }
 */
router.post('/placements', authorize('coordinator'), c.createPlacement);
router.get('/placements', c.getPlacements);
router.get('/placements/:id', c.getPlacementById);
router.put('/placements/:id/status', authorize('coordinator'), c.updatePlacementStatus);
router.put('/placements/:id/hiring', authorize('coordinator'), c.updateHiring);
router.put('/placements/:id/mentor', authorize('coordinator'), c.changeMentor);
router.put('/placements/:id/final-assessment', authorize('mentor'), c.setFinalAssessment);
module.exports = router;
