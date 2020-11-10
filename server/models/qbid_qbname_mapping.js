'use strict';
module.exports = function (sequelize, DataTypes) {
  var qbid_qbname_mapping = sequelize.define('qbid_qbname_mapping', {
    qqm_pk: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    qqm_qst_qb_name: {
      type: DataTypes.STRING(30),
      allowNull: false,
      unique: true
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
      tableName: 'qbid_qbname_mapping'

    });
  return qbid_qbname_mapping;
};