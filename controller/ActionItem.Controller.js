const { Op } = require('sequelize');
const { ActionItem, Placement, Student, User } = require('../models');
const S = require('../validation/schemas');
const H = require('../utils/helpers');
const { placementScope, findAccessiblePlacement } = require('../middlewares/access');

const include = [
  { model: Placement, as: 'placement', attributes: ['id', 'studentId'], include: [{ model: Student, as: 'student', attributes: ['id', 'fullName'] }] },
  { model: User, as: 'responsible', attributes: ['id', 'fullName', 'email'] },
];

// Faqat tegishli foydalanuvchilar: koordinator hammasini, mentor o'z amaliyotchilariniki, boshqalar o'zi mas'ul bo'lganini
exports.getActionItems = async (req, res) => {
  const where = {};
  if (req.user.role === 'coordinator') {
    // hammasi
  } else {
    const ids = (await Placement.findAll({ where: await placementScope(req.user), attributes: ['id'] })).map((p) => p.id);
    where[Op.or] = [{ placementId: req.user.role === 'mentor' ? ids : [] }, { responsibleId: req.user.id }];
  }
  if (['open', 'in_progress', 'resolved'].includes(req.query.status)) where.status = req.query.status;
  if (H.isUuid(req.query.placementId)) where.placementId = req.query.placementId;
  const { page, limit, offset } = H.paging(req.query, 50);
  const { count, rows } = await ActionItem.findAndCountAll({ where, include, limit, offset, order: [['createdAt', 'DESC']] });
  H.ok(res, rows, 200, H.meta(count, page, limit));
};

exports.createActionItem = async (req, res) => {
  const v = H.parse(S.actionCreate, req.body, res); if (!v) return;
  const p = await findAccessiblePlacement(req.user, v.placementId);
  if (!p) return H.fail(res, 404, 'Amaliyot topilmadi');
  const item = await ActionItem.create({ ...v, source: 'manual', createdById: req.user.id });
  H.ok(res, item, 201);
};

exports.updateActionItem = async (req, res) => {
  const v = H.parse(S.actionUpdate, req.body, res); if (!v) return;
  const item = await ActionItem.findByPk(req.params.id);
  if (!item) return H.fail(res, 404, 'Muammo kartasi topilmadi');
  const mine = item.responsibleId === req.user.id;
  const p = await findAccessiblePlacement(req.user, item.placementId);
  if (!p && !mine) return H.fail(res, 404, 'Muammo kartasi topilmadi');
  if (v.status === 'resolved' && !(v.result || item.result)) return H.fail(res, 400, 'Hal qilindi holati uchun natija majburiy');
  // Mas'ul o'zgartira olmaydigan maydonlar
  if (req.user.role !== 'coordinator' && !p) delete v.responsibleId;
  await item.update({ ...v, resolvedAt: v.status === 'resolved' ? new Date() : (v.status ? null : item.resolvedAt) });
  H.ok(res, item);
};
