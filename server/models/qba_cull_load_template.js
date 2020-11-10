'use strict';

module.exports = function (sequelize, DataTypes) {
    var qba_cull_load_template = sequelize.define('qba_cull_load_template', {
        id_pk: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            allowNull: false,
            autoIncrement: true
        },
        template_id_fk:
        {
            type: DataTypes.INTEGER,
            allowNull: true,
            unique: true
        },
        topic_name:
        {
            type: DataTypes.STRING(100),
            allowNull: false
        },
        marks:
        {
            type: DataTypes.INTEGER,
            allowNull: false

        },
        user_count:
        {
            type: DataTypes.INTEGER,
            allowNull: false

        },
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
            tableName: 'qba_cull_load_template'

        });
    return qba_cull_load_template;
};