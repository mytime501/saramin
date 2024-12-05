module.exports = (sequelize, DataTypes) => {
    const Job = sequelize.define('Job', {
        title: DataTypes.STRING,
        company: DataTypes.STRING,
        location: DataTypes.STRING,
        experience: DataTypes.STRING,  // 추가된 컬럼
        education: DataTypes.STRING,   // 추가된 컬럼
        employmentType: DataTypes.STRING,  // 추가된 컬럼
        deadline: DataTypes.STRING,
        techStack: DataTypes.STRING,
        salary: DataTypes.STRING,
        description: DataTypes.STRING,
        link: {
            type: DataTypes.STRING,
            unique: true,  // 링크는 고유해야 하므로 unique 제약조건을 추가
        },
        views: {
            type: DataTypes.INTEGER,
            defaultValue: 0, // 기본값 설정
        },
    },
    {
        tableName: 'jobs',  // 테이블 이름을 소문자 'jobs'로 명시
      });
    return Job;
};
