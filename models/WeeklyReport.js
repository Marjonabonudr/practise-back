module.exports = (sequelize, DataTypes) => {
    const WeeklyReport = sequelize.define('WeeklyReport', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        placementId: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        weekStartDate: {
            type: DataTypes.DATEONLY,
            allowNull: false,
        },
        reportText: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        discipline: {
            type: DataTypes.INTEGER, // 1-5 ball gacha
            allowNull: true,
        },
        workQuality: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        deadlineCompliance: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        learningIndependence: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        teamwork: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        averageScore: {
            type: DataTypes.FLOAT,
            allowNull: true,
        },
        mentorRecommendation: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        lowScoreReason: {
            type: DataTypes.TEXT, // 1 yoki 2 ball uchun sabab majburiy
            allowNull: true,
        }
    });

    WeeklyReport.associate = function(models) {
        WeeklyReport.belongsTo(models.Placement, { 
            foreignKey: 'placementId', 
            as: 'placement' 
        });
    };

    return WeeklyReport;
};
