const express = require('express');
const router = express.Router();
const dashboardController = require('../controller/Dashboard.Controller');
const { protect, authorize } = require('../middlewares/auth');

/**
 * @swagger
 * tags:
 *   name: Dashboard
 *   description: Koordinatorlar uchun tahliliy hisobotlar va eksport
 */

/**
 * @swagger
 * /api/dashboard/stats:
 *   get:
 *     tags: [Dashboard]
 *     summary: Dashboard uchun asosiy raqamli statistikalarni olish
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Statistika muvaffaqiyatli hisoblandi
 *       '500':
 *         description: Server xatosi
 */
router.get('/dashboard/stats', protect, authorize('coordinator'), dashboardController.getDashboardStats);

/**
 * @swagger
 * /api/dashboard/table:
 *   get:
 *     tags: [Dashboard]
 *     summary: Filtrlash va sahifalash bilan koordinator bosh jadvalini yuklash
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Jadval ma'lumotlari yuklandi
 *       '500':
 *         description: Server xatosi
 */
router.get('/dashboard/table', protect, authorize('coordinator'), dashboardController.getDashboardTable);

/**
 * @swagger
 * /api/dashboard/export:
 *   get:
 *     tags: [Dashboard]
 *     summary: Amaliyot hisobotlarini UTF-8 CSV formatida yuklab olish
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: CSV fayl muvaffaqiyatli generatsiya qilindi
 *       '500':
 *         description: Server xatosi
 */
router.get('/dashboard/export', protect, authorize('coordinator'), dashboardController.exportToCSV);

module.exports = router;
