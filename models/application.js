module.exports = (sequelize, DataTypes) => {
    const Application = sequelize.define('Application', {
        resume: {
            type: DataTypes.TEXT,
            allowNull: true, // 이력서 첨부는 선택 사항
        },
        status: {
            type: DataTypes.STRING,
            defaultValue: '지원 완료',
        },
    }, {
        tableName: 'applications',  // 테이블 이름을 소문자 'jobs'로 명시
    });

    Application.associate = (models) => {
        Application.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
        Application.belongsTo(models.Job, { foreignKey: 'jobId', as: 'job' });
    };

    return Application;
};
