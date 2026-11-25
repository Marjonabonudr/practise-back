const Sequelize = require('sequelize');
const sequelize = require('../config/database');

const defs = ['User', 'Student', 'Company', 'Placement', 'WorkLog', 'WeeklyReport', 'Notification', 'ActionItem', 'AuditLog'];
const db = { sequelize };
for (const name of defs) db[name] = require(`./${name}`)(sequelize, Sequelize.DataTypes);
for (const name of defs) if (db[name].associate) db[name].associate(sequelize.models);

module.exports = db;
