'use strict';
/* 
  exampaper_pk numeric(16,0),
  qstnpaper_id character varying(50),
  exam_name character varying(50),
  created_dt timestamp with time zone,
  exam_qb_pk numeric(16,0)  
  */

module.exports = function (sequelize, DataTypes) {
  var qba_exam_paper = sequelize.define('qba_exam_paper', {
    exampaper_pk: {
      type: DataTypes.INTEGER(16),
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    qstnpaper_id: {
      type: DataTypes.CHAR(50),
      allowNull: false
    },
    exam_name: {
      type: DataTypes.CHAR(50),
      allowNull: false
    },
    created_dt: {
      type: DataTypes.DATE,
      allowNull: false
    },
    exam_qb_pk:
    {
      type: DataTypes.ARRAY(DataTypes.INTEGER(16)),
      allowNull: false
    },
    qba_subject_fk:
    {
      type: DataTypes.INTEGER(16),
      allowNull: false
    },
    qba_course_fk:
    {
      type: DataTypes.INTEGER(16),
      allowNull: false
    },
    exam_fk: {
      type: DataTypes.INTEGER(16),
      allowNull: false
    },
    status: {
      type: DataTypes.CHAR(30),
      allowNull: true
    },
    published_qb_pk: {
      type: DataTypes.ARRAY(DataTypes.INTEGER(16)),
      allowNull: true
    },
    new_exampaper_pk: {
      type: DataTypes.ARRAY(DataTypes.INTEGER(16)),
      allowNull: false,
    },

  },
    {
      timestamps: false,
      paranoid: true,
      underscored: false,
      freezeTableName: true,
      tableName: 'qba_exam_paper'

    });
  return qba_exam_paper;
};



