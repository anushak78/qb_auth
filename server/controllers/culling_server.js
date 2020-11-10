var async = require('async');
var qba_course_master = require('../models/').qba_course_master;
var qba_subject_master = require('../models/').qba_subject_master;
const Sequelize = require('sequelize');

var sequelize = new Sequelize('postgres://qba:qba@127.0.0.1:5432/qba', { logging: false, dialect: 'postgres' });



var qstn_bank = require('../models/').qstn_bank;
var qstn_alternatives = require('../models/').qstn_alternatives;
var qbank_images = require('../models/').qbank_images;

var qba_topic_master = require('../models/').qba_topic_master;
var exam_master = require('../models/').exam_master;
var qba_module_mstr = require('../models/').qba_module_mstr;
var qba_cull_load_template = require('../models/').qba_cull_load_template;
var qba_cull_save_temp = require('../models/').qba_cull_save_temp;
var qba_cull_load_case_template = require('../models/').qba_cull_load_case_template;

qba_module_mstr.hasMany(qstn_bank, { foreignKey: 'qba_module_fk' });
qba_topic_master.hasMany(qstn_bank, { foreignKey: 'qba_topic_fk' });
qba_course_master.hasMany(qstn_bank, { foreignKey: 'qba_course_fk' });
qba_subject_master.hasMany(qstn_bank, { foreignKey: 'qba_subject_fk' });
qstn_bank.hasMany(qstn_alternatives, { foreignKey: 'qta_qst_id' });

qstn_bank.belongsTo(qba_module_mstr, { foreignKey: 'qba_module_fk' });
qstn_bank.belongsTo(qba_topic_master, { foreignKey: 'qba_topic_fk' });
qstn_bank.belongsTo(qba_course_master, { foreignKey: 'qba_course_fk' });
qstn_bank.belongsTo(qba_subject_master, { foreignKey: 'qba_subject_fk' });
qstn_alternatives.belongsTo(qstn_bank, { foreignKey: 'qta_qst_id' });



qstn_bank.belongsTo(qbank_images, { foreignKey: 'qst_img_fk', targetKey: 'qbi_pk' });
qstn_alternatives.belongsTo(qbank_images, { foreignKey: 'qta_img_fk', targetKey: 'qbi_pk' });

qbank_images.hasOne(qstn_bank, { foreignKey: 'qst_img_fk' });
qbank_images.hasOne(qstn_alternatives, { foreignKey: 'qta_img_fk' });

exam_master.belongsTo(qba_course_master, { foreignKey: 'qba_course_fk' });
exam_master.belongsTo(qba_subject_master, { foreignKey: 'qba_subject_fk' });

qba_course_master.hasOne(exam_master, { foreignKey: 'qba_course_fk' });
qba_subject_master.hasOne(exam_master, { foreignKey: 'qba_subject_fk' });


