const { AuditLog, User } = require('../models');
const H = require('../utils/helpers');

exports.getAuditLogs = async (req, res) => {
  const where = {};
  if (req.query.action) where.action = String(req.query.action).slice(0, 80);
  if (H.isUuid(req.query.userId)) where.userId = req.query.userId;
  const { page, limit, offset } = H.paging(req.query, 50);
  const { count, rows } = await AuditLog.findAndCountAll({
    where, limit, offset, order: [['createdAt', 'DESC']],
    include: [{ model: User, as: 'user', attributes: ['id', 'email', 'fullName', 'role'] }],
  });
  H.ok(res, rows, 200, H.meta(count, page, limit));
};
