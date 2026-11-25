const express = require('express');
const router = express.Router();
const c = require('../controller/AuditLog.Controller');
const { protect, authorize } = require('../middlewares/auth');

/**
 * @swagger
 * /api/audit-logs:
 *   get: { tags: [AuditLog], summary: "Koordinator: kim, qachon, nimani, nima sababdan o'zgartirgan", security: [{ bearerAuth: [] }], responses: { '200': { description: OK } } }
 */
router.get('/audit-logs', protect, authorize('coordinator'), c.getAuditLogs);
module.exports = router;
