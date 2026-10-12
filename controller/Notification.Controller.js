const { Op } = require('sequelize');
const { Notification } = require('../models');

exports.getNotifications = async (req, res) => {
    try {
        const notifications = await Notification.findAll({
            where: { userId: req.user.id },
            order: [['createdAt', 'DESC']]
        });
        res.status(200).send(notifications);
    } catch (error) {
        res.status(500).send(error.message);
    }
};

exports.markAsRead = async (req, res) => {
    try {
        const notification = await Notification.findOne({
            where: { id: req.params.id, userId: req.user.id }
        });
        if (!notification) return res.status(404).send('Notification not found');

        // TZ: Tizim ichida "o‘qildi" holati mavjud
        await notification.update({ isRead: true });
        res.status(200).send(notification);
    } catch (error) {
        res.status(500).send(error.message);
    }
};
