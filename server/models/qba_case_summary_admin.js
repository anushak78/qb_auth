'use strict';
module.exports = function (sequelize, DataTypes) {
  var qba_case_summary_admin = sequelize.define('qba_case_summary_admin', {
    case_summary_id_pk: {
      type: DataTypes.INTEGER(16),
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    topic_name: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    topic_code: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    parent_count: {
      type: DataTypes.INTEGER(16),
      allowNull: true
    },
    child_count: {
      type: DataTypes.INTEGER(16),
      allowNull: true
    },
    summary_marks: {
      type: DataTypes.INTEGER(16),
      allowNull: true
    },
    qstn_paper_id:
    {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    audit_date: {
      type: DataTypes.DATE,
      allowNull: true
    },
    short_fall_qstn: {
      type: DataTypes.INTEGER(16, 0),
      allowNull: true
    },
    module_id: {
      type: DataTypes.INTEGER(16),
      allowNull: true
    },
    module_name: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    module_fk: {
      type: DataTypes.INTEGER(16, 0),
      allowNull: true
    },
    topic_pk: {
      type: DataTypes.INTEGER(16, 0),
      allowNull: true
    },
    exam_fk: {
      type: DataTypes.INTEGER(16, 0),
      allowNull: true
    },
    exampaper_fk: {
      type: DataTypes.INTEGER(16, 0),
      allowNull: true
    }
  },
    {
      timestamps: false,
      paranoid: true,
      underscored: true,
      freezeTableName: true,
      tableName: 'qba_case_summary_admin'

    });
  return qba_case_summary_admin;
};