// TZ 6: "Avtomatik nazorat qoidalari". Hamma qoida shu yerda; cronScheduler.js faqat vaqtni belgilaydi.
// Printsiplar:
//  * faqat "Davom etmoqda" amaliyotlar tekshiriladi => to'xtatilgan davrda eslatma hisoblanmaydi
//  * bir voqea = bitta dedupeKey; bazadagi unikal indeks (userId, dedupeKey) takrorlanishni imkonsiz qiladi
//  * shart bartaraf bo'lsa eslatma avtomatik yopiladi (resolvedAt)
const { Op } = require('sequelize');
const { Placement, Student, WorkLog, WeeklyReport, Notification, ActionItem, User } = require('../models');
const H = require('./helpers');

const uniq = (a) => [...new Set(a.filter(Boolean))];
const coordinatorIds = async () =>
  (await User.findAll({ where: { role: 'coordinator', status: 'active' }, attributes: ['id'] })).map((u) => u.id);
const nameOf = (p) => p.student?.fullName || 'O‘quvchi';

const notifyOnce = async ({ users, type, key, title, message, placementId }) => {
  for (const userId of uniq(users)) {
    try {
      const [n, created] = await Notification.findOrCreate({
        where: { userId, dedupeKey: key }, defaults: { type, title, message, placementId: placementId || null },
      });
      if (!created && n.resolvedAt) await n.update({ resolvedAt: null }); // shart qaytadan paydo bo'lsa qayta ochiladi
    } catch (e) {
      if (e.name !== 'SequelizeUniqueConstraintError') throw e; // parallel ishga tushish — dublikat yaratilmaydi
    }
  }
};

// Shart endi mavjud bo'lmagan eslatmalarni yopadi
const closeResolved = async (type, activeKeys) => {
  const where = { type, resolvedAt: null, dedupeKey: { [Op.ne]: null } };
  if (activeKeys.length) where[Op.and] = [{ dedupeKey: { [Op.notIn]: activeKeys } }];
  await Notification.update({ resolvedAt: new Date() }, { where });
};

const ongoing = (extra = {}) =>
  Placement.findAll({ where: { status: 'ongoing', ...extra }, include: [{ model: Student, as: 'student', attributes: ['id', 'fullName', 'userId'] }] });

// 1) Tugashiga 7 kun qolganda (koordinator + mentor); muddati o'tib yopilmagan bo'lsa alohida ogohlantirish
const ruleDeadline = async (coords) => {
  const today = H.todayStr();
  const soon = await ongoing({ endDate: { [Op.between]: [today, H.addDays(today, 7)] } });
  const overdue = await ongoing({ endDate: { [Op.lt]: today } });
  const k1 = [], k2 = [];
  for (const p of soon) {
    const key = `deadline7:${p.id}`; k1.push(key);
    await notifyOnce({ users: [p.mentorId, ...coords], type: 'deadline_warning', key, placementId: p.id,
      title: 'Yakuniy suhbat eslatmasi', message: `${nameOf(p)} amaliyoti ${p.endDate} da tugaydi. Yakuniy suhbatni rejalashtiring.` });
  }
  for (const p of overdue) {
    const key = `overdue:${p.id}:${p.endDate}`; k2.push(key);
    await notifyOnce({ users: [p.mentorId, ...coords], type: 'placement_overdue', key, placementId: p.id,
      title: '⏰ Amaliyot muddati o‘tdi', message: `${nameOf(p)} amaliyoti ${p.endDate} da tugashi kerak edi, lekin hali yopilmagan.` });
  }
  await closeResolved('deadline_warning', k1);
  await closeResolved('placement_overdue', k2);
};

// 2) Haftalik hisobot muddati o'tdi (amaliyotchi + koordinator) va mentor bahosi kechikdi (mentor + koordinator)
const WEEKS_BACK = 8;
const ruleReports = async (coords) => {
  const now = new Date();
  const today = H.todayStr();
  const placements = await ongoing();
  const mondays = Array.from({ length: WEEKS_BACK }, (_, i) => H.addDays(H.mondayOf(today), -7 * i));
  const reps = await WeeklyReport.findAll({ where: { placementId: placements.map((p) => p.id), weekStartDate: mondays } });
  const byKey = new Map(reps.map((r) => [`${r.placementId}:${r.weekStartDate}`, r]));
  const kRep = [], kGrade = [];

  for (const p of placements) {
    for (const monday of mondays) {
      if (monday > p.endDate || H.addDays(monday, 6) < p.startDate) continue;           // hafta amaliyotdan tashqarida
      if (H.scheduledDates(p, monday, H.addDays(monday, 6)).length === 0) continue;     // bayram/ta'til/istisno hafta
      const r = byKey.get(`${p.id}:${monday}`);
      if (!r) {
        if (now > H.reportDeadline(monday)) {
          const key = `report_overdue:${p.id}:${monday}`; kRep.push(key);
          await notifyOnce({ users: [p.student?.userId, ...coords], type: 'report_overdue', key, placementId: p.id,
            title: 'Haftalik hisobot muddati o‘tdi', message: `${nameOf(p)}: ${monday} haftasi uchun hisobot yuborilmagan.` });
        }
      } else if (!r.gradedAt && now > H.gradeDeadline(monday)) {
        const key = `grade_overdue:${r.id}`; kGrade.push(key);
        await notifyOnce({ users: [p.mentorId, ...coords], type: 'grade_overdue', key, placementId: p.id,
          title: 'Mentor bahosi kechikdi', message: `${nameOf(p)}: ${monday} haftalik hisobotiga baho qo‘yilmagan.` });
      }
    }
  }
  await closeResolved('report_overdue', kRep);
  await closeResolved('grade_overdue', kGrade);
};

