const express = require('express');
const router = express.Router();
const auditLogController = require('../controller/AuditLog.Controller');

/**
 * @swagger
 * tags:
 *   name: AuditLog
 *   description: Tizim xavfsizligi va muhim o'zgarishlar tarixi loglari (Faqat Koordinator uchun)
 */

/**
 * @swagger
 * /api/audit-logs:
 *   get:
 *     tags: [AuditLog]
 *     summary: Kim, qachon, qaysi obyektni nima sababdan o'zgartirganligi to'liq tarixini yuklash
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Tizim amallar tarixi muvaffaqiyatli yuklandi
 *       '401':
 *         description: Token xatosi
 *       '403':
 *         description: Ushbu loglarni ko'rish huquqi sizda yo'q
 *       '500':
 *         description: Server xatosi
 */
router.get('/audit-logs', auditLogController.getAuditLogs);

module.exports = router;
