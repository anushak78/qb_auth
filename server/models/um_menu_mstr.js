'use strict';
module.exports = function (sequelize, DataTypes) {
    var um_menu_mstr = sequelize.define('um_menu_mstr', {
        menu_pk: {
            type: DataTypes.INTEGER(16),
            allowNull: false,
            primaryKey: true,
            autoIncrement: true
        },
        menu_name: {
            type: DataTypes.STRING(100),
            allowNull: false
        },
        parent_id: {
            type: DataTypes.INTEGER(16),
            allowNull: false
        },
        menu_srno: {
            type: DataTypes.INTEGER(10),
            allowNull: false
        },
        jsp_page: {
            type: DataTypes.STRING(100),
            allowNull: false
        },
        menu_status: {
            type: DataTypes.CHAR(1),
            allowNull: false
        },
        audit_dt: {
            type: DataTypes.DATE,
            allowNull: false
        },
        menu_type: {
            type: DataTypes.STRING(100)
        }
    },
        {
            timestamps: false,
            paranoid: true,
            underscored: true,
            freezeTableName: true,
            tableName: 'um_menu_mstr'

        });
    return um_menu_mstr;
};