module.exports = (sequelize, DataTypes) => {
    const Bookmark = sequelize.define('Bookmark', {}, {
        tableName: 'bookmarks',  // 테이블 이름 명시
      });

    Bookmark.associate = (models) => {
        Bookmark.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
        Bookmark.belongsTo(models.Job, { foreignKey: 'jobId', as: 'job' });
    };

    return Bookmark;
};
