module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    email: { type: DataTypes.STRING, allowNull: false, unique: true, validate: { isEmail: true } },
    password: { type: DataTypes.STRING, allowNull: false },
    role: { type: DataTypes.ENUM('coordinator', 'intern', 'mentor'), allowNull: false },
    status: { type: DataTypes.ENUM('active', 'inactive'), defaultValue: 'active' },
    fullName: { type: DataTypes.STRING, allowNull: true },
    phone: { type: DataTypes.STRING, allowNull: true },
  });
  User.associate = (models) => {
    User.hasOne(models.Student, { foreignKey: 'userId', as: 'studentProfile', onDelete: 'SET NULL' });
    User.belongsTo(models.Company, { foreignKey: 'companyId', as: 'company' });
    User.hasMany(models.AuditLog, { foreignKey: 'userId', as: 'auditLogs' });
    User.hasMany(models.Notification, { foreignKey: 'userId', as: 'notifications' });
  };
  return User;
};
