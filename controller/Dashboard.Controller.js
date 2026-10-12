const { Op } = require('sequelize');
const { Placement, Student, Company, User, sequelize } = require('../models');

// 1. Dashboard statistika hisoblash algoritmi
exports.getDashboardStats = async (req, res) => {
    try {
        // TZ: Noyob o'quvchilar soni (agregat counts orqali)
        const totalUniqueStudents = await Student.count();

        // TZ: Faol joylashtirish faqat “ongoing” (Davom etmoqda) statusidir
        const activePlacements = await Placement.count({
            where: { status: 'ongoing' }
        });

        // Yakunlangan amaliyotlar soni
        const completedPlacements = await Placement.count({
            where: { status: 'completed' }
        });

        // Faol hamkor kompaniyalar soni
        const activeCompanies = await Company.count({
            where: { status: 'active' }
        });

        // Taklif olganlar soni (hiringStatus: offered)
        const offeredCount = await Placement.count({
            where: { hiringStatus: 'offered' }
        });

        // Ish boshlaganlar soni (hiringStatus: started)
        const startedJobCount = await Placement.count({
            where: { hiringStatus: 'started' }
        });

        res.status(200).send({
            totalUniqueStudents,
            activePlacements,
            completedPlacements,
            activeCompanies,
            offeredCount,
            startedJobCount
        });
    } catch (error) {
        res.status(500).send(error.message);
    }
};

// 2. Filtrlar bilan asosiy jadval ro'yxatini yuklash (Qidiruv va Sahifalash 25/50)
exports.getDashboardTable = async (req, res) => {
    try {
        const { search, companyId, status, page = 1, limit = 25 } = req.query;
        const offset = (page - 1) * limit;

        let whereCondition = {};
        if (status) whereCondition.status = status;
        if (companyId) whereCondition.companyId = companyId;

        // Ism bo'yicha qidirish
        let studentWhere = {};
        if (search) {
            studentWhere.fullName = { [Op.iLike]: `%${search}%` };
        }

        const { count, rows } = await Placement.findAndCountAll({
            where: whereCondition,
            limit: parseInt(limit),
            offset: parseInt(offset),
            include: [
                { model: Student, as: 'student', where: studentWhere },
                { model: Company, as: 'company' },
                { model: User, as: 'mentor' }
            ],
            order: [['createdAt', 'DESC']]
        });

        res.status(200).send({
            totalItems: count,
            totalPages: Math.ceil(count / limit),
            currentPage: parseInt(page),
            data: rows
        });
    } catch (error) {
        res.status(500).send(error.message);
    }
};

// 3. UTF-8 CSV Eksport controlleri
exports.exportToCSV = async (req, res) => {
    try {
        const placements = await Placement.findAll({
            include: [
                { model: Student, as: 'student' },
                { model: Company, as: 'company' }
            ]
        });

        // TZ: UTF-8 CSV format uchun BOM belgisini qo'shish (Excel-da o'zbekcha harflar buzilmasligi uchun)
        let csvContent = '\uFEFF'; 
        csvContent += 'O‘quvchi F.I.Sh.,Yo‘nalish,Kompaniya,Reja Soat,Tasdiqlangan Soat,Amaliyot Status,Ishga Kirish Status\n';

        placements.forEach(p => {
            // TZ: Formula inyeksiyalaridan himoya qilish (kataklarni xavfsizlashtirish)
            let fullName = p.student ? p.student.fullName : '';
            if (fullName.startsWith('=') || fullName.startsWith('+') || fullName.startsWith('-')) {
                fullName = `'${fullName}`;
            }

            const field = p.student ? p.student.field : '';
            const companyName = p.company ? p.company.name : '';
            
            csvContent += `"${fullName}","${field}","${companyName}",${p.plannedHours},${p.approvedHours},"${p.status}","${p.hiringStatus}"\n`;
        });

        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', 'attachment; filename=amaliyot_monitoring_report.csv');
        res.status(200).send(csvContent);
    } catch (error) {
        res.status(500).send(error.message);
    }
};
