const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');
dotenv.config();

let sequelize;

// Render serveridagi DATABASE_URL maxfiy havolasini o'qish (Agar bor bo'lsa)
if (process.env.DATABASE_URL) {
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    protocol: 'postgres',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false // Render PostgreSQL bazasi uchun SSL shart
      }
    },
    logging: false
  });
} else {
  // Local kompyuteringizda ishlashi uchun eski andoza
  sequelize = new Sequelize(
    process.env.DB_NAME || 'amaliyot-back',
    process.env.DB_USER || 'postgres',
    process.env.DB_PASSWORD || 'password',
    {
      host: process.env.DB_HOST || '127.0.0.1',
      dialect: 'postgres',
      logging: false
    }
  );
}

module.exports = sequelize;