// 3) Ketma-ket 2 REJALASHTIRILGAN kunda tasdiqlangan sababsiz kelmaslik => koordinatorga signal
const ruleAbsence = async (coords) => {
  const today = H.todayStr();
  const placements = await ongoing();
  const logs = await WorkLog.findAll({
    where: { placementId: placements.map((p) => p.id), attendance: 'absent_unreasoned', status: 'approved', date: { [Op.gte]: H.addDays(today, -60) } },
    attributes: ['placementId', 'date'],
  });
  const absent = {};
  for (const l of logs) (absent[l.placementId] ||= new Set()).add(l.date);
  const keys = [];
  for (const p of placements) {
    const set = absent[p.id]; if (!set || set.size < 2) continue;
    const days = H.scheduledDates(p, H.addDays(today, -60), H.addDays(today, -1)); // bugundan oldingi rejalashtirilgan kunlar
    if (days.length < 2) continue;
    const [d1, d2] = days.slice(-2);
    if (set.has(d1) && set.has(d2)) {
      const key = `absence:${p.id}:${d2}`; keys.push(key);
      await notifyOnce({ users: coords, type: 'absence_alert', key, placementId: p.id,
        title: '⚠️ Kritik signal: ketma-ket kelmaslik', message: `${nameOf(p)} ketma-ket 2 rejalashtirilgan kunda (${d1}, ${d2}) sababsiz kelmadi.` });
    }
  }
  await closeResolved('absence_alert', keys);
};

// 4) Oxirgi haftalik o'rtacha 3 dan past => YORDAM VAZIFASI (muammo kartasi) + koordinatorga xabar.
//    Keyingi hafta baho 3 va undan yuqori bo'lsa, avtomatik karta va eslatma yopiladi.
const ruleLowScore = async (coords, onlyPlacementId = null) => {
  const placements = await ongoing(onlyPlacementId ? { id: onlyPlacementId } : {});
  const reps = await WeeklyReport.findAll({
    where: { placementId: placements.map((p) => p.id), averageScore: { [Op.ne]: null } },
    order: [['weekStartDate', 'DESC']],
  });
  const latest = {};
  for (const r of reps) if (!latest[r.placementId]) latest[r.placementId] = r;
  const keys = [];
  for (const p of placements) {
    const r = latest[p.id]; if (!r) continue;
    if (r.averageScore < 3) {
      const key = `low_score:${r.id}`; keys.push(key);
      await ActionItem.findOrCreate({
        where: { sourceKey: key },
        defaults: {
          placementId: p.id, source: 'auto_low_score', responsibleId: p.mentorId, dueDate: H.addDays(H.todayStr(), 7),
          description: `${nameOf(p)}: ${r.weekStartDate} haftasi o‘rtacha bahosi ${r.averageScore} (3 dan past). Yordam rejasini tuzing.`,
        },
      });
      await notifyOnce({ users: coords, type: 'low_score', key, placementId: p.id,
        title: '🆘 Yordam vazifasi: past progress', message: `${nameOf(p)} haftalik o‘rtacha bahosi ${r.averageScore}. Muammo kartasi ochildi.` });
    } else {
      await ActionItem.update(
        { status: 'resolved', resolvedAt: new Date(), result: 'Oxirgi haftalik o‘rtacha 3 dan yuqori: shart bartaraf bo‘ldi (avtomatik).' },
        { where: { placementId: p.id, source: 'auto_low_score', status: { [Op.ne]: 'resolved' } } });
    }
  }
  if (!onlyPlacementId) await closeResolved('low_score', keys);
  else await Notification.update({ resolvedAt: new Date() }, { where: { placementId: onlyPlacementId, type: 'low_score', resolvedAt: null, ...(keys.length ? { dedupeKey: { [Op.notIn]: keys } } : {}) } });
};

const safe = async (name, fn) => { try { await fn(); } catch (e) { console.error(`[qoida] "${name}" xatosi:`, e.message); } };

const runAll = async () => {
  console.log(`[qoida] tekshiruv boshlandi: ${H.nowLocal()}`);
  const coords = await coordinatorIds();
  await safe('muddat', () => ruleDeadline(coords));
  await safe('hisobot', () => ruleReports(coords));
  await safe('davomat', () => ruleAbsence(coords));
  await safe('past-baho', () => ruleLowScore(coords));
};
const lowScoreFor = async (placementId) => ruleLowScore(await coordinatorIds(), placementId);

module.exports = { runAll, lowScoreFor, ruleReports };
