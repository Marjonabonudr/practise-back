const express = require('express');
const router = express.Router();
const userController = require('../controller/User.Controller');

/**
 * @swagger
 * tags:
 *   name: User 
 *   description: Foydalanuvchilar va akkauntlarni boshqarish tizimi
 */

/**
 * @swagger
 * /api/users/invite:
 *   post:
 *     tags: [User]
 *     summary: Koordinator tomonidan amaliyotchi yoki mentor uchun 72 soatlik taklif havolasi yaratish
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - role
 *             properties:
 *               email:
 *                 type: string
 *                 example: mentor@company.com
 *               role:
 *                 type: string
 *                 enum: [intern, mentor]
 *                 example: mentor
 *     responses:
 *       '200':
 *         description: Bir martalik taklif havolasi muvaffaqiyatli yaratildi
 *       '400':
 *         description: Noto'g'ri ma'lumotlar kiritildi
 *       '401':
 *         description: Avtorizatsiya xatosi
 *       '403':
 *         description: Huquq yetarli emas (Faqat koordinator uchun)
 *       '500':
 *         description: Server xatosi
 */
router.post('/users/invite', userController.createInviteLink);

/**
 * @swagger
 * /api/users/register:
 *   post:
 *     tags: [User]
 *     summary: Taklif havolasi orqali tizimda yangi akkaunt ro'yxatdan o'tkazish
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - role
 *             properties:
 *               email:
 *                 type: string
 *                 example: student@algoritm.uz
 *               password:
 *                 type: string
 *                 example: securePassword123
 *               role:
 *                 type: string
 *                 enum: [coordinator, intern, mentor]
 *                 example: intern
 *     responses:
 *       '201':
 *         description: Foydalanuvchi muvaffaqiyatli ro'yxatdan o'tdi
 *       '400':
 *         description: Email band yoki validatsiya xatosi
 *       '500':
 *         description: Server xatosi
 */
router.post('/users/register', userController.registerUser);

/**
 * @swagger
 * /api/users/login:
 *   post:
 *     tags: [User]
 *     summary: Tizimga email va parol orqali kirish (JWT token olish)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: coordinator@algoritm.uz
 *               password:
 *                 type: string
 *                 example: password123
 *     responses:
 *       '200':
 *         description: Tizimga muvaffaqiyatli kirildi va token berildi
 *       '401':
 *         description: Email yoki parol noto'g'ri, yoki akkaunt faolsizlantirilgan
 *       '500':
 *         description: Server xatosi
 */
router.post('/users/login', userController.loginUser);

module.exports = router;
