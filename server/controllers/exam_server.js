const Sequelize = require('sequelize');

var sequelize = new Sequelize('postgres://qba:qba@127.0.0.1:5432/qba', { logging: false, dialect: 'postgres' });



var um_user_mstr = require('../models/').um_user_mstr;
var um_user_role_mapping = require('../models/').um_user_role_mapping;
var um_role_mstr = require('../models/').um_role_mstr;

var vetting_details = require('../models/').vetting_details;
var exam_master = require('../models/').exam_master;

um_user_mstr.hasOne(um_user_role_mapping, { foreignKey: 'user_fk' });
um_user_role_mapping.belongsTo(um_user_mstr, { foreignKey: 'user_fk' });

um_role_mstr.hasOne(um_user_role_mapping, { foreignKey: 'role_fk' });
um_user_role_mapping.belongsTo(um_role_mstr, { foreignKey: 'role_fk' });

exam_master.hasMany(vetting_details, { foreignKey: 'exam_fk' });
vetting_details.belongsTo(exam_master, { foreignKey: 'exam_fk' });

um_user_mstr.hasMany(vetting_details, { foreignKey: 'vetter_fk' });
vetting_details.belongsTo(um_user_mstr, { foreignKey: 'vetter_fk' });

var importMethods = {
    getUserList: function (req, res) {

        var roleCode = req.body.role;


        um_user_mstr.findAll({
            where: { user_status: 'A' },
            include: [{
                model: um_user_role_mapping,
                required: true,
                include: [{
                    model: um_role_mstr,
                    where: { role_code: roleCode }
                }]
            }]
        })
            .then(users => {
                res.send({
                    code: 0,
                    message: "success",
                    obj: users
                })
            })

    },
    assignVetterOrPublisher: function (req, res) {
        var vettingDetails = req.body;
        var findModuleID = vettingDetails.module_id.split(",").join("|")
        var query = ' select count(*), um_user_mstr.user_id, vetting_details.module_names from vetting_details ' +
            ' inner join um_user_mstr on um_user_mstr.user_pk = vetting_details.vetter_fk' +
            ' where exampaper_fk = ' + vettingDetails.exampaper_fk + ' and' +
            ' exam_fk= ' + vettingDetails.examId + ' and vetting_status =\'Active\' and' +
            ' module_ids ~ \'' + findModuleID + '\'' +
            ' group by um_user_mstr.user_id, vetting_details.module_names';

        sequelize.query(query).then(details => {
            if (details[1].rowCount == 0) {
                var params = {
                    exam_fk: vettingDetails.examId,
                    vetter_fk: vettingDetails.vetterId,
                    vetting_status: vettingDetails.vettingStatus,
                    audit_by: vettingDetails.auditBy,
                    audit_dt: new Date(),
                    module_ids: vettingDetails.module_id,
                    module_names: vettingDetails.module_name,
                    qstnpaper_id: vettingDetails.currentQstnPaperId,
                    exampaper_fk: vettingDetails.exampaper_fk
                };
                vetting_details.create(params).then(result => {
                    res.send({
                        code: 0,
                        message: "success",
                        obj: result
                    })
                })
                return;
            }
            res.send({
                code: 0,
                message: "Already Exists",
                obj: details
            })


        })
    },

    loadExamList: function (req, res) {

        vetting_details.findAll({
            include: [{
                model: exam_master,
            }]
        })
            .then(result => {
                res.send({
                    code: 0,
                    message: "success",
                    obj: result
                })
            })

    },

    assignPublisherWithoutVetting: function (req, res) {
        var params = req.body;
        var findModuleID = "[" + params.module_id + "]";

        var query = "select case when count(1)=0 then 1 else 0 end from " +
            "(select regexp_split_to_table(replace(replace(\'" + findModuleID + "\','[',''),']',''),E',') " +
            "except select regexp_split_to_table(module_ids,E',') from vetting_details where exampaper_fk = " + params.exampaper_fk + ")a";
        sequelize.query(query, { type: sequelize.QueryTypes.SELECT })
            .then(status => {
                res.send({
                    code: 0,
                    message: "success",
                    obj: status
                });
            })
    }


};

module.exports = importMethods;

