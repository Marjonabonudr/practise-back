const express = require('express');
const router = express.Router();
const c = require('../controller/WorkLog.Controller');
const { protect, authorize } = require('../middlewares/auth');
const { uuidParam } = require('../middlewares/access');
router.param('id', uuidParam);
router.use('/worklogs', protect);

/**
 * @swagger
 * /api/worklogs:
 *   get: { tags: [WorkLog], summary: "Rol bo'yicha qaydlar (?placementId=&status=submitted)", security: [{ bearerAuth: [] }], responses: { '200': { description: OK } } }
 *   post: { tags: [WorkLog], summary: "Amaliyotchi: kunlik qayd. Koordinator: mentor nomi va sabab bilan", security: [{ bearerAuth: [] }], responses: { '201': { description: OK } } }
 * /api/worklogs/{id}:
 *   put: { tags: [WorkLog], summary: "Amaliyotchi: qoralama/qaytarilgan qaydni tuzatib qayta yuborish", security: [{ bearerAuth: [] }], parameters: [{ in: path, name: id, required: true, schema: { type: string } }], responses: { '200': { description: OK } } }
 * /api/worklogs/{id}/approve:
 *   put: { tags: [WorkLog], summary: "Mentor: tasdiqlash", security: [{ bearerAuth: [] }], parameters: [{ in: path, name: id, required: true, schema: { type: string } }], responses: { '200': { description: OK } } }
 * /api/worklogs/{id}/reject:
 *   put: { tags: [WorkLog], summary: "Mentor: izoh bilan qaytarish", security: [{ bearerAuth: [] }], parameters: [{ in: path, name: id, required: true, schema: { type: string } }], responses: { '200': { description: OK } } }
 */
router.get('/worklogs', c.getWorkLogs);
router.post('/worklogs', authorize('intern', 'coordinator'), c.createWorkLog);
router.put('/worklogs/:id', authorize('intern'), c.updateWorkLog);
router.put('/worklogs/:id/approve', authorize('mentor', 'coordinator'), c.approveWorkLog);
router.put('/worklogs/:id/reject', authorize('mentor', 'coordinator'), c.rejectWorkLog);
module.exports = router;
