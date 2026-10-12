module.exports = (sequelize, DataTypes) => {
    const WorkLog = sequelize.define('WorkLog', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        placementId: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        date: {
            type: DataTypes.DATEONLY,
            allowNull: false,
        },
        hours: {
            type: DataTypes.FLOAT,
            allowNull: false,
        },
        attendance: {
            type: DataTypes.ENUM('present', 'absent_reasoned', 'absent_unreasoned', 'weekend'),
            allowNull: false,
        },
        task: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        resultUrl: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        comment: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        status: {
            type: DataTypes.ENUM('draft', 'submitted', 'approved', 'rejected'),
            defaultValue: 'draft',
        },
        rejectionComment: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        createdByCoordinator: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        }
    }, {
        indexes: [
            {
                unique: true,
                fields: ['placementId', 'date'] // TZ: Bir amaliyot uchun bir sanaga bitta kunlik qayd bo‘ladi
            }
        ]
    });

    WorkLog.associate = function(models) {
        WorkLog.belongsTo(models.Placement, { 
            foreignKey: 'placementId', 
            as: 'placement' 
        });
    };

    return WorkLog;
};
