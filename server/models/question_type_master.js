'use strict';
module.exports = function (sequelize, DataTypes) {
  var question_type_master = sequelize.define('question_type_master', {
    qtm_code: {
      type: DataTypes.STRING(2),
      allowNull: false
    },
    qtm_desc: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    is_active: {
      type: DataTypes.STRING(1),
      allowNull: false
    }
  },
    {
      timestamps: false,
      paranoid: true,
      underscored: true,
      freezeTableName: true,
      tableName: 'question_type_master'

    });
  return question_type_master;
};