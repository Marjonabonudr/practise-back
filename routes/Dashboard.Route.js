const express = require('express');
const router = express.Router();
const c = require('../controller/Dashboard.Controller');
const { protect, authorize } = require('../middlewares/auth');
// app.js da '/api/dashboard' ostida ulanadi => manzillar: /api/dashboard/stats, /table, /export
router.use(protect, authorize('coordinator'));

/**
 * @swagger
 * /api/dashboard/stats:
 *   get: { tags: [Dashboard], summary: Dashboard raqamlari, security: [{ bearerAuth: [] }], responses: { '200': { description: OK } } }
 * /api/dashboard/table:
 *   get: { tags: [Dashboard], summary: "Asosiy jadval (?search=&companyId=&mentorId=&field=&status=&hiringStatus=&dateFrom=&dateTo=&page=&limit=25|50)", security: [{ bearerAuth: [] }], responses: { '200': { description: OK } } }
 * /api/dashboard/export:
 *   get: { tags: [Dashboard], summary: "UTF-8 CSV (jadvaldagi filtrlar bilan bir xil)", security: [{ bearerAuth: [] }], responses: { '200': { description: CSV } } }
 */
router.get('/stats', c.getDashboardStats);
router.get('/table', c.getDashboardTable);
router.get('/export', c.exportToCSV);
module.exports = router;
