module.exports = (sequelize, DataTypes) => {
    const Placement = sequelize.define('Placement', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        studentId: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        companyId: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        mentorId: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        startDate: {
            type: DataTypes.DATEONLY,
            allowNull: false,
        },
        endDate: {
            type: DataTypes.DATEONLY,
            allowNull: false,
        },
        plannedHours: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        approvedHours: {
            type: DataTypes.FLOAT,
            defaultValue: 0,
        },
        status: {
            type: DataTypes.ENUM('placed', 'ongoing', 'paused', 'terminated', 'completed'),
            defaultValue: 'placed',
        },
        statusReason: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        goals: {
            type: DataTypes.JSONB,
            allowNull: false,
        },
        hiringStatus: {
            type: DataTypes.ENUM('not_discussed', 'under_review', 'offered', 'accepted', 'started', 'not_offered', 'rejected', 'canceled'),
            defaultValue: 'not_discussed',
        }
    });

    Placement.associate = function(models) {
        Placement.belongsTo(models.Student, { 
            foreignKey: 'studentId', 
            as: 'student' 
        });
        Placement.belongsTo(models.Company, { 
            foreignKey: 'companyId', 
            as: 'company' 
        });
        Placement.belongsTo(models.User, { 
            foreignKey: 'mentorId', 
            as: 'mentor' 
        });
        // Amaliyotning kunlik ish soatlari qaydlari
        Placement.hasMany(models.WorkLog, { 
            foreignKey: 'placementId', 
            as: 'workLogs',
            onDelete: 'CASCADE'
        });
        // Amaliyotning haftalik mentor baholari
        Placement.hasMany(models.WeeklyReport, { 
            foreignKey: 'placementId', 
            as: 'weeklyReports',
            onDelete: 'CASCADE'
        });
    };

    return Placement;
};
