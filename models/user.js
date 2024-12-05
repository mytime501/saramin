'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
      email: {
          type: DataTypes.STRING,
          allowNull: false,
          unique: true,
          validate: {
              isEmail: true
          }
      },
      password: {
          type: DataTypes.STRING,
          allowNull: false
      },
      name: {
          type: DataTypes.STRING,
          allowNull: false
      },
      role: {
          type: DataTypes.STRING,
          defaultValue: 'user',
          allowNull: false
      }
    }, {
        tableName: 'users',  // 테이블 이름을 소문자 'jobs'로 명시
    });

  return User;
};
