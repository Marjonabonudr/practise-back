// Birinchi koordinatorni yaratish (ochiq ro'yxatdan o'tish yopilgani uchun kerak):
//   node scripts/seedCoordinator.js coordinator@algoritm.uz KuchliParol123
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { sequelize, User } = require('../models');

(async () => {
  const [email, password] = process.argv.slice(2);
  if (!email || !password || password.length < 8) {
    console.log('Foydalanish: node scripts/seedCoordinator.js email parol(kamida 8 belgi)');
    process.exit(1);
  }
  await sequelize.sync();
  const [, created] = await User.findOrCreate({
    where: { email },
    defaults: { password: await bcrypt.hash(password, 10), role: 'coordinator', status: 'active' },
  });
  console.log(created ? 'Koordinator yaratildi' : 'Bu email allaqachon mavjud');
  process.exit(0);
})();
