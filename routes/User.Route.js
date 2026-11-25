const express = require('express');
const router = express.Router();
const c = require('../controller/User.Controller');
const { protect, authorize } = require('../middlewares/auth');
const { loginLimiter } = require('../middlewares/security');
const { uuidParam } = require('../middlewares/access');
router.param('id', uuidParam);

/**
 * @swagger
 * /api/users/login:
 *   post:
 *     tags: [User]
 *     summary: Email va parol bilan kirish (JWT)
 *     security: []
 *     responses: { '200': { description: "{ token, role, id, email }" }, '401': { description: Noto'g'ri ma'lumot } }
 * /api/users/register:
 *   post:
 *     tags: [User]
 *     summary: Taklif havolasi tokeni orqali parol o'rnatish va akkaunt yaratish (ochiq ro'yxatdan o'tish yo'q)
 *     security: []
 *     responses: { '201': { description: Yaratildi }, '400': { description: Token yaroqsiz } }
 * /api/users/invite:
 *   post:
 *     tags: [User]
 *     summary: "Koordinator: 72 soatlik taklif (intern: studentId, mentor: companyId, fullName, email)"
 *     security: [{ bearerAuth: [] }]
 *     responses: { '200': { description: inviteLink } }
 * /api/users/me:
 *   get:
 *     tags: [User]
 *     summary: Joriy foydalanuvchi
 *     security: [{ bearerAuth: [] }]
 *     responses: { '200': { description: OK } }
 * /api/users:
 *   get:
 *     tags: [User]
 *     summary: "Koordinator: foydalanuvchilar ro'yxati (?role=mentor&companyId=...)"
 *     security: [{ bearerAuth: [] }]
 *     responses: { '200': { description: OK } }
 * /api/users/{id}/status:
 *   put:
 *     tags: [User]
 *     summary: "Koordinator: akkauntni faolsizlantirish/faollashtirish (sabab majburiy)"
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: string, format: uuid } }]
 *     responses: { '200': { description: OK } }
 */
router.post('/users/login', loginLimiter, c.loginUser);
router.post('/users/register', loginLimiter, c.registerUser);
router.post('/users/invite', protect, authorize('coordinator'), c.createInviteLink);
router.get('/users/me', protect, c.me);
router.get('/users', protect, authorize('coordinator'), c.listUsers);
router.put('/users/:id/status', protect, authorize('coordinator'), c.setUserStatus);
module.exports = router;
