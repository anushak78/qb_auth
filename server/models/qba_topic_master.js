'use strict';
module.exports = function (sequelize, DataTypes) {
	var qba_topic_master = sequelize.define('qba_topic_master', {
		qba_topic_pk: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			allowNull: false,
			autoIncrement: true
		},
		qba_topic_code:
		{
			type: DataTypes.STRING(100),
			allowNull: false
		},
		topic_name:
		{
			type: DataTypes.STRING(100),
			allowNull: false
		},
		is_active:
		{
			type: DataTypes.STRING(1)

		},
		audit_by:
		{
			type: DataTypes.STRING(100)

		},
		audit_dt:
		{
			type: DataTypes.TIME
		},
		qba_module_fk:
		{
			type: DataTypes.INTEGER(16, 0),
			allowNull: true
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
			tableName: 'qba_topic_master'

		});
	return qba_topic_master;
};



