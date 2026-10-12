const cron = require('node-cron');
const { Op } = require('sequelize');
const { Placement, WorkLog, WeeklyReport, Notification, Student } = require('../models');

// TZ: Eslatmalar serverda har kuni 09:00 da tekshiriladi
const initCronJobs = () => {
    cron.schedule('0 9 * * *', async () => {
        console.log('Avtomatik nazorat qoidalari tekshirilmoqda: Soat 09:00');
        
        try {
            const bugun = new Date();
            
            // --- 1-QOIDA: Tugashiga 7 kun qolganda ogohlantirish ---
            const ettiKunKeyin = new Date();
            ettiKunKeyin.setDate(bugun.getDate() + 7);
            const ettiKunKeyinString = ettiKunKeyin.toISOString().split('T')[0];

            const yaqinlashayotganAmaliyotlar = await Placement.findAll({
                where: { endDate: ettiKunKeyinString, status: 'ongoing' },
                include: [{ model: Student, as: 'student' }]
            });

            for (let p of yaqinlashayotganAmaliyotlar) {
                const sarlavha = 'Yakuniy suhbat eslatmasi';
                const matn = `${p.student ? p.student.fullName : 'O‘quvchi'}ning amaliyoti tugashiga 7 kun qoldi. Yakuniy suhbatni rejalashtiring.`;

                // TZ: Takroriy nusxa yaratmaslik tekshiruvi
                const duplicate = await Notification.findOne({ where: { userId: p.mentorId, title: sarlavha, message: matn } });
                if (!duplicate) {
                    await Notification.create({ userId: p.mentorId, title: sarlavha, message: matn, type: 'deadline_warning' });
                    await Notification.create({ userId: p.coordinatorId, title: sarlavha, message: matn, type: 'deadline_warning' });
                }
            }

            // --- 2-QOIDA: Ketma-ket 2 kun sababsiz kelmaganlik (Signal) ---
            const faolAmaliyotlar = await Placement.findAll({ where: { status: 'ongoing' } });
            
            for (let p of faolAmaliyotlar) {
                const oxirgiQaydlar = await WorkLog.findAll({
                    where: { placementId: p.id },
                    order: [['date', 'DESC']],
                    limit: 2
                });

                if (oxirgiQaydlar.length === 2) {
                    const harIkkiKunSababsiz = oxirgiQaydlar.every(log => log.attendance === 'absent_unreasoned' && log.status === 'approved');
                    
                    if (harIkkiKunSababsiz) {
                        const sarlavha = '⚠️ Kritik Signal: Ketma-ket kelmaslik';
                        const matn = `Amaliyot ID: ${p.id} bo‘lgan talaba ketma-ket 2 rejalashtirilgan kunda sababsiz kelmadi!`;

                        const duplicate = await Notification.findOne({ where: { userId: p.coordinatorId, title: sarlavha } });
                        if (!duplicate) {
                            await Notification.create({ userId: p.coordinatorId, title: sarlavha, message: matn, type: 'absence_alert' });
                        }
                    }
                }
            }

            // --- 3-QOIDA: Oxirgi haftalik o‘rtacha 3 dan past bo‘lsa signal ---
            const pastBaholar = await WeeklyReport.findAll({
                where: {
                    averageScore: { [Op.lt]: 3.0 },
                    createdAt: { [Op.gte]: new Date(bugun.setDate(bugun.getDate() - 1)) }
                },
                include: [{ model: Placement, as: 'placement' }]
            });

            for (let report of pastBaholar) {
                if (report.placement) {
                    const sarlavha = '🆘 Yordam vazifasi: Past progress ko‘rsatkichi';
                    const matn = `Talabaning haftalik o‘rtacha bahosi 3 dan past (${report.averageScore}). Yordam kartochkasi ochilishi tavsiya etiladi.`;

                    const duplicate = await Notification.findOne({ where: { userId: report.placement.coordinatorId, title: sarlavha } });
                    if (!duplicate) {
                        await Notification.create({ userId: report.placement.coordinatorId, title: sarlavha, message: matn, type: 'low_score' });
                    }
                }
            }

        } catch (error) {
            console.error('Cron xizmati ishlashida xatolik:', error.message);
        }
    }, {
        scheduled: true,
        timezone: "Asia/Tashkent"
    });
};

module.exports = initCronJobs;
