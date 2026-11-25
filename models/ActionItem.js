// TZ: Muammo kartasi — tavsif, mas'ul, muddat, Ochiq / Jarayonda / Hal qilindi, natija
module.exports = (sequelize, DataTypes) => {
  const ActionItem = sequelize.define('ActionItem', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    placementId: { type: DataTypes.UUID, allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: false },
    responsibleId: { type: DataTypes.UUID, allowNull: true },
    dueDate: { type: DataTypes.DATEONLY, allowNull: true },
    status: { type: DataTypes.ENUM('open', 'in_progress', 'resolved'), defaultValue: 'open' },
    result: { type: DataTypes.TEXT, allowNull: true },
    source: { type: DataTypes.ENUM('manual', 'auto_low_score'), defaultValue: 'manual' },
    sourceKey: { type: DataTypes.STRING, allowNull: true, unique: true }, // avtomatik kartalar takrorlanmasligi uchun
    createdById: { type: DataTypes.UUID, allowNull: true },
    resolvedAt: { type: DataTypes.DATE, allowNull: true },
  });
  ActionItem.associate = (models) => {
    ActionItem.belongsTo(models.Placement, { foreignKey: 'placementId', as: 'placement' });
    ActionItem.belongsTo(models.User, { foreignKey: 'responsibleId', as: 'responsible' });
  };
  return ActionItem;
};
