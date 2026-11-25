module.exports = (sequelize, DataTypes) => {
  const score = { type: DataTypes.INTEGER, allowNull: true }; // 1-5 yoki null ("Baholanmadi")
  const WeeklyReport = sequelize.define('WeeklyReport', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    placementId: { type: DataTypes.UUID, allowNull: false },
    weekStartDate: { type: DataTypes.DATEONLY, allowNull: false }, // har doim dushanba
    reportText: { type: DataTypes.TEXT, allowNull: false },        // hafta natijalari
    skillsLearned: { type: DataTypes.TEXT, allowNull: true },
    challenges: { type: DataTypes.TEXT, allowNull: true },
    nextWeekPlan: { type: DataTypes.TEXT, allowNull: true },
    submittedAt: { type: DataTypes.DATE, allowNull: true },
    isLate: { type: DataTypes.BOOLEAN, defaultValue: false },
    discipline: score, workQuality: score, deadlineCompliance: score, learningIndependence: score, teamwork: score,
    averageScore: { type: DataTypes.FLOAT, allowNull: true },
    evaluatedCount: { type: DataTypes.INTEGER, allowNull: true },
    mentorRecommendation: { type: DataTypes.TEXT, allowNull: true },
    lowScoreReason: { type: DataTypes.TEXT, allowNull: true },
    gradedById: { type: DataTypes.UUID, allowNull: true },
    gradedAt: { type: DataTypes.DATE, allowNull: true },
    gradedOnBehalfMentor: { type: DataTypes.STRING, allowNull: true },
    gradedOnBehalfReason: { type: DataTypes.TEXT, allowNull: true },
  }, {
    version: true,
    indexes: [{ unique: true, fields: ['placementId', 'weekStartDate'] }],
  });
  WeeklyReport.associate = (models) => {
    WeeklyReport.belongsTo(models.Placement, { foreignKey: 'placementId', as: 'placement' });
  };
  return WeeklyReport;
};
