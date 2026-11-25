const express = require('express');
const router = express.Router();
const c = require('../controller/Student.Controller');
const { protect, authorize } = require('../middlewares/auth');
const { uuidParam } = require('../middlewares/access');
router.param('id', uuidParam);

/**
 * @swagger
 * /api/students:
 *   get: { tags: [Student], summary: "Koordinator: o'quvchilar (?search=&status=)", security: [{ bearerAuth: [] }], responses: { '200': { description: OK } } }
 *   post: { tags: [Student], summary: "Koordinator: o'quvchi profili (fullName, email, phone, field, group). userId KERAK EMAS", security: [{ bearerAuth: [] }], responses: { '201': { description: OK } } }
 * /api/students/{id}:
 *   get: { tags: [Student], summary: "Kartochka: koordinator hammasini, mentor o'ziga biriktirilganini, o'quvchi faqat o'zini", security: [{ bearerAuth: [] }], parameters: [{ in: path, name: id, required: true, schema: { type: string } }], responses: { '200': { description: OK }, '404': { description: Topilmadi yoki ruxsat yo'q } } }
 *   put: { tags: [Student], summary: Yangilash, security: [{ bearerAuth: [] }], parameters: [{ in: path, name: id, required: true, schema: { type: string } }], responses: { '200': { description: OK } } }
 *   delete: { tags: [Student], summary: Arxivlash, security: [{ bearerAuth: [] }], parameters: [{ in: path, name: id, required: true, schema: { type: string } }], responses: { '200': { description: OK } } }
 */
router.post('/students', protect, authorize('coordinator'), c.createStudent);
router.get('/students', protect, authorize('coordinator'), c.getStudents);
router.get('/students/:id', protect, authorize('coordinator', 'mentor', 'intern'), c.getStudentById);
router.put('/students/:id', protect, authorize('coordinator'), c.updateStudent);
router.delete('/students/:id', protect, authorize('coordinator'), c.deleteStudent);
module.exports = router;
