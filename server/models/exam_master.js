'use strict';



module.exports = function (sequelize, DataTypes) {
  var exam_master = sequelize.define('exam_master', {
    exam_pk: {
      type: DataTypes.INTEGER(16),
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    /*	qba_ct_fk: {
          type: DataTypes.INTEGER(16),
            allowNull: false
        },*/
    qba_subject_fk: {
      type: DataTypes.INTEGER(16),
      allowNull: false
    },
    qba_course_fk: {
      type: DataTypes.INTEGER(16),
      allowNull: false
    },
    exam_name:
    {
      type: DataTypes.STRING(100)
    },
    exam_date:
    {
      type: DataTypes.DATE
    },
    total_qts:
    {
      type: DataTypes.INTEGER
    },
    total_marks:
    {
      type: DataTypes.INTEGER
    },
    subject_abbreviation:
    {
      type: DataTypes.STRING(100)
    },
    case_question:
    {
      type: DataTypes.INTEGER
    },
    case_marks:
    {
      type: DataTypes.INTEGER
    },
    is_active:
    {
      type: DataTypes.STRING(5),
      allowNull: true
    },
    audit_by:
    {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    audit_dt:
    {
      type: DataTypes.TIME,
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
      tableName: 'exam_master'

    });
  return exam_master;
};



