'use strict';
module.exports = function (sequelize, DataTypes) {
    var um_user_mstr = sequelize.define('um_user_mstr', {
        user_pk: {
            type: DataTypes.INTEGER(16),
            allowNull: false,
            primaryKey: true,
            autoIncrement: true
        },
        user_id: {
            type: DataTypes.STRING(100),
            allowNull: false
        },
        user_password: {
            type: DataTypes.STRING(100)
        },
        user_salutation: {
            type: DataTypes.STRING(100)
        },
        first_name: {
            type: DataTypes.STRING(100),
            allowNull: false
        },
        middle_name: {
            type: DataTypes.STRING(100)
        },
        last_name: {
            type: DataTypes.STRING(100),
            allowNull: false
        },
        user_status: {
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
        address: {
            type: DataTypes.STRING(300)
        },
        email_id: {
            type: DataTypes.STRING(100)
        },
        mobile_no: {
            type: DataTypes.STRING(11)
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
            paranoid: true,
            underscored: true,
            freezeTableName: true,
            tableName: 'um_user_mstr'

        });
    return um_user_mstr;
};