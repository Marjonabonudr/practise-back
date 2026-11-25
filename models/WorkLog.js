module.exports = (sequelize, DataTypes) => {
  const WorkLog = sequelize.define('WorkLog', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    placementId: { type: DataTypes.UUID, allowNull: false },
    date: { type: DataTypes.DATEONLY, allowNull: false },
    hours: { type: DataTypes.FLOAT, allowNull: false },
    attendance: { type: DataTypes.ENUM('present', 'absent_reasoned', 'absent_unreasoned', 'weekend'), allowNull: false },
    task: { type: DataTypes.TEXT, allowNull: true },
    resultUrl: { type: DataTypes.STRING, allowNull: true },
    comment: { type: DataTypes.TEXT, allowNull: true },
    status: { type: DataTypes.ENUM('draft', 'submitted', 'approved', 'rejected'), defaultValue: 'draft' },
    rejectionComment: { type: DataTypes.TEXT, allowNull: true },
    authorId: { type: DataTypes.UUID, allowNull: true },
    approvedById: { type: DataTypes.UUID, allowNull: true },
    approvedAt: { type: DataTypes.DATE, allowNull: true },
    // TZ: koordinator mentorning og'zaki ma'lumoti asosida kiritsa, "koordinator kiritgan" + mentor nomi + sabab
    createdByCoordinator: { type: DataTypes.BOOLEAN, defaultValue: false },
    onBehalfMentorName: { type: DataTypes.STRING, allowNull: true },
    onBehalfReason: { type: DataTypes.TEXT, allowNull: true },
  }, {
    version: true,
    indexes: [{ unique: true, fields: ['placementId', 'date'] }], // bir sanaga bitta qayd
  });
  WorkLog.associate = (models) => {
    WorkLog.belongsTo(models.Placement, { foreignKey: 'placementId', as: 'placement' });
  };
  return WorkLog;
};
