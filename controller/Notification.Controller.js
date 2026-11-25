const { Notification } = require('../models');
const H = require('../utils/helpers');

exports.getNotifications = async (req, res) => {
  const where = { userId: req.user.id }; // faqat o'zinikini
  if (req.query.unread === '1') where.isRead = false;
  const { page, limit, offset } = H.paging(req.query, 50);
  const { count, rows } = await Notification.findAndCountAll({ where, limit, offset, order: [['createdAt', 'DESC']] });
  const unread = await Notification.count({ where: { userId: req.user.id, isRead: false, resolvedAt: null } });
  H.ok(res, rows, 200, { ...H.meta(count, page, limit), unread });
};

exports.markAsRead = async (req, res) => {
  const n = await Notification.findOne({ where: { id: req.params.id, userId: req.user.id } });
  if (!n) return H.fail(res, 404, 'Bildirishnoma topilmadi');
  await n.update({ isRead: true });
  H.ok(res, n);
};

exports.markAllRead = async (req, res) => {
  const [count] = await Notification.update({ isRead: true }, { where: { userId: req.user.id, isRead: false } });
  H.ok(res, { updated: count });
};
