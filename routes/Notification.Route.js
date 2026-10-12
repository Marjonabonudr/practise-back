const express = require('express');
const router = express.Router();
const notificationController = require('../controller/Notification.Controller');

/**
 * @swagger
 * tags:
 *   name: Notification
 *   description: Tizim ichidagi bildirishnomalar va ogohlantirishlar paneli
 */

/**
 * @swagger
 * /api/notifications:
 *   get:
 *     tags: [Notification]
 *     summary: Avtorizatsiyadan o'tgan foydalanuvchining o'ziga tegishli barcha bildirishnomalarni olish
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Bildirishnomalar ro'yxati
 *       '500':
 *         description: Server xatosi
 */
router.get('/notifications', notificationController.getNotifications);

/**
 * @swagger
 * /api/notifications/{id}/read:
 *   put:
 *     tags: [Notification]
 *     summary: Bildirishnoma holatini "o'qildi" (isRead = true) deb yangilash
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *     responses:
 *       '200':
 *         description: Xabarnoma muvaffaqiyatli yopildi (O'qildi)
 *       '404':
 *         description: Bildirishnoma topilmadi
 *       '500':
 *         description: Server xatosi
 */
router.put('/notifications/:id/read', notificationController.markAsRead);

module.exports = router;
