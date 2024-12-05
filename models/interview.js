module.exports = (sequelize, DataTypes) => {
    const Interview = sequelize.define('Interview', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        applicationId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'Applications',
                key: 'id',
            },
            onDelete: 'CASCADE',
        },
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'Users',
                key: 'id',
            },
            onDelete: 'CASCADE',
        },
        interview_date: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        interview_status: {
            type: DataTypes.STRING,
            defaultValue: 'scheduled', // 예정, 완료, 취소 등
        },
        feedback: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
    }, {
        tableName: 'interviews',  // 테이블 이름을 소문자 'jobs'로 명시
    });

    // 관계 설정
    Interview.associate = (models) => {
        // Interview는 Application과 관계
        Interview.belongsTo(models.Application, { foreignKey: 'applicationId' });

        // Interview는 User와 관계
        Interview.belongsTo(models.User, { foreignKey: 'userId' });
    };

    return Interview;
};
