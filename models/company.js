module.exports = (sequelize, DataTypes) => {
    const Company = sequelize.define('Company', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        location: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        industry: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        website: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        contact_number: {
            type: DataTypes.STRING,
            allowNull: true,
            validate: {
                is: /^[0-9]{2,3}-[0-9]{3,4}-[0-9]{4}$/, // 전화번호 형식 검증
            },
        },
        createdAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
        },
        updatedAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
        },
    }, {
        tableName: 'companies',  // 테이블 이름을 소문자 'jobs'로 명시
    });
    Company.associate = (models) => {
        Company.belongsTo(models.Job, { foreignKey: 'jobId' });
    };

    return Company;
};
