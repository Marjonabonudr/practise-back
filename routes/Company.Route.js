const express = require('express');
const router = express.Router();
const c = require('../controller/Company.Controller');
const { protect, authorize } = require('../middlewares/auth');
const { uuidParam } = require('../middlewares/access');
router.param('id', uuidParam);
router.use('/companies', protect, authorize('coordinator'));

/**
 * @swagger
 * /api/companies:
 *   get: { tags: [Company], summary: "Kompaniyalar (?status=active|archive|all&search=)", security: [{ bearerAuth: [] }], responses: { '200': { description: OK } } }
 *   post: { tags: [Company], summary: Yangi kompaniya, security: [{ bearerAuth: [] }], responses: { '201': { description: OK } } }
 * /api/companies/{id}:
 *   get: { tags: [Company], summary: "Kompaniya kartochkasi", security: [{ bearerAuth: [] }], parameters: [{ in: path, name: id, required: true, schema: { type: string } }], responses: { '200': { description: OK } } }
 *   put: { tags: [Company], summary: Yangilash yoki arxivlash, security: [{ bearerAuth: [] }], parameters: [{ in: path, name: id, required: true, schema: { type: string } }], responses: { '200': { description: OK } } }
 *   delete: { tags: [Company], summary: Arxivlash (tarix saqlanadi), security: [{ bearerAuth: [] }], parameters: [{ in: path, name: id, required: true, schema: { type: string } }], responses: { '200': { description: OK } } }
 */
router.post('/companies', c.createCompany);
router.get('/companies', c.getCompanies);
router.get('/companies/:id', c.getCompanyById);
router.put('/companies/:id', c.updateCompany);
router.delete('/companies/:id', c.deleteCompany);
module.exports = router;
