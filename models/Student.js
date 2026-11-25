module.exports = (sequelize, DataTypes) => {
  const Student = sequelize.define('Student', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    // userId ENDI ixtiyoriy: profil avval yaratiladi, akkaunt keyin taklif havolasi orqali ulanadi
    userId: { type: DataTypes.UUID, allowNull: true },
    fullName: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: true },
    phone: { type: DataTypes.STRING, allowNull: false },
    field: { type: DataTypes.STRING, allowNull: false },
    group: { type: DataTypes.STRING, allowNull: true },
    status: { type: DataTypes.ENUM('active', 'archive'), defaultValue: 'active' },
  }, { indexes: [{ unique: true, name: 'students_user_unique', fields: ['userId'] }] });
  Student.associate = (models) => {
    Student.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
    Student.hasMany(models.Placement, { foreignKey: 'studentId', as: 'placements' });
  };
  return Student;
};
