'use strict';
module.exports = function (sequelize, DataTypes) {
    var um_role_mstr = sequelize.define('um_role_mstr', {
        role_pk: {
            type: DataTypes.INTEGER(16),
            allowNull: false,
            primaryKey: true,
            autoIncrement: true
        },
        role_code: {
            type: DataTypes.STRING(10),
            allowNull: false
        },
        role_name: {
            type: DataTypes.STRING(100),
            allowNull: false
        },
        role_description: {
            type: DataTypes.STRING(100)
        },
        role_status: {
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
        },
        role_type: {
            type: DataTypes.STRING(100)
        }
    },
        {
            timestamps: false,
            paranoid: true,
            underscored: true,
            freezeTableName: true,
            tableName: 'um_role_mstr'

        });
    return um_role_mstr;
};