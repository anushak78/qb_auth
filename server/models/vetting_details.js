'use strict';
module.exports = function (sequelize, DataTypes) {
    var vetting_details = sequelize.define('vetting_details', {
        vd_pk: {
            type: DataTypes.INTEGER(16),
            allowNull: false,
            primaryKey: true,
            autoIncrement: true
        },
        exam_fk: {
            type: DataTypes.INTEGER(16),
            allowNull: false
        },
        vetter_fk: {
            type: DataTypes.INTEGER(16),
            allowNull: false
        },
        vetting_status: {
            type: DataTypes.STRING(100),
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
        module_names: {
            type: DataTypes.STRING(100),
            allowNull: true
        },
        module_ids: {
            type: DataTypes.STRING(100),
            allowNull: true
        },
        vetting_flag: {
            type: DataTypes.STRING(1),
            allowNull: true
        },
        qstnpaper_id: {
            type: DataTypes.CHAR(50),
            allowNull: false
        },
        exampaper_fk: {
            type: DataTypes.INTEGER(16)
        },
        summary_id_fk: {
            type: DataTypes.INTEGER(16)
        }
    },
        {
            timestamps: false,
            paranoid: true,
            underscored: true,
            freezeTableName: true,
            tableName: 'vetting_details'

        });
    return vetting_details;
};