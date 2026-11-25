const express = require('express');
const router = express.Router();
const c = require('../controller/ActionItem.Controller');
const { protect, authorize } = require('../middlewares/auth');
const { uuidParam } = require('../middlewares/access');
router.param('id', uuidParam);
router.use('/action-items', protect);

/**
 * @swagger
 * /api/action-items:
 *   get: { tags: [ActionItem], summary: "Muammo kartalari (faqat tegishli foydalanuvchilarga)", security: [{ bearerAuth: [] }], responses: { '200': { description: OK } } }
 *   post: { tags: [ActionItem], summary: "Muammo kartasi yaratish", security: [{ bearerAuth: [] }], responses: { '201': { description: OK } } }
 * /api/action-items/{id}:
 *   put: { tags: [ActionItem], summary: "Holat: open / in_progress / resolved (natija majburiy)", security: [{ bearerAuth: [] }], parameters: [{ in: path, name: id, required: true, schema: { type: string } }], responses: { '200': { description: OK } } }
 */
router.get('/action-items', c.getActionItems);
router.post('/action-items', authorize('coordinator', 'mentor'), c.createActionItem);
router.put('/action-items/:id', authorize('coordinator', 'mentor'), c.updateActionItem);
module.exports = router;
