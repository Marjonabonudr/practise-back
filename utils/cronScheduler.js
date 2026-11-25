const cron = require('node-cron');
const rules = require('./rules');

const TZ = 'Asia/Tashkent';
const day = Number(process.env.REPORT_DEADLINE_DAY || 5) % 7;   // cron: 0 = yakshanba
const hour = Number(process.env.REPORT_DEADLINE_HOUR || 18);

const initCronJobs = () => {
  // TZ: eslatmalar serverda HAR KUNI 09:00 da
  cron.schedule('0 9 * * *', () => rules.runAll().catch((e) => console.error('[cron]', e.message)), { timezone: TZ });
  // TZ: "...va tegishli muddat o'tganda": hisobot muddati (standart juma 18:00) va mentor bahosi muddati (dushanba 12:00) o'tgach darhol
  cron.schedule(`1 ${hour} * * ${day}`, () => rules.runAll().catch((e) => console.error('[cron]', e.message)), { timezone: TZ });
  cron.schedule('1 12 * * 1', () => rules.runAll().catch((e) => console.error('[cron]', e.message)), { timezone: TZ });
  console.log('[cron] qoidalar jadvali ishga tushdi (09:00 har kuni; hisobot/baho muddatlaridan keyin)');

  // Hosting (masalan, Render bepul tarifi) server "uxlab" 09:00 ni o'tkazib yuborishi mumkin:
  // ishga tushgach bir marta tekshiramiz. Dublikat yaratilmaydi, shuning uchun xavfsiz.
  if (process.env.RULES_ON_START !== 'false') {
    setTimeout(() => rules.runAll().catch((e) => console.error('[cron]', e.message)), 20000);
  }
};

module.exports = initCronJobs;