var importMethods = {

    createTopicTable: function (req, res) {
        var responseData = req.body;
        var count_marks = 0;
        var course_fk = responseData.course;
        var subject_fk = responseData.subject;
        var exam_paper_pk = responseData.exampaper_pk;
        var e_pk = responseData.e_pk
       // var admin_e_pk = responseData.admin_e_pk
        var str = "";
       /* if (admin_e_pk[0] != '0') {
            str = "and qstn_bank.qb_pk::text in ( select (case when published_qb_pk is null then unnest(exam_qb_pk) else unnest(published_qb_pk) end) from qba_exam_paper where exampaper_pk in (" + admin_e_pk + ")) "
        }*/
       
        var srcquery = "select coalesce(qba_topic_pk,qba_topic_pk1) topic_pk,coalesce(qba_topic_master.qba_module_fk,qba_module_fk1) module_fk,coalesce(topic_name,topic_name1) topic_name,coalesce(qba_topic_code,qba_topic_code1) qba_topic_code,coalesce(qst_marks,qst_marks1) qst_marks ," +
            " count(qst_marks) as count_of_questions,qstn_bank.qst_is_active from qstn_bank" +
            " inner join qba_topic_master on (qba_topic_pk=qba_topic_fk) " +
            " inner join qba_module_mstr m on (m.qba_module_pk=qstn_bank.qba_module_fk) " +
            " and qstn_bank.qba_course_fk='" + course_fk + "' And qstn_bank.qba_subject_fk='" + subject_fk + "' and qstn_bank.qst_lang = 'ENGLISH' and qst_type= 'M'" +
            " and qst_is_active = 'A' and qstn_bank.qb_pk::text not in ( select (case when published_qb_pk is null then unnest(exam_qb_pk) else unnest(published_qb_pk) end) from qba_exam_paper where exampaper_pk in (" + e_pk + ")) " + str +
            " right join (SELECT * FROM (SELECT DISTINCT qba_topic_pk qba_topic_pk1,qba_topic_master.qba_module_fk qba_module_fk1,topic_name topic_name1,qba_topic_code qba_topic_code1" +
            " FROM qba_topic_master INNER JOIN qstn_bank ON (qba_topic_pk = qba_topic_fk and qst_lang = 'ENGLISH'and qst_type='M')" +
            " WHERE qstn_bank.qst_lang = 'ENGLISH' and qstn_bank.qba_course_fk = '" + course_fk + "'AND qstn_bank.qba_subject_fk = '" + subject_fk + "') a" +
            " INNER JOIN" +
            " (SELECT DISTINCT qst_is_active,qst_marks qst_marks1" +
            " FROM qstn_bank where qst_lang = 'ENGLISH' and qst_type= 'M'" +
            "   and qst_is_active='A' and qstn_bank.qb_pk::text not in ( select (case when published_qb_pk is null then unnest(exam_qb_pk) else unnest(published_qb_pk) end) from qba_exam_paper where exampaper_pk in (" + e_pk + ")) " + str +
            "  and qstn_bank.qb_pk::text not in ( select (case when published_qb_pk is null then unnest(exam_qb_pk) else unnest(published_qb_pk) end) from qba_exam_paper where exam_fk in (" + exam_paper_pk + ")) " +
            ") b ON 1 = 1" +
            " ) b  on  topic_name = topic_name1 and   qst_marks = qst_marks1 " +
            " where qstn_bank.qst_lang = 'ENGLISH' group by qba_topic_pk,qba_topic_pk1,qstn_bank.qst_is_active,qba_topic_master.qba_module_fk,qba_module_fk1,topic_name,qba_topic_code,qst_marks,topic_name1,qba_topic_code1,qst_marks1,m.module_name" +
            " order by m.module_name, qba_topic_code,2,1,3,4,5"

        var countQuery = "select distinct qst_marks as qst_count from qstn_bank where qst_type='M' and qst_lang='ENGLISH'";
        sequelize.query(countQuery, { type: sequelize.QueryTypes.SELECT })
            .then(function (count) {
                if (count[0]) {
                    count_marks = count[0].qst_count;
                
                    sequelize.query(srcquery, { type: sequelize.QueryTypes.SELECT })
                        .then(topicData => {

                            var topicDataList = [];
                            var topic = {};
                            if (topicData.length > 0) {
                                for (var i = 0; i < topicData.length; i++) {
                                    topic = {
                                        topic_name: topicData[i].topic_name,
                                        qba_topic_code: topicData[i].qba_topic_code,
                                        topic_pk: topicData[i].topic_pk,
                                        module_fk: topicData[i].module_fk,
                                        marks_count: []
                                    };
                                    topic.marks_count.push({
                                        marks: topicData[i].qst_marks,
                                        count: topicData[i].count_of_questions,
                                        userCount: 0
                                    })
                                    topicDataList.push(topic);

                                }
                                res.send({
                                    code: 0,
                                    message: "Data Found",
                                    data: { topicList: topicDataList, marksCnt: count }
                                })
                            }
                            else {
                                res.send({
                                    code: 1,
                                    message: "No Data Found",
                                    data: {}
                                })
                            }

                        })
                }
                else {
                    res.send({
                        code: 1,
                        message: "No Data Found",
                        data: {}
                    })
                }
            });

    },
    getTopicwiseQstnIdMap: function (req, res) {
        var subjectId = req.body.subject;
        var selected_e_pk = req.body.selected_e_pk;
        //var admin_e_pk = req.body.admin_e_pk;
        var str = ""
        /*if (admin_e_pk[0] != '0') {
            str = " and qb_pk:: text in ( select (case when published_qb_pk is null then unnest(exam_qb_pk) else unnest(published_qb_pk) end) from qba.qba_exam_paper where exampaper_pk in (" + admin_e_pk + "))"
        }*/
        var query = "select qba_topic_pk, qst_marks, qb_pk  from qba_topic_master inner join qstn_bank " +
            "on (qba_topic_pk=qstn_bank.qba_topic_fk) " +
            "inner join qba_module_mstr on (qba_module_mstr.qba_module_pk = qba_topic_master.qba_module_fk) " +
            " and qb_pk:: text not in ( select (case when published_qb_pk is null then unnest(exam_qb_pk) else unnest(published_qb_pk) end) from qba.qba_exam_paper where exampaper_pk in (" + selected_e_pk + "))  "+ str +" where qstn_bank.qst_type='M' and qst_lang = 'ENGLISH' and qst_is_active = 'A' and qba_module_mstr.qba_subject_fk = " + subjectId + " order by qba_topic_pk asc, qst_marks asc";

        sequelize.query(query, { type: sequelize.QueryTypes.SELECT })
            .then(topicwiseQstnId => {
                var topicWiseQuestionMap = {};

                for (var i = 0; i < topicwiseQstnId.length; i++) {

                    var key = topicwiseQstnId[i].qba_topic_pk + "~" + topicwiseQstnId[i].qst_marks;
                    var existingQuestionList = topicWiseQuestionMap[key];

                    if (existingQuestionList == null) {
                        var newList = [];
                        newList.push(topicwiseQstnId[i].qb_pk);
                        topicWiseQuestionMap[key] = newList;
                    } else {
                        existingQuestionList.push(topicwiseQstnId[i].qb_pk);
                    }

                }
                res.send({
                    code: 0,
                    message: "Data Found",
                    obj: topicWiseQuestionMap
                })

            })

    },
    getTopicwiseCaseQstnIdMap: function (req, res) {
        var subjectId = req.body.subject;
        var selected_e_pk = req.body.selected_e_pk;
        var query = "select qba_topic_master.qba_topic_pk,child_data.child_marks,child_data.child_count,qstn_bank.qb_pk from " +
            "(select  qst_pid,qst_marks as child_marks,count(qb_pk) as child_count from " +
            "qstn_bank where qst_type = 'CS' and qst_pid >0 and qst_lang='ENGLISH' group by qst_pid,qst_marks) child_data " +
            "inner join qstn_bank on (qstn_bank.qb_id = child_data.qst_pid) " +
            "inner join qba_topic_master on (qba_topic_master.qba_topic_pk=qstn_bank.qba_topic_fk) " +
            "inner join qba_module_mstr on (qba_module_mstr.qba_module_pk = qba_topic_master.qba_module_fk) " +
            " and qb_pk:: text not in ( select (case when published_qb_pk is null then unnest(exam_qb_pk) else unnest(published_qb_pk) end) from qba.qba_exam_paper where exampaper_pk in (" + selected_e_pk + ")) where qstn_bank.qst_type='CS' and qst_lang='ENGLISH' and qba_module_mstr.qba_subject_fk =" + subjectId +
            " order by qba_topic_master.qba_topic_pk,child_data.child_marks,child_data.child_count ";
        sequelize.query(query, { type: sequelize.QueryTypes.SELECT })
            .then(topicwiseQstnId => {
                var topicWiseCaseQuestionMap = {};

                for (var i = 0; i < topicwiseQstnId.length; i++) {

                    var key = topicwiseQstnId[i].qba_topic_pk + "~" + topicwiseQstnId[i].child_marks + "~" + topicwiseQstnId[i].child_count;
                    var existingQuestionList = topicWiseCaseQuestionMap[key];

                    if (existingQuestionList == null) {
                        var newList = [];
                        newList.push(topicwiseQstnId[i].qb_pk);
                        topicWiseCaseQuestionMap[key] = newList;
                    } else {
                        existingQuestionList.push(topicwiseQstnId[i].qb_pk);
                    }
                }
                res.send({
                    code: 0,
                    message: "Data Found",
                    obj: topicWiseCaseQuestionMap
                })
            })
    },
    CaseQuestionCulling: function (req, res) {
        var caseCullingParams = req.body.caseCullingData;

        var subjectId = caseCullingParams.subject;
        var maxChildLimitPerCase = caseCullingParams.maxChildPerCase;
        var userInput = caseCullingParams.userInput;
        var selected_e_pk = caseCullingParams.selected_e_pk;

        var query = "select qba_topic_master.qba_topic_pk,child_data.child_marks,child_data.child_count,qstn_bank.qb_pk from " +
            "(select  qst_pid,qst_marks as child_marks,count(qb_pk) as child_count from " +
            "qstn_bank where qst_type = 'CS' and qst_pid >0 and qst_lang='ENGLISH' group by qst_pid,qst_marks) child_data " +
            "inner join qstn_bank on (qstn_bank.qb_id = child_data.qst_pid) " +
            "inner join qba_topic_master on (qba_topic_master.qba_topic_pk=qstn_bank.qba_topic_fk) " +
            "inner join qba_module_mstr on (qba_module_mstr.qba_module_pk = qba_topic_master.qba_module_fk) " +
            " and qb_pk:: text not in ( select (case when published_qb_pk is null then unnest(exam_qb_pk) else unnest(published_qb_pk) end) from qba.qba_exam_paper where exampaper_pk in (" + selected_e_pk + ")) where qstn_bank.qst_type='CS' and qst_lang='ENGLISH' and qst_is_active = 'A' and qba_module_mstr.qba_subject_fk =" + subjectId;
        if (caseCullingParams.status == 'N') {
            query = query + " order by qba_topic_master.qba_topic_pk,child_data.child_marks,child_data.child_count";
        }
        else {
            query = query + "order by qba_topic_master.qba_topic_pk,qstn_bank.qb_pk desc, child_data.child_marks,child_data.child_count desc";
        }

        sequelize.query(query, { type: sequelize.QueryTypes.SELECT })
            .then(CaseQstnsFromDB => {
                var culledCaseQstnIds = [];
                var caseQuestionShortfall = [];
                var topicIdFromUI;
                var marksFromUI;
                var parentCountFromUI;
                var childCountFromUI;
                if (userInput != undefined && userInput.length > 0) {
                    for (var i = 0; i < userInput.length; i++) {
                        var topicRecord = userInput[i];
                        topicIdFromUI = topicRecord.topic_pk;

                        for (var j = 0; j < topicRecord.case_marks_count.length; j++) {
                            var marksRecord = topicRecord.case_marks_count[j];
                            marksFromUI = marksRecord.case_marks;
                            parentCountFromUI = marksRecord.parent_userCount;
                            childCountFromUI = marksRecord.child_userCount;
                            case_count_child_questionsFromUI = marksRecord.case_count_child_questions;
                            var remainingChilds = parentCountFromUI * maxChildLimitPerCase;
                            var searchChildCount = 0;
                            var culledParentCount = 0;

                            if (parentCountFromUI > 0) {
                                for (var k = 0; k < CaseQstnsFromDB.length; k++) {
                                    var dbRecord = CaseQstnsFromDB[k];
                                    if (parentCountFromUI > culledParentCount && topicIdFromUI == dbRecord.qba_topic_pk && marksFromUI == dbRecord.child_marks && case_count_child_questionsFromUI == dbRecord.child_count) {
                                        if (remainingChilds > maxChildLimitPerCase) {
                                            searchChildCount = maxChildLimitPerCase;
                                        } else {
                                            searchChildCount = remainingChilds;
                                        }

                                        culledCaseQstnIds.push(dbRecord.qb_pk);
                                        remainingChilds = remainingChilds - searchChildCount;
                                        culledParentCount = culledParentCount + 1;

                                    }


                                }

                            }
                            if (parentCountFromUI > culledParentCount) {
                                var shortFallCount = parentCountFromUI - culledParentCount;
                                var shortFallRecord = { topicPk: topicIdFromUI, marks: marksFromUI, count: shortFallCount };
                                caseQuestionShortfall.push(shortFallRecord);
                                shortFallRecord = {};
                            }

                        }

                    }
                }
                res.send({
                    code: 0,
                    message: "success",
                    obj: culledCaseQstnIds
                })
            });
    },
    getExamMasterData: function (req, res) {
        var courseId = req.body.course;
        var subjectId = req.body.subject;
        var exampk = req.body;
        var exampk = req.body.exampaper_pk;

        exam_master.findOne({
            where: {
                qba_course_fk: courseId,
                qba_subject_fk: subjectId,
                exam_pk: exampk,
                is_active: 'Y'
            },
            include: [{
                model: qba_course_master
            }, {
                model: qba_subject_master
            }]
        }).then(examMaster => {

            res.send({
                code: 0,
                message: "Data Found",
                obj: examMaster
            })
        })
    },
    getFlag: function (req, res) {
        qba_cull_save_temp.findAll({
            where: {
                id_pk: req.body.template_id_fk
            }
        }).then(saveResponse => {
            res.send({
                code: 0,
                message: "success",
                obj: saveResponse
            });
        });
    },




    getTemplateName: function (req, res) {
        var results = []
        var query = "select exam_pk as exam_pk from exam_master where qba_subject_fk in (select qba_subject_fk from exam_master where exam_pk = " + req.body.exam_id + ")";
        sequelize.query(query).then(result => {
            for (var i = 0; i < result[0].length; i++) {
                results[i] = result[0][i].exam_pk
            }
            qba_cull_save_temp.findAll({
                attributes: ['template_name', 'id_pk'],
                where: {
                    exam_id: results
                }
            }).then(saveResponse => {
                res.send({
                    code: 0,
                    message: "success",
                    obj: saveResponse
                });
            });
        })
    },
    cullLoadTemplateDetails: function (req, res) {
        qba_cull_load_template.findAll({
            attributes: ['topic_name', 'marks', 'user_count'],
            where: {
                template_id_fk: req.body.template_id_fk
            }
        }).then(saveResponse => {
            res.send({
                code: 0,
                message: "success",
                obj: saveResponse
            });
        });
    },
    cullSaveTempDetails: function (req, res) {
        var params = req.body;
        async.each(params.templateDetails, function (arr1Element, callback) {
            async.each(arr1Element.marks_count, function (arr2Element, callback2) {
                qba_cull_load_template.create({
                    template_id_fk: params.template_id_fk,
                    topic_name: arr1Element.topic_name,
                    marks: arr2Element.marks,
                    user_count: arr2Element.userCount
                }).then(saveResponse => {
                    res.send({
                        code: 0,
                        message: "success",
                        obj: saveResponse
                    });
                });
                callback2();
            });
            callback();
        });
    },
    cullSaveTemp: function (req, res) {
        qba_cull_save_temp.findAll({
            where: {
                template_name: req.body.template_name
            }
        }).then(data => {
            if (data.length == 0) {
                qba_cull_save_temp.create({
                    exam_id: req.body.exam_id,
                    exam_name: req.body.exam_name,
                    template_name: req.body.template_name,
                    max_child_per_case: req.body.max_child_per_case,
                    flag: req.body.flag,
                    exam_paper: req.body.exam_paper,
                  //  admin_exam_paper: req.body.admin_exam_paper
                }).then(saveResponse => {
                    res.send({
                        code: 0,
                        message: "success",
                        obj: saveResponse
                    });
                });
            }
            else {
                res.send({
                    code: 1,
                    message: "Duplicate template",
                    obj: {}
                });
            }
        })
    },
    cullSaveCaseTempDetails: function (req, res) {
        var params = req.body;
        async.each(params.caseTemplateDetails, function (arr1Element, callback) {
            async.each(arr1Element.case_marks_count, function (arr2Element, callback2) {
                qba_cull_load_case_template.create({
                    case_template_id_fk: params.template_id_fk,
                    case_topic_name: arr1Element.topic_name,
                    case_marks: arr2Element.case_marks,
                    case_parent_count: arr2Element.parent_userCount,
                    case_child_count: arr2Element.case_count_child_questions
                }).then(saveResponse => {

                });
                callback2();
            });
            callback();
        });
        res.send({
            code: 0,
            message: "success",
        });
    },
    cullLoadCaseTemplateDetails: function (req, res) {
        qba_cull_load_case_template.findAll({
            attributes: ['case_topic_name', 'case_marks', 'case_parent_count', 'case_child_count'],
            where: {
                case_template_id_fk: req.body.template_id_fk
            }
        }).then(saveCaseResponse => {
            qba_cull_save_temp.findOne({
                attributes: ['template_name', 'max_child_per_case'],
                where: {
                    id_pk: req.body.template_id_fk
                }
            }).then(templateData => {
                if (templateData != null) {
                    res.send({
                        code: 0,
                        message: "success",
                        obj: saveCaseResponse,
                        maxChildCount: templateData.max_child_per_case
                    });
                }
                else {
                    res.send({
                        code: 0,
                        message: "success",
                        obj: saveCaseResponse,
                        maxChildCount: 100
                    })
                }
            });
        });
    },
    get_module_details: function (req, res) {
        var module_ids = req.body.module_ids;
        str = "";
        for (var i = 0; i < module_ids.length; i++) {

            if (str != "") {
                str += ','
            }
            str += module_ids[i]

        }
        let query = "select qba_module_pk,module_name from qba_module_mstr where qba_module_pk in (" + str + ") order by module_name";
        sequelize.query(query, { type: sequelize.QueryTypes.SELECT })
            .then(results => {
                res.send({
                    code: 0,
                    message: "success",
                    obj: results

                });
            });

    }
};
module.exports = importMethods;