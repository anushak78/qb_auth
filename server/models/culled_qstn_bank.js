'use strict';
module.exports = function (sequelize, DataTypes) {
    var culled_qstn_bank = sequelize.define('culled_qstn_bank', {
        culled_qb_pk: {
            type: DataTypes.INTEGER(16),
            allowNull: false,
            primaryKey: true,
            autoIncrement: true
        },
        qb_pk: {
            type: DataTypes.INTEGER(16),
            allowNull: false
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
            type: DataTypes.STRING
        },
        audit_qst_body: {
            type: DataTypes.STRING
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
        qba_module_fk: {
            type: DataTypes.INTEGER(16)
        },
        author_name: {
            type: DataTypes.STRING(100)
        },
        exam_fk: {
            type: DataTypes.INTEGER(16),
            allowNull: false
        },
        exampaper_fk: {
            type: DataTypes.INTEGER(16),
            allowNull: false
        },
        copied_from_repository: {
            type: DataTypes.CHAR(1)
        },
        publish_flag: {
            type: DataTypes.CHAR(1)
        },
        qst_request_status: {
            type: DataTypes.STRING(50),
            allowNull: true
        },
        qst_request_remarks: {
            type: DataTypes.STRING(100),
            allowNull: true
        },
        pub_status: {
            type: DataTypes.CHAR(1)
        },
        admin_status: {
            type: DataTypes.CHAR(1)
        },
        replace_id: {
            type: DataTypes.INTEGER(16),
            allowNull: true
        },
       /* comments: {
            type: DataTypes.STRING
        },*/
    },
        {
            timestamps: false,
            paranoid: true,
            underscored: true,
            freezeTableName: true,
            tableName: 'culled_qstn_bank'

        });
    return culled_qstn_bank;
};