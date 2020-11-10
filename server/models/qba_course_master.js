'use strict';
module.exports = function (sequelize, DataTypes) {
	var qba_course_master = sequelize.define('qba_course_master', {
		qba_course_pk:
		{
			type: DataTypes.INTEGER,
			primaryKey: true,
			allowNull: false,
			autoIncrement: true
		},
		qba_course_code:
		{
			type: DataTypes.STRING(100)
		},
		qba_course_name:
		{
			type: DataTypes.STRING(100),
			allowNull: false
		},
		is_active:
		{
			type: DataTypes.STRING(1),
			allowNull: false
		},
		audit_by:
		{
			type: DataTypes.STRING(100),
			allowNull: false
		},
		qba_audit_dt:
		{
			type: DataTypes.TIME,
			allowNull: false
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
			tableName: 'qba_course_master'

		});
	return qba_course_master;
};


