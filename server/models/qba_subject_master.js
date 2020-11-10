'use strict';
module.exports = function (sequelize, DataTypes) {
  var qba_subject_master = sequelize.define('qba_subject_master', {
    qba_subject_pk: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true
    },
    qba_course_fk:
    {
      type: DataTypes.INTEGER,
      references: {
        // This is a reference to another model
        model: sequelize.import('./qba_course_master.js'),

        // This is the column name of the referenced model
        key: 'qba_course_pk',

        // This declares when to check the foreign key constraint. PostgreSQL only.
        deferrable: sequelize.Deferrable.INITIALLY_IMMEDIATE
      }
    },
    qba_subject_code:
    {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    subject_name:
    {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    is_active:
    {
      type: DataTypes.STRING(1),
      allowNull: false
    },
    audit_by:
    {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    audit_dt:
    {
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
      tableName: 'qba_subject_master'

    });
  return qba_subject_master;
};



