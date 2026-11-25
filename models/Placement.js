module.exports = (sequelize, DataTypes) => {
  const Placement = sequelize.define('Placement', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    studentId: { type: DataTypes.UUID, allowNull: false },
    companyId: { type: DataTypes.UUID, allowNull: false },
    mentorId: { type: DataTypes.UUID, allowNull: false },
    startDate: { type: DataTypes.DATEONLY, allowNull: false },
    endDate: { type: DataTypes.DATEONLY, allowNull: false },
    // JADVAL: reja soati shulardan hisoblanadi (1=Dushanba ... 7=Yakshanba)
    workDays: { type: DataTypes.JSONB, allowNull: false, defaultValue: [1, 2, 3, 4, 5] },
    dailyHours: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 4 },
    excludedDates: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] }, // bayram/istisno kunlar
    format: { type: DataTypes.ENUM('office', 'remote', 'hybrid'), defaultValue: 'office' },
    plannedHours: { type: DataTypes.FLOAT, allowNull: false },
    plannedHoursReason: { type: DataTypes.TEXT, allowNull: true }, // qo'lda tuzatilgan bo'lsa sabab
    approvedHours: { type: DataTypes.FLOAT, defaultValue: 0 },
    status: { type: DataTypes.ENUM('placed', 'ongoing', 'paused', 'terminated', 'completed'), defaultValue: 'placed' },
    statusReason: { type: DataTypes.TEXT, allowNull: true },
    goals: { type: DataTypes.JSONB, allowNull: false },
    // ISHGA OLISH
    hiringStatus: {
      type: DataTypes.ENUM('not_discussed', 'under_review', 'offered', 'accepted', 'started', 'not_offered', 'rejected', 'canceled'),
      defaultValue: 'not_discussed',
    },
    hiringPosition: { type: DataTypes.STRING, allowNull: true },
    hiringCompany: { type: DataTypes.STRING, allowNull: true },
    offerDate: { type: DataTypes.DATEONLY, allowNull: true },
    acceptDate: { type: DataTypes.DATEONLY, allowNull: true },
    workStartDate: { type: DataTypes.DATEONLY, allowNull: true },
    hiringNote: { type: DataTypes.TEXT, allowNull: true },
    hiringConfirmedById: { type: DataTypes.UUID, allowNull: true },
    hiringConfirmedAt: { type: DataTypes.DATE, allowNull: true },
    // YAKUN
    finalAssessment: { type: DataTypes.JSONB, allowNull: true },
    companyConclusion: { type: DataTypes.TEXT, allowNull: true },
    closedAt: { type: DataTypes.DATE, allowNull: true },
  }, {
    version: true, // optimistik versiya: ikki kishi bir vaqtda tahrirlasa 409
    indexes: [
      // TZ: bir vaqtda ikkita faol joylashtirish taqiqlanadi (bazaning o'zida himoya)
      { unique: true, name: 'placements_one_active_per_student', fields: ['studentId'], where: { status: ['placed', 'ongoing', 'paused'] } },
      { fields: ['status'] },
      { fields: ['mentorId'] },
    ],
  });
  Placement.associate = (models) => {
    Placement.belongsTo(models.Student, { foreignKey: 'studentId', as: 'student' });
    Placement.belongsTo(models.Company, { foreignKey: 'companyId', as: 'company' });
    Placement.belongsTo(models.User, { foreignKey: 'mentorId', as: 'mentor' });
    Placement.hasMany(models.WorkLog, { foreignKey: 'placementId', as: 'workLogs', onDelete: 'RESTRICT' });
    Placement.hasMany(models.WeeklyReport, { foreignKey: 'placementId', as: 'weeklyReports', onDelete: 'RESTRICT' });
    Placement.hasMany(models.ActionItem, { foreignKey: 'placementId', as: 'actionItems' });
  };
  return Placement;
};
