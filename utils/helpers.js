const { AuditLog, WorkLog, Placement } = require('../models');

const TZ = 'Asia/Tashkent';
const pad = (n) => String(n).padStart(2, '0');

// ---------- Sana (barchasi Asia/Tashkent, ISO "YYYY-MM-DD" satrlar bilan) ----------
const toLocalDate = (d) => new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(new Date(d));
const todayStr = () => toLocalDate(new Date());
const nowLocal = () => new Intl.DateTimeFormat('sv-SE', { timeZone: TZ, dateStyle: 'short', timeStyle: 'short' }).format(new Date());
const addDays = (iso, n) => { const d = new Date(`${iso}T00:00:00Z`); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
const daysBetween = (a, b) => Math.round((new Date(`${b}T00:00:00Z`) - new Date(`${a}T00:00:00Z`)) / 86400000);
const weekday = (iso) => { const d = new Date(`${iso}T00:00:00Z`).getUTCDay(); return d === 0 ? 7 : d; }; // 1=Du ... 7=Ya
const mondayOf = (iso) => addDays(iso, 1 - weekday(iso));
const at = (iso, h, m = 0) => new Date(`${iso}T${pad(h)}:${pad(m)}:00+05:00`); // Toshkent UTC+5, yozgi vaqt yo'q

// TZ: hisobot muddati standart juma 18:00 (env orqali sozlanadi); mentor bahosi keyingi dushanba 12:00 gacha
const REPORT_DAY = Number(process.env.REPORT_DEADLINE_DAY || 5);
const REPORT_HOUR = Number(process.env.REPORT_DEADLINE_HOUR || 18);
const reportDeadline = (monday) => at(addDays(monday, REPORT_DAY - 1), REPORT_HOUR);
const gradeDeadline = (monday) => at(addDays(monday, 7), 12);

// Joylashtirish jadvali bo'yicha ish kunlari (dam olish va istisno kunlari chiqarib tashlanadi)
const scheduledDates = (p, from, to) => {
  const start = from > p.startDate ? from : p.startDate;
  const end = to < p.endDate ? to : p.endDate;
  const wd = p.workDays || [1, 2, 3, 4, 5];
  const ex = new Set(p.excludedDates || []);
  const out = [];
  for (let d = start; d <= end; d = addDays(d, 1)) if (wd.includes(weekday(d)) && !ex.has(d)) out.push(d);
  return out;
};
const isScheduled = (p, iso) => scheduledDates(p, iso, iso).length === 1;
const computePlannedHours = (p) => scheduledDates(p, p.startDate, p.endDate).length * p.dailyHours;

// ---------- Hisoblash qoidalari (TZ 4-bo'lim) ----------
const round1 = (x) => Math.round((x + Number.EPSILON) * 10) / 10;
const progressOf = (p) => {
  const planned = Number(p.plannedHours) || 0;
  const approved = Number(p.approvedHours) || 0;
  return {
    plannedHours: planned,
    approvedHours: approved,
    remainingHours: Math.max(0, planned - approved),
    completionPercent: planned > 0 ? Math.min(100, round1((approved / planned) * 100)) : 0, // 100% bilan cheklanadi
    overHours: Math.max(0, approved - planned), // ortiqcha soatlar alohida
  };
};
const calendarOf = (p) => {
  const today = todayStr();
  const closed = ['completed', 'terminated'].includes(p.status);
  const stop = closed && p.closedAt ? toLocalDate(p.closedAt) : today;
  const elapsedDays = stop < p.startDate ? 0 : daysBetween(p.startDate, stop) + 1;
  return {
    elapsedDays,
    daysToEnd: !closed && today <= p.endDate ? daysBetween(today, p.endDate) : 0,
    overdueDays: !closed && today > p.endDate ? daysBetween(p.endDate, today) : 0,
  };
};
const serializePlacement = (p) => { const j = p.toJSON ? p.toJSON() : p; return { ...j, progress: progressOf(j), calendar: calendarOf(j) }; };
const recalcApprovedHours = async (placementId, transaction) => {
  const sum = (await WorkLog.sum('hours', { where: { placementId, status: 'approved' }, transaction })) || 0;
  await Placement.update({ approvedHours: sum }, { where: { id: placementId }, transaction });
  return sum;
};

// ---------- HTTP yordamchilari ----------
const isUuid = (v) => typeof v === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
const ok = (res, data, status = 200, meta) => res.status(status).json(meta ? { data, meta } : { data });
const fail = (res, status, message, details) => res.status(status).json(details ? { message, details } : { message });
const paging = (q, def = 25, max = 100) => {
  const limit = Math.min(Math.max(parseInt(q.limit, 10) || def, 1), max);
  const page = Math.max(parseInt(q.page, 10) || 1, 1);
  return { page, limit, offset: (page - 1) * limit };
};
const meta = (total, page, limit) => ({ total, page, limit, totalPages: Math.ceil(total / limit) });
const escapeLike = (s) => String(s).replace(/[\\%_]/g, (m) => `\\${m}`);
// stripUnknown: kutilmagan maydonlar (role, status, userId...) jim olib tashlanadi — mass-assignment himoyasi
const parse = (schema, data, res) => {
  const { error, value } = schema.validate(data || {}, { abortEarly: false, stripUnknown: true, convert: true });
  if (error) {
    fail(res, 400, error.details[0].message, error.details.map((d) => ({ field: d.path.join('.'), message: d.message })));
    return null;
  }
  return value;
};
const CONFLICT_MSG = 'Yozuv boshqa foydalanuvchi tomonidan o‘zgartirilgan. Sahifani yangilab, qayta urinib ko‘ring.';
const versionConflict = (row, v) => v !== undefined && v !== null && Number(v) !== Number(row.version);
const audit = (userId, action, details, reason, transaction) =>
  AuditLog.create({ userId, action, details, reason: reason || '—' }, { transaction });

module.exports = {
  TZ, todayStr, nowLocal, addDays, daysBetween, weekday, mondayOf, toLocalDate,
  reportDeadline, gradeDeadline, scheduledDates, isScheduled, computePlannedHours,
  round1, progressOf, calendarOf, serializePlacement, recalcApprovedHours,
  isUuid, ok, fail, paging, meta, escapeLike, parse, CONFLICT_MSG, versionConflict, audit,
};
