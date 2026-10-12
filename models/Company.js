module.exports = (sequelize, DataTypes) => {
    const Company = sequelize.define('Company', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        field: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        address: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        contact: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        status: {
            type: DataTypes.ENUM('active', 'archive'),
            defaultValue: 'active',
        }
    });

    Company.associate = function(models) {
        // Kompaniyaning mentorlari ro'yxati
        Company.hasMany(models.User, { 
            foreignKey: 'companyId', 
            as: 'mentors' 
        });
        // Kompaniyadagi amaliyot shartnomalari
        Company.hasMany(models.Placement, { 
            foreignKey: 'companyId', 
            as: 'placements' 
        });
    };

    return Company;
};
