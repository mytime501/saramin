module.exports = (sequelize, DataTypes) => {
    const JobReview = sequelize.define('JobReview', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        jobId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'Jobs',
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
        rating: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: {
                min: 1,
                max: 5,
            },
        },
        review_text: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
    }, {
        tableName: 'jobreviews',  // 테이블 이름을 소문자 'jobs'로 명시
    });

    JobReview.associate = (models) => {
        JobReview.belongsTo(models.Job, { foreignKey: 'jobId' });
        JobReview.belongsTo(models.User, { foreignKey: 'userId' });
    };

    return JobReview;
};
