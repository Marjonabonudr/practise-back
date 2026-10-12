const express = require('express');
const router = express.Router();
const studentController = require('../controller/Student.Controller');

/**
 * @swagger
 * tags:
 *   name: Student
 *   description: O'quvchilar profili va kartochkalarini boshqarish
 */

/**
 * @swagger
 * /api/students:
 *   post:
 *     tags: [Student]
 *     summary: Yangi o'quvchi profil ma'lumotlarini yaratish
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - fullName
 *               - phone
 *               - field
 *               - group
 *             properties:
 *               userId:
 *                 type: string
 *                 format: uuid
 *               fullName:
 *                 type: string
 *                 example: Eshmatov Toshmat
 *               phone:
 *                 type: string
 *                 example: "+998901234567"
 *               field:
 *                 type: string
 *                 example: Backend Go
 *               group:
 *                 type: string
 *                 example: B-102
 *     responses:
 *       '201':
 *         description: Profil yaratildi
 *       '400':
 *         description: Validatsiya xatosi
 *       '500':
 *         description: Server xatosi
 */
router.post('/students', studentController.createStudent);

/**
 * @swagger
 * /api/students:
 *   get:
 *     tags: [Student]
 *     summary: Barcha o'quvchilar ro'yxatini olish
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Muvaffaqiyatli ro'yxat yuklandi
 *       '500':
 *         description: Server xatosi
 */
router.get('/students', studentController.getStudents);

/**
 * @swagger
 * /api/students/{id}:
 *   get:
 *     tags: [Student]
 *     summary: ID bo'yicha o'quvchi kartochkasi, profili va barcha amaliyotlar tarixini olish
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: O'quvchi ID raqami
 *     responses:
 *       '200':
 *         description: O'quvchi tarixi bilan to'liq yuklandi
 *       '403':
 *         description: Begona talaba profilini ko'rish taqiqlangan
 *       '404':
 *         description: O'quvchi topilmadi
 *       '500':
 *         description: Server xatosi
 */
router.get('/students/:id', studentController.getStudentById);

/**
 * @swagger
 * /api/students/{id}:
 *   put:
 *     tags: [Student]
 *     summary: O'quvchi ma'lumotlarini ID bo'yicha yangilash
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
 *             properties:
 *               fullName:
 *                 type: string
 *               phone:
 *                 type: string
 *               field:
 *                 type: string
 *               group:
 *                 type: string
 *     responses:
 *       '200':
 *         description: Profil muvaffaqiyatli yangilandi
 *       '404':
 *         description: O'quvchi topilmadi
 *       '500':
 *         description: Server xatosi
 */
router.put('/students/:id', studentController.updateStudent);

/**
 * @swagger
 * /api/students/{id}:
 *   delete:
 *     tags: [Student]
 *     summary: O'quvchini tizimdan o'chirish
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
 *         description: O'quvchi profili o'chirildi
 *       '404':
 *         description: O'quvchi topilmadi
 *       '500':
 *         description: Server xatosi
 */
router.delete('/students/:id', studentController.deleteStudent);

module.exports = router;
