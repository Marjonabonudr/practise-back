const express = require('express');
const router = express.Router();
const c = require('../controller/Notification.Controller');
const { protect } = require('../middlewares/auth');
const { uuidParam } = require('../middlewares/access');
router.param('id', uuidParam);
router.use('/notifications', protect);

/**
 * @swagger
 * /api/notifications:
 *   get: { tags: [Notification], summary: "O'z bildirishnomalari (?unread=1)", security: [{ bearerAuth: [] }], responses: { '200': { description: OK } } }
 * /api/notifications/read-all:
 *   put: { tags: [Notification], summary: "Hammasini o'qildi deb belgilash", security: [{ bearerAuth: [] }], responses: { '200': { description: OK } } }
 * /api/notifications/{id}/read:
 *   put: { tags: [Notification], summary: "O'qildi", security: [{ bearerAuth: [] }], parameters: [{ in: path, name: id, required: true, schema: { type: string } }], responses: { '200': { description: OK } } }
 */
router.get('/notifications', c.getNotifications);
router.put('/notifications/read-all', c.markAllRead);
router.put('/notifications/:id/read', c.markAsRead);
module.exports = router;
