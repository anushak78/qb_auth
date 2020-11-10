'use strict';

module.exports = function (sequelize, DataTypes) {
  var qba_vatting_log = sequelize.define("qba_vatting_log", {
    vlog_pk: {
      type: DataTypes.INTEGER(16),
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    seq: {
      type: DataTypes.INTEGER(75),
      allowNull: false
    },
    vlog_qb_fk: {
      type: DataTypes.INTEGER(16),
      allowNull: true
    },
    vlog_exam_fk: {
      type: DataTypes.INTEGER(16),
      allowNull: true
    },
    status: {
      type: DataTypes.CHAR(1)
    },
    remarks: {
      type: DataTypes.CHAR(2000)
    },
    created_dt:
    {
      type: DataTypes.DATE
      //allowNull: false    
    },
    created_by: {
      type: DataTypes.INTEGER(16),
      allowNull: false
    },
    updated_dt: {
      type: DataTypes.DATE
      //allowNull: false
    },
    updated_by: {
      type: DataTypes.INTEGER(16),
      allowNull: false
    },
    qb_id: {
      type: DataTypes.INTEGER(16),
      allowNull: false
    },
    admin_status: {
      type: DataTypes.CHAR(50)
    },
    qstnpaper_id: {
      type: DataTypes.CHAR(50),
      allowNull: false
    },
    exam_name: {
      type: DataTypes.CHAR(50),
      allowNull: false
    },
    exampaper_fk: {
      type: DataTypes.INTEGER(16),
      allowNull: false
    },
    is_active: {
      type: DataTypes.CHAR(1)
    },
	approved_by: {
		type: DataTypes.CHAR(100)
	}
  },
    {
      timestamps: false,
      paranoid: true,
      underscored: false,
      freezeTableName: true,
      tableName: 'qba_vatting_log'

    });
  return qba_vatting_log;
};