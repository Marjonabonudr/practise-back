const Sequelize = require('sequelize');
const sequelize = require('../config/database');

const User = require('./User')(sequelize, Sequelize.DataTypes);
const Student = require('./Student')(sequelize, Sequelize.DataTypes);
const Company = require('./Company')(sequelize, Sequelize.DataTypes);
const Placement = require('./Placement')(sequelize, Sequelize.DataTypes);
const WorkLog = require('./WorkLog')(sequelize, Sequelize.DataTypes);
const WeeklyReport = require('./WeeklyReport')(sequelize, Sequelize.DataTypes);
const Notification = require('./Notification')(sequelize, Sequelize.DataTypes);
const AuditLog = require('./AuditLog')(sequelize, Sequelize.DataTypes);


User.associate(sequelize.models);
Student.associate(sequelize.models);
Company.associate(sequelize.models);
Placement.associate(sequelize.models);  
WorkLog.associate(sequelize.models);
WeeklyReport.associate(sequelize.models);
Notification.associate(sequelize.models);
AuditLog.associate(sequelize.models);



module.exports = {
  sequelize, User, Student, Company, Placement, WorkLog, WeeklyReport, Notification, AuditLog
};
