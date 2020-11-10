'use strict';

module.exports = function (sequelize, DataTypes) {
    var qba_cull_save_temp = sequelize.define('qba_cull_save_temp', {
        id_pk: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            allowNull: false,
            autoIncrement: true
        },
        exam_id:
        {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        exam_name:
        {
            type: DataTypes.STRING(100),
            allowNull: false
        },
        template_name:
        {
            type: DataTypes.STRING(100),
            allowNull: false

        },
        max_child_per_case:
        {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        flag:
        {
            type: DataTypes.BOOLEAN
        },
        exam_paper:
        {
            type: DataTypes.ARRAY(DataTypes.STRING(10000))
        },
       /* admin_exam_paper: 
        {
            type: DataTypes.ARRAY(DataTypes.STRING(10000))
        }*/
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
            tableName: 'qba_cull_save_temp'

        });
    return qba_cull_save_temp;
};