const { Op } = require('sequelize');
const { WorkLog, Placement, sequelize } = require('../models');
const validateWorkLog = require('../validation/workLog.Validation');

exports.createWorkLog = async (req, res) => {
    const { error } = validateWorkLog(req.body);
    if (error) return res.status(400).send(error.details[0].message);

    try {
        const { placementId, date } = req.body;

        // TZ: Bir joylashtirish uchun bir sanaga bitta kunlik qayd bo‘ladi
        const existingLog = await WorkLog.findOne({ where: { placementId, date } });
        if (existingLog) {
            return res.status(400).send('Ushbu kunga amaliyotchi hisobot kiritib bo‘lgan!');
        }

        const logData = { ...req.body };
        // TZ: Agar koordinator og'zaki ma'lumot asosida kiritsa avtomat tasdiqlanadi
        if (req.user && req.user.role === 'coordinator') {
            logData.createdByCoordinator = true;
            logData.status = 'approved';
        } else {
            logData.status = 'submitted';
        }

        const workLog = await WorkLog.create(logData);
        res.status(201).send(workLog);
    } catch (error) {
        res.status(500).send(error.message);
    }
};

exports.approveWorkLog = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const workLog = await WorkLog.findByPk(req.params.id);
        if (!workLog) return res.status(404).send('WorkLog not found');

        await workLog.update({ status: 'approved' }, { transaction: t });

        // TZ: O‘talgan soat = faqat tasdiqlangan ish qaydlaridagi soatlar yig‘indisi
        const totalApprovedHours = await WorkLog.sum('hours', {
            where: { placementId: workLog.placementId, status: 'approved' },
            transaction: t
        }) || 0;

        await Placement.update(
            { approvedHours: totalApprovedHours },
            { where: { id: workLog.placementId }, transaction: t }
        );

        await t.commit();
        res.status(200).send(workLog);
    } catch (error) {
        await t.rollback();
        res.status(500).send(error.message);
    }
};
