const express = require('express');
const router = express.Router();
const placementController = require('../controller/Placement.Controller');

/**
 * @swagger
 * tags:
 *   name: Placement
 *   description: O'quvchilarni kompaniyalarga amaliyotga joylashtirish shartnomalari
 */

/**
 * @swagger
 * /api/placements:
 *   post:
 *     tags: [Placement]
 *     summary: O'quvchini kompaniyaga va mentorga biriktirib, yangi amaliyot shartnomasi yaratish
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - studentId
 *               - companyId
 *               - mentorId
 *               - startDate
 *               - endDate
 *               - plannedHours
 *               - goals
 *             properties:
 *               studentId:
 *                 type: string
 *                 format: uuid
 *               companyId:
 *                 type: string
 *                 format: uuid
 *               mentorId:
 *                 type: string
 *                 format: uuid
 *               startDate:
 *                 type: string
 *                 format: date
 *                 example: "2026-10-15"
 *               endDate:
 *                 type: string
 *                 format: date
 *                 example: "2027-01-15"
 *               plannedHours:
 *                 type: number
 *                 example: 160
 *               goals:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["REST API qurish", "Baza optimizatsiyasi", "Swagger yozish"]
 *     responses:
 *       '201':
 *         description: Amaliyot muvaffaqiyatli boshlandi
 *       '400':
 *         description: Talabada ayni vaqtda faol amaliyot bor (Dublikat taqiqlanadi)
 *       '500':
 *         description: Server xatosi
 */
router.post('/placements', placementController.createPlacement);

/**
 * @swagger
 * /api/placements:
 *   get:
 *     tags: [Placement]
 *     summary: Barcha joylashtirishlar tarixi va joriy holatlarini ko'rish
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Ro'yxat muvaffaqiyatli yuklandi
 *       '500':
 *         description: Server xatosi
 */
router.get('/placements', placementController.getPlacements);

/**
 * @swagger
 * /api/placements/{id}/status:
 *   put:
 *     tags: [Placement]
 *     summary: Amaliyot holatini o'zgartirish (Davom etmoqda, Vaqtincha to'xtatildi, Erta yopildi, Yakunlandi)
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
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [placed, ongoing, paused, terminated, completed]
 *               reason:
 *                 type: string
 *                 example: "Sog'ligi sababli vaqtincha to'xtatildi"
 *     responses:
 *       '200':
 *         description: Status o'zgardi va AuditLog tarixiga yozildi
 *       '400':
 *         description: To'xtatish yoki erta tugatishda sabab (reason) yozilmadi
 *       '404':
 *         description: Amaliyot shartnomasi topilmadi
 *       '500':
 *         description: Server xatosi
 */
router.put('/placements/:id/status', placementController.updatePlacementStatus);

module.exports = router;
