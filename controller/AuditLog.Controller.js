const { Op } = require('sequelize');
const { AuditLog } = require('../models');

exports.getAuditLogs = async (req, res) => {
    try {
        // Faqat koordinator tizim audit tarixini o'qiydi
        const logs = await AuditLog.findAll({
            order: [['createdAt', 'DESC']]
        });
        res.status(200).send(logs);
    } catch (error) {
        res.status(500).send(error.message);
    }
};
