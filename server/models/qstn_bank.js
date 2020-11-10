'use strict';
module.exports = function (sequelize, DataTypes) {
    var qstn_bank = sequelize.define('qstn_bank', {
        qb_pk: {
            type: DataTypes.INTEGER(16),
            allowNull: false,
            primaryKey: true,
            autoIncrement: true
        },
        qst_type: {
            type: DataTypes.STRING(2),
            allowNull: false
        },
        qst_lang: {
            type: DataTypes.STRING(5),
            allowNull: false
        },
        qst_pid: {
            type: DataTypes.INTEGER(16),
            allowNull: false
        },
        qst_sub_seq_no: {
            type: DataTypes.INTEGER(16)
        },
        qst_body: {
            type: DataTypes.STRING,
            allowNull: true
        },
        qst_marks: {
            type: DataTypes.DECIMAL(6, 2),
            allowNull: false
        },
        qst_neg_marks: {
            type: DataTypes.DECIMAL(6, 2)
        },
        qst_expiry_dt: {
            type: DataTypes.DATE
        },
        qst_no_of_altr: {
            type: DataTypes.INTEGER(2)
        },
        qst_img_fk: {
            type: DataTypes.INTEGER(16)
        },
        qst_remarks: {
            type: DataTypes.STRING(200)
        },
        qst_fk_tpc_pk: {
            type: DataTypes.INTEGER(16)
        },
        qst_dimension: {
            type: DataTypes.STRING(100)
        },
        qst_is_active: {
            type: DataTypes.CHAR(1)
        },
        qst_audit_by: {
            type: DataTypes.STRING(100),
            allowNull: false
        },
        qst_audit_dt: {
            type: DataTypes.DATE,
            allowNull: false
        },
        qb_assigned_to: {
            type: DataTypes.INTEGER(10),
            allowNull: false
        },
        qb_status_fk: {
            type: DataTypes.INTEGER(10),
            allowNull: false
        },
        qba_topic_fk: {
            type: DataTypes.INTEGER(16)
        },
        qba_subject_fk: {
            type: DataTypes.INTEGER(16)
        },
        qba_course_fk: {
            type: DataTypes.INTEGER(16)
        },
        no_of_question: {
            type: DataTypes.INTEGER(10)
        },
        reference_info: {
            type: DataTypes.STRING(100)
        },
        calculation_info: {
            type: DataTypes.STRING(100)
        },
        qb_id: {
            type: DataTypes.INTEGER(16)
        },
        author_name: {
            type: DataTypes.STRING(100)
        },
        sr_no: {
            type: DataTypes.INTEGER(16)
        }
    },
        {
            charset: 'utf8',
            collate: 'utf8_general_ci',
            timestamps: false,
            paranoid: true,
            underscored: true,
            freezeTableName: true,
            tableName: 'qstn_bank'

        });
    return qstn_bank;
};