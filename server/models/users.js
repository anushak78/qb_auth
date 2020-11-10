'use strict';
module.exports = function (sequelize, DataTypes) {
  var Users = sequelize.define('users', {
    id: {
      type: DataTypes.INTEGER(16),
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    qb_id: { 
      type: DataTypes.INTEGER(16)
    },
    page: { 
      type: DataTypes.INTEGER(16)
    },
    no_of_records:{ 
      type: DataTypes.INTEGER(16)
    },
    exampaper_fk: {
      type: DataTypes.INTEGER
    },
    user_fk: {
      type: DataTypes.INTEGER
    }
  });
  return Users;
};