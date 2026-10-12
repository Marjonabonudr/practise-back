const express = require('express');
const router = express.Router();
const companyController = require('../controller/Company.Controller');

/**
 * @swagger
 * tags:
 *   name: Company
 *   description: Hamkor kompaniyalarni boshqarish paneli
 */

/**
 * @swagger
 * /api/companies:
 *   post:
 *     tags: [Company]
 *     summary: Yangi hamkor kompaniya qo'shish
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - field
 *               - address
 *               - contact
 *             properties:
 *               name:
 *                 type: string
 *                 example: Najot Ta'lim MCHJ
 *               field:
 *                 type: string
 *                 example: Axborot Texnologiyalari
 *               address:
 *                 type: string
 *                 example: Toshkent sh., Chilonzor 9-kvartal
 *               contact:
 *                 type: string
 *                 example: "+998712001122"
 *     responses:
 *       '201':
 *         description: Kompaniya muvaffaqiyatli qo'shildi
 *       '400':
 *         description: Ma'lumotlar to'liq emas
 *       '500':
 *         description: Server xatosi
 */
router.post('/companies', companyController.createCompany);

/**
 * @swagger
 * /api/companies:
 *   get:
 *     tags: [Company]
 *     summary: Barcha faol hamkor kompaniyalar ro'yxatini yuklash
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Ro'yxat yuklandi
 *       '500':
 *         description: Server xatosi
 */
router.get('/companies', companyController.getCompanies);

/**
 * @swagger
 * /api/companies/{id}:
 *   get:
 *     tags: [Company]
 *     summary: ID bo'yicha kompaniya kartochkasi va tafsilotlari
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
 *         description: Kompaniya tafsilotlari
 *       '404':
 *         description: Kompaniya topilmadi
 *       '500':
 *         description: Server xatosi
 */
router.get('/companies/:id', companyController.getCompanyById);

/**
 * @swagger
 * /api/companies/{id}:
 *   put:
 *     tags: [Company]
 *     summary: Kompaniya ma'lumotlarini yangilash yoki arxivlash
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
 *               name:
 *                 type: string
 *               field:
 *                 type: string
 *               address:
 *                 type: string
 *               contact:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [active, archive]
 *     responses:
 *       '200':
 *         description: Ma'lumotlar yangilandi
 *       '404':
 *         description: Kompaniya topilmadi
 *       '500':
 *         description: Server xatosi
 */
router.put('/companies/:id', companyController.updateCompany);

/**
 * @swagger
 * /api/companies/{id}:
 *   delete:
 *     tags: [Company]
 *     summary: Kompaniyani bazadan o'chirish
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
 *         description: Kompaniya muvaffaqiyatli o'chirildi
 *       '404':
 *         description: Kompaniya topilmadi
 *       '500':
 *         description: Server xatosi
 */
router.delete('/companies/:id', companyController.deleteCompany);

module.exports = router;
