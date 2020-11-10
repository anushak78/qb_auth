'use strict';

/*  rep_id_pk numeric(16,0) NOT NULL DEFAULT nextval('qba.rep_id_pk_seq'::regclass),
  rep_qb_pk numeric(16,0),
  rep_id_marks numeric(6,0),
  rep_id_qsttype character varying(2),
  req_id_module character varying(75),
  req_id_user numeric(16,0),
  req_id_isapproved boolean,
  */

module.exports = function (sequelize, DataTypes) {
  var qba_replaceqstn_history = sequelize.define('qba_replaceqstn_history', {
    rep_id_pk: {
      type: DataTypes.INTEGER(16),
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    rep_qb_pk: {
      type: DataTypes.INTEGER(16),
      allowNull: false
    },
    rep_id_marks: {
      type: DataTypes.INTEGER(6),
      allowNull: false
    },
    rep_id_qsttype: {
      type: DataTypes.CHAR(2),
      allowNull: false
    },
    req_id_module: {
      type: DataTypes.CHAR(75),
      allowNull: false
    },
    req_id_user:
    {
      type: DataTypes.INTEGER(16)
    },
    req_id_isapproved:
    {
      type: DataTypes.BOOLEAN(1)
    },
    rep_act_qb_pk:
    {
      type: DataTypes.INTEGER(16),
      allowNull: false
    },
    rep_act_qb_id: {
      type: DataTypes.INTEGER(16)
    },
    exampaper_fk: {
      type: DataTypes.INTEGER(16),
      allowNull: false
    },
    exam_fk: {
      type: DataTypes.INTEGER(16),
      allowNull: false
    }

  },
    {
      timestamps: false,
      paranoid: true,
      underscored: false,
      freezeTableName: true,
      tableName: 'qba_replaceqstn_history'

    });
  return qba_replaceqstn_history;
};



