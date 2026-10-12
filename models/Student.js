module.exports = (sequelize, DataTypes) => {
    const Student = sequelize.define('Student', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        userId: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        fullName: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        phone: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        field: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        group: {
            type: DataTypes.STRING,
            allowNull: false,
        }
    });

    Student.associate = function(models) {
        // Har bir talabaning akkaunti bo'ladi
        Student.belongsTo(models.User, { 
            foreignKey: 'userId', 
            as: 'user' 
        });
        // Talabaning barcha amaliyotlar tarixi (Bir o'quvchi qayta joylashishi mumkin)
        Student.hasMany(models.Placement, { 
            foreignKey: 'studentId', 
            as: 'placements' 
        });
    };

    return Student;
};
