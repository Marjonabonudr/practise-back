const { Op } = require('sequelize');
const { Placement, AuditLog, Student, Company } = require('../models');
const validatePlacement = require('../validation/placement.Validation');

exports.createPlacement = async (req, res) => {
    const { error } = validatePlacement(req.body);
    if (error) return res.status(400).send(error.details[0].message);

    try {
        // TZ: Bir vaqtda ikkita faol joylashtirish taqiqlanadi
        const activePlacement = await Placement.findOne({
            where: {
                studentId: req.body.studentId,
                status: { [Op.in]: ['placed', 'ongoing', 'paused'] }
            }
        });

        if (activePlacement) {
            return res.status(400).send('O‘quvchida faol amaliyot mavjud. Dublikat joylashtirish taqiqlanadi.');
        }

        const placement = await Placement.create(req.body);
        res.status(201).send(placement);
    } catch (error) {
        res.status(500).send(error.message);
    }
};

exports.getPlacements = async (req, res) => {
    try {
        const placements = await Placement.findAll({
            include: [
                { model: Student, as: 'student' },
                { model: Company, as: 'company' }
            ]
        });
        res.status(200).send(placements);
    } catch (error) {
        res.status(500).send(error.message);
    }
};

exports.updatePlacementStatus = async (req, res) => {
    try {
        const { status, reason } = req.body;
        const placement = await Placement.findByPk(req.params.id);
        if (!placement) return res.status(404).send('Placement not found');

        // TZ: to‘xtatish va erta tugatishda sabab majburiy
        if (['paused', 'terminated'].includes(status) && !reason) {
            return res.status(400).send('Statusni o‘zgartirish uchun sabab (reason) kiritish majburiy');
        }

        const oldStatus = placement.status;
        await placement.update({ status, statusReason: reason });

        // TZ: Har bir muhim o‘zgarishda kim, qachon, nimani o‘zgartirgani tarixga yoziladi
        await AuditLog.create({
            userId: req.user.id, // middleware'dan keladi
            action: 'PLACEMENT_STATUS_CHANGE',
            details: { oldStatus, newStatus: status, placementId: placement.id },
            reason: reason || 'Koordinator tomonidan holat yangilandi'
        });

        res.status(200).send(placement);
    } catch (error) {
        res.status(500).send(error.message);
    }
};
