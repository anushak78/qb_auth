'use strict';
module.exports = function (sequelize, DataTypes) {
  var qba_lang_mstr = sequelize.define('qba_lang_mstr', {
    lang_id_pk: {
      type: DataTypes.INTEGER(16, 0),
      allowNull: false,
      primaryKey: true
    },

    lang_code: {
      type: DataTypes.CHAR(5),
      allowNull: true,
    },
    lang_name: {
      type: DataTypes.CHAR(100),
      allowNull: true,
    },
    is_active: {
      type: DataTypes.CHAR(1),
      allowNull: true
    },
    qta_audit_by: {
      type: DataTypes.CHAR(100),
      allowNull: true
    },
    qta_audit_dt: {
      type: DataTypes.DATE,
      allowNull: true
    }
  },
    {
      timestamps: false,
      paranoid: true,
      underscored: true,
      freezeTableName: true,
      tableName: 'qba_lang_mstr'

    });
  return qba_lang_mstr;
};