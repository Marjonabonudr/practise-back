module.exports = (sequelize, DataTypes) => {
  const Notification = sequelize.define('Notification', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    userId: { type: DataTypes.UUID, allowNull: false },
    placementId: { type: DataTypes.UUID, allowNull: true },
    title: { type: DataTypes.STRING, allowNull: false },
    message: { type: DataTypes.TEXT, allowNull: false },
    type: { type: DataTypes.STRING, allowNull: true },
    // Bir voqea = bitta kalit. (userId, dedupeKey) bazada unikal => takroriy nusxa bo'lishi mumkin emas
    dedupeKey: { type: DataTypes.STRING, allowNull: true },
    isRead: { type: DataTypes.BOOLEAN, defaultValue: false },
    resolvedAt: { type: DataTypes.DATE, allowNull: true }, // shart bartaraf bo'lsa eslatma yopiladi
  }, { indexes: [{ unique: true, name: 'notifications_user_dedupe', fields: ['userId', 'dedupeKey'] }] });
  Notification.associate = (models) => {
    Notification.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
  };
  return Notification;
};
