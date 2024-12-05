const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    class JobPosition extends Model {
        static associate(models) {
            // JobPosition과 Job은 다대일 관계 (Many-to-One)
            JobPosition.belongsTo(models.Job, {
                foreignKey: 'jobId',
                as: 'job', // 관계 명시
                onDelete: 'CASCADE', // 관련 Job 삭제 시 삭제
            });
        }
    }

    JobPosition.init(
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false,
            },
            jobId: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: 'Jobs', // 연관된 테이블
                    key: 'id',
                },
                onDelete: 'CASCADE',
                onUpdate: 'CASCADE',
            },
            title: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            description: {
                type: DataTypes.TEXT,
                allowNull: false,
            },
            responsibilities: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            requirements: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            createdAt: {
                type: DataTypes.DATE,
                allowNull: false,
                defaultValue: DataTypes.NOW,
            },
            updatedAt: {
                type: DataTypes.DATE,
                allowNull: false,
                defaultValue: DataTypes.NOW,
            },
        },
        {
            sequelize,
            modelName: 'JobPosition',
            tableName: 'jobpositions', // 테이블 이름 지정
            timestamps: true, // createdAt, updatedAt 사용
        }
    );

    return JobPosition;
};
