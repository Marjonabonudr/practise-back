const express = require('express');
const router = express.Router();
const workLogController = require('../controller/WorkLog.Controller');

/**
 * @swagger
 * tags:
 *   name: WorkLog
 *   description: Kunlik davomat va bajarilgan ish soatlari qaydlari
 */

/**
 * @swagger
 * /api/worklogs:
 *   post:
 *     tags: [WorkLog]
 *     summary: Amaliyotchi tomonidan yangi kunlik vazifa va soat qaydini yuborish
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
 *               - date
 *               - hours
 *               - attendance
 *               - task
 *               - resultUrl
 *             properties:
 *               placementId:
 *                 type: string
 *                 format: uuid
 *               date:
 *                 type: string
 *                 format: date
 *                 example: "2026-10-12"
 *               hours:
 *                 type: number
 *                 example: 6.5
 *               attendance:
 *                 type: string
 *                 enum: [present, absent_reasoned, absent_unreasoned, weekend]
 *                 example: present
 *               task:
 *                 type: string
 *                 example: "Bugun Sequelize modellarini yozdim va munosabatlarni bog'ladim."
 *               resultUrl:
 *                 type: string
 *                 example: "https://github.com"
 *               comment:
 *                 type: string
 *                 example: "Kechikish sababli qo'shimcha ishlandi."
 *     responses:
 *       '201':
 *         description: Kunlik qayd yaratildi va Mentor tasdig'iga yuborildi
 *       '400':
 *         description: Bir kunga bitta qayd sharti buzildi (Dublikat taqiqlanadi) yoki soat 0.5 qadamda emas
 *       '500':
 *         description: Server xatosi
 */
router.post('/worklogs', workLogController.createWorkLog);

/**
 * @swagger
 * /api/worklogs/{id}/approve:
 *   put:
 *     tags: [WorkLog]
 *     summary: Mentor yoki Koordinator tomonidan talabaning kunlik soatini tasdiqlash va jami soatga qo'shish
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
 *         description: Qayd tasdiqlandi, amaliyotning o'talgan soatlari avtomatik qayta hisoblandi
 *       '404':
 *         description: Qayd topilmadi
 *       '500':
 *         description: Server xatosi
 */
router.put('/worklogs/:id/approve', workLogController.approveWorkLog);

module.exports = router;
