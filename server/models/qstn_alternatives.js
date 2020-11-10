'use strict';
module.exports = function (sequelize, DataTypes) {
  var qstn_alternatives = sequelize.define('qstn_alternatives', {
    qta_pk: {
      type: DataTypes.INTEGER(16),
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    qta_qst_id: {
      type: DataTypes.INTEGER(16),
    },
    qta_id: {
      type: DataTypes.INTEGER(16),
      allowNull: false
    },
    qta_alt_desc: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    qta_img_fk: {
      type: DataTypes.INTEGER(16)
    },
    qta_order: {
      type: DataTypes.INTEGER(10),
      allowNull: false
    },
    qta_is_corr_alt: {
      type: DataTypes.CHAR(1),
      allowNull: false
    },
    qta_is_active: {
      type: DataTypes.CHAR(1),
      allowNull: false
    },
    qta_audit_by: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    qta_audit_dt: {
      type: DataTypes.DATE,
      allowNull: false
    }
  },
    {
      charset: 'utf8',
      collate: 'utf8_general_ci',
      timestamps: false,
      paranoid: true,
      underscored: true,
      freezeTableName: true,
      tableName: 'qstn_alternatives',
      logging: false

    });
  return qstn_alternatives;
};