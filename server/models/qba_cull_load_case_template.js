'use strict';

module.exports = function (sequelize, DataTypes) {
    var qba_cull_load_case_template = sequelize.define('qba_cull_load_case_template', {
        case_id_pk: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            allowNull: false,
            autoIncrement: true
        },
        case_template_id_fk: {
            type: DataTypes.INTEGER,
            allowNull: true,
            unique: true
        },
        case_topic_name: {
            type: DataTypes.STRING(100),
            allowNull: false
        },
        case_marks: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        case_parent_count: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        case_child_count: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
    },
        {
            timestamps: false,
            paranoid: true,
            underscored: true,
            freezeTableName: true,
            tableName: 'qba_cull_load_case_template'
        });
    return qba_cull_load_case_template;
};