'use strict';
module.exports = function (sequelize, DataTypes) {
  var qstn_attr_mapping = sequelize.define('qstn_attr_mapping', {
    qam_pk: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    qam_fk_qst_pk: {
      type: DataTypes.INTEGER,
      references: {
        model: sequelize.import('./qstn_bank.js'),
        key: 'qb_pk',
        deferrable: sequelize.Deferrable.INITIALLY_IMMEDIATE
      }
    },
    qam_fk_attr_pk: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    is_active: {
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
      timestamps: false,

      // don't delete database entries but set the newly added attribute deletedAt
      // to the current date (when deletion was done). paranoid will only work if
      // timestamps are enabled
      paranoid: true,

      // don't use camelcase for automatically added attributes but underscore style
      // so updatedAt will be updated_at
      underscored: true,

      // disable the modification of tablenames; By default, sequelize will automatically
      // transform all passed model names (first parameter of define) into plural.
      // if you don't want that, set the following
      freezeTableName: true,

      // define the table's name
      tableName: 'qstn_attr_mapping'

    });
  return qstn_attr_mapping;
};