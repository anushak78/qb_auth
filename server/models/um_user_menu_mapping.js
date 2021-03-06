'use strict';
module.exports = function (sequelize, DataTypes) {
  var um_user_menu_mapping = sequelize.define('um_user_menu_mapping', {
    user_menu_mapping_pk: {
      type: DataTypes.INTEGER(16),
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    user_fk: {
      type: DataTypes.INTEGER(16),
      allowNull: false
    },
    menu_fk: {
      type: DataTypes.INTEGER(16),
      allowNull: false
    },
    audit_by: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    audit_dt: {
      type: DataTypes.DATE,
      allowNull: false
    }
  },
    {
      timestamps: false,
      paranoid: true,
      underscored: true,
      freezeTableName: true,
      tableName: 'um_user_menu_mapping'

    });
  return um_user_menu_mapping;
};