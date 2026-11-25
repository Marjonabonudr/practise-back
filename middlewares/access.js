// OBYEKT DARAJASIDAGI ruxsat (TZ Q2): rol tekshiruvi yetarli emas, yozuv foydalanuvchiga tegishli bo'lishi shart.
const { Placement, Student } = require('../models');
const { isUuid } = require('../utils/helpers');

const uuidParam = (req, res, next, val) =>
  isUuid(val) ? next() : res.status(400).json({ message: 'ID noto‘g‘ri formatda' });

// Foydalanuvchi ko'ra oladigan joylashtirishlar sharti
const placementScope = async (user) => {
  if (user.role === 'coordinator') return {};
  if (user.role === 'mentor') return { mentorId: user.id };
  if (user.role === 'intern') {
    const s = await Student.findOne({ where: { userId: user.id }, attributes: ['id'] });
    return { studentId: s ? s.id : null }; // null => hech narsa mos kelmaydi
  }
  return { studentId: null };
};

// Ruxsat yo'q yoki mavjud emas — bir xil javob (null): ID'larni taxmin qilib mavjudligini bilib bo'lmaydi
const findAccessiblePlacement = async (user, id, options = {}) => {
  const scope = await placementScope(user);
  return Placement.findOne({ where: { id, ...scope }, ...options });
};

module.exports = { uuidParam, placementScope, findAccessiblePlacement };
