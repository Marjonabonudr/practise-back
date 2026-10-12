module.exports = (sequelize, DataTypes) => {
    const User = sequelize.define('User', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
            validate: { isEmail: true }
        },
        password: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        role: {
            type: DataTypes.ENUM('coordinator', 'intern', 'mentor'),
            allowNull: false,
        },
        status: {
            type: DataTypes.ENUM('active', 'inactive'),
            defaultValue: 'active',
        }
    });

    User.associate = function(models) {
        // User <-> Student (One-to-One)
        User.hasOne(models.Student, { 
            foreignKey: 'userId', 
            as: 'studentProfile',
            onDelete: 'CASCADE'
        });
        // Mentor <-> Company (Many-to-One)
        User.belongsTo(models.Company, { 
            foreignKey: 'companyId', 
            as: 'company' 
        });
        // Koordinator o'zgartirgan amallar tarixi
        User.hasMany(models.AuditLog, { 
            foreignKey: 'userId', 
            as: 'auditLogs' 
        });
        // Foydalanuvchining xabarnomalari
        User.hasMany(models.Notification, { 
            foreignKey: 'userId', 
            as: 'notifications' 
        });
    };

    return User;
};
