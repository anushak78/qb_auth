'use strict';
module.exports = function (sequelize, DataTypes) {
  var qbank_images = sequelize.define('qbank_images', {
    qbi_pk: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    qbi_image_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true
    },
    image_width: {
      type: DataTypes.INTEGER
    },
    image_height: {
      type: DataTypes.INTEGER
    },
    qbi_filename: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true
    },
    // qbi_image:{
    //     type: DataTypes.BLOB,
    //     allowNull: false  
    // },
    qbi_is_active: {
      type: DataTypes.CHAR(1),
      allowNull: false
    },
    audit_by: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    audit_dt: {
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
      tableName: 'qbank_images'

    });
  return qbank_images;
};