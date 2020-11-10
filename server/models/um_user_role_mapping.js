'use strict';
module.exports = function (sequelize, DataTypes) {
  var um_user_role_mapping = sequelize.define('um_user_role_mapping', {
    user_role_pk: {
      type: DataTypes.INTEGER(16),
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    user_fk: {
      type: DataTypes.INTEGER(16),
      allowNull: false
    },
    role_fk: {
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
      tableName: 'um_user_role_mapping'

    });
  return um_user_role_mapping;
};