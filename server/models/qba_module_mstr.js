'use strict';
module.exports = function (sequelize, DataTypes) {
  var qba_module_mstr = sequelize.define('qba_module_mstr', {
    qba_module_pk: {
      type: DataTypes.INTEGER(16),
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    module_name: {
      type: DataTypes.STRING(75),
      allowNull: false
    },
    qba_subject_fk: {
      type: DataTypes.INTEGER(16),
      allowNull: false
    },
    is_active: {
      type: DataTypes.CHAR(1)
    },
    audit_by: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    audit_dt: {
      type: DataTypes.DATE,
      allowNull: false
    },
    updated_by:
    {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    updated_dt:
    {
      type: DataTypes.TIME,
      allowNull: true
    }
  },
    {
      timestamps: false,
      paranoid: true,
      underscored: true,
      freezeTableName: true,
      tableName: 'qba_module_mstr'

    });



  return qba_module_mstr;
};