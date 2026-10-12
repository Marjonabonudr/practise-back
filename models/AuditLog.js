module.exports = (sequelize, DataTypes) => {
    const AuditLog = sequelize.define('AuditLog', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        userId: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        action: {
            type: DataTypes.STRING, // Masalan: 'PLACEMENT_STATUS_CHANGE'
            allowNull: false,
        },
        details: {
            type: DataTypes.JSONB, // Eski va yangi o'zgarish qiymatlari
            allowNull: false,
        },
        reason: {
            type: DataTypes.TEXT, // TZ: O'zgarish sababi yozilishi shart
            allowNull: false,
        }
    });

    AuditLog.associate = function(models) {
        AuditLog.belongsTo(models.User, { 
            foreignKey: 'userId', 
            as: 'user' 
        });
    };

    return AuditLog;
};
