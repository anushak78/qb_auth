/**
 * Created by krishna on 7/3/17.
 */
var async = require('async');
var fs = require('fs');
var express = require('express');
var parse = require('csv-parse');
var Promise = require('bluebird');
var qba_course_master = require('../models/').qba_course_master;
var qba_subject_master = require('../models/').qba_subject_master;
var User = require('../models/').um_user_mstr;
var bcrypt = require('bcrypt-nodejs');
const Sequelize = require('sequelize');
const Op = Sequelize.Op;
var unzip = require('unzip');
var mkdir = require('mkdirp');
var path = require('path');
var json2xls = require('json2xls');
var now = new Date();
var jwt = require('jsonwebtoken');
var router = express.Router();   //Dipika HSS//
var archiver = require('archiver');
var striptags = require('striptags');
var Excel = require('exceljs');
var XLSX = require('xlsx');
var csvWriter = require('csv-write-stream');
var sizeOf = require('image-size');

// performance-now to calculate time in between each process 
var now1 = require("performance-now")

router.use(function (req, res, next) {
    var token = req.headers['auth-token'];

    jwt.verify(token, process.env.SECRET, function (err, decoded) {
        if (err) {
            res.status(400).send("The token is invalid");
        } else {
            next();
        }
    })
});


var sequelize = new Sequelize('postgres://qba:qba@127.0.0.1:5432/qba', {
    timezone: '+05:30',
    dialect: 'postgres',
    logging: false,
    define: {

        charset: 'utf8',
        dialectOptions: {
            collate: 'utf8_general_ci'
        }
    }

});


var qstn_bank = require('../models/').qstn_bank;
var qstn_alternatives = require('../models/').qstn_alternatives;
var qbank_images = require('../models/').qbank_images;

var qba_topic_master = require('../models/').qba_topic_master;
var qba_module_mstr = require('../models/').qba_module_mstr;
var um_user_role_mapping = require('../models/').um_user_role_mapping;
var um_role_mstr = require('../models/').um_role_mstr;
var exam_master = require('../models/').exam_master;
var vetting_details = require('../models/').vetting_details;
var qba_vatting_log = require('../models/').qba_vatting_log;
var qba_summary_admin = require('../models/').qba_summary_admin;
var qba_replaceqstn_history = require('../models/').qba_replaceqstn_history;
var qba_case_summary_admin = require('../models/').qba_case_summary_admin;
var users = require('../models').users;


var qba_exam_paper = require('../models').qba_exam_paper; // add by milan

var culled_qstn_bank = require('../models').culled_qstn_bank;
var culled_qstn_alternatives = require('../models').culled_qstn_alternatives;
var qba_lang_mstr = require('../models').qba_lang_mstr;

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

qba_module_mstr.hasMany(culled_qstn_bank, { foreignKey: 'qba_module_fk' });
qba_topic_master.hasMany(culled_qstn_bank, { foreignKey: 'qba_topic_fk' });
qba_course_master.hasMany(culled_qstn_bank, { foreignKey: 'qba_course_fk' });
qba_subject_master.hasMany(culled_qstn_bank, { foreignKey: 'qba_subject_fk' });
culled_qstn_bank.hasMany(culled_qstn_alternatives, { foreignKey: 'qta_qst_id' });

culled_qstn_bank.belongsTo(qba_module_mstr, { foreignKey: 'qba_module_fk' });
culled_qstn_bank.belongsTo(qba_topic_master, { foreignKey: 'qba_topic_fk' });
culled_qstn_bank.belongsTo(qba_course_master, { foreignKey: 'qba_course_fk' });
culled_qstn_bank.belongsTo(qba_subject_master, { foreignKey: 'qba_subject_fk' });
culled_qstn_alternatives.belongsTo(culled_qstn_bank, { foreignKey: 'qta_qst_id' });

exam_master.hasMany(culled_qstn_bank, { foreignKey: 'exam_fk' });
qba_exam_paper.hasMany(culled_qstn_bank, { foreignKey: 'exampaper_fk' });

culled_qstn_bank.belongsTo(exam_master, { foreignKey: 'exam_fk' });
culled_qstn_bank.belongsTo(qba_exam_paper, { foreignKey: 'exampaper_fk' });


var importMethods = {
    saveFiles: function (req, res) {
        req.file('file').upload({ dirname: rootPath + '/uploads/zip' }, function (err, uploadedFiles) {

            if (err) return res.send(500, err);
            var entries = [];
            fs.createReadStream(uploadedFiles[0].fd)
                .pipe(unzip.Parse())
                .on('entry', function (entry) {
                    var fileName = entry.path;
                    var type = entry.type;
                    var fullPath = __dirname + '\\output';
                    entries.push(fullPath + "\\" + entry.path)
                    if (type === "File") {
                        entry.pipe(fs.createWriteStream(fullPath + '\\' + fileName));
                    } else {
                        entry.autodrain();
                    }
                }).on('close', function () {
                    var flag = false
                    for (var i = 0; i < entries.length; i++) {
                        if (entries[i].search("xlsx") > 0) {
                            flag = true
                        }
                    }
                    if (flag == false) {
                        res.send({
                            code: 3,
                            message: "success"
                        });
                    }
                    else {
                        res.send({
                            code: 0,
                            message: 'success'
                        })
                    }
                });
        })
    },
    importDocument: function (req, res) {
        var sr_no = []; var flag;
        var excelColumnHeaders = [
            { header: "QB_ID", key: "QB_ID" },
            { header: "Course", key: "Course" },
            { header: "Subject", key: "Subject" },
            { header: "Module", key: "Module" },
            { header: "Topic", key: "Topic" },
            { header: "Marks", key: "Marks" },
            { header: "Negative_Marks", key: "Negative_Marks" },
            { header: "Language", key: "Language" },
            { header: "Question_Type", key: "Question_Type" },
            { header: "Parent_QB_ID", key: "Parent_QB_ID" },
            { header: "No_of_Questions", key: "No_of_Questions" },
            { header: "Question_Body", key: "Question_Body" },
            { header: "Number_of_Alternatives", key: "Number_of_Alternatives" },
            { header: "Alternative 1", key: "Alternative 1" },
            { header: "Alternative 2", key: "Alternative 2" },
            { header: "Alternative 3", key: "Alternative 3" },
            { header: "Alternative 4", key: "Alternative 4" },
            { header: "Alternative 5", key: "Alternative 5" },
            { header: "Alternative 6", key: "Alternative 6" },
            { header: "Alternative 7", key: "Alternative 7" },
            { header: "Alternative 8", key: "Alternative 8" },
            { header: "Alternative 9", key: "Alternative 9" },
            { header: "Correct Alternative", key: "Correct Alternative" },
            { header: "Remarks", key: "Remarks" },
            { header: "Remarks Image", key: "Remarks Image" },
            { header: "Reference", key: "Reference" },
            { header: "Reference Image", key: "Reference Image" },
            { header: "Calculation", key: "Calculation" },
            { header: "Calculation Image", key: "Calculation Image" },
            { header: "Question Image", key: "Question Image" },
            { header: "Alternative 1 Image", key: "Alternative 1 Image" },
            { header: "Alternative 2 Image", key: "Alternative 2 Image" },
            { header: "Alternative 3 Image", key: "Alternative 3 Image" },
            { header: "Alternative 4 Image", key: "Alternative 4 Image" },
            { header: "Alternative 5 Image", key: "Alternative 5 Image" },
            { header: "Alternative 6 Image", key: "Alternative 6 Image" },
            { header: "Alternative 7 Image", key: "Alternative 7 Image" },
            { header: "Alternative 8 Image", key: "Alternative 8 Image" },
            { header: "Alternative 9 Image", key: "Alternative 9 Image" },
            { header: "Status (Active / Inactive)", key: "Status (Active / Inactive)" },
            { header: "Author_Name", key: "Author_Name" },
            { header: "Flag", key: "Flag" }
        ];
        var rowData = [];
        var invalidHeader = excelColumnHeaders;
        invalidHeader.push({ header: "Invalid", key: "Invalid" });
        var fields = []; var worksheetcount = 1;
        for (var i = 0; i < invalidHeader.length; i++) {
            fields.push(invalidHeader[i].header)
            rowData[i + 1] = invalidHeader[i].header;
        }
        var ckInvalidData = false; var validcount = 0;
        var writer = csvWriter({ headers: fields });

        var invaliddatafilename = "import" + (new Date).getTime() + ".xlsx";
        // writer.pipe(fs.createWriteStream(rootPath+'/uploads/csv_download/'+invaliddatafilename, {flags: 'a'}))

        req.file('file').upload({ dirname: rootPath + '/uploads/zip' }, function (err, uploadedFiles) {

            if (err) return res.send(500, err);
            var csvFileName = "";
            let maxqbidquery = "select nextval('qb_id_val') as qb_id";
            sequelize.query(maxqbidquery, { type: sequelize.QueryTypes.SELECT })
                .then(next_qb_id => {
                    var qb_id = next_qb_id[0].qb_id;  // max qb id
                    var entries = []
                    fs.createReadStream(uploadedFiles[0].fd)
                        .pipe(unzip.Parse())
                        .on('entry', function (entry) {
                            var fileName = entry.path;
                            var type = entry.type;
                            entries.push(entry.path)
                            if (type === 'File') {
                                var fullPath = __dirname + '\\output';
                                fileName = path.basename(fileName);
                                mkdir.sync(fullPath);
                                csvFileName = "";

                                var writeStream = fs.createWriteStream(fullPath + '\\' + fileName);
                                writeStream.on('close', function () {
                                    csvFileName = writeStream.path;

                                    //  ===start new code==
                                    if (fileName.search("xlsx") > 0) {
                                        var xlsfilename = fileName.replace(/\.[^/.]+$/, "") + "_";
                                    }

                                    var workbook = new Excel.Workbook();
                                    var workbook1 = new Excel.Workbook();
                                    var newSheet = workbook1.addWorksheet('InvalidData');
                                    newSheet.addRow(rowData).commit();
                                    workbook.xlsx.readFile(fullPath + '\\' + fileName)
                                        .then(function () {

                                            var workbookXLSX = XLSX.readFile(fullPath + '\\' + fileName);
                                            var first_sheet_name = workbookXLSX.SheetNames[0];
                                            var address_of_cell = 'AP1';
                                            var readworksheet = workbookXLSX.Sheets[first_sheet_name];
                                            var desired_cell = readworksheet[address_of_cell];
                                            var desired_value = (desired_cell ? desired_cell.v : undefined);
                                            if (desired_value == undefined || desired_value != 'Flag') {

                                                res.send({
                                                    code: 2,
                                                    message: "success"
                                                });
                                                return false;
                                            }

                                            var array_topic_data_query = "select tm.topic_name, tm.qba_topic_code, mm.module_name, sm.qba_subject_code, cm.qba_course_code " +
                                                "from qba_topic_master tm " +
                                                "left join qba_module_mstr mm on (tm.qba_module_fk=mm.qba_module_pk) " +
                                                "left join qba_subject_master sm on (mm.qba_subject_fk=sm.qba_subject_pk) " +
                                                "left join qba_course_master cm on (cm.qba_course_pk=sm.qba_course_fk) " +
                                                "where tm.is_active = 'Y' and mm.is_active = 'Y' and sm.is_active = 'Y' and cm.is_active = 'Y'"

                                            sequelize.query(array_topic_data_query).then(topic_array => {
                                                var lang_array_query = "select lang_name from qba_lang_mstr where is_active = 'A'"
                                                sequelize.query(lang_array_query).then(lang_array => {
                                                    var pk_query = "select qba_course_pk,qba_subject_pk,qba_module_pk,qba_topic_pk, qba_course_code, qba_subject_code, module_name, qba_topic_code " +
                                                        "from qba_course_master inner join qba_subject_master on (qba_course_fk=qba_course_pk) " +
                                                        "inner join qba_module_mstr on (qba_subject_fk=qba_subject_pk) " +
                                                        "inner join qba_topic_master on (qba_module_fk=qba_module_pk)"
                                                    sequelize.query(pk_query).then(pk_array => {
                                                        Promise.map(workbookXLSX.SheetNames, function (sheetname) {

                                                            var worksheet = workbook.getWorksheet(sheetname);


                                                            worksheet.columns = excelColumnHeaders;

                                                            worksheet.eachRow(function (row, rowNumber) {

                                                                if (rowNumber > 1) {
                                                                    //validation start here by shilpa 19-03-2019
                                                                    let valid_qb_id = row.getCell('QB_ID');
                                                                    let valid_course = row.getCell('Course');
                                                                    let valid_subject = row.getCell('Subject');
                                                                    let valid_module = row.getCell('Module');
                                                                    let valid_topic = row.getCell('Topic');
                                                                    let valid_marks = row.getCell('Marks');
                                                                    let valid_negative_marks = row.getCell('Negative_Marks');
                                                                    let valid_language = row.getCell('Language');
                                                                    let valid_question_type = row.getCell('Question_Type');
                                                                    let valid_parent_qb_id = row.getCell('Parent_QB_ID');
                                                                    let valid_no_of_questions = row.getCell('No_of_Questions');
                                                                    let valid_question_body = row.getCell('Question_Body');
                                                                    let valid_number_of_alternatives = row.getCell('Number_of_Alternatives');
                                                                    let valid_question_image = row.getCell('Question Image');
                                                                    let valid_status = row.getCell('Status (Active / Inactive)');
                                                                    let valid_author = row.getCell('Author_Name');
                                                                    let valid_flag = row.getCell('Flag');
                                                                    let valid_correct_alternative = row.getCell('Correct Alternative');
                                                                    let valid_alternative_text = [];
                                                                    let valid_alternative_image = [];
                                                                    let validflagvalue = ['A', 'M'];


                                                                    let forlooppromise = new Promise((resolve, reject) => {

                                                                        for (var i = 1; i <= row.getCell('Number_of_Alternatives').value; i++) {
                                                                            let altImage = "Alternative " + i + " Image";
                                                                            let option = "Alternative " + i;
                                                                            if (row.getCell(option) != '') {
                                                                                if (typeof row.getCell(option).value === 'object') {
                                                                                    reject(option)
                                                                                }
                                                                                else {
                                                                                    valid_alternative_text.push(row.getCell(option).text);
                                                                                }
                                                                            }
                                                                            else if (row.getCell(altImage) != '') {
                                                                                valid_alternative_image.push(row.getCell(altImage).text);
                                                                            }
                                                                            else {
                                                                                ckInvalidData = true;
                                                                                if (row.getCell(option) == '') {
                                                                                    reject(option);
                                                                                } else if (row.getCell(altImage) == '') {
                                                                                    reject(altImage);
                                                                                }
                                                                            }
                                                                        }

                                                                        if (i == parseInt(row.getCell('Number_of_Alternatives').value) + 1) {
                                                                            resolve('success');
                                                                        }
                                                                    }); // forlooppromise end 

                                                                    let validInvalidPromise = new Promise((resolve, reject) => {
                                                                        let excelPId = parseInt(row.getCell('Parent_QB_ID').value) + parseInt(qb_id);
                                                                        var topic_name = false
                                                                        for (var i = 0; i < topic_array[0].length; i++) {
                                                                            if (topic_array[0][i].qba_topic_code == valid_topic && topic_array[0][i].module_name == valid_module &&
                                                                                topic_array[0][i].qba_subject_code == valid_subject && topic_array[0][i].qba_course_code == valid_course) {
                                                                                topic_name = true
                                                                            }
                                                                        }
                                                                        if (topic_name == false) {
                                                                            validInvalidFlag = 'Invalid';
                                                                            ckInvalidData = true;
                                                                            reject('Course Subject Module Topic Mismatch');
                                                                        }

                                                                        var lang_flag = false
                                                                        lang_array[0].forEach(function (value) {
                                                                            if (value.lang_name == valid_language) {
                                                                                lang_flag = true
                                                                            }
                                                                        });
                                                                        if (lang_flag == false) {
                                                                            validInvalidFlag = 'Invalid';
                                                                            ckInvalidData = true;
                                                                            reject('Language');
                                                                        }

                                                                        if (valid_qb_id == null || valid_qb_id == undefined || valid_qb_id == '' || valid_qb_id == 0) {

                                                                            validInvalidFlag = 'Invalid';
                                                                            ckInvalidData = true;
                                                                            reject('QB_ID');

                                                                        } else if (valid_course == null || valid_course == undefined || valid_course == '' || valid_course == 0) {

                                                                            validInvalidFlag = 'Invalid'; ckInvalidData = true;
                                                                            reject('Course');
                                                                        } else if (valid_subject == null || valid_subject == undefined || valid_subject == '' || valid_subject == 0) {

                                                                            validInvalidFlag = 'Invalid'; ckInvalidData = true;
                                                                            reject('Subject');
                                                                        } else if (valid_module == null || valid_module == undefined || valid_module == '' || valid_module == 0) {

                                                                            validInvalidFlag = 'Invalid'; ckInvalidData = true;
                                                                            reject('Module');
                                                                        } else if (valid_topic == null || valid_topic == undefined || valid_topic == '' || valid_topic == 0) {

                                                                            validInvalidFlag = 'Invalid'; ckInvalidData = true;
                                                                            reject('Topic');
                                                                        } else if (valid_marks == null || valid_marks == undefined || valid_marks == '') {

                                                                            validInvalidFlag = 'Invalid'; ckInvalidData = true;
                                                                            reject('Marks');
                                                                        } else if (valid_negative_marks == null || valid_negative_marks == undefined || valid_negative_marks == '') {

                                                                            validInvalidFlag = 'Invalid'; ckInvalidData = true;
                                                                            reject('Negative_Marks');
                                                                        } else if (valid_language == null || valid_language == undefined || valid_language == '' || valid_language == 0) {

                                                                            validInvalidFlag = 'Invalid'; ckInvalidData = true;
                                                                            reject('Language');
                                                                        } else if (valid_question_type == null || valid_question_type == undefined || valid_question_type == '' || valid_question_type == 0) {

                                                                            validInvalidFlag = 'Invalid'; ckInvalidData = true;
                                                                            reject('Question_Type');
                                                                        } else if (valid_parent_qb_id == null || valid_parent_qb_id == undefined || valid_parent_qb_id == '') {

                                                                            validInvalidFlag = 'Invalid'; ckInvalidData = true;
                                                                            reject('Parent_QB_ID');
                                                                        } else if (valid_no_of_questions == null || valid_no_of_questions == undefined || valid_no_of_questions == '') {

                                                                            validInvalidFlag = 'Invalid'; ckInvalidData = true;
                                                                            reject('No_of_Questions');
                                                                        } else if ((valid_question_body == null || valid_question_body == undefined || valid_question_body == '' || valid_question_body == 0) && (valid_question_image == null || valid_question_image == undefined || valid_question_image == '' || valid_question_image == 0)) {

                                                                            validInvalidFlag = 'Invalid'; ckInvalidData = true;
                                                                            reject('Question_Body');
                                                                        } else if (valid_number_of_alternatives == null || valid_number_of_alternatives == undefined || valid_number_of_alternatives == '') {

                                                                            validInvalidFlag = 'Invalid'; ckInvalidData = true;
                                                                            reject('Number_of_Alternatives');
                                                                        } else if (valid_status == null || valid_status == undefined || valid_status == '' || valid_status == 0) {

                                                                            validInvalidFlag = 'Invalid'; ckInvalidData = true;
                                                                            reject('Status');
                                                                        } else if (valid_author == null || valid_author == undefined || valid_author == '' || valid_author == 0) {

                                                                            validInvalidFlag = 'Invalid'; ckInvalidData = true;
                                                                            reject('Author_Name');
                                                                        } else if (valid_question_type == 'CS' && valid_parent_qb_id == '0' && valid_number_of_alternatives != 0) {

                                                                            validInvalidFlag = 'Invalid'; ckInvalidData = true;
                                                                            reject('Question_Type+Parent_QB_ID+Number_of_Alternatives');
                                                                        } else if ((valid_question_type == 'CS' && valid_parent_qb_id != '0' && valid_number_of_alternatives == 0) || (valid_question_type == 'M' && valid_number_of_alternatives == 0)) {
                                                                            validInvalidFlag = 'Invalid'; ckInvalidData = true;
                                                                            reject('Question_Type+Parent_QB_ID+Number_of_Alternatives');
                                                                        } else if (valid_question_type == 'CS' && valid_parent_qb_id == '0' && valid_no_of_questions == 0) {

                                                                            validInvalidFlag = 'Invalid'; ckInvalidData = true;
                                                                            reject('Question_Type+Parent_QB_ID+Number_of_Questions');
                                                                        } else if (valid_question_type == 'M' && valid_parent_qb_id != '0') {

                                                                            validInvalidFlag = 'Invalid'; ckInvalidData = true;
                                                                            reject('Question_Type+Parent_QB_ID');
                                                                        } else if (valid_question_type == 'M' && valid_no_of_questions != '0') {

                                                                            validInvalidFlag = 'Invalid'; ckInvalidData = true;
                                                                            reject('Question_Type+No_of_Questions');
                                                                        } else if (valid_question_type == 'CS' && valid_parent_qb_id > 0 && valid_no_of_questions != '0') {

                                                                            validInvalidFlag = 'Invalid'; ckInvalidData = true;
                                                                            reject('Question_Type+Parent_QB_ID+No_of_Questions');
                                                                        } else if (valid_question_type == 'CS' && valid_parent_qb_id == '0' && (valid_marks != '0' || valid_negative_marks != '0')) {

                                                                            validInvalidFlag = 'Invalid'; ckInvalidData = true;
                                                                            reject('Question_Type+Parent_QB_ID+Marks+Negative_Marks');
                                                                        } else if (valid_flag == '0' || valid_flag == '' || valid_flag == 'undefined' || validflagvalue.indexOf(row.getCell('Flag').value) == '-1') {

                                                                            validInvalidFlag = 'Invalid'; ckInvalidData = true;
                                                                            reject('Flag');
                                                                        } else if ((valid_correct_alternative == 0 && valid_question_type == 'M') || (valid_question_type == 'CS' && valid_parent_qb_id > 0 && valid_correct_alternative == 0) || valid_correct_alternative == '' || typeof valid_correct_alternative == 'undefined') {
                                                                            validInvalidFlag = 'Invalid';
                                                                            ckInvalidData = true;
                                                                            reject('Correct Alternative');
                                                                        } else if ((valid_marks == '0' || valid_marks == undefined || valid_marks == '') && valid_question_type == 'M') {
                                                                            validInvalidFlag = 'Invalid';
                                                                            ckInvalidData = true;
                                                                            reject('Question_Type+Total Marks');
                                                                        } else if (typeof valid_correct_alternative.value != 'number') {
                                                                            reject('Correct Alternative');

                                                                        } else if (typeof valid_question_body.value === 'object') {
                                                                            reject('Question body')
                                                                        } else {
                                                                            if (valid_language != 'ENGLISH') {
                                                                                var chkotherlang = "select qb_id from qstn_bank where qst_lang = 'ENGLISH' and  qb_id ='" + valid_qb_id + "' and qst_type = '" + valid_question_type + "'";
                                                                                sequelize.query(chkotherlang, { type: sequelize.QueryTypes.SELECT })
                                                                                    .then(result2 => {
                                                                                        if (result2.length == 0) {
                                                                                            validInvalidFlag = 'Invalid';
                                                                                            ckInvalidData = true;
                                                                                            reject('OtherLangQBID');
                                                                                        }
                                                                                        else {
                                                                                            resolve('Valid');
                                                                                        }
                                                                                    })
                                                                            }
                                                                            else {
                                                                                resolve('Valid');
                                                                            }
                                                                        }
                                                                        //});                                               
                                                                    }); // validinvalidpromise end
                                                                    //validataion end here by shilpa 19-03-2019

                                                                    Promise.all([validInvalidPromise, forlooppromise])
                                                                        .then(values => {
                                                                            validcount++;
                                                                            var qid = parseInt(parseInt(row.getCell('QB_ID')) + parseInt(qb_id)) - 1;



                                                                            var arr_images = [];
                                                                            var obj;
                                                                            if (row.getCell('Question Image').value != undefined && row.getCell('Question Image').value != null && row.getCell('Question Image').value != "") {
                                                                                obj = new Object();
                                                                                var data = rootPath + '/server/controllers/output/' + row.getCell('Question Image').text;
                                                                                var dimensions = sizeOf(data);
                                                                                obj.qbi_filename = row.getCell('Question Image').text;
                                                                                obj.qbi_image_name = row.getCell('Question Image').text;
                                                                                obj.qbi_is_active = "Y";
                                                                                obj.audit_by = req.body.userName;
                                                                                obj.audit_dt = new Date();
                                                                                obj.image_width = dimensions.width
                                                                                obj.image_height = dimensions.height
                                                                                arr_images.push(obj);
                                                                            }

                                                                            if (row.getCell('Alternative 1 Image').value != undefined && row.getCell('Alternative 1 Image').value != null && row.getCell('Alternative 1 Image').value != "") {
                                                                                obj = new Object();
                                                                                var data = rootPath + '/server/controllers/output/' + row.getCell('Alternative 1 Image').text;
                                                                                var dimensions = sizeOf(data);
                                                                                obj.image_width = dimensions.width
                                                                                obj.image_height = dimensions.height
                                                                                obj.qbi_filename = row.getCell('Alternative 1 Image').text;
                                                                                obj.qbi_image_name = row.getCell('Alternative 1 Image').text;
                                                                                obj.qbi_is_active = "Y";
                                                                                obj.audit_by = req.body.userName;
                                                                                obj.audit_dt = new Date();
                                                                                arr_images.push(obj);
                                                                            }

                                                                            if (row.getCell('Alternative 2 Image').value != undefined && row.getCell('Alternative 2 Image').value != null && row.getCell('Alternative 2 Image').value != "") {
                                                                                obj = new Object();
                                                                                var data = rootPath + '/server/controllers/output/' + row.getCell('Alternative 2 Image').text;
                                                                                var dimensions = sizeOf(data);
                                                                                obj.image_width = dimensions.width
                                                                                obj.image_height = dimensions.height
                                                                                obj.qbi_filename = row.getCell('Alternative 2 Image').text;
                                                                                obj.qbi_image_name = row.getCell('Alternative 2 Image').text;
                                                                                // obj.qbi_image  = parseInt('10101010', 2);
                                                                                obj.qbi_is_active = "Y";
                                                                                obj.audit_by = req.body.userName;
                                                                                obj.audit_dt = new Date();
                                                                                arr_images.push(obj);

                                                                            }

                                                                            if (row.getCell('Alternative 3 Image').value != undefined && row.getCell('Alternative 3 Image').value != null && row.getCell('Alternative 3 Image').value != "") {
                                                                                obj = new Object();
                                                                                var data = rootPath + '/server/controllers/output/' + row.getCell('Alternative 3 Image').text;
                                                                                var dimensions = sizeOf(data);
                                                                                obj.image_width = dimensions.width
                                                                                obj.image_height = dimensions.height
                                                                                obj.qbi_filename = row.getCell('Alternative 3 Image').text;
                                                                                obj.qbi_image_name = row.getCell('Alternative 3 Image').text;
                                                                                //    obj.qbi_image  = parseInt('10101010', 2);
                                                                                obj.qbi_is_active = "Y";
                                                                                obj.audit_by = req.body.userName;
                                                                                obj.audit_dt = new Date();
                                                                                arr_images.push(obj);

                                                                            }

                                                                            if (row.getCell('Alternative 4 Image').value != undefined && row.getCell('Alternative 4 Image').value != null && row.getCell('Alternative 4 Image').value != "") {
                                                                                obj = new Object();
                                                                                var data = rootPath + '/server/controllers/output/' + row.getCell('Alternative 4 Image').text;
                                                                                var dimensions = sizeOf(data);
                                                                                obj.image_width = dimensions.width
                                                                                obj.image_height = dimensions.height
                                                                                obj.qbi_filename = row.getCell('Alternative 4 Image').text;
                                                                                obj.qbi_image_name = row.getCell('Alternative 4 Image').text;
                                                                                //   obj.qbi_image  = parseInt('10101010', 2);
                                                                                obj.qbi_is_active = "Y";
                                                                                obj.audit_by = req.body.userName;
                                                                                obj.audit_dt = new Date();
                                                                                arr_images.push(obj);

                                                                            }

                                                                            if (row.getCell('Alternative 5 Image').value != undefined && row.getCell('Alternative 5 Image').value != null && row.getCell('Alternative 5 Image').value != "") {
                                                                                obj = new Object();
                                                                                obj.qbi_filename = row.getCell('Alternative 5 Image').text;
                                                                                obj.qbi_image_name = row.getCell('Alternative 5 Image').text;
                                                                                //   obj.qbi_image  = parseInt('10101010', 2);
                                                                                obj.qbi_is_active = "Y";
                                                                                obj.audit_by = req.body.userName;
                                                                                obj.audit_dt = new Date();
                                                                                arr_images.push(obj);

                                                                            }

                                                                            if (row.getCell('Alternative 6 Image').value != undefined && row.getCell('Alternative 6 Image').value != null && row.getCell('Alternative 6 Image').value != "") {
                                                                                obj = new Object();
                                                                                obj.qbi_filename = row.getCell('Alternative 6 Image').text;
                                                                                obj.qbi_image_name = row.getCell('Alternative 6 Image').text;
                                                                                //   obj.qbi_image  = parseInt('10101010', 2);
                                                                                obj.qbi_is_active = "Y";
                                                                                obj.audit_by = req.body.userName;
                                                                                obj.audit_dt = new Date();
                                                                                arr_images.push(obj);

                                                                            }

                                                                            if (row.getCell('Alternative 7 Image').value != undefined && row.getCell('Alternative 7 Image').value != null && row.getCell('Alternative 7 Image').value != "") {
                                                                                obj = new Object();
                                                                                obj.qbi_filename = row.getCell('Alternative 7 Image').text;
                                                                                obj.qbi_image_name = row.getCell('Alternative 7 Image').text;
                                                                                //   obj.qbi_image  = parseInt('10101010', 2);
                                                                                obj.qbi_is_active = "Y";
                                                                                obj.audit_by = req.body.userName;
                                                                                obj.audit_dt = new Date();
                                                                                arr_images.push(obj);

                                                                            }

                                                                            if (row.getCell('Alternative 8 Image').value != undefined && row.getCell('Alternative 8 Image').value != null && row.getCell('Alternative 8 Image').value != "") {
                                                                                obj = new Object();
                                                                                obj.qbi_filename = row.getCell('Alternative 8 Image').text;
                                                                                obj.qbi_image_name = row.getCell('Alternative 8 Image').text;
                                                                                //   obj.qbi_image  = parseInt('10101010', 2);
                                                                                obj.qbi_is_active = "Y";
                                                                                obj.audit_by = req.body.userName;
                                                                                obj.audit_dt = new Date();
                                                                                arr_images.push(obj);

                                                                            }

                                                                            if (row.getCell('Alternative 9 Image').value != undefined && row.getCell('Alternative 9 Image').value != null && row.getCell('Alternative 9 Image').value != "") {
                                                                                obj = new Object();
                                                                                obj.qbi_filename = row.getCell('Alternative 9 Image').text;
                                                                                obj.qbi_image_name = row.getCell('Alternative 9 Image').text;
                                                                                //   obj.qbi_image  = parseInt('10101010', 2);
                                                                                obj.qbi_is_active = "Y";
                                                                                obj.audit_by = req.body.userName;
                                                                                obj.audit_dt = new Date();
                                                                                arr_images.push(obj);

                                                                            }


                                                                            var hashmap_pri_keys = {};
                                                                            if (arr_images != null && arr_images.length > 0) {

                                                                                return qbank_images.bulkCreate(arr_images, { returning: true })
                                                                                    .then(images => {

                                                                                        for (var i = 0; i < images.length; i++) {

                                                                                            hashmap_pri_keys[images[i].qbi_image_name] = images[i].qbi_pk;
                                                                                        }
                                                                                        return importMethods.saveQuestionFromFile(row, hashmap_pri_keys, req.body.userName, qid, qb_id, xlsfilename, pk_array[0]);
                                                                                    });
                                                                            } else {
                                                                                return importMethods.saveQuestionFromFile(row, hashmap_pri_keys, req.body.userName, qid, qb_id, xlsfilename, pk_array[0]);
                                                                            }
                                                                        })
                                                                        .catch(function (fail) {
                                                                            worksheetcount++;

                                                                            var message = ''
                                                                            if (typeof fail.message === 'undefined') {
                                                                                message = fail
                                                                            }
                                                                            else {
                                                                                message = fail.message
                                                                            }
                                                                            catch_set = true
                                                                            let result = [
                                                                                valid_qb_id.value,
                                                                                valid_course.value,
                                                                                valid_subject.value,
                                                                                valid_module.value,
                                                                                valid_topic.value,
                                                                                valid_marks.value,
                                                                                valid_negative_marks.value,
                                                                                valid_language.value,
                                                                                valid_question_type.value,
                                                                                valid_parent_qb_id.value,
                                                                                valid_no_of_questions.value,
                                                                                valid_question_body.value,
                                                                                valid_number_of_alternatives.value,
                                                                                row.getCell('Alternative 1').value,
                                                                                row.getCell('Alternative 2').value,
                                                                                row.getCell('Alternative 3').value,
                                                                                row.getCell('Alternative 4').value,
                                                                                row.getCell('Alternative 5').value,
                                                                                row.getCell('Alternative 6').value,
                                                                                row.getCell('Alternative 7').value,
                                                                                row.getCell('Alternative 8').value,
                                                                                row.getCell('Alternative 9').value,
                                                                                row.getCell('Correct Alternative').value,
                                                                                row.getCell('Remarks').value,
                                                                                row.getCell('Remarks Image').value,
                                                                                row.getCell('Reference').value,
                                                                                row.getCell('Reference Image').value,
                                                                                row.getCell('Calculation').value,
                                                                                row.getCell('Calculation Image').value,
                                                                                valid_question_image.value,
                                                                                row.getCell('Alternative 1 Image').value,
                                                                                row.getCell('Alternative 2 Image').value,
                                                                                row.getCell('Alternative 3 Image').value,
                                                                                row.getCell('Alternative 4 Image').value,
                                                                                row.getCell('Alternative 5 Image').value,
                                                                                row.getCell('Alternative 6 Image').value,
                                                                                row.getCell('Alternative 7 Image').value,
                                                                                row.getCell('Alternative 8 Image').value,
                                                                                row.getCell('Alternative 9 Image').value,
                                                                                valid_status.value,
                                                                                valid_author.value,
                                                                                valid_flag.value,
                                                                                message
                                                                            ]
                                                                            let csvdata = [];
                                                                            for (var i = 0; i < result.length; i++) {
                                                                                rowData[i + 1] = result[i];

                                                                            }
                                                                            if (i == result.length) {
                                                                                newSheet.addRow(rowData).commit();
                                                                                workbook1.xlsx.writeFile(rootPath + '/uploads/csv_download/' + invaliddatafilename)
                                                                                    .then(function () {

                                                                                        //  if (worksheet.actualRowCount == worksheetcount) {

                                                                                        flag = true;

                                                                                        //   }
                                                                                        if (flag) {
                                                                                            //res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
                                                                                            res.send({
                                                                                                code: 0,
                                                                                                message: "success",
                                                                                                validcount: validcount,
                                                                                                obj: "/uploads/csv_download/" + invaliddatafilename
                                                                                            });
                                                                                        }
                                                                                    });


                                                                            }
                                                                        }).then(function () {
                                                                            if (typeof catch_set !== 'undefined') { return }
                                                                            worksheetcount++;

                                                                            if (worksheet.actualRowCount == worksheetcount) {
                                                                                flag = true;

                                                                            }
                                                                            if (flag) {
                                                                                res.send({
                                                                                    code: 1,
                                                                                    message: "success",
                                                                                    validcount: validcount

                                                                                });
                                                                            }
                                                                        });
                                                                }

                                                            }); // worksheet each row end   

                                                        }); // promise.map sheetsname end
                                                    })
                                                })
                                            })
                                        });//worksheet end

                                })
                                entry.pipe(writeStream);
                            } else {
                                entry.autodrain();
                            }
                            var get_val_query = "select max(qb_id) as qb_id from qstn_bank"
                            sequelize.query(get_val_query, { type: sequelize.QueryTypes.SELECT })
                                .then((next_val) => {
                                    var set_val_query = "select setval('qb_id_val'," + next_val[0].qb_id + ")"
                                    sequelize.query(set_val_query, { type: sequelize.QueryTypes.SELECT })
                                })
                        }).on('close', function () {
                            var flag = false
                            for (var i = 0; i < entries.length; i++) {
                                if (entries[i].search("xlsx") > 0) {
                                    flag = true
                                }
                            }
                            if (flag == false) {
                                res.send({
                                    code: 3,
                                    message: "success"
                                });
                            }
                        });
                });
        });
    },

    updateQstPid: function (req, res) {
        importMethods.checkValidUser(req, res);

        let query = "select qb_id,sr_no from qstn_bank where qst_pid=0 and sr_no in (select qst_pid from qstn_bank where qst_pid!=0 and qst_lang='ENGLISH')";

        sequelize.query(query, { type: sequelize.QueryTypes.SELECT }).then(result => {
            for (var i = 0; i < result.length; i++) {
                let query1 = "update qstn_bank set qst_pid = " + result[i].qb_id + " where qst_pid = " + result[i].sr_no + " and sr_no != '0'";
                let query2 = "update qstn_bank set sr_no='0' where (qst_pid =" + result[i].qb_id + " or qb_id = " + result[i].qb_id + ") and sr_no !=0";
                sequelize.query(query1, { type: sequelize.QueryTypes.UPDATE }).then(parentQues => {
                    sequelize.query(query2, { type: sequelize.QueryTypes.UPDATE })
                });
            }

            let query3 = "update qstn_bank set sr_no='0' where qst_type='M'";
            sequelize.query(query3, { type: sequelize.QueryTypes.UPDATE })
        });

        res.send({
            code: 0,
            message: "success"

        });

    },

    // added by shilpa
    updateImportPaperAdminDoc: function (req, res) {
        var excelColumnHeaders = [ //added by Barnali
            { header: "QB_ID", key: "QB_ID" },
            { header: "Course", key: "Course" },
            { header: "Subject", key: "Subject" },
            { header: "Module", key: "Module" },
            { header: "Topic", key: "Topic" },
            { header: "Marks", key: "Marks" },
            { header: "Negative_Marks", key: "Negative_Marks" },
            { header: "Language", key: "Language" },
            { header: "Question_Type", key: "Question_Type" },
            { header: "Parent_QB_ID", key: "Parent_QB_ID" },
            { header: "No_of_Questions", key: "No_of_Questions" },
            { header: "Question_Body", key: "Question_Body" },
            { header: "Number_of_Alternatives", key: "Number_of_Alternatives" },
            { header: "Alternative 1", key: "Alternative 1" },
            { header: "Alternative 2", key: "Alternative 2" },
            { header: "Alternative 3", key: "Alternative 3" },
            { header: "Alternative 4", key: "Alternative 4" },
            { header: "Alternative 5", key: "Alternative 5" },
            { header: "Alternative 6", key: "Alternative 6" },
            { header: "Alternative 7", key: "Alternative 7" },
            { header: "Alternative 8", key: "Alternative 8" },
            { header: "Alternative 9", key: "Alternative 9" },
            { header: "Correct Alternative", key: "Correct Alternative" },
            { header: "Remarks", key: "Remarks" },
            { header: "Remarks Image", key: "Remarks Image" },
            { header: "Reference", key: "Reference" },
            { header: "Reference Image", key: "Reference Image" },
            { header: "Calculation", key: "Calculation" },
            { header: "Calculation Image", key: "Calculation Image" },
            { header: "Question Image", key: "Question Image" },
            { header: "Alternative 1 Image", key: "Alternative 1 Image" },
            { header: "Alternative 2 Image", key: "Alternative 2 Image" },
            { header: "Alternative 3 Image", key: "Alternative 3 Image" },
            { header: "Alternative 4 Image", key: "Alternative 4 Image" },
            { header: "Alternative 5 Image", key: "Alternative 5 Image" },
            { header: "Alternative 6 Image", key: "Alternative 6 Image" },
            { header: "Alternative 7 Image", key: "Alternative 7 Image" },
            { header: "Alternative 8 Image", key: "Alternative 8 Image" },
            { header: "Alternative 9 Image", key: "Alternative 9 Image" },
            { header: "Status (Active / Inactive)", key: "Status (Active / Inactive)" },
            { header: "Author_Name", key: "Author_Name" }
        ];

        let userName = req.body.userName;
        let exam_fk = req.body.exam_fk;
        let examPaper_fk = req.body.exampaper_fk;
        let language = req.body.language;
        req.file('file').upload({
            dirname: rootPath + '/uploads/zip'
        }, function (err, uploadedFiles) {
            if (err) return res.send(500, err);
            var csvFileName = "";
            fs.createReadStream(uploadedFiles[0].fd)
                .pipe(unzip.Parse())
                .on('entry', function (entry) {
                    var fileName = entry.path
                    var type = entry.type
                    if (type === 'File') {
                        var fullPath = __dirname + '/output/';
                        fileName = path.basename(fileName);
                        mkdir.sync(fullPath);
                        csvFileName = "";
                        var writeStream = fs.createWriteStream(fullPath + '/' + fileName);
                        writeStream.on('close', function () {
                            csvFileName = writeStream.path;
                            var workbook = new Excel.Workbook();
                            workbook.xlsx.readFile(fullPath + '\\' + fileName)
                                .then(function () {

                                    var workbookXLSX = XLSX.readFile(fullPath + '\\' + fileName);

                                    Promise.map(workbookXLSX.SheetNames, function (sheetname) {

                                        var worksheet = workbook.getWorksheet(sheetname);
                                        worksheet.columns = excelColumnHeaders;
                                        worksheet.eachRow(function (row, rowNumber) {
                                            if (rowNumber > 1) {

                                                var arr_images = [];
                                                var obj;

                                                if (row.getCell('Question Image').value != undefined && row.getCell('Question Image').value != null && row.getCell('Question Image').value != "") {
                                                    obj = new Object();
                                                    obj.qbi_filename = row.getCell('Question Image').value;
                                                    obj.qbi_image_name = row.getCell('Question Image').value;
                                                    //   obj.qbi_image  = parseInt('10101010', 2);
                                                    obj.qbi_is_active = "Y";
                                                    obj.audit_by = req.body.userName;
                                                    obj.audit_dt = new Date();
                                                    arr_images.push(obj);
                                                }

                                                if (row.getCell('Alternative 1 Image').value != undefined && row.getCell('Alternative 1 Image').value != null && row.getCell('Alternative 1 Image').value != "") {
                                                    obj = new Object();
                                                    obj.qbi_filename = row.getCell('Alternative 1 Image').value;
                                                    obj.qbi_image_name = row.getCell('Alternative 1 Image').value;
                                                    //  obj.qbi_image  = parseInt('10101010', 2);
                                                    obj.qbi_is_active = "Y";
                                                    obj.audit_by = req.body.userName;
                                                    obj.audit_dt = new Date();
                                                    arr_images.push(obj);
                                                }

                                                if (row.getCell('Alternative 2 Image').value != undefined && row.getCell('Alternative 2 Image').value != null && row.getCell('Alternative 2 Image').value != "") {
                                                    obj = new Object();
                                                    obj.qbi_filename = row.getCell('Alternative 2 Image').value;
                                                    obj.qbi_image_name = row.getCell('Alternative 2 Image').value;
                                                    // obj.qbi_image  = parseInt('10101010', 2);
                                                    obj.qbi_is_active = "Y";
                                                    obj.audit_by = req.body.userName;
                                                    obj.audit_dt = new Date();
                                                    arr_images.push(obj);

                                                }

                                                if (row.getCell('Alternative 3 Image').value != undefined && row.getCell('Alternative 3 Image').value != null && row.getCell('Alternative 3 Image').value != "") {
                                                    obj = new Object();
                                                    obj.qbi_filename = row.getCell('Alternative 3 Image').value;
                                                    obj.qbi_image_name = row.getCell('Alternative 3 Image').value;
                                                    //    obj.qbi_image  = parseInt('10101010', 2);
                                                    obj.qbi_is_active = "Y";
                                                    obj.audit_by = req.body.userName;
                                                    obj.audit_dt = new Date();
                                                    arr_images.push(obj);

                                                }

                                                if (row.getCell('Alternative 4 Image').value != undefined && row.getCell('Alternative 4 Image').value != null && row.getCell('Alternative 4 Image').value != "") {
                                                    obj = new Object();
                                                    obj.qbi_filename = row.getCell('Alternative 4 Image').value;
                                                    obj.qbi_image_name = row.getCell('Alternative 4 Image').value;
                                                    //   obj.qbi_image  = parseInt('10101010', 2);
                                                    obj.qbi_is_active = "Y";
                                                    obj.audit_by = req.body.userName;
                                                    obj.audit_dt = new Date();
                                                    arr_images.push(obj);

                                                }
                                                if (row.getCell('Alternative 5 Image').value != undefined && row.getCell('Alternative 5 Image').value != null && row.getCell('Alternative 5 Image').value != "") {
                                                    obj = new Object();
                                                    obj.qbi_filename = row.getCell('Alternative 5 Image').value;
                                                    obj.qbi_image_name = row.getCell('Alternative 5 Image').value;
                                                    //   obj.qbi_image  = parseInt('10101010', 2);
                                                    obj.qbi_is_active = "Y";
                                                    obj.audit_by = req.body.userName;
                                                    obj.audit_dt = new Date();
                                                    arr_images.push(obj);

                                                }
                                                if (row.getCell('Alternative 6 Image').value != undefined && row.getCell('Alternative 6 Image').value != null && row.getCell('Alternative 6 Image').value != "") {
                                                    obj = new Object();
                                                    obj.qbi_filename = row.getCell('Alternative 6 Image').value;
                                                    obj.qbi_image_name = row.getCell('Alternative 6 Image').value;
                                                    //   obj.qbi_image  = parseInt('10101010', 2);
                                                    obj.qbi_is_active = "Y";
                                                    obj.audit_by = req.body.userName;
                                                    obj.audit_dt = new Date();
                                                    arr_images.push(obj);

                                                }
                                                if (row.getCell('Alternative 7 Image').value != undefined && row.getCell('Alternative 7 Image').value != null && row.getCell('Alternative 7 Image').value != "") {
                                                    obj = new Object();
                                                    obj.qbi_filename = row.getCell('Alternative 7 Image').value;
                                                    obj.qbi_image_name = row.getCell('Alternative 7 Image').value;
                                                    //   obj.qbi_image  = parseInt('10101010', 2);
                                                    obj.qbi_is_active = "Y";
                                                    obj.audit_by = req.body.userName;
                                                    obj.audit_dt = new Date();
                                                    arr_images.push(obj);

                                                }
                                                if (row.getCell('Alternative 8 Image').value != undefined && row.getCell('Alternative 8 Image').value != null && row.getCell('Alternative 8 Image').value != "") {
                                                    obj = new Object();
                                                    obj.qbi_filename = row.getCell('Alternative 8 Image').value;
                                                    obj.qbi_image_name = row.getCell('Alternative 8 Image').value;
                                                    //   obj.qbi_image  = parseInt('10101010', 2);
                                                    obj.qbi_is_active = "Y";
                                                    obj.audit_by = req.body.userName;
                                                    obj.audit_dt = new Date();
                                                    arr_images.push(obj);

                                                }
                                                if (row.getCell('Alternative 9 Image').value != undefined && row.getCell('Alternative 9 Image').value != null && row.getCell('Alternative 9 Image').value != "") {
                                                    obj = new Object();
                                                    obj.qbi_filename = row.getCell('Alternative 9 Image').value;
                                                    obj.qbi_image_name = row.getCell('Alternative 9 Image').value;
                                                    //   obj.qbi_image  = parseInt('10101010', 2);
                                                    obj.qbi_is_active = "Y";
                                                    obj.audit_by = req.body.userName;
                                                    obj.audit_dt = new Date();
                                                    arr_images.push(obj);

                                                }
                                                var hashmap_pri_keys = {};

                                                if (arr_images != null && arr_images.length > 0) {
                                                    qbank_images.bulkCreate(arr_images, { returning: true })
                                                        .then(images => {


                                                            for (var i = 0; i < images.length; i++) {
                                                                hashmap_pri_keys[images[i].qbi_image_name] = images[i].qbi_pk;
                                                            }

                                                            importMethods.savePaperAdminQuestionFromFile(row, hashmap_pri_keys, req.body.userName, req.body.exam_fk, req.body.exampaper_fk);

                                                        });
                                                } else {


                                                    importMethods.savePaperAdminQuestionFromFile(row, hashmap_pri_keys, req.body.userName, req.body.exam_fk, req.body.exampaper_fk);
                                                }
                                            }
                                        })
                                    }).then(function () {

                                        res.send({
                                            code: 1,
                                            message: "success",

                                        });

                                    });
                                    //  });parsing
                                });//xlsx read file from workbook

                        });
                        entry.pipe(writeStream);
                    } else {
                        entry.autodrain();
                    }

                });

        });

    },

    importPaperAdminDoc: function (req, res) {
        importMethods.checkValidUser(req, res);
        let language = req.body.language;  // added by shilpa

        if (language != 'ENGLISH')  // added by shilpa
        {
            importMethods.updateImportPaperAdminDoc(req, res);  // added by shilpa
            return false;
        }
        req.file('file').upload({
            dirname: 'D:/QBAuthoringApp/uploads/xlsx/original'
        }, function (err, uploadedFiles) {

            if (err) return res.send(500, err);

            var csvFileName = "";
            fs.createReadStream(uploadedFiles[0].fd)
                .pipe(unzip.Parse())
                .on('entry', function (entry) {

                    var fileName = entry.path
                    var type = entry.type

                    if (type === 'File') {

                        var fullPath = __dirname + '/output/';//+ path.dirname( fileName );
                        fileName = path.basename(fileName);

                        mkdir.sync(fullPath);
                        csvFileName = "";
                        var writeStream = fs.createWriteStream(fullPath + '/' + fileName);
                        writeStream.on('close', function () {

                            csvFileName = writeStream.path;
                            if (csvFileName.search('.csv') == -1) {
                                return;
                            }

                            fs.readFile(csvFileName, function (err, data) {

                                parse(data, { columns: true, trim: false }, function (err, rows) {


                                    Promise.map(rows, function (r) {
                                        // Promise.map awaits for returned promises as well.


                                        var arr_images = [];
                                        var obj;

                                        if (r['Question Image'] != "") {
                                            obj = new Object();
                                            obj.qbi_filename = r['Question Image'];
                                            obj.qbi_image_name = r['Question Image'];
                                            obj.qbi_is_active = "Y";
                                            obj.audit_by = req.body.userName;
                                            obj.audit_dt = new Date();
                                            arr_images.push(obj);
                                        }

                                        if (r['Alternative 1 Image'] != "") {
                                            obj = new Object();
                                            obj.qbi_filename = r['Alternative 1 Image'];
                                            obj.qbi_image_name = r['Alternative 1 Image'];
                                            //  obj.qbi_image  = parseInt('10101010', 2);
                                            obj.qbi_is_active = "Y";
                                            obj.audit_by = req.body.userName;
                                            obj.audit_dt = new Date();
                                            arr_images.push(obj);
                                        }

                                        if (r['Alternative 2 Image'] != "") {
                                            obj = new Object();
                                            obj.qbi_filename = r['Alternative 2 Image'];
                                            obj.qbi_image_name = r['Alternative 2 Image'];
                                            // obj.qbi_image  = parseInt('10101010', 2);
                                            obj.qbi_is_active = "Y";
                                            obj.audit_by = req.body.userName;
                                            obj.audit_dt = new Date();
                                            arr_images.push(obj);

                                        }

                                        if (r['Alternative 3 Image'] != "") {
                                            obj = new Object();
                                            obj.qbi_filename = r['Alternative 3 Image'];
                                            obj.qbi_image_name = r['Alternative 3 Image'];
                                            //    obj.qbi_image  = parseInt('10101010', 2);
                                            obj.qbi_is_active = "Y";
                                            obj.audit_by = req.body.userName;
                                            obj.audit_dt = new Date();
                                            arr_images.push(obj);

                                        }

                                        if (r['Alternative 4 Image'] != "") {
                                            obj = new Object();
                                            obj.qbi_filename = r['Alternative 4 Image'];
                                            obj.qbi_image_name = r['Alternative 4 Image'];
                                            //   obj.qbi_image  = parseInt('10101010', 2);
                                            obj.qbi_is_active = "Y";
                                            obj.audit_by = req.body.userName;
                                            obj.audit_dt = new Date();
                                            arr_images.push(obj);

                                        }

                                        var hashmap_pri_keys = {};

                                        if (arr_images != null && arr_images.length > 0) {
                                            qbank_images.bulkCreate(arr_images, { returning: true })
                                                .then(images => {


                                                    for (var i = 0; i < images.length; i++) {
                                                        hashmap_pri_keys[images[i].qbi_image_name] = images[i].qbi_pk;
                                                    }

                                                    importMethods.savePaperAdminQuestionFromFile(r, hashmap_pri_keys, req.body.userName, req.body.exam_fk, req.body.exampaper_fk);

                                                });
                                        } else {


                                            importMethods.savePaperAdminQuestionFromFile(r, hashmap_pri_keys, req.body.userName, req.body.exam_fk, req.body.exampaper_fk);
                                        }
                                        ///query to insert question bank


                                        //end of insert query for question bank

                                    }).then(function () {

                                        res.send({
                                            code: 1,
                                            message: "success",

                                        })

                                    });
                                });
                            });
                            ////////////////
                        });

                        entry.pipe(writeStream);

                    } else {
                        entry.autodrain();
                    }

                })


        });
    },

    otherLangExportDocument: function (req, res) {
        let params = req.body;
        let filepath = rootPath + '/public/images/products/image/';
        let filepath1 = rootPath + '/server/controllers/output/';
        let examstatus = req.body.examstatus;
        let language = req.body.language;
        let EnglishLanguage = 'ENGLISH';
        let examFk = req.body.exam_fk;
        let examPaper_fk = req.body.examPaper;
        var userName = req.body.userName;
        //admin_status = \'A\';
        if (examstatus == 'A') {
            var statuscondition = '  cb.admin_status = \'A\' and ';
            var culledstatuscondition = '  admin_status = \'A\' and ';
        } else {
            var statuscondition = '';
            var culledstatuscondition = '';
        }


        var query = 'select * from culled_qstn_bank where ' + culledstatuscondition + ' qb_id in (select distinct cb.qb_id from culled_qstn_bank cb where ' + statuscondition + ' cb.exam_fk = ' + parseInt(examFk) + ' and  cb.exampaper_fk = ' + parseInt(examPaper_fk) + ' and cb.qst_lang = \'' + EnglishLanguage + '\' and cb.pub_status = \'A\' and cb.qb_id not in (select qb_id from culled_qstn_bank where qst_lang = \'' + language + '\' and exam_fk = ' + parseInt(examFk) + ' and  exampaper_fk = ' + parseInt(examPaper_fk) + ' and pub_status = \'A\') order by cb.qb_id) and exam_fk = ' + parseInt(examFk) + ' and  exampaper_fk = ' + parseInt(examPaper_fk) + ' and qst_lang = \'' + EnglishLanguage + '\'';
        sequelize.query(query, { type: sequelize.QueryTypes.SELECT })
            .then(result => {
                var i = 0;
                for (var i = 0; i < result.length; i++) {

                    var culled_qb_pk = result[i].culled_qb_pk;
                    var qb_id = result[i].qb_id;

                    qstn_bank.create({
                        qst_type: result[i].qst_type,
                        qst_lang: language,
                        qst_pid: result[i].qst_pid,
                        no_of_question: result[i].no_of_question,
                        qst_sub_seq_no: result[i].qst_sub_seq_no,
                        qst_body: '',
                        qst_marks: result[i].qst_marks,
                        qst_neg_marks: result[i].qst_neg_marks,
                        qst_expiry_dt: new Date(),
                        qst_no_of_altr: result[i].qst_no_of_altr,
                        qst_img_fk: result[i].qst_img_fk,
                        qst_remarks: result[i].qst_remarks != 0 ? result[i].qst_remarks : null,
                        qst_fk_tpc_pk: '0',
                        qst_dimension: 'Dimension',
                        qst_is_active: result[i].qst_is_active,
                        qst_audit_by: userName,
                        author_name: userName,
                        qst_audit_dt: new Date(),
                        qb_assigned_to: '0',
                        qb_status_fk: '0',
                        qba_topic_fk: result[i].qba_topic_fk,
                        qba_subject_fk: result[i].qba_subject_fk,
                        qba_course_fk: result[i].qba_course_fk,
                        reference_info: result[i].reference_info != 0 ? result[i].reference_info : null,
                        calculation_info: result[i].calculation_info != 0 ? result[i].calculation_info : null,
                        qb_id: result[i].qb_id,
                        qba_module_fk: result[i].qba_module_fk
                    }).then(question => {
                        culled_qstn_bank.create({
                            qst_lang: language,
                            qst_sub_seq_no: '0',
                            qst_body: '',
                            qst_marks: question.qst_marks,
                            qst_expiry_dt: new Date(),
                            qst_img_fk: null,
                            qst_fk_tpc_pk: '0',
                            qst_is_active: 'A',
                            qst_audit_dt: new Date(),
                            qb_assigned_to: '0',
                            qb_status_fk: '0',
                            qba_topic_fk: question.qba_topic_fk,
                            qba_subject_fk: question.qba_subject_fk,
                            qba_course_fk: question.qba_course_fk,
                            qst_type: question.qst_type,
                            qba_module_fk: question.qba_module_fk,
                            qst_no_of_altr: question.qst_no_of_altr,
                            no_of_question: question.no_of_question,
                            qst_pid: question.qst_pid,
                            qst_audit_by: userName,
                            author_name: userName,
                            qst_dimension: 'Dimension',
                            qst_neg_marks: question.qst_neg_marks,
                            qb_id: question.qb_id,
                            copied_from_repository: 'Y',
                            exam_fk: examFk,
                            exampaper_fk: examPaper_fk,
                            qst_request_remarks: null,
                            qst_request_status: null,
                            pub_status: 'A',
                            qb_pk: question.qb_pk
                        }).then(response => {

                            var copy_qstn_alternative_query = "insert into qstn_alternatives(qta_qst_id,qta_id,qta_order,qta_is_corr_alt,qta_is_active,qta_audit_by,qta_audit_dt) select " + question.qb_pk + ",qta_id,qta_order,qta_is_corr_alt,qta_is_active,'" + userName + "',now() from culled_qstn_alternatives where qta_id = " + question.qb_id + " and exam_fk = " + parseInt(examFk) + " and  exampaper_fk = " + parseInt(examPaper_fk) + " ";
                            sequelize.query(copy_qstn_alternative_query).then(data => {
                                var copy_culled_qstn_alternative_query = "insert into culled_qstn_alternatives(qta_qst_id,qta_id,qta_order,qta_is_corr_alt,qta_is_active,qta_audit_by,qta_audit_dt, exam_fk,exampaper_fk) select " + question.qb_pk + ",qta_id,qta_order,qta_is_corr_alt,qta_is_active,'" + userName + "',now(),exam_fk,exampaper_fk from culled_qstn_alternatives where qta_id = " + question.qb_id + " and exam_fk = " + parseInt(examFk) + " and  exampaper_fk = " + parseInt(examPaper_fk) + " ";

                                sequelize.query(copy_culled_qstn_alternative_query).then(data2 => {
                                });
                            });
                        });
                    });
                }
                if (i == result.length) {
                    var q = 'select * from culled_qstn_bank where ' + culledstatuscondition + ' qb_id in (select distinct cb.qb_id from culled_qstn_bank cb where ' + statuscondition + ' cb.exam_fk = ' + parseInt(examFk) + ' and  cb.exampaper_fk = ' + parseInt(examPaper_fk) + ' and cb.qst_lang = \'' + EnglishLanguage + '\' and cb.pub_status = \'A\' and cb.qb_id not in (select qb_id from culled_qstn_bank where qst_lang = \'' + language + '\' and exam_fk = ' + parseInt(examFk) + ' and  exampaper_fk = ' + parseInt(examPaper_fk) + ' and pub_status = \'A\') order by cb.qb_id) and exam_fk = ' + parseInt(examFk) + ' and  exampaper_fk = ' + parseInt(examPaper_fk) + ' and qst_lang = \'' + EnglishLanguage + '\'';
                    sequelize.query(q, { type: sequelize.QueryTypes.SELECT })
                        .then(result1 => {
                            if (result1.length == 0) {
                                importMethods.otherLangExportBlankDocument(req, res);
                            }
                            else {
                                res.send({
                                    code: 2,
                                    message: "wait",
                                });
                            }
                        })
                }

            });
    },

    otherLangExportBlankDocument(req, res) {
        let params = req.body;
        let filepath = rootPath + '/public/images/products/image/';
        let filepath1 = rootPath + '/server/controllers/output/';
        let examstatus = req.body.examstatus;
        let EnglishLanguage = 'ENGLISH';
        let examFk = req.body.examstatus;
        let language = req.body.lang_fk;
        let examPaper_fk = req.body.examPaper;
        var userName = req.body.userName;
        if (examstatus == 'A') {
            var culledstatuscondition = ' admin_status = \'A\' and ';
        } else {
            var culledstatuscondition = '';
        }

        var expQuery = 'select qb_id as QB_ID, qba_course_code as Course, qba_subject_code as Subject, module_name as Module, qba_topic_code as Topic, ' +
            ' qst_marks as Marks, qst_neg_marks as Negative_Marks, qst_lang as Language, qst_type as Question_type,' +
            'qst_pid as Parent_QB_ID, ' +
            ' qst_sub_seq_no as No_of_Questions, qst_body as Question_Body, qst_body "Question Image", ' +
            'max(case when  a1.qta_order=1 then a1.qta_alt_desc end) "Alternative1Image",' +
            ' max(case when a1.qta_order=2 then a1.qta_alt_desc end) "Alternative2Image",' +
            ' max(case when a1.qta_order=3 then a1.qta_alt_desc end) "Alternative3Image",' +
            ' max(case when a1.qta_order=4 then a1.qta_alt_desc end) "Alternative4Image",' +
            'qst_no_of_altr as Number_of_Alternatives,culled_qstn_alternatives.qta_alt_desc as Alternative, ' +
            ' qta_is_corr_alt as corr_alt, qst_remarks as Remarks, reference_info as Reference, calculation_info as Calculation, qst_is_active as Status, ' +
            ' author_name as Author_Name from culled_qstn_bank ' +
            ' inner join qba_course_master on culled_qstn_bank.qba_course_fk = qba_course_master.qba_course_pk ' +
            ' left join culled_qstn_alternatives on (culled_qstn_bank.qb_pk = culled_qstn_alternatives.qta_qst_id and culled_qstn_alternatives.exam_fk =  ' + parseInt(req.body.exam_fk) + ' and culled_qstn_alternatives.exampaper_fk = ' + parseInt(req.body.examPaper) + ')' +
            ' inner join qba_subject_master on culled_qstn_bank.qba_subject_fk = qba_subject_master.qba_subject_pk ' +
            ' inner join qba_module_mstr on culled_qstn_bank.qba_module_fk = qba_module_mstr.qba_module_pk ' +
            ' inner join qba_topic_master on culled_qstn_bank.qba_topic_fk = qba_topic_master.qba_topic_pk ' +
            ' LEFT JOIN (select qbank_images.qbi_image_name,qstn_bank.qb_pk from qbank_images left join qstn_bank on qstn_bank.qst_img_fk = qbank_images.qbi_pk) b2 on (b2.qb_pk= culled_qstn_bank.qb_pk)' +
            'LEFT JOIN (select qta_order,qta_alt_desc,qta_id from culled_qstn_alternatives where exam_fk = ' + parseInt(req.body.exam_fk) + ' and exampaper_fk = ' + parseInt(req.body.examPaper) + ') a1 on (a1.qta_id= culled_qstn_bank.qb_id) ' +
            ' where ' + culledstatuscondition + ' culled_qstn_bank.exam_fk = ' + parseInt(req.body.exam_fk) +
            ' and culled_qstn_bank.pub_status = \'A\' and culled_qstn_bank.exampaper_fk = ' + parseInt(req.body.examPaper) + ' and culled_qstn_bank.qst_lang = \'' + req.body.language + '\' group by culled_qstn_bank.qb_id,qba_course_code,qba_subject_code,module_name,qba_topic_code,qst_marks,qst_neg_marks,qst_lang,qst_type,qst_pid,qst_sub_seq_no,qst_body,b2.qbi_image_name,qst_no_of_altr,qta_is_corr_alt,qst_remarks,reference_info,calculation_info,qst_is_active,author_name,culled_qstn_alternatives.qta_alt_desc,culled_qstn_alternatives.qta_order order by culled_qstn_bank.qst_type,module_name,qba_topic_code,case when culled_qstn_bank.qst_type=\'M\' then culled_qstn_bank.qst_marks end,culled_qstn_bank.qb_id,culled_qstn_alternatives.qta_order';
        sequelize.query(expQuery, { type: sequelize.QueryTypes.SELECT })
            .then(expData => {
                var k = 0;
                var xlsxExprtData = [];
                var imgFileNames = []; // added by shilpa
                for (var i = 0; i < expData.length; i++) {
                    xlsxExprtData[k] = {};
                    xlsxExprtData[k]['QB_ID'] = expData[i].qb_id;
                    xlsxExprtData[k]['Course'] = expData[i].course;
                    xlsxExprtData[k]['Subject'] = expData[i].subject;
                    xlsxExprtData[k]['Module'] = expData[i].module;
                    xlsxExprtData[k]['Topic'] = expData[i].topic;
                    if (expData[i].question_type == 'CS' && expData[i].parent_qb_id == 0) {
                        expData[i].marks = 0;
                        expData[i].negative_marks = 0;
                    }
                    xlsxExprtData[k]['Marks'] = expData[i].marks;
                    xlsxExprtData[k]['Negative_Marks'] = expData[i].negative_marks;
                    xlsxExprtData[k]['Language'] = expData[i].language;
                    xlsxExprtData[k]['Question_Type'] = expData[i].question_type;
                    xlsxExprtData[k]['Parent_QB_ID'] = expData[i].parent_qb_id;
                    xlsxExprtData[k]['No_of_Questions'] = expData[i].no_of_questions;
                    qstn_body = expData[i]["question_body"];
                    remarks_body = expData[i].remarks;
                    if (qstn_body != null) {
                        if (qstn_body.includes("<img")) {
                            if (qstn_body.includes('<del ')) {
                                let start = parseInt(qstn_body.search('<del '));
                                let end = parseInt(qstn_body.search('</del>')) + parseInt(6);
                                qstn_body = qstn_body.replace(qstn_body.slice(start, end), "");
                                xlsxExprtData[k]['Question_Body'] = qstn_body;
                            }
                            if (qstn_body.includes('src="/images/products/image/')) {
                                if (qstn_body.includes('data-cke-saved-src="/images/products/image/')) {
                                    let start = parseInt(qstn_body.search(' src="/images/products/image/')) + parseInt(29);
                                    let end = qstn_body.search('" style=');
                                    let filename = qstn_body.substring(start, end).replace(/[&\/\\#,+()$~%'":*?<>{}]/g, "").trim();


                                    if (fs.existsSync(filepath + filename)) {
                                        xlsxExprtData[k]['Question_Body'] = qstn_body.replace(/<img[^>]*>/g, "");
                                        imgFileNames.push(filename);
                                    }
                                    else {
                                        xlsxExprtData[k]['Question_Body'] = qstn_body.replace(/<img[^>]*>/g, "");
                                    }
                                } else {
                                    let start = parseInt(qstn_body.search('image/')) + parseInt(6);
                                    let end = qstn_body.search('" style=');
                                    let filename = qstn_body.substring(start, end).replace(/[&\/\\#,+()$~%'":*?<>{}]/g, "").trim();


                                    if (fs.existsSync(filepath + filename)) {
                                        xlsxExprtData[k]['Question_Body'] = qstn_body.replace(/<img[^>]*>/g, "");
                                    }
                                    else {
                                        xlsxExprtData[k]['Question_Body'] = qstn_body.replace(/<img[^>]*>/g, "");
                                    }
                                }

                            }
                            if (qstn_body.includes('src="static/controllers/output/')) {
                                let start = parseInt(qstn_body.search('output/')) + parseInt(7);
                                let end = qstn_body.search('" style=');
                                if (end == -1)
                                    end = qstn_body.search('>');
                                let filename = qstn_body.substring(start, end).replace(/[&\/\\#,+()$~%'":*?<>{}]/g, "").trim();

                                if (fs.existsSync(filepath1 + filename)) {
                                    xlsxExprtData[k]['Question_Body'] = qstn_body.replace(/<img[^>]*>/g, "");
                                    imgFileNames.push(filename);
                                }
                                else {
                                    xlsxExprtData[k]['Question_Body'] = qstn_body.replace(/<img[^>]*>/g, "");
                                }
                            }
                        }
                        else {
                            xlsxExprtData[k]['Question_Body'] = qstn_body;
                        }
                    }
                    else {
                        xlsxExprtData[k]['Question_Body'] = qstn_body;
                    }
                    xlsxExprtData[k]['Number_of_Alternatives'] = expData[i].number_of_alternatives;
                    if (expData[i].question_type == 'CS' && expData[i].parent_qb_id == 0) {
                        xlsxExprtData[k]['Alternative 1'] = ''
                        xlsxExprtData[k]['Alternative 2'] = ''
                        xlsxExprtData[k]['Alternative 3'] = ''
                        xlsxExprtData[k]['Alternative 4'] = ''


                    }
                    for (var j = 0; j < parseInt(expData[i].number_of_alternatives); j++) {
                        var count = j + 1;
                        if (expData[i + j].alternative == null) {
                            xlsxExprtData[k]['Alternative ' + count] = expData[i + j].alternative;
                        }
                        else {

                            if (expData[i + j].alternative.includes('<del ')) {
                                let start = parseInt(expData[i + j].alternative.search('<del '));
                                let end = parseInt(expData[i + j].alternative.search('</del>')) + parseInt(6);
                                expData[i + j].alternative = expData[i + j].alternative.replace(expData[i + j].alternative.slice(start, end), "");
                            }
                            if (expData[i + j].alternative.includes("<img")) {
                                if (expData[i + j].alternative.includes('src="/images/products/image/')) {
                                    let start = parseInt(expData[i + j].alternative.search(' src="/images/products/image/')) + parseInt(29);
                                    let end = expData[i + j].alternative.search('" style=');
                                    let filename = expData[i + j].alternative.substring(start, end).replace(/[&\/\\#,+()$~%'":*?<>{}]/g, "").trim();
                                    if (fs.existsSync(filepath + filename)) {
                                        xlsxExprtData[k]['Alternative ' + count] = expData[i + j].alternative.replace(/<img[^>]*>/g, "");
                                        // xlsxExprtData[k]['Alternative ' + count] = stripHtml(xlsxExprtData[k]['Alternative ' + count],{"ignoreTags":['img']}); 
                                        xlsxExprtData[k]['Alternative ' + count] = xlsxExprtData[k]['Alternative ' + count];
                                        //xlsxExprtData[k]['Alternative ' + count+ 'Image']=  filename;
                                    }
                                    else {
                                        xlsxExprtData[k]['Alternative ' + count] = expData[i + j].alternative.replace(/<img[^>]*>/g, "");
                                        //xlsxExprtData[k]['Alternative ' + count] = stripHtml(xlsxExprtData[k]['Alternative ' + count],{"ignoreTags":['img']}); 
                                        xlsxExprtData[k]['Alternative ' + count] = xlsxExprtData[k]['Alternative ' + count];
                                        //xlsxExprtData[k]['Alternative ' + count+ 'Image']=  "";
                                    }

                                }
                                if (expData[i + j].alternative.includes('src="static/controllers/output/')) {
                                    let start = parseInt(expData[i + j].alternative.search('output/')) + parseInt(7);
                                    let end = expData[i + j].alternative.search('" style=');
                                    if (end == -1)
                                        end = expData[i + j].alternative.search('>');
                                    let filename = expData[i + j].alternative.substring(start, end).replace(/[&\/\\#,+()$~%'":*?<>{}]/g, "").trim();

                                    if (fs.existsSync(filepath1 + filename)) {
                                        xlsxExprtData[k]['Alternative ' + count] = expData[i + j].alternative.replace(/<img[^>]*>/g, "");
                                        // xlsxExprtData[k]['Alternative ' + count] = entities.decode(stripHtml(xlsxExprtData[k]['Alternative ' + count],{"ignoreTags":['img']}));  
                                        xlsxExprtData[k]['Alternative ' + count] = xlsxExprtData[k]['Alternative ' + count];
                                        // xlsxExprtData[k]['Alternative ' + count+ 'Image']=  filename;  
                                    }
                                    else {
                                        xlsxExprtData[k]['Alternative ' + count] = expData[i + j].alternative.replace(/<img[^>]*>/g, "");
                                        //xlsxExprtData[k]['Alternative ' + count] = entities.decode(stripHtml(xlsxExprtData[k]['Alternative ' + count],{"ignoreTags":['img']}));
                                        xlsxExprtData[k]['Alternative ' + count] = xlsxExprtData[k]['Alternative ' + count];
                                        //xlsxExprtData[k]['Alternative ' + count+ 'Image']=  "";
                                    }
                                }
                            } else {
                                xlsxExprtData[k]['Alternative ' + count] = expData[i + j].alternative;   //xlsxExprtData[k]['Alternative ' + count+ 'Image']=  "";  

                            }
                        }

                        if (expData[i + j].corr_alt == 'Y') {
                            //xlsxExprtData[k]['Correct Alternative'] = count;
                            var Correct_Alternative = count;  //added by dipika
                        }
                    }
                    xlsxExprtData[k]['Alternative 5'] = "";
                    xlsxExprtData[k]['Alternative 6'] = "";
                    xlsxExprtData[k]['Alternative 7'] = "";
                    xlsxExprtData[k]['Alternative 8'] = "";
                    xlsxExprtData[k]['Alternative 9'] = "";
                    if (expData[i].question_type == 'CS' && expData[i].parent_qb_id == 0) {
                        xlsxExprtData[k]['Correct Alternative'] = parseInt(0);
                    }
                    else if (Correct_Alternative != undefined) {
                        xlsxExprtData[k]['Correct Alternative'] = parseInt(Correct_Alternative);
                    } else {
                        xlsxExprtData[k]['Correct Alternative'] = parseInt(0);
                    }
                    xlsxExprtData[k]['Remarks'] = expData[i].remarks;
                    if (expData[i].remarks == null) {
                        xlsxExprtData[k]['Remarks Image'] = '';
                    } else if (expData[i].remarks.includes('src')) {

                        if (expData[i]["remarks"].includes('src="static/controllers/output/')) {
                            let start = parseInt(expData[i]["remarks"].search('output/')) + parseInt(7);
                            let end = expData[i]["remarks"].search('>');
                            let filename = expData[i]["remarks"].substring(start, end).replace(/[&\/\\#,+()$~%'":*?<>{}]/g, "").trim();


                            if (fs.existsSync(filepath1 + filename)) {
                                xlsxExprtData[k]['Remarks Image'] = filename;
                                if (filename != '') {
                                    imgFileNames.push(filename);
                                }


                            }
                            else {
                                xlsxExprtData[k]['Remarks Image'] = "";
                            }
                        }

                        if (expData[i]["remarks"].includes('src="/images/products/image/')) {
                            if (expData[i]["remarks"].includes('data-cke-saved-src="/images/products/image/')) {
                                let start = parseInt(expData[i]["remarks"].search(' src="/images/products/image/')) + parseInt(29);
                                let end = expData[i]["remarks"].search('" style=');
                                let filename = expData[i]["remarks"].substring(start, end).replace(/[&\/\\#,+()$~%'":*?<>{}]/g, "").trim();


                                if (fs.existsSync(filepath + filename)) {
                                    xlsxExprtData[k]['Remarks Image'] = filename;;
                                    imgFileNames.push(filename);

                                }
                                else {
                                    xlsxExprtData[k]['Remarks Image'] = "";
                                }
                            } else {
                                let start = parseInt(expData[i]["remarks"].search('image/')) + parseInt(6);
                                let end = expData[i]["remarks"].search('" style=');
                                let filename = expData[i]["remarks"].substring(start, end).replace(/[&\/\\#,+()$~%'":*?<>{}]/g, "").trim();
                                imgFileNames.push(filename);

                                if (fs.existsSync(filepath + filename)) {
                                    xlsxExprtData[k]['Remarks Image'] = filename;
                                    imgFileNames.push(filename);
                                }
                                else {
                                    xlsxExprtData[k]['Remarks Image'] = "";
                                }
                            }
                        }
                    } else {
                        xlsxExprtData[k]['Remarks Image'] = "";
                    }
                    xlsxExprtData[k]['Reference'] = expData[i].reference;
                    if (expData[i].reference == null) {
                        xlsxExprtData[k]['Reference Image'] = '';
                    } else if (expData[i]["reference"].includes('src')) {
                        if (expData[i]["reference"].includes('src="static/controllers/output/')) {
                            let start = parseInt(expData[i]["reference"].search('output/')) + parseInt(7);
                            let end = expData[i]["reference"].search('>');
                            let filename = expData[i]["reference"].substring(start, end).replace(/[&\/\\#,+()$~%'":*?<>{}]/g, "").trim();


                            if (fs.existsSync(filepath1 + filename)) {
                                xlsxExprtData[k]['Reference Image'] = filename;
                                if (filename != '') {
                                    imgFileNames.push(filename);
                                }
                            }
                            else {
                                xlsxExprtData[k]['Reference Image'] = "";
                            }
                        }
                        if (expData[i]["reference"].includes('src="/images/products/image/')) {
                            if (expData[i]["reference"].includes('data-cke-saved-src="/images/products/image/')) {
                                let start = parseInt(expData[i]["reference"].search(' src="/images/products/image/')) + parseInt(29);
                                let end = expData[i]["reference"].search('" style=');
                                let filename = expData[i]["reference"].substring(start, end).replace(/[&\/\\#,+()$~%'":*?<>{}]/g, "").trim();


                                if (fs.existsSync(filepath + filename)) {
                                    xlsxExprtData[k]['Reference Image'] = filename;;
                                    imgFileNames.push(filename);

                                }
                                else {
                                    xlsxExprtData[k]['Reference Image'] = "";
                                }
                            } else {
                                let start = parseInt(expData[i]["reference"].search('image/')) + parseInt(6);
                                let end = expData[i]["reference"].search('" style=');
                                let filename = expData[i]["reference"].substring(start, end).replace(/[&\/\\#,+()$~%'":*?<>{}]/g, "").trim();
                                imgFileNames.push(filename);

                                if (fs.existsSync(filepath + filename)) {
                                    xlsxExprtData[k]['Reference Image'] = filename;
                                    imgFileNames.push(filename);
                                }
                                else {
                                    xlsxExprtData[k]['Reference Image'] = "";
                                }
                            }
                        }


                    } else {
                        xlsxExprtData[k]['Reference Image'] = '';
                    }
                    xlsxExprtData[k]['Calculation'] = expData[i].calculation;
                    if (expData[i].calculation == null) {
                        xlsxExprtData[k]['Calculation Image'] = '';
                    } else if (expData[i]["calculation"].includes('src')) {
                        if (expData[i]["calculation"].includes('src="static/controllers/output/')) {
                            let start = parseInt(expData[i]["calculation"].search('output/')) + parseInt(7);
                            let end = expData[i]["calculation"].search('>');
                            let filename = expData[i]["calculation"].substring(start, end).replace(/[&\/\\#,+()$~%'":*?<>{}]/g, "").trim();


                            if (fs.existsSync(filepath1 + filename)) {
                                xlsxExprtData[k]['Calculation Image'] = filename;
                                if (filename != '') {
                                    imgFileNames.push(filename);
                                }
                            }
                            else {
                                xlsxExprtData[k]['Calculation Image'] = "";
                            }
                        }
                        if (expData[i]["calculation"].includes('src="/images/products/image/')) {
                            if (expData[i]["calculation"].includes('data-cke-saved-src="/images/products/image/')) {
                                let start = parseInt(expData[i]["calculation"].search(' src="/images/products/image/')) + parseInt(29);
                                let end = expData[i]["calculation"].search('" style=');
                                let filename = expData[i]["calculation"].substring(start, end).replace(/[&\/\\#,+()$~%'":*?<>{}]/g, "").trim();


                                if (fs.existsSync(filepath + filename)) {
                                    xlsxExprtData[k]['Calculation Image'] = filename;;
                                    imgFileNames.push(filename);

                                }
                                else {
                                    xlsxExprtData[k]['Calculation Image'] = "";
                                }
                            } else {
                                let start = parseInt(expData[i]["calculation"].search('image/')) + parseInt(6);
                                let end = expData[i]["calculation"].search('" style=');
                                let filename = expData[i]["calculation"].substring(start, end).replace(/[&\/\\#,+()$~%'":*?<>{}]/g, "").trim();
                                imgFileNames.push(filename);

                                if (fs.existsSync(filepath + filename)) {
                                    xlsxExprtData[k]['Calculation Image'] = filename;
                                    imgFileNames.push(filename);
                                }
                                else {
                                    xlsxExprtData[k]['Calculation Image'] = "";
                                }
                            }
                        }
                    } else {
                        xlsxExprtData[k]['Calculation Image'] = '';
                    }

                    if (expData[i]["Question Image"] == null) {
                        xlsxExprtData[k]['Question Image'] = expData[i]["Question Image"];
                    } else if (expData[i]["Question Image"].includes("<img")) {
                        if (expData[i]["Question Image"].includes('<del ')) {
                            let start = parseInt(expData[i]["Question Image"].search('<del '));
                            let end = parseInt(expData[i]["Question Image"].search('</del>')) + parseInt(6);
                            expData[i]["Question Image"] = expData[i]["Question Image"].replace(expData[i]["Question Image"].slice(start, end), "");
                        }
                        if (expData[i]["Question Image"].includes('src="/images/products/image/')) {
                            if (expData[i]["Question Image"].includes('data-cke-saved-src="/images/products/image/')) {
                                let start = parseInt(expData[i]["Question Image"].search(' src="/images/products/image/')) + parseInt(29);
                                let end = expData[i]["Question Image"].search('" style=');
                                let filename = expData[i]["Question Image"].substring(start, end).replace(/[&\/\\#,+()$~%'":*?<>{}]/g, "").trim();


                                if (fs.existsSync(filepath + filename)) {
                                    xlsxExprtData[k]['Question Image'] = filename;;
                                    imgFileNames.push(filename);

                                }
                                else {
                                    xlsxExprtData[k]['Question Image'] = "";
                                }
                            } else {
                                let start = parseInt(expData[i]["Question Image"].search('image/')) + parseInt(6);
                                let end = expData[i]["Question Image"].search('" style=');
                                let filename = expData[i]["Question Image"].substring(start, end).replace(/[&\/\\#,+()$~%'":*?<>{}]/g, "").trim();
                                imgFileNames.push(filename);

                                if (fs.existsSync(filepath + filename)) {
                                    xlsxExprtData[k]['Question Image'] = filename;
                                    imgFileNames.push(filename);
                                }
                                else {
                                    xlsxExprtData[k]['Question Image'] = "";
                                }
                            }
                        }
                        if (expData[i]["Question Image"].includes('src="static/controllers/output/')) {
                            let start = parseInt(expData[i]["Question Image"].search('output/')) + parseInt(7);
                            let end = expData[i]["Question Image"].search('" style=');
                            if (end == -1)
                                end = expData[i]["Question Image"].search('>');
                            let filename = expData[i]["Question Image"].substring(start, end).replace(/[&\/\\#,+()$~%'":*?<>{}]/g, "").trim();

                            if (fs.existsSync(filepath1 + filename)) {
                                xlsxExprtData[k]['Question Image'] = filename;
                                imgFileNames.push(filename);
                            }
                            else {
                                xlsxExprtData[k]['Question Image'] = "";
                            }
                        }
                    } else {
                        xlsxExprtData[k]['Question Image'] = "";
                    }

                    if (expData[i].question_type == 'CS' && expData[i].parent_qb_id == 0) {
                        xlsxExprtData[k]['Alternative 1 Image'] = ''
                        xlsxExprtData[k]['Alternative 2 Image'] = ''
                        xlsxExprtData[k]['Alternative 3 Image'] = ''
                        xlsxExprtData[k]['Alternative 4 Image'] = ''


                    }
                    for (var j = 0, m = 1; j < parseInt(expData[i].number_of_alternatives); j++ , m++) {
                        if (expData[i + j].alternative == null) {
                            //Alternative 1 Image
                            xlsxExprtData[k]['Alternative ' + m + ' Image'] = expData[i + j].alternative;
                        }
                        else {

                            if (expData[i + j].alternative.includes('<del ')) {
                                let start = parseInt(expData[i + j].alternative.search('<del '));
                                let end = parseInt(expData[i + j].alternative.search('</del>')) + parseInt(6);
                                expData[i + j].alternative = expData[i + j].alternative.replace(expData[i + j].alternative.slice(start, end), "");
                            }
                            if (expData[i + j].alternative.includes("<img")) {
                                if (expData[i + j].alternative.includes('src="/images/products/image/')) {
                                    let start = parseInt(expData[i + j].alternative.search(' src="/images/products/image/')) + parseInt(29);
                                    let end = expData[i + j].alternative.search('" style=');
                                    let filename = expData[i + j].alternative.substring(start, end).replace(/[&\/\\#,+()$~%'":*?<>{}]/g, "").trim();
                                    if (fs.existsSync(filepath + filename)) {
                                        imgFileNames.push(filename);
                                        xlsxExprtData[k]['Alternative ' + m + ' Image'] = filename;
                                    }
                                    else {
                                        xlsxExprtData[k]['Alternative ' + m + ' Image'] = "";
                                    }

                                }
                                if (expData[i + j].alternative.includes('src="static/controllers/output/')) {
                                    let start = parseInt(expData[i + j].alternative.search('output/')) + parseInt(7);
                                    let end = expData[i + j].alternative.search('" style=');
                                    if (end == -1)
                                        end = expData[i + j].alternative.search('>');
                                    let filename = expData[i + j].alternative.substring(start, end).replace(/[&\/\\#,+()$~%'":*?<>{}]/g, "").trim();

                                    if (fs.existsSync(filepath1 + filename)) {
                                        imgFileNames.push(filename);
                                        xlsxExprtData[k]['Alternative ' + m + ' Image'] = filename;

                                    }
                                    else {
                                        xlsxExprtData[k]['Alternative ' + m + ' Image'] = "";
                                    }
                                }
                            } else {
                                xlsxExprtData[k]['Alternative ' + m + ' Image'] = "";

                            }
                        }


                    }
                    xlsxExprtData[k]['Alternative 5 Image'] = "";
                    xlsxExprtData[k]['Alternative 6 Image'] = "";
                    xlsxExprtData[k]['Alternative 7 Image'] = "";
                    xlsxExprtData[k]['Alternative 8 Image'] = "";
                    xlsxExprtData[k]['Alternative 9 Image'] = "";

                    xlsxExprtData[k]['Status (Active / Inactive)'] = expData[i].status;
                    xlsxExprtData[k]['Author_Name'] = expData[i].author_name;
                    if (expData[i].flag != '' || expData[i].flag != null || expData[i].flag != undefined) {
                        if (expData[i].flag == 'null') {
                            xlsxExprtData[k]['Flag'] = ''
                        }
                        else
                            xlsxExprtData[k]['Flag'] = expData[i].flag
                    }
                    else {
                        xlsxExprtData[k]['Flag'] = ''
                    }

                    var parentQuesId = parseInt(expData[i].parent_qb_id);
                    if (!(expData[i].question_type == 'CS' && parentQuesId == 0)) {
                        if (expData[i].number_of_alternatives != null) {
                            i = (i + j) - 1;
                        }
                    }

                    k++;
                }
                function onlyUnique(value, index, self) {
                    return self.indexOf(value) === index;
                }
                var fields = [];
                for (var m in xlsxExprtData[0]) fields.push(m);
                var xls = json2xls(xlsxExprtData, { fields: fields });
                var xlsfilename = "data_" + (new Date).getTime() + ".xlsx";
                fs.writeFileSync(rootPath + '/uploads/csv_download/' + xlsfilename, xls, 'binary');
                var csvfilepath = rootPath + '/uploads/csv_download/' + xlsfilename;
                var getStream = function (fileName) {
                    return fs.readFileSync(fileName);
                }
                //archiver code start
                var output = fs.createWriteStream(rootPath + '/uploads/csv_download/data.zip');
                var archive = archiver('zip');
                archive.pipe(output);
                archive.on('error', function (err) {
                    throw err;
                });
                var uniqueImages = imgFileNames.filter(onlyUnique);
                archive.append(getStream(csvfilepath), { name: xlsfilename });
                for (var k in uniqueImages) {
                    var img = rootPath + '/server/controllers/output/' + uniqueImages[k];
                    var img1 = rootPath + '/public/images/products/image/' + uniqueImages[k];
                    if (fs.existsSync(img)) {
                        archive.append(getStream(img), { name: uniqueImages[k] });
                    }
                    else if (fs.existsSync(img1)) {
                        archive.append(getStream(img1), { name: uniqueImages[k] });
                    }
                }
                archive.finalize();
                //archiver code end
                output.on('close', function () {
                    res.send({
                        code: 0,
                        message: "success",
                        obj: "/uploads/csv_download/data.zip"
                    });
                });

            });
    },

    exportDocument: function (req, res) {

        var qstn_body;
        var params = req.body;
        var filepath = rootPath + '/public/images/products/image/';
        var filepath1 = rootPath + '/server/controllers/output/';
        var examstatus = req.body.examstatus;
        let language = req.body.language;
        if (language != 'ENGLISH') {
            importMethods.otherLangExportDocument(req, res);
            return;
        }
        if (examstatus == 'A') {
            var expQuery = 'select ( CASE WHEN qst_type=\'CS\' AND qst_pid > 0 THEN qst_pid::varchar || \'.\' || lpad(qb_id::varchar,8,\'0\')::varchar ELSE CASE WHEN qst_type = \'M\' THEN qb_id::varchar ELSE qb_id::varchar END END )::numeric(16,10) as qb_id1,qb_id as QB_ID, qba_course_code as Course, qba_subject_code as Subject, module_name as Module, qba_topic_code as Topic, ' +
                ' qst_marks as Marks, qst_neg_marks as Negative_Marks, qst_lang as Language, qst_type as Question_type,' +
                'qst_pid as Parent_QB_ID, ' +
                ' (select count(b.qst_pid) from culled_qstn_bank b where b.exam_fk = ' + parseInt(req.body.exam_fk) + ' and b.exampaper_fk = ' + parseInt(req.body.examPaper) + ' and b.qst_lang = \'' + req.body.language + '\' and b.qst_pid = culled_qstn_bank.qb_id and b.admin_status =\'A\') as No_of_Questions, qst_body as Question_Body, qst_body "Question Image", ' +
                'max(case when  a1.qta_order=1 then a1.qta_alt_desc end) "Alternative1Image",' +
                ' max(case when a1.qta_order=2 then a1.qta_alt_desc end) "Alternative2Image",' +
                ' max(case when a1.qta_order=3 then a1.qta_alt_desc end) "Alternative3Image",' +
                ' max(case when a1.qta_order=4 then a1.qta_alt_desc end) "Alternative4Image",' +
                'qst_no_of_altr as Number_of_Alternatives,culled_qstn_alternatives.qta_alt_desc as alternative, ' +
                ' qta_is_corr_alt as corr_alt, qst_remarks as Remarks, qst_request_remarks as flag, reference_info as Reference, calculation_info as Calculation, qst_is_active as Status, ' +
                ' author_name as Author_Name from culled_qstn_bank ' +
                ' inner join qba_course_master on culled_qstn_bank.qba_course_fk = qba_course_master.qba_course_pk ' +
                ' left join culled_qstn_alternatives on (culled_qstn_bank.qb_pk = culled_qstn_alternatives.qta_qst_id and culled_qstn_alternatives.qta_id = culled_qstn_bank.qb_id and culled_qstn_alternatives.exam_fk =  ' + parseInt(req.body.exam_fk) + ' and culled_qstn_alternatives.exampaper_fk = ' + parseInt(req.body.examPaper) + ') ' +
                ' inner join qba_subject_master on culled_qstn_bank.qba_subject_fk = qba_subject_master.qba_subject_pk ' +
                ' inner join qba_module_mstr on culled_qstn_bank.qba_module_fk = qba_module_mstr.qba_module_pk ' +
                ' inner join qba_topic_master on culled_qstn_bank.qba_topic_fk = qba_topic_master.qba_topic_pk ' +
                ' LEFT JOIN (select qbank_images.qbi_image_name,qstn_bank.qb_pk from qbank_images left join qstn_bank on qstn_bank.qst_img_fk = qbank_images.qbi_pk) b2 on (b2.qb_pk= culled_qstn_bank.qb_pk)' +
                'LEFT JOIN (select qta_order,qta_alt_desc,qta_id from culled_qstn_alternatives where exam_fk = ' + parseInt(req.body.exam_fk) + ' and exampaper_fk = ' + parseInt(req.body.examPaper) + ') a1 on (a1.qta_id= culled_qstn_bank.qb_id) ' +
                ' where admin_status = \'A\' and  culled_qstn_bank.exam_fk = ' + parseInt(req.body.exam_fk) +
                ' and culled_qstn_bank.exampaper_fk = ' + parseInt(req.body.examPaper) + ' and culled_qstn_bank.qst_lang = \'' + req.body.language + '\' group by culled_qstn_bank.qb_id,qba_course_code,qba_subject_code,module_name,qba_topic_code,qst_marks,qst_neg_marks,qst_lang,qst_type,qst_pid,qst_sub_seq_no,qst_body,b2.qbi_image_name,qst_no_of_altr,qta_is_corr_alt,qst_remarks,reference_info,calculation_info,qst_is_active,author_name,culled_qstn_alternatives.qta_alt_desc,culled_qstn_alternatives.qta_order, qst_request_remarks order by qst_type, module,topic,case when qst_type=\'M\' then qst_marks end,qb_id1,subject,course,culled_qstn_alternatives.qta_order';
        }
        else {

            var expQuery = 'select ( CASE WHEN qst_type=\'CS\' AND qst_pid > 0 THEN qst_pid::varchar || \'.\' || lpad(qb_id::varchar,8,\'0\')::varchar ELSE CASE WHEN qst_type = \'M\' THEN qb_id::varchar ELSE qb_id::varchar END END )::numeric(16,10) as qb_id1,qb_id as QB_ID, qba_course_code as Course, qba_subject_code as Subject, module_name as Module, qba_topic_code as Topic, ' +
                ' qst_marks as Marks, qst_neg_marks as Negative_Marks, qst_lang as Language, qst_type as Question_type,' +
                'qst_pid as Parent_QB_ID, ' +
                ' (select count(b.qst_pid) from culled_qstn_bank b where b.exam_fk = ' + parseInt(req.body.exam_fk) + ' and b.exampaper_fk = ' + parseInt(req.body.examPaper) + ' and b.qst_lang = \'' + req.body.language + '\' and b.qst_pid = culled_qstn_bank.qb_id and b.pub_status =\'A\') as No_of_Questions, qst_body as Question_Body, qst_body   "Question Image", ' +
                'max(case when  a1.qta_order=1 then a1.qta_alt_desc end) "Alternative1Image",' +
                ' max(case when a1.qta_order=2 then a1.qta_alt_desc end) "Alternative2Image",' +
                ' max(case when a1.qta_order=3 then a1.qta_alt_desc end) "Alternative3Image",' +
                ' max(case when a1.qta_order=4 then a1.qta_alt_desc end) "Alternative4Image",' +
                'qst_no_of_altr as Number_of_Alternatives,a1.qta_alt_desc as alternative, ' +
                ' qta_is_corr_alt as corr_alt, qst_remarks as Remarks, qst_request_remarks as flag, qst_remarks "Remarks Image", reference_info as Reference, reference_info "Reference Image", calculation_info as Calculation, calculation_info "Calculation Image", qst_is_active as Status, ' +
                ' author_name as Author_Name from culled_qstn_bank ' +
                ' inner join qba_course_master on culled_qstn_bank.qba_course_fk = qba_course_master.qba_course_pk ' +
                ' inner join qba_subject_master on culled_qstn_bank.qba_subject_fk = qba_subject_master.qba_subject_pk ' +
                ' inner join qba_module_mstr on culled_qstn_bank.qba_module_fk = qba_module_mstr.qba_module_pk ' +
                ' inner join qba_topic_master on culled_qstn_bank.qba_topic_fk = qba_topic_master.qba_topic_pk ' +
                ' LEFT JOIN (select qbank_images.qbi_image_name,qstn_bank.qb_pk from qbank_images left join qstn_bank on qstn_bank.qst_img_fk = qbank_images.qbi_pk) b2 on (b2.qb_pk= culled_qstn_bank.qb_pk)' +
                'LEFT JOIN (select qta_order,qta_alt_desc,qta_id, qta_qst_id,qta_is_corr_alt from culled_qstn_alternatives where exam_fk = ' + parseInt(req.body.exam_fk) + ' and exampaper_fk = ' + parseInt(req.body.examPaper) + ') a1 on (a1.qta_id= culled_qstn_bank.qb_id and a1.qta_qst_id = culled_qstn_bank.qb_pk) ' +
                ' where culled_qstn_bank.qst_lang = \'' + req.body.language + '\' and culled_qstn_bank.exam_fk = ' + parseInt(req.body.exam_fk) +
                'and culled_qstn_bank.pub_status = \'A\'' +
                ' and culled_qstn_bank.exampaper_fk = ' + parseInt(req.body.examPaper) + '  group by culled_qstn_bank.qb_id,qba_course_code,qba_subject_code,module_name,qba_topic_code,qst_marks,qst_neg_marks,qst_lang,qst_type,qst_pid,qst_sub_seq_no,qst_body,b2.qbi_image_name,qst_no_of_altr,qta_order,qta_alt_desc,qta_id, qta_qst_id,qta_is_corr_alt,qst_remarks,reference_info,calculation_info,qst_is_active,author_name, qst_request_remarks order by qst_type, module,topic,case when qst_type=\'M\' then qst_marks end,qb_id1,subject,course,a1.qta_order';
        }
        sequelize.query(expQuery, { type: sequelize.QueryTypes.SELECT })
            .then(expData => {
                var k = 0;
                var xlsxExprtData = [];
                var imgFileNames = []; // added by shilpa
                for (var i = 0; i < expData.length; i++) {
                    xlsxExprtData[k] = {};
                    xlsxExprtData[k]['QB_ID'] = expData[i].qb_id;
                    xlsxExprtData[k]['Course'] = expData[i].course;
                    xlsxExprtData[k]['Subject'] = expData[i].subject;
                    xlsxExprtData[k]['Module'] = expData[i].module;
                    xlsxExprtData[k]['Topic'] = expData[i].topic;
                    if (expData[i].question_type == 'CS' && expData[i].parent_qb_id == 0) {
                        expData[i].marks = 0;
                        expData[i].negative_marks = 0;
                    }
                    xlsxExprtData[k]['Marks'] = expData[i].marks;
                    xlsxExprtData[k]['Negative_Marks'] = expData[i].negative_marks;
                    xlsxExprtData[k]['Language'] = expData[i].language;
                    xlsxExprtData[k]['Question_Type'] = expData[i].question_type;
                    xlsxExprtData[k]['Parent_QB_ID'] = expData[i].parent_qb_id;
                    xlsxExprtData[k]['No_of_Questions'] = expData[i].no_of_questions;
                    qstn_body = expData[i]["question_body"];
                    remarks_body = expData[i].remarks;
                    if (qstn_body != null) {
                        if (qstn_body.includes("<img")) {
                            if (qstn_body.includes('<del ')) {
                                let start = parseInt(qstn_body.search('<del '));
                                let end = parseInt(qstn_body.search('</del>')) + parseInt(6);
                                qstn_body = qstn_body.replace(qstn_body.slice(start, end), "");
                                xlsxExprtData[k]['Question_Body'] = qstn_body;
                            }
                            if (qstn_body.includes('src="/images/products/image/')) {

                                if (qstn_body.includes('data-cke-saved-src="/images/products/image/')) {
                                    let start = parseInt(qstn_body.search(' src="/images/products/image/')) + parseInt(29);
                                    let end = qstn_body.search('" style=');
                                    let filename = qstn_body.substring(start, end).replace(/[&\/\\#,+()$~%'":*?<>{}]/g, "").trim();


                                    if (fs.existsSync(filepath + filename)) {
                                        xlsxExprtData[k]['Question_Body'] = qstn_body.replace(/<img[^>]*>/g, "");
                                        imgFileNames.push(filename);
                                    }
                                    else {
                                        xlsxExprtData[k]['Question_Body'] = qstn_body.replace(/<img[^>]*>/g, "");
                                    }
                                } else {
                                    let start = parseInt(qstn_body.search('image/')) + parseInt(6);
                                    let end = qstn_body.search('" style=');
                                    let filename = qstn_body.substring(start, end).replace(/[&\/\\#,+()$~%'":*?<>{}]/g, "").trim();


                                    if (fs.existsSync(filepath + filename)) {
                                        xlsxExprtData[k]['Question_Body'] = qstn_body.replace(/<img[^>]*>/g, "");
                                    }
                                    else {
                                        xlsxExprtData[k]['Question_Body'] = qstn_body.replace(/<img[^>]*>/g, "");
                                    }
                                }

                            }
                            if (qstn_body.includes('src="static/controllers/output/')) {
                                let start = parseInt(qstn_body.search('output/')) + parseInt(7);
                                let end = qstn_body.search('" style=');
                                if (end == -1)
                                    end = qstn_body.search('>');
                                let filename = qstn_body.substring(start, end).replace(/[&\/\\#,+()$~%'":*?<>{}]/g, "").trim();

                                if (fs.existsSync(filepath1 + filename)) {
                                    xlsxExprtData[k]['Question_Body'] = qstn_body.replace(/<img[^>]*>/g, "");
                                    imgFileNames.push(filename);
                                }
                                else {
                                    xlsxExprtData[k]['Question_Body'] = qstn_body.replace(/<img[^>]*>/g, "");
                                }
                            }
                        }
                        else {
                            xlsxExprtData[k]['Question_Body'] = qstn_body;
                        }
                    }
                    else {
                        xlsxExprtData[k]['Question_Body'] = qstn_body;
                    }
                    xlsxExprtData[k]['Number_of_Alternatives'] = expData[i].number_of_alternatives;
                    if (expData[i].question_type == 'CS' && expData[i].parent_qb_id == 0) {
                        xlsxExprtData[k]['Alternative 1'] = ''
                        xlsxExprtData[k]['Alternative 2'] = ''
                        xlsxExprtData[k]['Alternative 3'] = ''
                        xlsxExprtData[k]['Alternative 4'] = ''


                    }
                    for (var j = 0; j < parseInt(expData[i].number_of_alternatives); j++) {
                        var count = j + 1;
                        if (expData[i + j].alternative == null) {
                            xlsxExprtData[k]['Alternative ' + count] = expData[i + j].alternative;
                        }
                        else {

                            if (expData[i + j].alternative.includes('<del ')) {
                                let start = parseInt(expData[i + j].alternative.search('<del '));
                                let end = parseInt(expData[i + j].alternative.search('</del>')) + parseInt(6);
                                expData[i + j].alternative = expData[i + j].alternative.replace(expData[i + j].alternative.slice(start, end), "");
                            }
                            if (expData[i + j].alternative.includes("<img")) {
                                if (expData[i + j].alternative.includes('src="/images/products/image/')) {
                                    let start = parseInt(expData[i + j].alternative.search(' src="/images/products/image/')) + parseInt(29);
                                    let end = expData[i + j].alternative.search('" style=');
                                    let filename = expData[i + j].alternative.substring(start, end).replace(/[&\/\\#,+()$~%'":*?<>{}]/g, "").trim();
                                    if (fs.existsSync(filepath + filename)) {
                                        xlsxExprtData[k]['Alternative ' + count] = expData[i + j].alternative.replace(/<img[^>]*>/g, "");
                                        xlsxExprtData[k]['Alternative ' + count] = xlsxExprtData[k]['Alternative ' + count];
                                    }
                                    else {
                                        xlsxExprtData[k]['Alternative ' + count] = expData[i + j].alternative.replace(/<img[^>]*>/g, "");
                                        xlsxExprtData[k]['Alternative ' + count] = xlsxExprtData[k]['Alternative ' + count];
                                    }

                                }
                                if (expData[i + j].alternative.includes('src="static/controllers/output/')) {
                                    let start = parseInt(expData[i + j].alternative.search('output/')) + parseInt(7);
                                    let end = expData[i + j].alternative.search('" style=');
                                    if (end == -1)
                                        end = expData[i + j].alternative.search('>');
                                    let filename = expData[i + j].alternative.substring(start, end).replace(/[&\/\\#,+()$~%'":*?<>{}]/g, "").trim();

                                    if (fs.existsSync(filepath1 + filename)) {
                                        xlsxExprtData[k]['Alternative ' + count] = expData[i + j].alternative.replace(/<img[^>]*>/g, "");
                                        xlsxExprtData[k]['Alternative ' + count] = xlsxExprtData[k]['Alternative ' + count];
                                    }
                                    else {
                                        xlsxExprtData[k]['Alternative ' + count] = expData[i + j].alternative.replace(/<img[^>]*>/g, "");
                                        xlsxExprtData[k]['Alternative ' + count] = xlsxExprtData[k]['Alternative ' + count];

                                    }
                                }
                            } else {
                                xlsxExprtData[k]['Alternative ' + count] = expData[i + j].alternative;   //xlsxExprtData[k]['Alternative ' + count+ 'Image']=  "";  

                            }
                        }

                        if (expData[i + j].corr_alt == 'Y') {
                            var Correct_Alternative = count;  //added by dipika
                        }
                    }
                    xlsxExprtData[k]['Alternative 5'] = "";
                    xlsxExprtData[k]['Alternative 6'] = "";
                    xlsxExprtData[k]['Alternative 7'] = "";
                    xlsxExprtData[k]['Alternative 8'] = "";
                    xlsxExprtData[k]['Alternative 9'] = "";
                    if (expData[i].question_type == 'CS' && expData[i].parent_qb_id == 0) {
                        xlsxExprtData[k]['Correct Alternative'] = parseInt(0);
                    }
                    else if (Correct_Alternative != undefined) {
                        xlsxExprtData[k]['Correct Alternative'] = parseInt(Correct_Alternative);
                    } else {
                        xlsxExprtData[k]['Correct Alternative'] = parseInt(0);
                    }
                    xlsxExprtData[k]['Remarks'] = expData[i].remarks;
                    if (expData[i].remarks == null) {
                        xlsxExprtData[k]['Remarks Image'] = '';
                    } else if (expData[i].remarks.includes('src')) {

                        if (expData[i]["remarks"].includes('src="static/controllers/output/')) {
                            let start = parseInt(expData[i]["remarks"].search('output/')) + parseInt(7);
                            let end = expData[i]["remarks"].search('>');
                            let filename = expData[i]["remarks"].substring(start, end).replace(/[&\/\\#,+()$~%'":*?<>{}]/g, "").trim();


                            if (fs.existsSync(filepath1 + filename)) {
                                xlsxExprtData[k]['Remarks Image'] = filename;
                                if (filename != '') {
                                    imgFileNames.push(filename);
                                }


                            }
                            else {
                                xlsxExprtData[k]['Remarks Image'] = "";
                            }
                        }

                        if (expData[i]["remarks"].includes('src="/images/products/image/')) {
                            if (expData[i]["remarks"].includes('data-cke-saved-src="/images/products/image/')) {
                                let start = parseInt(expData[i]["remarks"].search(' src="/images/products/image/')) + parseInt(29);
                                let end = expData[i]["remarks"].search('" style=');
                                let filename = expData[i]["remarks"].substring(start, end).replace(/[&\/\\#,+()$~%'":*?<>{}]/g, "").trim();


                                if (fs.existsSync(filepath + filename)) {
                                    xlsxExprtData[k]['Remarks Image'] = filename;;
                                    imgFileNames.push(filename);

                                }
                                else {
                                    xlsxExprtData[k]['Remarks Image'] = "";
                                }
                            } else {
                                let start = parseInt(expData[i]["remarks"].search('image/')) + parseInt(6);
                                let end = expData[i]["remarks"].search('" style=');
                                let filename = expData[i]["remarks"].substring(start, end).replace(/[&\/\\#,+()$~%'":*?<>{}]/g, "").trim();
                                imgFileNames.push(filename);

                                if (fs.existsSync(filepath + filename)) {
                                    xlsxExprtData[k]['Remarks Image'] = filename;
                                    imgFileNames.push(filename);
                                }
                                else {
                                    xlsxExprtData[k]['Remarks Image'] = "";
                                }
                            }
                        }
                    } else {
                        xlsxExprtData[k]['Remarks Image'] = "";
                    }
                    xlsxExprtData[k]['Reference'] = expData[i].reference;
                    if (expData[i].reference == null) {
                        xlsxExprtData[k]['Reference Image'] = '';
                    } else if (expData[i]["reference"].includes('src')) {
                        if (expData[i]["reference"].includes('src="static/controllers/output/')) {
                            let start = parseInt(expData[i]["reference"].search('output/')) + parseInt(7);
                            let end = expData[i]["reference"].search('>');
                            let filename = expData[i]["reference"].substring(start, end).replace(/[&\/\\#,+()$~%'":*?<>{}]/g, "").trim();


                            if (fs.existsSync(filepath1 + filename)) {
                                xlsxExprtData[k]['Reference Image'] = filename;
                                if (filename != '') {
                                    imgFileNames.push(filename);
                                }
                            }
                            else {
                                xlsxExprtData[k]['Reference Image'] = "";
                            }
                        }
                        if (expData[i]["reference"].includes('src="/images/products/image/')) {
                            if (expData[i]["reference"].includes('data-cke-saved-src="/images/products/image/')) {
                                let start = parseInt(expData[i]["reference"].search(' src="/images/products/image/')) + parseInt(29);
                                let end = expData[i]["reference"].search('" style=');
                                let filename = expData[i]["reference"].substring(start, end).replace(/[&\/\\#,+()$~%'":*?<>{}]/g, "").trim();


                                if (fs.existsSync(filepath + filename)) {
                                    xlsxExprtData[k]['Reference Image'] = filename;;
                                    imgFileNames.push(filename);

                                }
                                else {
                                    xlsxExprtData[k]['Reference Image'] = "";
                                }
                            } else {
                                let start = parseInt(expData[i]["reference"].search('image/')) + parseInt(6);
                                let end = expData[i]["reference"].search('" style=');
                                let filename = expData[i]["reference"].substring(start, end).replace(/[&\/\\#,+()$~%'":*?<>{}]/g, "").trim();
                                imgFileNames.push(filename);

                                if (fs.existsSync(filepath + filename)) {
                                    xlsxExprtData[k]['Reference Image'] = filename;
                                    imgFileNames.push(filename);
                                }
                                else {
                                    xlsxExprtData[k]['Reference Image'] = "";
                                }
                            }
                        }


                    } else {
                        xlsxExprtData[k]['Reference Image'] = '';
                    }
                    xlsxExprtData[k]['Calculation'] = expData[i].calculation;
                    if (expData[i].calculation == null) {
                        xlsxExprtData[k]['Calculation Image'] = '';
                    } else if (expData[i]["calculation"].includes('src')) {
                        if (expData[i]["calculation"].includes('src="static/controllers/output/')) {
                            let start = parseInt(expData[i]["calculation"].search('output/')) + parseInt(7);
                            let end = expData[i]["calculation"].search('>');
                            let filename = expData[i]["calculation"].substring(start, end).replace(/[&\/\\#,+()$~%'":*?<>{}]/g, "").trim();


                            if (fs.existsSync(filepath1 + filename)) {
                                xlsxExprtData[k]['Calculation Image'] = filename;
                                if (filename != '') {
                                    imgFileNames.push(filename);
                                }
                            }
                            else {
                                xlsxExprtData[k]['Calculation Image'] = "";
                            }
                        }
                        if (expData[i]["calculation"].includes('src="/images/products/image/')) {
                            if (expData[i]["calculation"].includes('data-cke-saved-src="/images/products/image/')) {
                                let start = parseInt(expData[i]["calculation"].search(' src="/images/products/image/')) + parseInt(29);
                                let end = expData[i]["calculation"].search('" style=');
                                let filename = expData[i]["calculation"].substring(start, end).replace(/[&\/\\#,+()$~%'":*?<>{}]/g, "").trim();


                                if (fs.existsSync(filepath + filename)) {
                                    xlsxExprtData[k]['Calculation Image'] = filename;;
                                    imgFileNames.push(filename);

                                }
                                else {
                                    xlsxExprtData[k]['Calculation Image'] = "";
                                }
                            } else {
                                let start = parseInt(expData[i]["calculation"].search('image/')) + parseInt(6);
                                let end = expData[i]["calculation"].search('" style=');
                                let filename = expData[i]["calculation"].substring(start, end).replace(/[&\/\\#,+()$~%'":*?<>{}]/g, "").trim();
                                imgFileNames.push(filename);

                                if (fs.existsSync(filepath + filename)) {
                                    xlsxExprtData[k]['Calculation Image'] = filename;
                                    imgFileNames.push(filename);
                                }
                                else {
                                    xlsxExprtData[k]['Calculation Image'] = "";
                                }
                            }
                        }
                    } else {
                        xlsxExprtData[k]['Calculation Image'] = '';
                    }

                    if (expData[i]["Question Image"] == null) {
                        xlsxExprtData[k]['Question Image'] = expData[i]["Question Image"];
                    } else if (expData[i]["Question Image"].includes("<img")) {
                        if (expData[i]["Question Image"].includes('<del ')) {
                            let start = parseInt(expData[i]["Question Image"].search('<del '));
                            let end = parseInt(expData[i]["Question Image"].search('</del>')) + parseInt(6);
                            expData[i]["Question Image"] = expData[i]["Question Image"].replace(expData[i]["Question Image"].slice(start, end), "");
                        }
                        if (expData[i]["Question Image"].includes('src="/images/products/image/')) {
                            if (expData[i]["Question Image"].includes('data-cke-saved-src="/images/products/image/')) {
                                let start = parseInt(expData[i]["Question Image"].search(' src="/images/products/image/')) + parseInt(29);
                                let end = expData[i]["Question Image"].search('" style=');
                                let filename = expData[i]["Question Image"].substring(start, end).replace(/[&\/\\#,+()$~%'":*?<>{}]/g, "").trim();

                                if (fs.existsSync(filepath + filename)) {
                                    xlsxExprtData[k]['Question Image'] = filename;;
                                    imgFileNames.push(filename);

                                }
                                else {
                                    xlsxExprtData[k]['Question Image'] = "";
                                }
                            } else {
                                let start = parseInt(expData[i]["Question Image"].search('image/')) + parseInt(6);
                                let end = expData[i]["Question Image"].search('" style=');
                                let filename = expData[i]["Question Image"].substring(start, end).replace(/[&\/\\#,+()$~%'":*?<>{}]/g, "").trim();
                                imgFileNames.push(filename);
                                if (fs.existsSync(filepath + filename)) {
                                    xlsxExprtData[k]['Question Image'] = filename;
                                    imgFileNames.push(filename);
                                }
                                else {
                                    xlsxExprtData[k]['Question Image'] = "";
                                }
                            }
                        }
                        if (expData[i]["Question Image"].includes('src="static/controllers/output/')) {
                            let start = parseInt(expData[i]["Question Image"].search('output/')) + parseInt(7);
                            let end = expData[i]["Question Image"].search('" style=');
                            if (end == -1)
                                end = expData[i]["Question Image"].search('>');
                            let filename = expData[i]["Question Image"].substring(start, end).replace(/[&\/\\#,+()$~%'":*?<>{}]/g, "").trim();

                            if (fs.existsSync(filepath1 + filename)) {
                                xlsxExprtData[k]['Question Image'] = filename;
                                imgFileNames.push(filename);
                            }
                            else {
                                xlsxExprtData[k]['Question Image'] = "";
                            }
                        }
                    } else {
                        xlsxExprtData[k]['Question Image'] = "";
                    }
                    if (expData[i].question_type == 'CS' && expData[i].parent_qb_id == 0) {
                        xlsxExprtData[k]['Alternative 1 Image'] = ''
                        xlsxExprtData[k]['Alternative 2 Image'] = ''
                        xlsxExprtData[k]['Alternative 3 Image'] = ''
                        xlsxExprtData[k]['Alternative 4 Image'] = ''


                    }
                    for (var j = 0, m = 1; j < parseInt(expData[i].number_of_alternatives); j++ , m++) {
                        if (expData[i + j].alternative == null) {
                            xlsxExprtData[k]['Alternative ' + m + ' Image'] = expData[i + j].alternative;
                        }
                        else {

                            if (expData[i + j].alternative.includes('<del ')) {
                                let start = parseInt(expData[i + j].alternative.search('<del '));
                                let end = parseInt(expData[i + j].alternative.search('</del>')) + parseInt(6);
                                expData[i + j].alternative = expData[i + j].alternative.replace(expData[i + j].alternative.slice(start, end), "");
                            }
                            if (expData[i + j].alternative.includes("<img")) {
                                if (expData[i + j].alternative.includes('src="/images/products/image/')) {
                                    let start = parseInt(expData[i + j].alternative.search(' src="/images/products/image/')) + parseInt(29);
                                    let end = expData[i + j].alternative.search('" style=');
                                    let filename = expData[i + j].alternative.substring(start, end).replace(/[&\/\\#,+()$~%'":*?<>{}]/g, "").trim();
                                    if (fs.existsSync(filepath + filename)) {
                                        // xlsxExprtData[k]['Alternative ' + count] =expData[i + j].alternative.replace(/<img[^>]*>/g,"");
                                        // xlsxExprtData[k]['Alternative ' + count] = stripHtml(xlsxExprtData[k]['Alternative ' + count],{"ignoreTags":['img']}); 
                                        imgFileNames.push(filename);
                                        xlsxExprtData[k]['Alternative ' + m + ' Image'] = filename;
                                    }
                                    else {
                                        // xlsxExprtData[k]['Alternative ' + count] = expData[i + j].alternative.replace(/<img[^>]*>/g,""); 
                                        //xlsxExprtData[k]['Alternative ' + count] = stripHtml(xlsxExprtData[k]['Alternative ' + count],{"ignoreTags":['img']}); 
                                        xlsxExprtData[k]['Alternative ' + m + ' Image'] = "";
                                    }

                                }
                                if (expData[i + j].alternative.includes('src="static/controllers/output/')) {
                                    let start = parseInt(expData[i + j].alternative.search('output/')) + parseInt(7);
                                    let end = expData[i + j].alternative.search('" style=');
                                    if (end == -1)
                                        end = expData[i + j].alternative.search('>');
                                    let filename = expData[i + j].alternative.substring(start, end).replace(/[&\/\\#,+()$~%'":*?<>{}]/g, "").trim();

                                    if (fs.existsSync(filepath1 + filename)) {
                                        imgFileNames.push(filename);
                                        // xlsxExprtData[k]['Alternative ' + count] =expData[i + j].alternative.replace(/<img[^>]*>/g,""); 
                                        // xlsxExprtData[k]['Alternative ' + count] = entities.decode(stripHtml(xlsxExprtData[k]['Alternative ' + count],{"ignoreTags":['img']}));  
                                        xlsxExprtData[k]['Alternative ' + m + ' Image'] = filename;

                                    }
                                    else {
                                        // xlsxExprtData[k]['Alternative ' + count] = expData[i + j].alternative.replace(/<img[^>]*>/g,""); 
                                        //xlsxExprtData[k]['Alternative ' + count] = entities.decode(stripHtml(xlsxExprtData[k]['Alternative ' + count],{"ignoreTags":['img']}));
                                        xlsxExprtData[k]['Alternative ' + m + ' Image'] = "";
                                    }
                                }
                            } else {
                                xlsxExprtData[k]['Alternative ' + m + ' Image'] = "";

                            }
                        }


                    }

                    xlsxExprtData[k]['Alternative 5 Image'] = "";
                    xlsxExprtData[k]['Alternative 6 Image'] = "";
                    xlsxExprtData[k]['Alternative 7 Image'] = "";
                    xlsxExprtData[k]['Alternative 8 Image'] = "";
                    xlsxExprtData[k]['Alternative 9 Image'] = "";

                    xlsxExprtData[k]['Status (Active / Inactive)'] = expData[i].status;
                    xlsxExprtData[k]['Author_Name'] = expData[i].author_name;
                    if (expData[i].flag != '' || expData[i].flag != null || expData[i].flag != undefined) {
                        if (expData[i].flag == 'null') {
                            xlsxExprtData[k]['Flag'] = ''
                        }
                        else
                            xlsxExprtData[k]['Flag'] = expData[i].flag
                    }
                    else {
                        xlsxExprtData[k]['Flag'] = ''
                    }

                    var parentQuesId = parseInt(expData[i].parent_qb_id);
                    if (!(expData[i].question_type == 'CS' && parentQuesId == 0)) {
                        if (expData[i].number_of_alternatives != null) {
                            i = (i + j) - 1;
                        }
                    }

                    k++;
                }
                function onlyUnique(value, index, self) {
                    return self.indexOf(value) === index;
                }
                var fields = [];
                for (var m in xlsxExprtData[0]) fields.push(m);
                // var csv = json2csv({data: xlsxExprtData, fields: fields});
                //fs.writeFileSync(rootPath + '/uploads/csv_download/data.csv', csv, 'binary');
                var xls = json2xls(xlsxExprtData, { fields: fields });
                var xlsfilename = "data_" + (new Date).getTime() + ".xlsx";
                fs.writeFileSync(rootPath + '/uploads/csv_download/' + xlsfilename, xls, 'binary');

                var csvfilepath = rootPath + '/uploads/csv_download/' + xlsfilename;
                var getStream = function (fileName) {
                    return fs.readFileSync(fileName);
                }
                //archiver code start
                var output = fs.createWriteStream(rootPath + '/uploads/csv_download/data.zip');
                var archive = archiver('zip');
                archive.pipe(output);
                archive.on('error', function (err) {
                    throw err;
                });
                var uniqueImages = imgFileNames.filter(onlyUnique);
                archive.append(getStream(csvfilepath), { name: xlsfilename });
                for (var k in uniqueImages) {
                    var img = rootPath + '/server/controllers/output/' + uniqueImages[k];
                    var img1 = rootPath + '/public/images/products/image/' + uniqueImages[k];
                    if (fs.existsSync(img)) {
                        archive.append(getStream(img), { name: uniqueImages[k] });
                    }
                    else if (fs.existsSync(img1)) {
                        archive.append(getStream(img1), { name: uniqueImages[k] });
                    }
                }
                archive.finalize();
                //archiver code end
                output.on('close', function () {
                    res.send({
                        code: 0,
                        message: "success",
                        obj: "/uploads/csv_download/data.zip"
                    });
                });

            });
    },
    saveQuestionFromFile: function (row, hashmap_pri_keys, userName, qid, maxqbId, xlsfilename, pk_array) {
        let flag = row.getCell('Flag').text;
        var course = row.getCell('Course').text;
        course = course + "";
        course = course.replace("?", "-");
        course = course.trim();

        var subject = row.getCell('Subject').text;
        subject = subject + "";
        subject = subject.replace("?", "-");
        subject = subject.trim();

        var module = row.getCell('Module').text;
        module = module + "";
        module = module.replace("?", "-");
        module = module.trim();

        var topic = row.getCell('Topic').text;
        topic = topic + "";
        topic = topic.replace("?", "-");
        topic = topic.trim();

        var pri_keys = []
        for (var i = 0; i < pk_array.length; i++) {
            if (pk_array[i].qba_course_code == course && pk_array[i].qba_subject_code == subject
                && pk_array[i].module_name == module && pk_array[i].qba_topic_code == topic) {
                pri_keys[0] = pk_array[i]
                break;
            }
            else {
                continue
            }
        }

        if (pri_keys != undefined && pri_keys != null && pri_keys.length > 0) {

            if (pri_keys[0].qba_course_pk == undefined || pri_keys[0].qba_course_pk == null) {
                return;
            }

            if (pri_keys[0].qba_subject_pk == undefined || pri_keys[0].qba_subject_pk == null) {
                return;
            }

            if (pri_keys[0].qba_module_pk == undefined || pri_keys[0].qba_module_pk == null) {
                return;
            }


            if (pri_keys[0].qba_topic_pk == undefined || pri_keys[0].qba_topic_pk == null) {
                return;
            }
            var excelPId = parseInt(row.getCell('Parent_QB_ID').text);
            if (row.getCell('Question_Type').text == "CS" && excelPId != 0 && row.getCell('Language').text == 'ENGLISH') {
                excelPId = excelPId + parseInt(maxqbId) - 1;
            }
            var actualQbid = qid;

            if (row.getCell('Language').text !== 'ENGLISH') {
                actualQbid = row.getCell('QB_ID').value;
            }
            var d = new Date();
            let remarks, reference, calculation;

            if (!row.getCell('Remarks Image').value) {
                remarks = row.getCell('Remarks').text;
            }
            else {
                remarks = (row.getCell("Remarks Image").value != null && row.getCell('Remarks').value == null) ? '<img src="static/controllers/output/' + row.getCell("Remarks Image").value + '" >' : row.getCell('Remarks').value + ' <img src="static/controllers/output/' + row.getCell("Remarks Image").value + '" >';
            }
            if (!row.getCell('Reference Image').value) {
                reference = row.getCell('Reference').text;
            }
            else {
                reference = (row.getCell("Reference Image").value != null && row.getCell('Reference').value == null) ? '<img src="static/controllers/output/' + row.getCell("Reference Image").value + '" >' : row.getCell('Reference').value + ' <img src="static/controllers/output/' + row.getCell("Reference Image").value + '" >';
            }
            if (!row.getCell('Calculation Image').value) {
                calculation = row.getCell('Calculation').text;
            }
            else {
                calculation = (row.getCell("Calculation Image").value != null && row.getCell('Calculation').value == null) ? '<img src="static/controllers/output/' + row.getCell("Calculation Image").value + '" >' : row.getCell('Calculation').value + ' <img src="static/controllers/output/' + row.getCell("Calculation Image").value + '" >';
            }

            if (flag == 'A') {
                return qstn_bank.create({
                    //sr_no:row.getCell('sr_no').value,
                    sr_no: 0,
                    qst_type: row.getCell('Question_Type').text,
                    qst_lang: row.getCell('Language').text,
                    qst_pid: excelPId,
                    no_of_question: row.getCell('No_of_Questions').value,
                    qst_sub_seq_no: '0',
                    qst_body: row.getCell('Question_Body').text,
                    qst_marks: row.getCell('Marks').value,
                    qst_neg_marks: row.getCell('Negative_Marks').value,
                    qst_expiry_dt: new Date(),
                    qst_no_of_altr: row.getCell('Number_of_Alternatives').value,
                    qst_img_fk: hashmap_pri_keys[row.getCell('Question Image').text],
                    qst_remarks: remarks,
                    qst_fk_tpc_pk: '0',
                    qst_dimension: 'Dimension',
                    qst_is_active: row.getCell('Status (Active / Inactive)').text,
                    qst_audit_by: userName,
                    qst_audit_dt: new Date(),
                    qb_assigned_to: '0',
                    qb_status_fk: '0',
                    qba_topic_fk: pri_keys[0].qba_topic_pk,
                    qba_subject_fk: pri_keys[0].qba_subject_pk,
                    qba_course_fk: pri_keys[0].qba_course_pk,
                    reference_info: reference,
                    calculation_info: calculation,
                    // qb_id: r['QB_ID'],
                    qb_id: actualQbid,
                    qba_module_fk: pri_keys[0].qba_module_pk,
                    // author_name: authorName
                    author_name: row.getCell('Author_Name').text
                }).then(question => {
                    var arr_alternatives = [];
                    var no_of_alternative = row.getCell('Number_of_Alternatives').value;
                    var correct_ans_num = row.getCell('Correct Alternative').value;
                    for (var i = 1; i <= no_of_alternative; i++) {
                        var altImage = "Alternative " + i + " Image";

                        var option = "Alternative " + i;
                        var obj = new Object();
                        var is_correct = 'N';
                        if (correct_ans_num == i) {
                            is_correct = 'Y';
                        }

                        obj.qta_qst_id = question.qb_pk;
                        //obj.qta_id = r['QB_ID'];
                        obj.qta_id = actualQbid;
                        obj.qta_alt_desc = row.getCell(option).text;
                        obj.qta_order = i;
                        obj.qta_is_corr_alt = is_correct;
                        obj.qta_is_active = 'Y';
                        obj.qta_img_fk = hashmap_pri_keys[row.getCell(altImage).text];
                        obj.qta_audit_by = userName;
                        obj.qta_audit_dt = new Date();
                        arr_alternatives.push(obj);
                    }
                    if (no_of_alternative > 0)
                        return qstn_alternatives.bulkCreate(arr_alternatives);
                });
            } else if (flag == 'M') {
                qstn_bank.update({
                    qst_body: row.getCell('Question_Body').text,
                    author_name: row.getCell('Author_Name').text,
                    reference_info: reference,
                    calculation_info: calculation,
                    qst_remarks: remarks,
                    qst_marks: row.getCell('Marks').value,
                    qst_neg_marks: row.getCell('Negative_Marks').value,
                    qst_is_active: row.getCell('Status (Active / Inactive)').text,
                    no_of_question: row.getCell('No_of_Questions').value,
                    qst_no_of_altr: row.getCell('Number_of_Alternatives').value,
                    qst_img_fk: hashmap_pri_keys[row.getCell('Question Image').text],
                    //topic course subject updations
                    qba_module_fk: pri_keys[0].qba_module_pk,
                    qba_topic_fk: pri_keys[0].qba_topic_pk
                    //qba_subject_fk: pri_keys[0].qba_subject_pk,
                    //qba_course_fk: pri_keys[0].qba_course_pk

                }, {
                    where: {
                        qb_id: row.getCell('QB_ID').value,
                        qst_lang: row.getCell('Language').text
                    },
                    returning: true,
                    plain: true
                }).then(question => {
                    var no_of_alternative = row.getCell('Number_of_Alternatives').value;
                    var no_of_alternative = row.getCell('Number_of_Alternatives').value;
                    var correct_ans_num = row.getCell('Correct Alternative').value;
                    qstn_alternatives.destroy({
                        where: {
                            qta_id: row.getCell('QB_ID').value
                        }
                    })
                    var arr_alternatives = [];
                    for (var i = 1; i <= no_of_alternative; i++) {
                        var obj = new Object()
                        var altImage = "Alternative " + i + " Image";
                        var option = "Alternative " + i;
                        var is_correct = 'N';
                        if (correct_ans_num == i) {
                            is_correct = 'Y';
                        }
                        obj.qta_alt_desc = row.getCell(option).text;
                        obj.qta_is_corr_alt = is_correct;
                        obj.qta_img_fk = hashmap_pri_keys[row.getCell(altImage).value];
                        obj.qta_audit_by = userName;
                        obj.qta_audit_dt = new Date();
                        obj.qta_id = row.getCell('QB_ID').value;
                        obj.qta_order = i;
                        obj.qta_qst_id = question[1].dataValues.qb_pk;
                        obj.qta_is_active = 'A'
                        arr_alternatives.push(obj);

                    }
                    if (no_of_alternative > 0)
                        return qstn_alternatives.bulkCreate(arr_alternatives);
                });
            }

            //}



        } else {

        }
        //});

    },
    savePaperAdminQuestionFromFile: function (row, hashmap_pri_keys, userName, exam_fk, exampaper_fk) {
        var course = row.getCell('Course').value;
        course = course + " ";
        course = course.replace("?", "-");
        course = course.trim();

        var subject = row.getCell('Subject').value;
        subject = subject + " ";
        subject = subject.replace("?", "-");
        subject = subject.trim();

        var module = row.getCell('Module').value;
        module = module + " ";
        module = module.replace("?", "-");
        module = module.trim();

        var topic = row.getCell('Topic').value;
        topic = topic + " ";
        topic = topic.replace("?", "-");
        topic = topic.trim();
        if (row.getCell('Question Image').value != undefined && row.getCell('Question Image').value != null && row.getCell('Question Image').value != "")
            var temp = '<img src="static/controllers/output/' + row.getCell('Question Image').value + '">'
        else
            var temp = ''
        var searchIdsQuery = "select qba_course_pk,qba_subject_pk,qba_module_pk,qba_topic_pk " +
            " from qba_course_master inner join qba_subject_master on (qba_course_fk=qba_course_pk) " +
            " inner join qba_module_mstr on (qba_subject_fk=qba_subject_pk) " +
            " inner join qba_topic_master on (qba_module_fk=qba_module_pk) " +
            " where qba_course_code='" + course + "' " +
            " and qba_subject_code='" + subject + "' " +
            " and module_name='" + module + "' " +
            " and qba_topic_code='" + topic + "'";
        sequelize.query(searchIdsQuery, { type: sequelize.QueryTypes.SELECT })
            .then(pri_keys => {

                if (pri_keys != null) {

                    qstn_bank.update({
                        qst_body: row.getCell('Question_Body').value + temp,
                        img_fk: null
                    }, {
                        where: {
                            qb_id: row.getCell('QB_ID').value,
                            qst_lang: row.getCell('Language').value

                        },
                        returning: true,
                        plain: true
                    }).then(question => {

                        qstn_alternatives.destroy({
                            where: {
                                qta_qst_id: question[1].dataValues.qb_pk,
                            }
                        }).then(removeOpt => {
                            var arr_alternatives = [];
                            var no_of_alternative = row.getCell('Number_of_Alternatives').value;
                            var correct_ans_num = row.getCell('Correct Alternative').value;
                            for (var i = 1; i <= no_of_alternative; i++) {
                                var altImage = "Alternative " + i + " Image";

                                var option = "Alternative " + i;
                                var obj = new Object();
                                var is_correct = 'N';
                                if (correct_ans_num == i) {
                                    is_correct = 'Y';
                                }

                                obj.qta_qst_id = question[1].dataValues.qb_pk;
                                obj.qta_id = row.getCell('QB_ID').value;
                                obj.qta_alt_desc = row.getCell(option).value;
                                obj.qta_order = i;
                                obj.qta_is_corr_alt = is_correct;
                                obj.qta_is_active = 'Y';
                                obj.qta_img_fk = hashmap_pri_keys[row.getCell(altImage).value];
                                obj.qta_audit_by = userName;
                                obj.qta_audit_dt = new Date();
                                arr_alternatives.push(obj);
                            }
                            if (no_of_alternative > 0)
                                qstn_alternatives.bulkCreate(arr_alternatives);
                        });

                    });


                    culled_qstn_bank.update({
                        qst_body: row.getCell('Question_Body').value + temp

                    }, {
                        where: {
                            qb_id: row.getCell('QB_ID').value,
                            qst_lang: row.getCell('Language').value,
                            exam_fk: exam_fk,
                            exampaper_fk: exampaper_fk
                        },
                        returning: true,
                        plain: true
                    }).then(question => {
                        culled_qstn_alternatives.destroy({
                            where: {
                                qta_qst_id: question[1].dataValues.qb_pk,
                                exam_fk: exam_fk,
                                exampaper_fk: exampaper_fk
                            }
                        }).then(removeOpt => {
                            var arr_alternatives = [];
                            var no_of_alternative = row.getCell('Number_of_Alternatives').value;
                            var correct_ans_num = row.getCell('Correct Alternative').value;
                            for (var i = 1; i <= no_of_alternative; i++) {
                                var altImage = "Alternative " + i + " Image";

                                var option = "Alternative " + i;
                                var obj = new Object();
                                var is_correct = 'N';
                                if (correct_ans_num == i) {
                                    is_correct = 'Y';
                                }

                                obj.qta_qst_id = question[1].dataValues.qb_pk;
                                obj.qta_id = row.getCell('QB_ID').value;
                                if (row.getCell(altImage).value != undefined || row.getCell(altImage).value != null || row.getCell(altImage).value != '') {
                                    var temp1 = '<img src="static/controllers/output/' + row.getCell(altImage).value + '">'
                                }
                                else {
                                    var temp1 = ''
                                }
                                if (temp1 == '<img src="static/controllers/output/">' || temp1 == '<img src="static/controllers/output/null">') {
                                    temp1 = ''
                                }
                                obj.qta_alt_desc = row.getCell(option).value + temp1;
                                obj.qta_order = i;
                                obj.qta_is_corr_alt = is_correct;
                                obj.qta_is_active = 'Y';
                                //     obj.qta_img_fk = hashmap_pri_keys[row.getCell(altImage).value];
                                obj.qta_audit_by = userName;
                                obj.qta_audit_dt = new Date();
                                obj.exam_fk = exam_fk;
                                obj.exampaper_fk = exampaper_fk;
                                arr_alternatives.push(obj);
                            }
                            if (no_of_alternative > 0)
                                culled_qstn_alternatives.bulkCreate(arr_alternatives);
                        })
                    });
                }
            });
    },
    fileUploadMethod: function (fileObject) {
        var rootPath = "D:/QBAutheringApp";
        return new Promise(function (f, r) {
            fileObject.upload({
                dirname: rootPath + "/uploads/"
            }, function (err, uploadedFiles) {
                for (var i = 0; i < uploadedFiles.length; i++) {
                    var file = uploadedFiles[i].fd.split("/");
                    var filename = file[file.length - 1];
                    f({
                        filename: "uploads/" + filename
                    })
                }
            });
        })
    },

    loadInactiveQuestionsAdmin: function (req, res) {

        var course_fk = req.body.course_fk;
        var course = req.body.course;
        var subject_code = req.body.subject_code;
        var moduleId = req.body.moduleId;

        var exampaper_fk = req.body.exampaper_pk;
        var exam_fk = req.body.exam_id;
        var qstType = req.body.qstType;
        var alldata = req.body;


        var filteredQuery = "select *, qta_is_corr_alt,qta_alt_desc,alterimage.qbi_image_name as aimage from  " +
            "(select dense_rank()over(order by  un_id) rnk,qb_pk, qba_topic_fk, qba_course_name,qstn_bank.qba_course_fk,qstn_bank.qba_subject_fk,qstn_bank.qst_no_of_altr,no_of_question,qstn_bank.qba_module_fk,subject_name,qstn_bank.qba_subject_fk,qstn_bank.qba_course_fk,qba_topic_fk,module_name,topic_name,qba_topic_code,qst_marks,qst_neg_marks, qst_lang,qst_type, " +
            "qst_pid,qst_body,qst_no_of_altr,qst_remarks,calculation_info,  reference_info,qst_is_active,qst_audit_by,qst_audit_dt,questionimage.qbi_image_name as qimage,qb_id " +
            "from  ( select qb_pk un_id,* from qstn_bank a   where (case when  qst_type  = 'CS' and qst_pid  > 0  then 1 else 2 end) =2 " +
            "union ALL " +
            "select a.qb_pk un_id,b.* from qstn_bank a   inner join  qstn_bank b on  a.qst_lang= b.qst_lang and a.qb_id=b.qst_pid  " +
            "where  a.qst_type = 'CS' and a.qst_pid = 0   )qstn_bank " +
            "inner join qba_topic_master on (qba_topic_master.qba_topic_pk=qstn_bank.qba_topic_fk) " +
            "inner join qba_module_mstr on (qba_module_mstr.qba_module_pk=qba_topic_master.qba_module_fk) " +
            "inner join qba_subject_master on (qba_subject_master.qba_subject_pk=qba_module_mstr.qba_subject_fk) " +
            "inner join qba_course_master on (qba_course_master.qba_course_pk=qba_subject_master.qba_course_fk) " +
            "LEFT OUTER JOIN qbank_images as questionimage ON  (qstn_bank.qst_img_fk = questionimage.qbi_pk) where " +
            "qstn_bank.qba_module_fk IN (" + moduleId + ") and  qst_lang = 'ENGLISH' and  qst_type = '" + qstType + "' and qstn_bank.qst_is_active ='A'  and qstn_bank.qba_course_fk = '" + course_fk + "' and qstn_bank.qba_subject_fk = '" + subject_code + "' order by qb_pk)a " + //("+moduleId+")
            "left join qstn_alternatives on(qstn_alternatives.qta_qst_id=a.qb_pk) " +
            "LEFT OUTER JOIN qbank_images as alterimage  ON (qstn_alternatives.qta_img_fk = alterimage.qbi_pk)  where  qb_pk:: text not in ( select unnest(exam_qb_pk) from qba.qba_exam_paper where exampaper_pk:: text in( select unnest(new_exampaper_pk)  from qba.qba_exam_paper where exampaper_pk =" + exampaper_fk + ")) and  qb_id not in (select qb_id from culled_qstn_bank where exampaper_fk = '" + exampaper_fk + "' and exam_fk = '" + exam_fk + "' and qba_module_fk IN (" + moduleId + ") ) " +
            "order by rnk,qb_pk,qta_order";



        var countQuery = "select count(1) as qst_count from qstn_bank where qba_module_fk in (" + moduleId + ") and qst_lang = 'ENGLISH' and  (case when  qst_type  = 'CS' and qst_pid  > 0  then 1 else 2 end) =2 " +
            "and qba_module_fk in (" + moduleId + ") and qst_type = '" + qstType + "'   and qb_id not in (select qb_id from culled_qstn_bank where exampaper_fk = '" + exampaper_fk + "' and exam_fk = '" + exam_fk + "' and  qba_module_fk in (" + moduleId + ")) ";

        sequelize.query(countQuery, { type: sequelize.QueryTypes.SELECT })
            .then(c => {
                sequelize.query(filteredQuery, { type: sequelize.QueryTypes.SELECT })
                    .then(searchResult => {

                        req.body.result = searchResult;
                        req.body.count = c;
                        importMethods.parseQuestionBankData(req, res);
                    });
            });
    },


    loadCaseInAdmin: function (req, res) {

        var course_fk = req.body.course_fk;
        var course = req.body.course;
        var subject_code = req.body.subject_code;
        var moduleId = req.body.moduleId;

        var exampaper_fk = req.body.exampaper_pk;
        var exam_fk = req.body.exam_id;
        var qstType = req.body.qstType;
        var alldata = req.body;

        var filteredcaseQuery = "select *, qta_is_corr_alt,qta_alt_desc,alterimage.qbi_image_name as aimage from  " +
            "(select dense_rank()over(order by  module_name,qba_topic_code,un_id) rnk,qb_pk, qba_topic_fk, qba_course_name,qstn_bank.qba_course_fk,qstn_bank.qba_subject_fk,qstn_bank.qst_no_of_altr,no_of_question,qstn_bank.qba_module_fk,subject_name,module_name,topic_name,qba_topic_code,qst_marks,qst_neg_marks, qst_lang,qst_type, " +
            "qst_pid,qst_body,qst_no_of_altr,qst_remarks,calculation_info,  reference_info,qst_is_active,qst_audit_by,qst_audit_dt,questionimage.qbi_image_name as qimage,qb_id " +
            "from  ( select qb_pk un_id,* from qstn_bank a   where (case when  qst_type  = 'CS' and qst_pid  > 0  then 1 else 2 end) =2 " +
            "union ALL " +
            "select a.qb_pk un_id,b.* from qstn_bank a   inner join  qstn_bank b on  a.qst_lang= b.qst_lang and a.qb_id=b.qst_pid  " +
            "where  a.qst_type = 'CS' and a.qst_pid = 0   )qstn_bank " +
            "inner join qba_topic_master on (qba_topic_master.qba_topic_pk=qstn_bank.qba_topic_fk) " +
            "inner join qba_module_mstr on (qba_module_mstr.qba_module_pk=qba_topic_master.qba_module_fk) " +
            "inner join qba_subject_master on (qba_subject_master.qba_subject_pk=qba_module_mstr.qba_subject_fk) " +
            "inner join qba_course_master on (qba_course_master.qba_course_pk=qba_subject_master.qba_course_fk) " +
            "LEFT OUTER JOIN qbank_images as questionimage ON  (qstn_bank.qst_img_fk = questionimage.qbi_pk) where " +
            "qstn_bank.qba_module_fk IN (" + moduleId + ") and  qst_lang = 'ENGLISH' and  qst_type = '" + qstType + "' and qst_is_active = \'A\'  and qstn_bank.qba_course_fk = '" + course_fk + "' and qstn_bank.qba_subject_fk = '" + subject_code + "' order by qb_pk)a " + //("+moduleId+")
            "left join qstn_alternatives on(qstn_alternatives.qta_qst_id=a.qb_pk) " +
            "LEFT OUTER JOIN qbank_images as alterimage  ON (qstn_alternatives.qta_img_fk = alterimage.qbi_pk)  where   qb_id not in (select qb_id from culled_qstn_bank where exampaper_fk = '" + exampaper_fk + "' and exam_fk = '" + exam_fk + "' and qba_module_fk IN (" + moduleId + ") ) " +
            "order by rnk,module_name,qba_topic_code,qb_id,qta_order";


        var countQuery = "select count(1) as qst_count from qstn_bank where qba_module_fk in (" + moduleId + ") and qst_lang = 'ENGLISH' and  (case when  qst_type  = 'CS' and qst_pid  > 0  then 1 else 2 end) =2 " +
            "and qba_module_fk in (" + moduleId + ") and qst_type = '" + qstType + "'   and qb_pk not in (select qb_pk from culled_qstn_bank where exampaper_fk = '" + exampaper_fk + "' and exam_fk = '" + exam_fk + "' and  qba_module_fk in (" + moduleId + ")) ";

        sequelize.query(countQuery, { type: sequelize.QueryTypes.SELECT })
            .then(c => {
                sequelize.query(filteredcaseQuery, { type: sequelize.QueryTypes.SELECT })
                    .then(searchResult => {

                        req.body.result = searchResult;
                        req.body.count = c[0].qst_count;
                        importMethods.parseQuestionBankData(req, res);
                    });
            });
    },





    saveMCQ: function (req, res) {
        importMethods.checkValidUser(req, res);

        var questionData = req.body

        // to check same questions entered multiple times
        if (!questionData.negativeMarks) {
            questionData.negativeMarks = 0
        }
        qstn_bank.findAll({
            where: {
                qst_body: {
                    [Op.iLike]: questionData.question
                }
            }
        }).then(questions => {
            if (questions.length == 0) {
                sequelize.query("select nextval('qb_id_val') as val", { type: sequelize.QueryTypes.SELECT })
                    .then(next_qb_id => {
                        var a = now1()
                        qstn_bank.create({
                            qst_type: questionData.type,
                            qst_lang: 'ENGLISH',
                            qst_pid: questionData.parentId,
                            qst_sub_seq_no: '0',
                            qst_body: questionData.question,
                            qst_marks: questionData.marks,
                            qst_neg_marks: questionData.negativeMarks,
                            qst_expiry_dt: new Date(),
                            qst_no_of_altr: questionData.numOfAlternatives,
                            qst_img_fk: null,
                            qst_remarks: questionData.remark != '' ? questionData.remark : null,
                            qst_fk_tpc_pk: '0',
                            qst_dimension: 'Dimension',
                            qst_is_active: 'A',
                            qst_audit_by: questionData.userName,
                            author_name: questionData.userName,
                            qst_audit_dt: new Date(),
                            qb_assigned_to: '0',
                            qb_status_fk: '0',
                            qba_topic_fk: questionData.topicId,
                            qba_subject_fk: questionData.subjectId,
                            qba_course_fk: questionData.courseId,
                            reference_info: questionData.reference != '' ? questionData.reference : null,
                            calculation_info: questionData.calculations != '' ? questionData.calculations : null,
                            qb_id: next_qb_id[0].val,
                            qba_module_fk: questionData.moduleId,
                            no_of_question: '0'
                        }).then(question => {
                            var b = now1()
                            console.log("Insertion ", (b - a).toFixed(3))
                            var arr_alternatives = [];
                            for (var i = 1; i <= questionData.numOfAlternatives; i++) {
                                var obj = new Object();
                                obj.qta_qst_id = question.qb_pk;
                                obj.qta_id = question.qb_id;
                                obj.qta_alt_desc = questionData.alternatives[i - 1].text;
                                obj.qta_order = i;
                                obj.qta_is_corr_alt = questionData.alternatives[i - 1].isCorrect;
                                obj.qta_is_active = 'A';
                                obj.qta_audit_by = questionData.userName;
                                obj.qta_audit_dt = new Date();
                                arr_alternatives.push(obj);
                            }
                            qstn_alternatives.bulkCreate(arr_alternatives).then(() => {
                                res.send({
                                    code: 0,
                                    message: "success",
                                    obj: question
                                })
                            });
                        })
                    })
            }
            else {
                res.send({
                    code: 0,
                    message: "Question already exists",
                    obj: {}
                })
            }
        })


    },


    saveMCQAdmin: function (req, res) {
        importMethods.checkValidUser(req, res);

        var questionData = req.body;
        if (!questionData.negativeMarks) {
            questionData.negativeMarks = 0
        }

        sequelize.query("select nextval('qb_id_val') as val", { type: sequelize.QueryTypes.SELECT })
            .then(next_qb_id => {

                qstn_bank.create({
                    qst_type: questionData.type,
                    qst_lang: 'ENGLISH',
                    qst_pid: questionData.parentId,
                    qst_sub_seq_no: '0',
                    qst_body: questionData.question,
                    qst_marks: questionData.marks,
                    qst_neg_marks: questionData.negativeMarks,
                    qst_expiry_dt: new Date(),
                    qst_no_of_altr: questionData.numOfAlternatives,
                    qst_img_fk: null,
                    qst_remarks: questionData.remark != '' ? questionData.remark : null,
                    qst_fk_tpc_pk: '0',
                    qst_dimension: 'Dimension',
                    qst_is_active: 'A',
                    qst_audit_by: questionData.userName,
                    author_name: questionData.userName,
                    qst_audit_dt: new Date(),
                    qb_assigned_to: '0',
                    qb_status_fk: '0',
                    qba_topic_fk: questionData.topicId,
                    qba_subject_fk: questionData.subjectId,
                    qba_course_fk: questionData.courseId,
                    reference_info: questionData.reference != '' ? questionData.reference : null,
                    calculation_info: questionData.calculations != '' ? questionData.calculations : null,
                    qb_id: next_qb_id[0].val,
                    qba_module_fk: questionData.moduleId
                }).then(question => {

                    var arr_alternatives = [];
                    for (var i = 1; i <= questionData.numOfAlternatives; i++) {
                        var obj = new Object();
                        obj.qta_qst_id = question.qb_pk;
                        obj.qta_id = question.qb_id;
                        obj.qta_alt_desc = questionData.alternatives[i - 1].text;
                        obj.qta_order = i;
                        obj.qta_is_corr_alt = questionData.alternatives[i - 1].isCorrect;
                        obj.qta_is_active = 'A';
                        obj.qta_audit_by = questionData.userName;
                        obj.qta_audit_dt = new Date();
                        arr_alternatives.push(obj);
                    }
                    qstn_alternatives.bulkCreate(arr_alternatives).then(() => {
                        res.send({
                            code: 0,
                            message: "success",
                            obj: question
                        })
                    });
                })
            })
    },

    editVetterQuestions: function (req, res) {
        importMethods.checkValidUser(req, res);
        var questionData = req.body;
        let topic_pk = questionData.selectedTopic;
        let qb_pk = questionData.qb_pk;
        let qb_id = questionData.qb_id;
        let exampaper_fk = questionData.exampaper_fk;
        let exam_fk = questionData.exam_id;
        let add_by = questionData.userName;
        let old_qta_fk = questionData.qb_id;
        let new_qta_fk = questionData.qb_id;
        let old_module_name = questionData.oldModuleName;
        let old_unit_name = questionData.oldUnitName;
        let oldobj = {
            marks: questionData.oldMarks,
            negative_marks: questionData.oldNegMarks,
            module: questionData.oldModuleName,
            unit: questionData.oldUnitName
        };
        let newobj = {
            marks: questionData.marks,
            negative_marks: questionData.negativeMarks,
            module: questionData.newModuleName,
            unit: questionData.newUnitName
        };
        let changeFlag = false;
        if (questionData.oldMarks != questionData.marks) {
            var log = "insert into culled_qstn_alternatives_log (exam_fk,exampaper_fk,qb_id,new_qta_fk,old_answer,new_answer,qta_audit_by,add_date,status,old_qta_fk) select " + exam_fk + "," + exampaper_fk + "," + qb_id + "," + qb_id + ",'" + questionData.oldMarks + "','" + questionData.marks + "','" + add_by + "',now(),'Marks'," + qb_id + "";
            sequelize.query(log).spread((results2, metadata2) => {
            });
            changeFlag = true;
            if (questionData.oldUnitPk == questionData.selectedTopic) {
                if (questionData.qst_type == 'M') {
                    var check = "select summary_id_pk as pk from qba_summary_admin where exam_fk = " + exam_fk + " and exampaper_fk =" + exampaper_fk + " and topic_pk = " + questionData.selectedTopic + " order by summary_id_pk limit 1";
                    sequelize.query(check).then(checkData => {
                        var query = "update qba_summary_admin set summary_marks = summary_marks - " + parseFloat(questionData.oldMarks) + " + " + parseFloat(questionData.marks) + " where exam_fk = " + exam_fk + " and exampaper_fk =" + exampaper_fk + " and topic_pk = " + questionData.selectedTopic + " and summary_id_pk = " + checkData[0][0].pk;
                        sequelize.query(query).then(checkData => { })
                    })
                }
                if (questionData.qst_type == 'CS') {
                    var check = "select case_summary_id_pk as pk from qba_case_summary_admin where exam_fk = " + exam_fk + " and exampaper_fk =" + exampaper_fk + " and topic_pk = " + questionData.oldUnitPk + " order by case_summary_id_pk limit 1"
                    sequelize.query(check).then(checkData => {
                        var query = "update qba_case_summary_admin set summary_marks = summary_marks - " + parseFloat(questionData.oldMarks) + "+ " + parseFloat(questionData.marks) + " where exam_fk = " + exam_fk + " and exampaper_fk =" + exampaper_fk + " and topic_pk = " + questionData.oldUnitPk + " and case_summary_id_pk =" + checkData[0][0].pk;
                        sequelize.query(query, { type: sequelize.QueryTypes.UPDATE }).then(responseData => {
                        })
                    })
                }
            }
        }
        if (questionData.oldNegMarks != questionData.negativeMarks) {
            changeFlag = true;
            var log = "insert into culled_qstn_alternatives_log (exam_fk,exampaper_fk,qb_id,new_qta_fk,old_answer,new_answer,qta_audit_by,add_date,status,old_qta_fk) select " + exam_fk + "," + exampaper_fk + "," + qb_id + "," + qb_id + ",'" + questionData.oldNegMarks + "','" + questionData.negativeMarks + "','" + add_by + "',now(),'Negative Marks'," + qb_id + "";
            sequelize.query(log).spread((results2, metadata2) => {
            })
        }
        if (questionData.oldModuleName != questionData.newModuleName) {
            changeFlag = true;
            var log = "insert into culled_qstn_alternatives_log (exam_fk,exampaper_fk,qb_id,new_qta_fk,old_answer,new_answer,qta_audit_by,add_date,status,old_qta_fk) select " + exam_fk + "," + exampaper_fk + "," + qb_id + "," + qb_id + ",'" + questionData.oldModuleName + "','" + questionData.newModuleName + "','" + add_by + "',now(),'Module'," + qb_id + "";
            sequelize.query(log).spread((results2, metadata2) => {
            })
        }
        if (questionData.oldUnitName != questionData.newUnitName) {
            changeFlag = true;
            var log = "insert into culled_qstn_alternatives_log (exam_fk,exampaper_fk,qb_id,new_qta_fk,old_answer,new_answer,qta_audit_by,add_date,status,old_qta_fk) select " + exam_fk + "," + exampaper_fk + "," + qb_id + "," + qb_id + ",'" + questionData.oldUnitName + "','" + questionData.newUnitName + "','" + add_by + "',now(),'Unit'," + qb_id + "";
            sequelize.query(log).spread((results2, metadata2) => {
            })
            if (questionData.qst_type == 'M') {
                var check = "select summary_id_pk as pk from qba_summary_admin where exam_fk = " + exam_fk + " and exampaper_fk =" + exampaper_fk + " and topic_pk = " + questionData.oldUnitPk + " order by summary_id_pk limit 1";
                sequelize.query(check).then(checkData => {
                    var query = "update qba_summary_admin set summary_question = summary_question - 1, summary_marks = summary_marks - " + parseFloat(questionData.oldMarks) + " where exam_fk = " + exam_fk + " and exampaper_fk =" + exampaper_fk + " and topic_pk = " + questionData.oldUnitPk + " and summary_id_pk = " + checkData[0][0].pk;
                    sequelize.query(query).then(checkData => {
                        var query1 = "select summary_id_pk as pk from qba_summary_admin where exam_fk = " + exam_fk + " and exampaper_fk =" + exampaper_fk + " and topic_pk = " + questionData.selectedTopic + " order by summary_id_pk limit 1"
                        sequelize.query(query1).then(checkData => {
                            var query2 = "update qba_summary_admin set summary_question = summary_question + 1, summary_marks = summary_marks + " + parseFloat(questionData.marks) + " where exam_fk = " + exam_fk + " and exampaper_fk =" + exampaper_fk + " and topic_pk = " + questionData.selectedTopic + " and summary_id_pk = " + checkData[0][0].pk;
                            sequelize.query(query2).then(checkData => { })
                        })
                    })
                })
            }
            if (questionData.qst_type == 'CS') {
                var check = "select sum(qst_marks) as total_marks, count(qb_id) as total_questions from culled_qstn_bank where exam_fk = " + questionData.exam_id + " and exampaper_fk = " + questionData.exampaper_fk + " and qst_lang = 'ENGLISH' and qst_pid in (select qb_id from culled_qstn_bank where qb_pk = " + questionData.qb_pk + " and exam_fk = " + questionData.exam_id + " and exampaper_fk = " + questionData.exampaper_fk + ")";
                sequelize.query(check).then(getData => {
                    var check = "select case_summary_id_pk as pk from qba_case_summary_admin where exam_fk = " + exam_fk + " and exampaper_fk =" + exampaper_fk + " and topic_pk = " + questionData.oldUnitPk + " order by case_summary_id_pk limit 1"
                    sequelize.query(check).then(checkData => {
                        var query = "update qba_case_summary_admin set parent_count = parent_count - 1, child_count = child_count - " + parseInt(getData[0][0].total_questions) + ", summary_marks = summary_marks - " + parseFloat(getData[0][0].total_marks) + " where exam_fk = " + exam_fk + " and exampaper_fk =" + exampaper_fk + " and topic_pk = " + questionData.oldUnitPk + " and case_summary_id_pk =" + checkData[0][0].pk;
                        sequelize.query(query, { type: sequelize.QueryTypes.UPDATE }).then(responseData => {
                            var query1 = "select case_summary_id_pk as pk from qba_case_summary_admin where exam_fk = " + exam_fk + " and exampaper_fk =" + exampaper_fk + " and topic_pk = " + questionData.selectedTopic + " order by case_summary_id_pk limit 1"
                            sequelize.query(query1).then(checkData => {
                                var query = "update qba_case_summary_admin set parent_count = parent_count + 1, child_count = child_count + " + parseInt(getData[0][0].total_questions) + ", summary_marks = summary_marks + " + parseFloat(getData[0][0].total_marks) + " where exam_fk = " + exam_fk + " and exampaper_fk =" + exampaper_fk + " and topic_pk = " + questionData.selectedTopic + " and case_summary_id_pk =" + checkData[0][0].pk;
                                sequelize.query(query, { type: sequelize.QueryTypes.UPDATE }).then(responseData => {
                                })
                            })
                        })
                    })
                })
            }
        }
        let old_details = JSON.stringify({
            marks: questionData.oldMarks,
            negative_marks: questionData.oldNegMarks,
            module: questionData.oldModuleName,
            unit: questionData.oldUnitName
        });
        let new_details = JSON.stringify({
            marks: questionData.marks,
            negative_marks: questionData.negativeMarks,
            module: questionData.newModuleName,
            unit: questionData.newUnitName
        });

        culled_qstn_bank.update({
            qst_body: questionData.question,
            qst_marks: questionData.marks,
            qst_neg_marks: questionData.negativeMarks,
            qst_no_of_altr: questionData.numOfAlternatives,
            qst_remarks: questionData.remark != '' ? questionData.remark : null,
            qst_audit_by: questionData.userName,
            qst_expiry_dt: new Date(),
            qst_audit_dt: sequelize.fn('NOW'),
            reference_info: questionData.reference != '' ? questionData.reference : null,
            calculation_info: questionData.calculations != '' ? questionData.calculations : null,
            qba_module_fk: questionData.selectedModule,
            qba_topic_fk: questionData.selectedTopic
        }, {
            where: {
                qb_pk: questionData.qb_pk,
                exam_fk: questionData.exam_id,
                exampaper_fk: questionData.exampaper_fk
            }
        }).then(questionUpdate => {

            if (questionData.qst_type == 'CS' && questionData.qst_pid == '0') {
                culled_qstn_bank.update({
                    qba_module_fk: questionData.selectedModule,
                    qba_topic_fk: questionData.selectedTopic
                }, {
                    where: {
                        exam_fk: questionData.exam_id,
                        exampaper_fk: questionData.exampaper_fk,
                        qst_pid: questionData.qb_id
                    }
                })
            }
            var arr_alternatives = [];
            for (var i = 1; i <= questionData.numOfAlternatives; i++) {
                var obj = new Object();
                obj.qta_qst_id = questionData.qb_pk;
                obj.qta_id = questionData.qb_id;
                obj.qta_alt_desc = questionData.alternatives[i - 1].text;
                obj.qta_order = i;
                obj.qta_is_corr_alt = questionData.alternatives[i - 1].isCorrect;
                obj.qta_is_active = 'A';
                obj.qta_audit_by = questionData.userName;
                obj.exam_fk = questionData.exam_id;
                obj.exampaper_fk = questionData.exampaper_fk;
                obj.qta_audit_dt = new Date();
                arr_alternatives.push(obj);
            }
            culled_qstn_alternatives.destroy({
                where: {
                    qta_qst_id: questionData.qb_pk,
                    exam_fk: questionData.exam_id,
                    exampaper_fk: questionData.exampaper_fk
                }
            }).then(altDelete => {
                culled_qstn_alternatives.bulkCreate(arr_alternatives).then(() => {
                });
            });


            //Save the change log details to change log table


            //if result found then update the row with updated_dt updated_by column
            //else below insert function will run
            //Check where vlog_qb_fk ==? created_by =? and status = E and qb_id = ?

            qba_vatting_log.findAll(
                {
                    where: {
                        vlog_qb_fk: questionData.qb_pk,
                        created_by: questionData.user_id,
                        status: "E",
                        qb_id: questionData.qb_id

                    }
                })
                .then(logDetails => {
                    if (logDetails.length > 0) {
                        qba_vatting_log.update({
                            updated_dt: new Date(),
                            exampaper_fk: questionData.exampaper_fk
                        },
                            {
                                where: {
                                    vlog_qb_fk: questionData.qb_pk,
                                    created_by: questionData.user_id,
                                    status: "E",
                                    qb_id: questionData.qb_id
                                }
                            }).then(logUpdate => {
                                res.send({
                                    code: 0,
                                    message: "success",
                                    obj: {}
                                });
                            });
                    } else {
                        var vetting_log_data = {
                            seq: 0,
                            vlog_qb_fk: questionData.qb_pk,
                            vlog_exam_fk: questionData.exam_id,
                            status: "E",
                            remarks: "Question Edited",
                            qstnpaper_id: questionData.edt_exam_paper_id,
                            exam_name: questionData.edt_exam_name,
                            // exampaper_fk: questionData.exampaper_fk,
                            created_dt: new Date(),
                            created_by: questionData.user_id,
                            updated_dt: new Date(),
                            updated_by: questionData.user_id,
                            qb_id: questionData.qb_id,
                            exampaper_fk: questionData.exampaper_fk
                        };
                        qba_vatting_log.create(vetting_log_data).then(question => {
                            res.send({
                                code: 0,
                                message: "success",
                                obj: {}
                            });
                        });
                    }


                });





        });

    },
    exportOtherLangDocumentInNseitFormat: function (req, res) {
        var params = req.body;
        var filepath = rootPath + '/public/images/products/image/';
        var filepath1 = rootPath + '/server/controllers/output/';
        var examstatus = req.body.examstatus;
        let language = req.body.language;
        var userName = req.body.userName;

        if (examstatus == 'A') {
            var culledstatuscondition = ' culled_qstn_bank.admin_status = \'A\' and ';
        } else {
            var culledstatuscondition = '';
        }

        var expQuery = 'SELECT ( CASE WHEN qst_type=\'CS\' AND culled_qstn_bank.qst_pid > 0 THEN culled_qstn_bank.qst_pid::varchar || \'.\' || lpad(qb_id::varchar,8,\'0\')::varchar ELSE CASE WHEN qst_type = \'M\' THEN qb_id::varchar ELSE qb_id::varchar END END )::numeric(16,10) as qb_id1,' +
            ' row_number()over(order by max(culled_qstn_bank.qst_type),max(culled_qstn_bank.culled_qb_pk)) as "Sr No", ' +
            'max(case when culled_qstn_bank.qst_type=\'M\' then \'S\' else culled_qstn_bank.qst_type end) "QType",' +
            ' max(culled_qstn_bank.qst_body) "Question Body",' +
            'max(culled_qstn_bank.qst_body) "Question Image",' +
            ' NULL as  "XML Content",' +
            ' max(case when culled_qstn_bank.qst_marks = 0.00 then tw.total_weightage else culled_qstn_bank.qst_marks end) "Weightage Marks",' +
            ' max(qba_topic_code) "Topic  Code",' +
            ' max(culled_qstn_bank.qst_lang) "Language",' +
            ' \'N\' "Change Of Order",' +
            ' max(case when (culled_qstn_bank.qst_pid = 0 and culled_qstn_bank.qst_type = \'CS\') then 0 else culled_qstn_bank.qst_no_of_altr end) "Number Of Alternatives",' +
            '  \'\' "Expiry Date",' +
            ' 999999 "Maximum Attempt",' +
            ' max(culled_qstn_bank.qb_id) "Client Id",' +
            '  max(culled_qstn_bank.qst_neg_marks) "Negative Marks",' +
            ' \'A\' "Question Modification Flag",' +
            ' max(case when (culled_qstn_bank.qst_type=\'CS\' and culled_qstn_bank.qst_pid=0) then 0 else case when qta_is_corr_alt=\'Y\'  then culled_qstn_alternatives.qta_order end end) "Correct Alternative position", ' +
            ' null "Dimension" ,' +
            ' max(case when culled_qstn_bank.qst_pid=0 then null else culled_qstn_bank.qst_pid end) "ParentClientID",\'\' "Question Shuffle",' +
            ' max(case when culled_qstn_alternatives.qta_order=1 then qta_alt_desc end) "Alternative1",' +
            ' max(case when culled_qstn_alternatives.qta_order=1 then qta_alt_desc end) "Alternative1Image",' +
            ' max(case when culled_qstn_alternatives.qta_order=2 then qta_alt_desc end) "Alternative2",' +
            ' max(case when culled_qstn_alternatives.qta_order=2 then qta_alt_desc end) "Alternative2Image",' +
            ' max(case when culled_qstn_alternatives.qta_order=3 then qta_alt_desc end) "Alternative3",' +
            ' max(case when culled_qstn_alternatives.qta_order=3 then qta_alt_desc end) "Alternative3Image",' +
            ' max(case when culled_qstn_alternatives.qta_order=4 then qta_alt_desc end) "Alternative4",' +
            ' max(case when culled_qstn_alternatives.qta_order=4 then qta_alt_desc end) "Alternative4Image",' +
            ' max(case when culled_qstn_alternatives.qta_order=5 then qta_alt_desc end) "Alternative5",' +
            ' max(case when culled_qstn_alternatives.qta_order=5 then qta_alt_desc end) "Alternative5Image"' +
            ' FROM  culled_qstn_bank  ' +
            ' INNER JOIN qba_topic_master on qba_topic_fk = qba_topic_pk ' +
            ' LEFT JOIN culled_qstn_alternatives  on (qta_qst_id=qb_pk AND culled_qstn_alternatives.exampaper_fk = ' + parseInt(req.body.examPaper) +
            ' AND culled_qstn_alternatives.exam_fk = ' + parseInt(req.body.exam_fk) + ') ' +
            ' LEFT JOIN (select qbank_images.qbi_image_name,qstn_bank.qb_pk from qbank_images left join qstn_bank on qstn_bank.qst_img_fk = qbank_images.qbi_pk) b2 on (b2.qb_pk= culled_qstn_bank.qb_pk)' +
            'LEFT JOIN (select sum(qst_marks) total_weightage,max(qst_pid) qst_pid from culled_qstn_bank where culled_qstn_bank.exam_fk = ' + parseInt(req.body.exam_fk) + ' AND culled_qstn_bank.exampaper_fk = ' + parseInt(req.body.examPaper) +
            ' AND culled_qstn_bank.qst_lang = \'' + req.body.language + '\' ' +
            '   group by qst_pid having(qst_pid)> 1) tw on (culled_qstn_bank.qb_id = tw.qst_pid)' +
            //' WHERE culled_qstn_bank.admin_status = \'A\' ' +
            ' WHERE culled_qstn_bank.exam_fk = ' + parseInt(req.body.exam_fk) + ' AND ' + culledstatuscondition + ' culled_qstn_bank.exampaper_fk = ' + parseInt(req.body.examPaper) +
            ' AND culled_qstn_bank.qst_lang = \'' + req.body.language + '\'   GROUP BY culled_qstn_bank.culled_qb_pk order by qst_type,qb_id1';

        sequelize.query(expQuery, { type: sequelize.QueryTypes.SELECT })
            .then(exportData => {
                var k = 0;
                var client_id = []; // added by shilpa
                var parent_id = []; // added by shilpa
                var imgFileNames = []; // added by shilpa
                var xlsxExprtData = [];
                for (var i = 0; i < exportData.length; i++) {
                    xlsxExprtData[k] = {};
                    client_id[exportData[i]["Sr No"]] = parseInt(exportData[i]["Client Id"]); // added by shilpa

                    xlsxExprtData[k]['Sr No'] = parseInt(exportData[i]["Sr No"]);

                    xlsxExprtData[k]['Question Body'] = exportData[i]["Question Body"].replace(/<img[^>]*>/g, "");


                    if (exportData[i]["Question Image"] == null) {
                        xlsxExprtData[k]['Question Image'] = exportData[i]["Question Image"];
                    } else if (exportData[i]["Question Image"].includes("<img")) {
                        if (exportData[i]["Question Image"].includes('src="/images/products/image/')) {
                            let start = parseInt(exportData[i]["Question Image"].search(' src="/images/products/image/')) + parseInt(29);
                            let end = exportData[i]["Question Image"].search('" style=');
                            let filename = exportData[i]["Question Image"].substring(start, end).replace(/[&\/\\#,+()$~%'":*?<>{}]/g, "").trim();
                            imgFileNames.push(filename);

                            if (fs.existsSync(filepath + filename)) {
                                xlsxExprtData[k]['Question Image'] = filename;
                                imgFileNames.push(filename);
                            }
                            else {
                                xlsxExprtData[k]['Question Image'] = "";
                            }
                        }
                        if (exportData[i]["Question Image"].includes('src="static/controllers/output/')) {
                            let start = parseInt(exportData[i]["Question Image"].search('output/')) + parseInt(7);
                            let end = exportData[i]["Question Image"].search('>');
                            let filename = exportData[i]["Question Image"].substring(start, end).replace(/[&\/\\#,+()$~%'":*?<>{}]/g, "").trim();


                            if (fs.existsSync(filepath1 + filename)) {
                                xlsxExprtData[k]['Question Image'] = filename;
                                imgFileNames.push(filename);
                            }
                            else {
                                xlsxExprtData[k]['Question Image'] = "";
                            }
                        }
                    } else {
                        xlsxExprtData[k]['Question Image'] = "";
                    }

                    xlsxExprtData[k]['XML Content'] = exportData[i]["XML Content"];
                    xlsxExprtData[k]['Weightage Marks'] = exportData[i]["Weightage Marks"];
                    xlsxExprtData[k]['Topic  Code'] = exportData[i]["Topic  Code"];
                    xlsxExprtData[k]['Language'] = exportData[i]["Language"];
                    xlsxExprtData[k]['Change Of Order'] = exportData[i]["Change Of Order"];
                    xlsxExprtData[k]['Number Of Alternatives'] = parseInt(exportData[i]["Number Of Alternatives"]);
                    xlsxExprtData[k]['Expiry Date'] = exportData[i]["Expiry Date"];
                    xlsxExprtData[k]['Maximum Attempt'] = exportData[i]["Maximum Attempt"];
                    xlsxExprtData[k]['Client Id'] = parseInt(exportData[i]["Sr No"]); // changed by shilpa
                    xlsxExprtData[k]['Negative Marks'] = exportData[i]["Negative Marks"];
                    xlsxExprtData[k]['Question Modification Flag'] = exportData[i]["Question Modification Flag"];
                    xlsxExprtData[k]['Correct Alternative position'] = parseInt(exportData[i]["Correct Alternative position"]);
                    xlsxExprtData[k]['Dimension'] = exportData[i]["Dimension"];
                    xlsxExprtData[k]['QType'] = exportData[i]["QType"];
                    xlsxExprtData[k]['ParentClientID'] = exportData[i]["ParentClientID"]; // changed by shilpa
                    xlsxExprtData[k]['Question Shuffle'] = exportData[i]["Question Shuffle"];

                    if (exportData[i]["Alternative1"] == null) {
                        xlsxExprtData[k]['Alternative1'] = exportData[i]["Alternative1"];
                    } else {
                        xlsxExprtData[k]['Alternative1'] = exportData[i]["Alternative1"].replace(/<img[^>]*>|null/g, "");
                        xlsxExprtData[k]['Alternative1'] = striptags(xlsxExprtData[k]['Alternative1']);
                    }


                    if (exportData[i].Alternative1Image == null) {
                        xlsxExprtData[k]['Alternative1Image'] = exportData[i].Alternative1Image;
                    }
                    else if (exportData[i].Alternative1Image.includes("<img")) {
                        if (exportData[i].Alternative1Image.includes('src="/images/products/image/')) {
                            let start = parseInt(exportData[i].Alternative1Image.search(' src="/images/products/image/')) + parseInt(29);
                            let end = exportData[i].Alternative1Image.search('" style=');
                            let filename = exportData[i].Alternative1Image.substring(start, end).replace(/[&\/\\#,+()$~%'":*?<>{}]/g, "").trim();


                            if (fs.existsSync(filepath + filename)) {
                                xlsxExprtData[k]['Alternative1Image'] = filename;
                                imgFileNames.push(filename);
                            }
                            else {
                                xlsxExprtData[k]['Alternative1Image'] = "";
                            }
                        }
                        if (exportData[i].Alternative1Image.includes('src="static/controllers/output/')) {
                            let start = parseInt(exportData[i].Alternative1Image.search('output/')) + parseInt(7);
                            let end = exportData[i].Alternative1Image.search('>');
                            let filename = exportData[i].Alternative1Image.substring(start, end).replace(/[&\/\\#,+()$~%'":*?<>{}]/g, "").trim();

                            if (fs.existsSync(filepath1 + filename)) {
                                xlsxExprtData[k]['Alternative1Image'] = filename;
                                imgFileNames.push(filename);
                            }
                            else {
                                xlsxExprtData[k]['Alternative1Image'] = "";
                            }
                        }
                    }
                    else {
                        xlsxExprtData[k]['Alternative1Image'] = "";
                    }

                    if (exportData[i]["Alternative2"] == null) {
                        xlsxExprtData[k]['Alternative2'] = exportData[i]["Alternative2"];
                    } else {
                        xlsxExprtData[k]['Alternative2'] = exportData[i]["Alternative2"].replace(/<img[^>]*>|null/g, "");
                        xlsxExprtData[k]['Alternative2'] = striptags(xlsxExprtData[k]['Alternative2']);
                    }





                    if (exportData[i].Alternative2Image == null) {
                        xlsxExprtData[k]['Alternative2Image'] = exportData[i].Alternative2Image;
                    }
                    else if (exportData[i].Alternative2Image.includes("<img")) {
                        if (exportData[i].Alternative2Image.includes('src="/images/products/image/')) {
                            let start = parseInt(exportData[i].Alternative2Image.search(' src="/images/products/image/')) + parseInt(29);
                            let end = exportData[i].Alternative2Image.search('" style=');
                            let filename = exportData[i].Alternative2Image.substring(start, end).replace(/[&\/\\#,+()$~%'":*?<>{}]/g, "").trim();


                            if (fs.existsSync(filepath + filename)) {
                                xlsxExprtData[k]['Alternative2Image'] = filename;
                                imgFileNames.push(filename);
                            }
                            else {
                                xlsxExprtData[k]['Alternative2Image'] = "";
                            }
                        }
                        if (exportData[i].Alternative2Image.includes('src="static/controllers/output/')) {
                            let start = parseInt(exportData[i].Alternative2Image.search('output/')) + parseInt(7);
                            let end = exportData[i].Alternative2Image.search('>');
                            let filename = exportData[i].Alternative2Image.substring(start, end).replace(/[&\/\\#,+()$~%'":*?<>{}]/g, "").trim();

                            if (fs.existsSync(filepath1 + filename)) {
                                xlsxExprtData[k]['Alternative2Image'] = filename;
                                imgFileNames.push(filename);
                            }
                            else {
                                xlsxExprtData[k]['Alternative2Image'] = "";
                            }
                        }
                    }
                    else {
                        xlsxExprtData[k]['Alternative2Image'] = "";
                    }

                    if (exportData[i]["Alternative3"] == null) {
                        xlsxExprtData[k]['Alternative3'] = exportData[i]["Alternative3"];
                    } else {
                        xlsxExprtData[k]['Alternative3'] = exportData[i]["Alternative3"].replace(/<img[^>]*>|null/g, "");
                        xlsxExprtData[k]['Alternative3'] = striptags(xlsxExprtData[k]['Alternative3']);
                    }



                    if (exportData[i].Alternative3Image == null) {
                        xlsxExprtData[k]['Alternative3Image'] = exportData[i].Alternative3Image;
                    }
                    else if (exportData[i].Alternative3Image.includes("<img")) {
                        if (exportData[i].Alternative3Image.includes('src="/images/products/image/')) {
                            let start = parseInt(exportData[i].Alternative3Image.search(' src="/images/products/image/')) + parseInt(29);
                            let end = exportData[i].Alternative3Image.search('" style=');
                            let filename = exportData[i].Alternative3Image.substring(start, end).replace(/[&\/\\#,+()$~%'":*?<>{}]/g, "").trim();


                            if (fs.existsSync(filepath + filename)) {
                                xlsxExprtData[k]['Alternative3Image'] = filename;
                                imgFileNames.push(filename);
                            }
                            else {
                                xlsxExprtData[k]['Alternative3Image'] = "";
                            }
                        }
                        if (exportData[i].Alternative3Image.includes('src="static/controllers/output/')) {
                            let start = parseInt(exportData[i].Alternative3Image.search('output/')) + parseInt(7);
                            let end = exportData[i].Alternative3Image.search('>');
                            let filename = exportData[i].Alternative3Image.substring(start, end).replace(/[&\/\\#,+()$~%'":*?<>{}]/g, "").trim();

                            if (fs.existsSync(filepath1 + filename)) {
                                xlsxExprtData[k]['Alternative3Image'] = filename;
                                imgFileNames.push(filename);
                            }
                            else {
                                xlsxExprtData[k]['Alternative3Image'] = "";
                            }
                        }
                    }
                    else {
                        xlsxExprtData[k]['Alternative3Image'] = "";
                    }


                    if (exportData[i]["Alternative4"] == null) {
                        xlsxExprtData[k]['Alternative4'] = exportData[i]["Alternative4"];
                    } else {
                        xlsxExprtData[k]['Alternative4'] = exportData[i]["Alternative4"].replace(/<img[^>]*>|null/g, "");
                        xlsxExprtData[k]['Alternative4'] = striptags(xlsxExprtData[k]['Alternative4']);
                    }



                    if (exportData[i].Alternative4Image == null) {
                        xlsxExprtData[k]['Alternative4Image'] = exportData[i].Alternative4Image;
                    }
                    else if (exportData[i].Alternative4Image.includes("<img")) {
                        if (exportData[i].Alternative4Image.includes('src="/images/products/image/')) {
                            let start = parseInt(exportData[i].Alternative4Image.search(' src="/images/products/image/')) + parseInt(29);
                            let end = exportData[i].Alternative4Image.search('" style=');
                            let filename = exportData[i].Alternative4Image.substring(start, end).replace(/[&\/\\#,+()$~%'":*?<>{}]/g, "").trim();


                            if (fs.existsSync(filepath + filename)) {
                                xlsxExprtData[k]['Alternative4Image'] = filename;
                                imgFileNames.push(filename);
                            }
                            else {
                                xlsxExprtData[k]['Alternative4Image'] = "";
                            }
                        }
                        if (exportData[i].Alternative4Image.includes('src="static/controllers/output/')) {
                            let start = parseInt(exportData[i].Alternative4Image.search('output/')) + parseInt(7);
                            let end = exportData[i].Alternative4Image.search('>');
                            let filename = exportData[i].Alternative4Image.substring(start, end).replace(/[&\/\\#,+()$~%'":*?<>{}]/g, "").trim();

                            if (fs.existsSync(filepath1 + filename)) {
                                xlsxExprtData[k]['Alternative4Image'] = filename;
                                imgFileNames.push(filename);
                            }
                            else {
                                xlsxExprtData[k]['Alternative4Image'] = "";
                            }
                        }
                    }
                    else {
                        xlsxExprtData[k]['Alternative4Image'] = "";
                    }

                    if (exportData[i]["Alternative5"] == null) {
                        xlsxExprtData[k]['Alternative5'] = exportData[i]["Alternative5"];
                    } else {
                        xlsxExprtData[k]['Alternative5'] = exportData[i]["Alternative5"].replace(/<img[^>]*>|null/g, "");
                        xlsxExprtData[k]['Alternative5'] = striptags(xlsxExprtData[k]['Alternative5']);
                    }

                    xlsxExprtData[k]['Alternative6'] = "";
                    xlsxExprtData[k]['Alternative7'] = "";
                    xlsxExprtData[k]['Alternative8'] = "";
                    xlsxExprtData[k]['Alternative9'] = "";

                    if (exportData[i].Alternative5Image == null) {
                        xlsxExprtData[k]['Alternative5Image'] = exportData[i].Alternative5Image;
                    }
                    else if (exportData[i].Alternative5Image.includes("<img")) {
                        if (exportData[i].Alternative5Image.includes('src="/images/products/image/')) {
                            let start = parseInt(exportData[i].Alternative5Image.search(' src="/images/products/image/')) + parseInt(29);
                            let end = exportData[i].Alternative5Image.search('" style=');
                            let filename = exportData[i].Alternative5Image.substring(start, end).replace(/[&\/\\#,+()$~%'":*?<>{}]/g, "").trim();


                            if (fs.existsSync(filepath + filename)) {
                                xlsxExprtData[k]['Alternative5Image'] = filename;
                                imgFileNames.push(filename);
                            }
                            else {
                                xlsxExprtData[k]['Alternative5Image'] = "";
                            }
                        }
                        if (exportData[i].Alternative5Image.includes('src="static/controllers/output/')) {
                            let start = parseInt(exportData[i].Alternative5Image.search('output/')) + parseInt(7);
                            let end = exportData[i].Alternative5Image.search('>');
                            let filename = exportData[i].Alternative5Image.substring(start, end).replace(/[&\/\\#,+()$~%'":*?<>{}]/g, "").trim();

                            if (fs.existsSync(filepath1 + filename)) {
                                xlsxExprtData[k]['Alternative5Image'] = filename;
                                imgFileNames.push(filename);
                            }
                            else {
                                xlsxExprtData[k]['Alternative5Image'] = "";
                            }
                        }
                    }
                    else {
                        xlsxExprtData[k]['Alternative5Image'] = "";
                    }

                    xlsxExprtData[k]['Alternative6Image'] = "";
                    xlsxExprtData[k]['Alternative7Image'] = "";
                    xlsxExprtData[k]['Alternative8Image'] = "";
                    xlsxExprtData[k]['Alternative9Image'] = "";
                    k++;
                }
                // added by shilpa
                let datacount = exportData.length;
                var clientid = [];
                for (var i = 0; i < datacount; i++) {
                    let index = client_id.indexOf(parseInt(xlsxExprtData[i]['ParentClientID']));
                    if (index != -1) {
                        xlsxExprtData[i]['ParentClientID'] = index;
                    }
                    parent_id[i] = xlsxExprtData[i]['ParentClientID']; // added by shilpa
                    clientid[i] = parseInt(xlsxExprtData[i]['Client Id']);
                }

                function getAllIndexes(arr, val) {
                    var indexes = [], i = -1;
                    while ((i = arr.indexOf(val, i + 1)) != -1) {
                        indexes.push(i);
                    }
                    return indexes;
                }
                for (var k = 0; k < clientid.length; k++) {
                    var indexes = getAllIndexes(parent_id, clientid[k]);
                    for (var p = 0; p < indexes.length; p++) {
                        xlsxExprtData[k]['Alternative' + (p + 1)] = clientid[indexes[p]];
                    }
                }


                var fields = [];
                for (var m in xlsxExprtData[0]) fields.push(m);
                var xlsfilename = "nseit_data_" + (new Date).getTime() + ".xlsx";

                var xls = json2xls(xlsxExprtData, { fields: fields });

                fs.writeFileSync(rootPath + '/uploads/csv_download/' + xlsfilename, xls, 'binary');
                var csvfilepath = rootPath + '/uploads/csv_download/' + xlsfilename;

                var getStream = function (fileName) {
                    return fs.readFileSync(fileName);
                }

                //archiver code start
                function onlyUnique(value, index, self) {
                    return self.indexOf(value) === index;
                }
                var uniqueImages = imgFileNames.filter(onlyUnique);
                var output = fs.createWriteStream(rootPath + '/uploads/csv_download/nseit_data.zip');
                var archive = archiver('zip');
                archive.pipe(output);
                archive.on('error', function (err) {
                    throw err;
                });
                archive.append(getStream(csvfilepath), { name: xlsfilename });
                for (var k in uniqueImages) {
                    var img = rootPath + '/server/controllers/output/' + uniqueImages[k];
                    var img1 = rootPath + '/public/images/products/image/' + uniqueImages[k];
                    if (fs.existsSync(img)) {
                        archive.append(getStream(img), { name: uniqueImages[k] });
                    }
                    else if (fs.existsSync(img1)) {
                        archive.append(getStream(img1), { name: uniqueImages[k] });
                    }
                }
                archive.finalize();
                //archiver code end
                output.on('close', function () {
                    res.send({
                        code: 0,
                        message: "success",
                        obj: "/uploads/csv_download/nseit_data.zip"
                    });
                });
            });


    },
    exportDocumentInNseitFormat: function (req, res) {
        var params = req.body;
        var filepath = rootPath + '/public/images/products/image/';
        var filepath1 = rootPath + '/server/controllers/output/';
        var examstatus = req.body.examstatus;
        let language = req.body.language;
        if (examstatus == 'A') {


            var expQuery = 'SELECT ( CASE WHEN qst_type=\'CS\' AND culled_qstn_bank.qst_pid > 0 THEN culled_qstn_bank.qst_pid::varchar || \'.\' || lpad(qb_id::varchar,8,\'0\')::varchar ELSE CASE WHEN qst_type = \'M\' THEN qb_id::varchar ELSE qb_id::varchar END END )::numeric(16,10) as qb_id1,' +
                ' row_number()over(order by max(culled_qstn_bank.qst_type),max(culled_qstn_bank.qb_id)) as "Sr. No.", ' +
                'max(case when culled_qstn_bank.qst_type=\'M\' then \'S\' else culled_qstn_bank.qst_type end) "QType",' +
                ' max(culled_qstn_bank.qst_body) "Question Body",' +
                'max(culled_qstn_bank.qst_body) "Question Image",' +
                ' null  "XML Content",' +
                ' max(case when culled_qstn_bank.qst_type = \'CS\' and culled_qstn_bank.qst_pid = 0 then tw.total_weightage else culled_qstn_bank.qst_marks end) "Weightage Marks",' +
                ' max(qba_topic_code) "Topic  Code",' +
                ' max(culled_qstn_bank.qst_lang) "Language",' +
                ' \'N\' "Change Of Order",' +
                ' max(case when culled_qstn_bank.qst_type = \'CS\' and culled_qstn_bank.qst_pid = 0  then tw.total_questions else culled_qstn_bank.qst_no_of_altr end) "Number Of Alternatives",' +
                '  \'\' "Expiry Date",' +
                ' 999999 "Maximum Attempt",' +
                ' max(culled_qstn_bank.qb_id) "Client Id",' +
                '  max(culled_qstn_bank.qst_neg_marks) "Negative Marks",' +
                ' \'A\' "Question Modification Flag",' +
                ' max(case when qta_is_corr_alt=\'Y\'  then culled_qstn_alternatives.qta_order end) "Correct Alternative position", ' +
                ' null "Dimension" ,' +
                ' max(case when culled_qstn_bank.qst_pid=0 then null else culled_qstn_bank.qst_pid end) "ParentClientID",\'\' "Question Shuffle",' +
                ' max(case when culled_qstn_alternatives.qta_order=1 then qta_alt_desc end) "Alternative1",' +
                ' max(case when culled_qstn_alternatives.qta_order=1 then qta_alt_desc end) "Alternative1Image",' +
                ' max(case when culled_qstn_alternatives.qta_order=2 then qta_alt_desc end) "Alternative2",' +
                ' max(case when culled_qstn_alternatives.qta_order=2 then qta_alt_desc end) "Alternative2Image",' +
                ' max(case when culled_qstn_alternatives.qta_order=3 then qta_alt_desc end) "Alternative3",' +
                ' max(case when culled_qstn_alternatives.qta_order=3 then qta_alt_desc end) "Alternative3Image",' +
                ' max(case when culled_qstn_alternatives.qta_order=4 then qta_alt_desc end) "Alternative4",' +
                ' max(case when culled_qstn_alternatives.qta_order=4 then qta_alt_desc end) "Alternative4Image",' +
                ' max(case when culled_qstn_alternatives.qta_order=5 then qta_alt_desc end) "Alternative5",' +
                ' max(case when culled_qstn_alternatives.qta_order=5 then qta_alt_desc end) "Alternative5Image"' +
                ' FROM  culled_qstn_bank  ' +
                ' INNER JOIN qba_topic_master on qba_topic_fk = qba_topic_pk ' +
                ' INNER JOIN qba_module_mstr on culled_qstn_bank.qba_module_fk = qba_module_pk ' +
                ' LEFT JOIN culled_qstn_alternatives  on (qta_qst_id=qb_pk AND culled_qstn_alternatives.exampaper_fk = ' + parseInt(req.body.examPaper) +
                ' AND culled_qstn_alternatives.exam_fk = ' + parseInt(req.body.exam_fk) + ') ' +
                ' LEFT JOIN (select qbank_images.qbi_image_name,qstn_bank.qb_pk from qbank_images left join qstn_bank on qstn_bank.qst_img_fk = qbank_images.qbi_pk) b2 on (b2.qb_pk= culled_qstn_bank.qb_pk)' +
                'LEFT JOIN (select sum(qst_marks) total_weightage,count(*) total_questions,max(qst_pid) qst_pid from culled_qstn_bank where culled_qstn_bank.exam_fk = ' + parseInt(req.body.exam_fk) + '  and culled_qstn_bank.admin_status=\'A\' and culled_qstn_bank.qst_is_active = \'A\' AND culled_qstn_bank.exampaper_fk = ' + parseInt(req.body.examPaper) +
                ' AND culled_qstn_bank.exampaper_fk = ' + parseInt(req.body.examPaper) +
                ' AND culled_qstn_bank.qst_lang = \'' + req.body.language + '\'  group by qst_pid having(qst_pid)> 1) tw on (culled_qstn_bank.qb_id = tw.qst_pid)' +
                ' WHERE culled_qstn_bank.admin_status = \'A\' ' +
                ' AND culled_qstn_bank.exam_fk = ' + parseInt(req.body.exam_fk) + ' AND culled_qstn_bank.exampaper_fk = ' + parseInt(req.body.examPaper) +
                ' AND culled_qstn_bank.qst_lang = \'' + req.body.language + '\'  GROUP BY culled_qstn_bank.culled_qb_pk,qba_topic_code, qba_module_mstr.module_name  order by culled_qstn_bank.qst_type,qba_module_mstr.module_name,qba_topic_code,case when qst_type = \'M\' then qst_marks end,qb_id1';
        }
        else {
            var expQuery = 'SELECT ( CASE WHEN qst_type=\'CS\' AND culled_qstn_bank.qst_pid > 0 THEN culled_qstn_bank.qst_pid::varchar || \'.\' || lpad(qb_id::varchar,8,\'0\')::varchar ELSE CASE WHEN qst_type = \'M\' THEN qb_id::varchar ELSE qb_id::varchar END END )::numeric(16,10) as qb_id1,' +
                ' row_number()over(order by max(culled_qstn_bank.qst_type),max(culled_qstn_bank.qb_id)) as "Sr. No.", ' +
                'max(case when culled_qstn_bank.qst_type=\'M\' then \'S\' else culled_qstn_bank.qst_type end) "QType",' +
                ' max(culled_qstn_bank.qst_body) "Question Body",' +
                'max(culled_qstn_bank.qst_body) "Question Image",' +
                ' NULL as  "XML Content",' +
                ' max(case when culled_qstn_bank.qst_type = \'CS\' and culled_qstn_bank.qst_pid = 0 then tw.total_weightage else culled_qstn_bank.qst_marks end) "Weightage Marks",' +
                ' max(qba_topic_code) "Topic  Code",' +
                ' max(culled_qstn_bank.qst_lang) "Language",' +
                ' \'N\' "Change Of Order",' +
                ' max(case when culled_qstn_bank.qst_type = \'CS\' and culled_qstn_bank.qst_pid = 0  then tw.total_questions else culled_qstn_bank.qst_no_of_altr end) "Number Of Alternatives",' +
                '  \'\' "Expiry Date",' +
                ' 999999 "Maximum Attempt",' +
                ' max(culled_qstn_bank.qb_id) "Client Id",' +
                '  max(culled_qstn_bank.qst_neg_marks) "Negative Marks",' +
                ' \'A\' "Question Modification Flag",' +
                ' max(case when qta_is_corr_alt=\'Y\'  then culled_qstn_alternatives.qta_order end) "Correct Alternative position", ' +
                ' null "Dimension" ,' +
                ' max(case when culled_qstn_bank.qst_pid=0 then null else culled_qstn_bank.qst_pid end) "ParentClientID",\'\' "Question Shuffle",' +
                ' max(case when culled_qstn_alternatives.qta_order=1 then qta_alt_desc end) "Alternative1",' +
                ' max(case when culled_qstn_alternatives.qta_order=1 then qta_alt_desc end) "Alternative1Image",' +
                ' max(case when culled_qstn_alternatives.qta_order=2 then qta_alt_desc end) "Alternative2",' +
                ' max(case when culled_qstn_alternatives.qta_order=2 then qta_alt_desc end) "Alternative2Image",' +
                ' max(case when culled_qstn_alternatives.qta_order=3 then qta_alt_desc end) "Alternative3",' +
                ' max(case when culled_qstn_alternatives.qta_order=3 then qta_alt_desc end) "Alternative3Image",' +
                ' max(case when culled_qstn_alternatives.qta_order=4 then qta_alt_desc end) "Alternative4",' +
                ' max(case when culled_qstn_alternatives.qta_order=4 then qta_alt_desc end) "Alternative4Image",' +
                ' max(case when culled_qstn_alternatives.qta_order=5 then qta_alt_desc end) "Alternative5",' +
                ' max(case when culled_qstn_alternatives.qta_order=5 then qta_alt_desc end) "Alternative5Image"' +
                ' FROM  culled_qstn_bank  ' +
                ' INNER JOIN qba_topic_master on qba_topic_fk = qba_topic_pk ' +
                ' INNER JOIN qba_module_mstr on culled_qstn_bank.qba_module_fk = qba_module_pk ' +
                ' LEFT JOIN culled_qstn_alternatives  on (qta_qst_id=qb_pk AND culled_qstn_alternatives.exampaper_fk = ' + parseInt(req.body.examPaper) +
                ' AND culled_qstn_alternatives.exam_fk = ' + parseInt(req.body.exam_fk) + ') ' +
                ' LEFT JOIN (select qbank_images.qbi_image_name,qstn_bank.qb_pk from qbank_images left join qstn_bank on qstn_bank.qst_img_fk = qbank_images.qbi_pk) b2 on (b2.qb_pk= culled_qstn_bank.qb_pk)' +
                'LEFT JOIN (select sum(qst_marks) total_weightage,count(*) total_questions,max(qst_pid) qst_pid from culled_qstn_bank where culled_qstn_bank.exam_fk = ' + parseInt(req.body.exam_fk) + ' and culled_qstn_bank.pub_status=\'A\' and culled_qstn_bank.qst_is_active = \'A\' AND culled_qstn_bank.exampaper_fk = ' + parseInt(req.body.examPaper) +
                ' AND culled_qstn_bank.qst_lang = \'' + req.body.language + '\' ' +
                '   group by qst_pid having(qst_pid)> 1) tw on (culled_qstn_bank.qb_id = tw.qst_pid)' +
                ' WHERE culled_qstn_bank.exam_fk = ' + parseInt(req.body.exam_fk) + ' AND culled_qstn_bank.exampaper_fk = ' + parseInt(req.body.examPaper) +
                ' AND culled_qstn_bank.pub_status = \'A\' ' +
                ' AND culled_qstn_bank.qst_lang = \'' + req.body.language + '\'  GROUP BY culled_qstn_bank.culled_qb_pk,qba_topic_code, qba_module_mstr.module_name  order by culled_qstn_bank.qst_type,qba_module_mstr.module_name,qba_topic_code,case when qst_type = \'M\' then qst_marks end,qb_id1';              //added by dipika
        }

        sequelize.query(expQuery, { type: sequelize.QueryTypes.SELECT })
            .then(exportData => {
                var k = 0;
                var client_id = []; // added by shilpa
                var parent_id = []; // added by shilpa
                var imgFileNames = []; // added by shilpa
                var xlsxExprtData = [];
                for (var i = 0; i < exportData.length; i++) {
                    xlsxExprtData[k] = {};
                    client_id[exportData[i]["Sr. No."]] = exportData[i]["Client Id"]; // added by shilpa

                    xlsxExprtData[k]['Sr No'] = parseInt(exportData[i]["Sr. No."]);
                    if (exportData[i]["Question Body"] == null) {
                        xlsxExprtData[k]['Question Body'] = exportData[i]["Question Body"];
                    } else if (exportData[i]["Question Body"].includes('<del ')) {
                        let start = parseInt(exportData[i]["Question Body"].search('<del '));
                        let end = parseInt(exportData[i]["Question Body"].search('</del>')) + parseInt(6);
                        exportData[i]["Question Body"] = exportData[i]["Question Body"].replace(exportData[i]["Question Body"].slice(start, end), "");
                    }
                    if (exportData[i]["Question Body"] != null) {
                        xlsxExprtData[k]['Question Body'] = exportData[i]["Question Body"].replace(/<img[^>]*>/g, "");
                    }

                    if (exportData[i]["Question Image"] == null) {
                        xlsxExprtData[k]['Question Image'] = exportData[i]["Question Image"];
                    } else if (exportData[i]["Question Image"].includes("<img")) {
                        if (exportData[i]["Question Image"].includes('<del ')) {
                            let start = parseInt(exportData[i]["Question Image"].search('<del '));
                            let end = parseInt(exportData[i]["Question Image"].search('</del>')) + parseInt(6);
                            exportData[i]["Question Image"] = exportData[i]["Question Image"].replace(exportData[i]["Question Image"].slice(start, end), "");
                        }
                        if (exportData[i]["Question Image"].includes('data-cke-saved-src="/images/products/image/')) {
                            let start = parseInt(exportData[i]["Question Image"].search(' src="/images/products/image/')) + parseInt(29);
                            let end = exportData[i]["Question Image"].search('" style=');
                            let filename = exportData[i]["Question Image"].substring(start, end).replace(/[&\/\\#,+()$~%'":*?<>{}]/g, "").trim();


                            if (fs.existsSync(filepath + filename)) {
                                xlsxExprtData[k]['Question Image'] = filename;
                                imgFileNames.push(filename);
                            }
                            else {
                                xlsxExprtData[k]['Question Image'] = "";
                            }
                        } else {
                            if (exportData[i]["Question Image"].includes('src="/images/products/image/')) {
                                let start = parseInt(exportData[i]["Question Image"].search(' src="/images/products/image/')) + parseInt(29);
                                let end = exportData[i]["Question Image"].search('" style=');
                                let filename = exportData[i]["Question Image"].substring(start, end).replace(/[&\/\\#,+()$~%'":*?<>{}]/g, "").trim();
                                imgFileNames.push(filename);

                                if (fs.existsSync(filepath + filename)) {
                                    xlsxExprtData[k]['Question Image'] = filename;
                                    imgFileNames.push(filename);
                                }
                                else {
                                    xlsxExprtData[k]['Question Image'] = "";
                                }
                            }
                        }
                        if (exportData[i]["Question Image"].includes('src="static/controllers/output/')) {
                            let start = parseInt(exportData[i]["Question Image"].search('output/')) + parseInt(7);
                            let end = exportData[i]["Question Image"].search('" style=');
                            if (end == -1)
                                end = exportData[i]["Question Image"].search('>');
                            let filename = exportData[i]["Question Image"].substring(start, end).replace(/[&\/\\#,+()$~%'":*?<>{}]/g, "").trim();


                            if (fs.existsSync(filepath1 + filename)) {
                                xlsxExprtData[k]['Question Image'] = filename;
                                imgFileNames.push(filename);
                            }
                            else {
                                xlsxExprtData[k]['Question Image'] = "";
                            }
                        }
                    } else {
                        xlsxExprtData[k]['Question Image'] = "";
                    }
                    xlsxExprtData[k]['XML Content'] = exportData[i]["XML Content"];
                    if (exportData[i]["Weightage Marks"])
                        xlsxExprtData[k]['Weightage Marks'] = parseFloat(exportData[i]["Weightage Marks"]);
                    else
                        xlsxExprtData[k]['Weightage Marks'] = 0
                    xlsxExprtData[k]['Topic Name'] = "Topic" + " " + exportData[i]["Topic  Code"];
                    xlsxExprtData[k]['Language'] = exportData[i]["Language"];
                    xlsxExprtData[k]['Change Of Order'] = exportData[i]["Change Of Order"];
                    if (!exportData[i]["Number Of Alternatives"]) {
                        xlsxExprtData[k]['Number Of Alternatives'] = parseInt(0);
                    } else {
                        xlsxExprtData[k]['Number Of Alternatives'] = parseInt(exportData[i]["Number Of Alternatives"]);
                    }

                    xlsxExprtData[k]['Expiry Date'] = exportData[i]["Expiry Date"];
                    xlsxExprtData[k]['Maximum Attempt'] = exportData[i]["Maximum Attempt"];
                    xlsxExprtData[k]['Client Id'] = parseInt(exportData[i]["Sr. No."]); // changed by shilpa
                    if (!exportData[i]["Negative Marks"]) {
                        xlsxExprtData[k]['Negative Marks'] = parseInt(0);

                    } else {
                        xlsxExprtData[k]['Negative Marks'] = parseInt(exportData[i]["Negative Marks"]);
                    }
                    xlsxExprtData[k]['Question Modification Flag'] = exportData[i]["Question Modification Flag"];
                    if (exportData[i]["Correct Alternative position"] == undefined || exportData[i]["Correct Alternative position"] == null || exportData[i]["Correct Alternative position"] == '') {
                        xlsxExprtData[k]['Correct Alternative position'] = parseInt(0);
                    } else {
                        xlsxExprtData[k]['Correct Alternative position'] = parseInt(exportData[i]["Correct Alternative position"]);
                    }

                    xlsxExprtData[k]['Dimension'] = exportData[i]["Dimension"];
                    xlsxExprtData[k]['QTYPE'] = exportData[i]["QType"];
                    xlsxExprtData[k]['ParentClientID'] = exportData[i]["ParentClientID"]; // changed by shilpa
                    xlsxExprtData[k]['Question Shuffle'] = exportData[i]["Question Shuffle"];

                    // xlsxExprtData[k]['Alternative1'] = exportData[i]["Alternative1"].length == 0 ? exportData[i]["Alternative1"] : exportData[i]["Alternative1"].replace(/<img[^>]*>|null/g,"");



                    if (exportData[i]["Alternative1"] == null) {
                        xlsxExprtData[k]['Alternative1'] = exportData[i]["Alternative1"];
                    } else {
                        if (exportData[i]["Alternative1"].includes('<del ')) {
                            let start = parseInt(exportData[i]["Alternative1"].search('<del '));
                            let end = parseInt(exportData[i]["Alternative1"].search('</del>')) + parseInt(6);
                            exportData[i]["Alternative1"] = exportData[i]["Alternative1"].replace(exportData[i]["Alternative1"].slice(start, end), "");
                        }
                        xlsxExprtData[k]['Alternative1'] = exportData[i]["Alternative1"].replace(/<img[^>]*>/g, "");

                        xlsxExprtData[k]['Alternative1'] = xlsxExprtData[k]['Alternative1'];
                    }

                    if (exportData[i].Alternative1Image == null) {
                        xlsxExprtData[k]['Alternative1Image'] = exportData[i].Alternative1Image;
                    }
                    else if (exportData[i].Alternative1Image.includes("<img")) {
                        if (exportData[i].Alternative1Image.includes('<del ')) {
                            let start = parseInt(exportData[i].Alternative1Image.search('<del '));
                            let end = parseInt(exportData[i].Alternative1Image.search('</del>')) + parseInt(6);
                            exportData[i].Alternative1Image = exportData[i].Alternative1Image.replace(exportData[i].Alternative1Image.slice(start, end), "");
                        }
                        if (exportData[i].Alternative1Image.includes('src="/images/products/image/')) {
                            if (exportData[i].Alternative1Image.includes('data-cke-saved-src="/images/products/image/')) {
                                let start = parseInt(exportData[i].Alternative1Image.search(' src="/images/products/image/')) + parseInt(29);
                                let end = exportData[i].Alternative1Image.search('" style=');
                                let filename = exportData[i].Alternative1Image.substring(start, end).replace(/[&\/\\#,+()$~%'":*?<>{}]/g, "").trim();


                                if (fs.existsSync(filepath + filename)) {
                                    xlsxExprtData[k]['Alternative1Image'] = " <img>" + filename + "</img>";;
                                    imgFileNames.push(filename);

                                }
                                else {
                                    xlsxExprtData[k]['Alternative1Image'] = "";
                                }
                            } else {
                                let start = parseInt(exportData[i].Alternative1Image.search('image/')) + parseInt(6);
                                let end = exportData[i].Alternative1Image.search('" style=');
                                let filename = exportData[i].Alternative1Image.substring(start, end).replace(/[&\/\\#,+()$~%'":*?<>{}]/g, "").trim();


                                if (fs.existsSync(filepath + filename)) {
                                    xlsxExprtData[k]['Alternative1Image'] = filename;
                                    imgFileNames.push(filename);
                                }
                                else {
                                    xlsxExprtData[k]['Alternative1Image'] = "";
                                }
                            }
                        }
                        if (exportData[i].Alternative1Image.includes('src="static/controllers/output/')) {
                            let start = parseInt(exportData[i].Alternative1Image.search('output/')) + parseInt(7);
                            let end = exportData[i].Alternative1Image.search('" style=');
                            if (end == -1)
                                end = exportData[i].Alternative1Image.search('>');
                            let filename = exportData[i].Alternative1Image.substring(start, end).replace(/[&\/\\#,+()$~%'":*?<>{}]/g, "").trim();

                            if (fs.existsSync(filepath1 + filename)) {
                                xlsxExprtData[k]['Alternative1Image'] = filename;
                                imgFileNames.push(filename);
                            }
                            else {
                                xlsxExprtData[k]['Alternative1Image'] = "";
                            }
                        }
                    }
                    else {
                        xlsxExprtData[k]['Alternative1Image'] = "";
                    }

                    if (exportData[i]["Alternative2"] == null) {
                        xlsxExprtData[k]['Alternative2'] = exportData[i]["Alternative2"];
                    } else {
                        if (exportData[i]["Alternative2"].includes('<del ')) {
                            let start = parseInt(exportData[i]["Alternative2"].search('<del '));
                            let end = parseInt(exportData[i]["Alternative2"].search('</del>')) + parseInt(6);
                            exportData[i]["Alternative2"] = exportData[i]["Alternative2"].replace(exportData[i]["Alternative2"].slice(start, end), "");
                        }
                        xlsxExprtData[k]['Alternative2'] = exportData[i]["Alternative2"].replace(/<img[^>]*>/g, "");
                    }

                    if (exportData[i].Alternative2Image == null) {
                        xlsxExprtData[k]['Alternative2Image'] = exportData[i].Alternative2Image;
                    }
                    else if (exportData[i].Alternative2Image.includes("<img")) {
                        if (exportData[i].Alternative2Image.includes('<del ')) {
                            let start = parseInt(exportData[i].Alternative2Image.search('<del '));
                            let end = parseInt(exportData[i].Alternative2Image.search('</del>')) + parseInt(6);
                            exportData[i].Alternative2Image = exportData[i].Alternative2Image.replace(exportData[i].Alternative2Image.slice(start, end), "");
                        }
                        if (exportData[i].Alternative2Image.includes('src="/images/products/image/')) {
                            if (exportData[i].Alternative2Image.includes('data-cke-saved-src="/images/products/image/')) {
                                let start = parseInt(exportData[i].Alternative2Image.search(' src="/images/products/image/')) + parseInt(29);
                                let end = exportData[i].Alternative2Image.search('" style=');
                                let filename = exportData[i].Alternative2Image.substring(start, end).replace(/[&\/\\#,+()$~%'":*?<>{}]/g, "").trim();


                                if (fs.existsSync(filepath + filename)) {
                                    xlsxExprtData[k]['Alternative2Image'] = " <img>" + filename + "</img>";;
                                    imgFileNames.push(filename);

                                }
                                else {
                                    xlsxExprtData[k]['Alternative2Image'] = "";
                                }
                            } else {
                                let start = parseInt(exportData[i].Alternative2Image.search('image/')) + parseInt(6);
                                let end = exportData[i].Alternative2Image.search('" style=');
                                let filename = exportData[i].Alternative2Image.substring(start, end).replace(/[&\/\\#,+()$~%'":*?<>{}]/g, "").trim();


                                if (fs.existsSync(filepath + filename)) {
                                    xlsxExprtData[k]['Alternative2Image'] = filename;
                                    imgFileNames.push(filename);
                                }
                                else {
                                    xlsxExprtData[k]['Alternative2Image'] = "";
                                }
                            }
                        }
                        if (exportData[i].Alternative2Image.includes('src="static/controllers/output/')) {
                            let start = parseInt(exportData[i].Alternative2Image.search('output/')) + parseInt(7);
                            let end = exportData[i].Alternative2Image.search('" style=');
                            if (end == -1)
                                end = exportData[i].Alternative2Image.search('>');
                            let filename = exportData[i].Alternative2Image.substring(start, end).replace(/[&\/\\#,+()$~%'":*?<>{}]/g, "").trim();

                            if (fs.existsSync(filepath1 + filename)) {
                                xlsxExprtData[k]['Alternative2Image'] = filename;
                                imgFileNames.push(filename);
                            }
                            else {
                                xlsxExprtData[k]['Alternative2Image'] = "";
                            }
                        }
                    }
                    else {
                        xlsxExprtData[k]['Alternative2Image'] = "";
                    }

                    if (exportData[i]["Alternative3"] == null) {
                        xlsxExprtData[k]['Alternative3'] = exportData[i]["Alternative3"];
                    } else {
                        if (exportData[i]["Alternative3"].includes('<del ')) {
                            let start = parseInt(exportData[i]["Alternative3"].search('<del '));
                            let end = parseInt(exportData[i]["Alternative3"].search('</del>')) + parseInt(6);
                            exportData[i]["Alternative3"] = exportData[i]["Alternative3"].replace(exportData[i]["Alternative3"].slice(start, end), "");
                        }
                        xlsxExprtData[k]['Alternative3'] = exportData[i]["Alternative3"].replace(/<img[^>]*>/g, "");
                    }

                    if (exportData[i].Alternative3Image == null) {
                        xlsxExprtData[k]['Alternative3Image'] = exportData[i].Alternative3Image;
                    }
                    else if (exportData[i].Alternative3Image.includes("<img")) {
                        if (exportData[i].Alternative3Image.includes('<del ')) {
                            let start = parseInt(exportData[i].Alternative3Image.search('<del '));
                            let end = parseInt(exportData[i].Alternative3Image.search('</del>')) + parseInt(6);
                            exportData[i].Alternative3Image = exportData[i].Alternative3Image.replace(exportData[i].Alternative3Image.slice(start, end), "");
                        }
                        if (exportData[i].Alternative3Image.includes('src="/images/products/image/')) {
                            if (exportData[i].Alternative3Image.includes('data-cke-saved-src="/images/products/image/')) {
                                let start = parseInt(exportData[i].Alternative3Image.search(' src="/images/products/image/')) + parseInt(29);
                                let end = exportData[i].Alternative3Image.search('" style=');
                                let filename = exportData[i].Alternative3Image.substring(start, end).replace(/[&\/\\#,+()$~%'":*?<>{}]/g, "").trim();


                                if (fs.existsSync(filepath + filename)) {
                                    xlsxExprtData[k]['Alternative3Image'] = " <img>" + filename + "</img>";;
                                    imgFileNames.push(filename);

                                }
                                else {
                                    xlsxExprtData[k]['Alternative3Image'] = "";
                                }
                            } else {
                                let start = parseInt(exportData[i].Alternative3Image.search('image/')) + parseInt(6);
                                let end = exportData[i].Alternative3Image.search('" style=');
                                let filename = exportData[i].Alternative3Image.substring(start, end).replace(/[&\/\\#,+()$~%'":*?<>{}]/g, "").trim();


                                if (fs.existsSync(filepath + filename)) {
                                    xlsxExprtData[k]['Alternative3Image'] = filename;
                                    imgFileNames.push(filename);
                                }
                                else {
                                    xlsxExprtData[k]['Alternative3Image'] = "";
                                }
                            }
                        }
                        if (exportData[i].Alternative3Image.includes('src="static/controllers/output/')) {
                            let start = parseInt(exportData[i].Alternative3Image.search('output/')) + parseInt(7);
                            let end = exportData[i].Alternative3Image.search('" style=');
                            if (end == -1)
                                end = exportData[i].Alternative3Image.search('>');
                            let filename = exportData[i].Alternative3Image.substring(start, end).replace(/[&\/\\#,+()$~%'":*?<>{}]/g, "").trim();

                            if (fs.existsSync(filepath1 + filename)) {
                                xlsxExprtData[k]['Alternative3Image'] = filename;
                                imgFileNames.push(filename);
                            }
                            else {
                                xlsxExprtData[k]['Alternative3Image'] = "";
                            }
                        }
                    }
                    else {
                        xlsxExprtData[k]['Alternative3Image'] = "";
                    }


                    if (exportData[i]["Alternative4"] == null) {
                        xlsxExprtData[k]['Alternative4'] = exportData[i]["Alternative4"];
                    } else {
                        if (exportData[i]["Alternative4"].includes('<del ')) {
                            let start = parseInt(exportData[i]["Alternative4"].search('<del '));
                            let end = parseInt(exportData[i]["Alternative4"].search('</del>')) + parseInt(6);
                            exportData[i]["Alternative4"] = exportData[i]["Alternative4"].replace(exportData[i]["Alternative4"].slice(start, end), "");
                        }
                        xlsxExprtData[k]['Alternative4'] = exportData[i]["Alternative4"].replace(/<img[^>]*>/g, "");
                    }

                    if (exportData[i].Alternative4Image == null) {
                        xlsxExprtData[k]['Alternative4Image'] = exportData[i].Alternative4Image;
                    }
                    else if (exportData[i].Alternative4Image.includes("<img")) {
                        if (exportData[i].Alternative4Image.includes('<del ')) {
                            let start = parseInt(exportData[i].Alternative4Image.search('<del '));
                            let end = parseInt(exportData[i].Alternative4Image.search('</del>')) + parseInt(6);
                            exportData[i].Alternative4Image = exportData[i].Alternative4Image.replace(exportData[i].Alternative4Image.slice(start, end), "");
                        }
                        if (exportData[i].Alternative4Image.includes('src="/images/products/image/')) {
                            if (exportData[i].Alternative4Image.includes('data-cke-saved-src="/images/products/image/')) {
                                let start = parseInt(exportData[i].Alternative4Image.search(' src="/images/products/image/')) + parseInt(29);
                                let end = exportData[i].Alternative4Image.search('" style=');
                                let filename = exportData[i].Alternative4Image.substring(start, end).replace(/[&\/\\#,+()$~%'":*?<>{}]/g, "").trim();


                                if (fs.existsSync(filepath + filename)) {
                                    xlsxExprtData[k]['Alternative4Image'] = " <img>" + filename + "</img>";;
                                    imgFileNames.push(filename);

                                }
                                else {
                                    xlsxExprtData[k]['Alternative4Image'] = "";
                                }
                            } else {
                                let start = parseInt(exportData[i].Alternative4Image.search('image/')) + parseInt(6);
                                let end = exportData[i].Alternative4Image.search('" style=');
                                let filename = exportData[i].Alternative4Image.substring(start, end).replace(/[&\/\\#,+()$~%'":*?<>{}]/g, "").trim();


                                if (fs.existsSync(filepath + filename)) {
                                    xlsxExprtData[k]['Alternative4Image'] = filename;
                                    imgFileNames.push(filename);
                                }
                                else {
                                    xlsxExprtData[k]['Alternative4Image'] = "";
                                }
                            }
                        }
                        if (exportData[i].Alternative4Image.includes('src="static/controllers/output/')) {
                            let start = parseInt(exportData[i].Alternative4Image.search('output/')) + parseInt(7);
                            let end = exportData[i].Alternative4Image.search('" style=');
                            if (end == -1)
                                end = exportData[i].Alternative4Image.search('>');
                            let filename = exportData[i].Alternative4Image.substring(start, end).replace(/[&\/\\#,+()$~%'":*?<>{}]/g, "").trim();

                            if (fs.existsSync(filepath1 + filename)) {
                                xlsxExprtData[k]['Alternative4Image'] = filename;
                                imgFileNames.push(filename);
                            }
                            else {
                                xlsxExprtData[k]['Alternative4Image'] = "";
                            }
                        }
                    }
                    else {
                        xlsxExprtData[k]['Alternative4Image'] = "";
                    }

                    if (exportData[i]["Alternative5"] == null) {
                        xlsxExprtData[k]['Alternative5'] = exportData[i]["Alternative5"];
                    } else {
                        if (exportData[i]["Alternative5"].includes('<del ')) {
                            let start = parseInt(exportData[i]["Alternative5"].search('<del '));
                            let end = parseInt(exportData[i]["Alternative5"].search('</del>')) + parseInt(6);
                            exportData[i]["Alternative5"] = exportData[i]["Alternative5"].replace(exportData[i]["Alternative5"].slice(start, end), "");
                        }
                        xlsxExprtData[k]['Alternative5'] = exportData[i]["Alternative5"].replace(/<img[^>]*>/g, "");
                    }

                    if (exportData[i].Alternative5Image == null) {
                        xlsxExprtData[k]['Alternative5Image'] = exportData[i].Alternative5Image;
                    }
                    else if (exportData[i].Alternative5Image.includes("<img")) {
                        if (exportData[i].Alternative5Image.includes('<del ')) {
                            let start = parseInt(exportData[i].Alternative5Image.search('<del '));
                            let end = parseInt(exportData[i].Alternative5Image.search('</del>')) + parseInt(6);
                            exportData[i].Alternative5Image = exportData[i].Alternative5Image.replace(exportData[i].Alternative5Image.slice(start, end), "");
                        }
                        if (exportData[i].Alternative5Image.includes('src="/images/products/image/')) {
                            if (exportData[i].Alternative5Image.includes('data-cke-saved-src="/images/products/image/')) {
                                let start = parseInt(exportData[i].Alternative5Image.search(' src="/images/products/image/')) + parseInt(29);
                                let end = exportData[i].Alternative5Image.search('" style=');
                                let filename = exportData[i].Alternative5Image.substring(start, end).replace(/[&\/\\#,+()$~%'":*?<>{}]/g, "").trim();


                                if (fs.existsSync(filepath + filename)) {
                                    xlsxExprtData[k]['Alternative5Image'] = " <img>" + filename + "</img>";;
                                    imgFileNames.push(filename);

                                }
                                else {
                                    xlsxExprtData[k]['Alternative5Image'] = "";
                                }
                            } else {
                                let start = parseInt(exportData[i].Alternative5Image.search('image/')) + parseInt(6);
                                let end = exportData[i].Alternative5Image.search('" style=');
                                let filename = exportData[i].Alternative5Image.substring(start, end).replace(/[&\/\\#,+()$~%'":*?<>{}]/g, "").trim();


                                if (fs.existsSync(filepath + filename)) {
                                    xlsxExprtData[k]['Alternative5Image'] = filename;
                                    imgFileNames.push(filename);
                                }
                                else {
                                    xlsxExprtData[k]['Alternative5Image'] = "";
                                }
                            }
                        }
                        if (exportData[i].Alternative5Image.includes('src="static/controllers/output/')) {
                            let start = parseInt(exportData[i].Alternative5Image.search('output/')) + parseInt(7);
                            let end = exportData[i].Alternative5Image.search('>');
                            let filename = exportData[i].Alternative5Image.substring(start, end).replace(/[&\/\\#,+()$~%'":*?<>{}]/g, "").trim();

                            if (fs.existsSync(filepath1 + filename)) {
                                xlsxExprtData[k]['Alternative5Image'] = filename;
                                imgFileNames.push(filename);
                            }
                            else {
                                xlsxExprtData[k]['Alternative5Image'] = "";
                            }
                        }
                    }
                    else {
                        xlsxExprtData[k]['Alternative5Image'] = "";
                    }

                    xlsxExprtData[k]['Alternative6'] = "";
                    xlsxExprtData[k]['Alternative6Image'] = "";
                    xlsxExprtData[k]['Alternative7'] = "";
                    xlsxExprtData[k]['Alternative7Image'] = "";
                    xlsxExprtData[k]['Alternative8'] = "";
                    xlsxExprtData[k]['Alternative8Image'] = "";
                    xlsxExprtData[k]['Alternative9'] = "";
                    xlsxExprtData[k]['Alternative9Image'] = "";
                    k++;
                }
                // added by shilpa
                let datacount = exportData.length;
                var clientid = [];
                for (var i = 0; i < datacount; i++) {
                    let index = client_id.indexOf(xlsxExprtData[i]['ParentClientID']);
                    if (index != -1) {
                        xlsxExprtData[i]['ParentClientID'] = index;
                    }
                    parent_id[i] = xlsxExprtData[i]['ParentClientID']; // added by shilpa
                    clientid[i] = parseInt(xlsxExprtData[i]['Client Id']);
                }

                function getAllIndexes(arr, val) {
                    var indexes = [], i = -1;
                    while ((i = arr.indexOf(val, i + 1)) != -1) {
                        indexes.push(i);
                    }
                    return indexes;
                }
                for (var k = 0; k < clientid.length; k++) {
                    var indexes = getAllIndexes(parent_id, clientid[k]);
                    for (var p = 0; p < indexes.length; p++) {
                        xlsxExprtData[k]['Alternative' + (p + 1)] = clientid[indexes[p]];
                    }
                }


                var fields = [];
                for (var m in xlsxExprtData[0]) fields.push(m);



                var xls = json2xls(xlsxExprtData, { fields: fields });
                var xlsfilename = "nseit_data_" + (new Date).getTime() + ".xlsx";
                fs.writeFileSync(rootPath + '/uploads/csv_download/' + xlsfilename, xls, 'binary');
                var csvfilepath = rootPath + '/uploads/csv_download/' + xlsfilename;

                var getStream = function (fileName) {
                    return fs.readFileSync(fileName);
                }

                //archiver code start
                function onlyUnique(value, index, self) {
                    return self.indexOf(value) === index;
                }
                var uniqueImages = imgFileNames.filter(onlyUnique);
                var output = fs.createWriteStream(rootPath + '/uploads/csv_download/nseit_data.zip');
                var archive = archiver('zip');
                archive.pipe(output);
                archive.on('error', function (err) {
                    throw err;
                });
                archive.append(getStream(csvfilepath), { name: xlsfilename });
                for (var k in uniqueImages) {
                    var img = rootPath + '/server/controllers/output/' + uniqueImages[k];
                    var img1 = rootPath + '/public/images/products/image/' + uniqueImages[k];
                    if (fs.existsSync(img)) {
                        archive.append(getStream(img), { name: uniqueImages[k] });
                    }
                    else if (fs.existsSync(img1)) {
                        archive.append(getStream(img1), { name: uniqueImages[k] });
                    }
                }
                archive.finalize();
                //archiver code end
                output.on('close', function () {
                    res.send({
                        code: 0,
                        message: "success",
                        obj: "/uploads/csv_download/nseit_data.zip"
                    });
                });
            });
    },
    /* saveComments: function (req, res) {
         importMethods.checkValidUser(req, res);
         var questionData = req.body;
         var comments = questionData.comments;
         var qb_id = questionData.qb_id;
         var exam_fk = questionData.exam_fk;
         var exampaper_fk = questionData.exampaper_fk;
         culled_qstn_bank.update({
             comments: comments,
             qst_audit_by: req.body.qst_audit_by,
             qst_audit_dt: sequelize.fn('NOW')
         }, {
             where: sequelize.and({ qb_id: qb_id },
                 { exam_fk: exam_fk },
                 { exampaper_fk: exampaper_fk },
                 { qst_lang: 'ENGLISH' })
         }).then(comment_update=>{
             res.send({
                 code: 0,
                 message: "success",
                 obj: comment_update
             })
         })
     },*/

    saveallchangesdata: function (req, res) {
        importMethods.checkValidUser(req, res);
        var questionData = req.body;
        var qst_body = questionData.qst_body;
        var qb_id = questionData.qb_id;
        var exam_fk = questionData.exam_fk;
        var exampaper_fk = questionData.exampaper_fk;
        culled_qstn_bank.update({
            qst_body: qst_body,
            audit_qst_body: qst_body,
            qst_audit_by: req.body.qst_audit_by,
            qst_audit_dt: sequelize.fn('NOW')
        }, {
            where: sequelize.and({ qb_id: qb_id },
                { exam_fk: exam_fk },
                { exampaper_fk: exampaper_fk },
                { qst_lang: 'ENGLISH' })
        }).then(questionUpdates => {
            res.send({
                code: 0,
                message: "success",
                obj: questionUpdates
            });
        });
    },



    saveremarkdatas: function (req, res) {
        importMethods.checkValidUser(req, res);
        var questionData = req.body;
        var remark = questionData.remark;
        var qb_id = questionData.qb_id;
        var exam_fk = questionData.exam_fk;
        var exampaper_fk = questionData.exampaper_fk;
        var query = "update culled_qstn_bank set qst_remarks = '" + questionData.remark + "', qst_audit_by = '" + questionData.qst_audit_by + "', qst_audit_dt = CURRENT_TIMESTAMP where qb_id=" + questionData.qb_id + " and exampaper_fk = " + questionData.exampaper_fk + " and qst_lang = 'ENGLISH' and exam_fk =" + questionData.exam_fk + " ";

        sequelize.query(query, { type: sequelize.QueryTypes.UPDATE }).then(remarkdata => {

            res.send({
                code: 0,
                message: "success",
                obj: remarkdata
            })
        })
    },

    saverefdata: function (req, res) {
        importMethods.checkValidUser(req, res);
        var questionData = req.body;
        var ref = questionData.ref;
        var qb_id = questionData.qb_id;
        var exam_fk = questionData.exam_fk;
        var exampaper_fk = questionData.exampaper_fk;
        var query = "update culled_qstn_bank set reference_info = '" + questionData.ref + "' ,qst_audit_by = '" + questionData.qst_audit_by + "', qst_audit_dt = CURRENT_TIMESTAMP where qb_id=" + questionData.qb_id + " and exampaper_fk = " + questionData.exampaper_fk + " and qst_lang = 'ENGLISH' and exam_fk =" + questionData.exam_fk + " ";

        sequelize.query(query, { type: sequelize.QueryTypes.UPDATE }).then(refdata => {

            res.send({
                code: 0,
                message: "success",
                obj: refdata
            })
        })
    },

    savecaldata: function (req, res) {
        importMethods.checkValidUser(req, res);
        var questionData = req.body;
        var cal = questionData.cal;
        var qb_id = questionData.qb_id;
        var exam_fk = questionData.exam_fk;
        var exampaper_fk = questionData.exampaper_fk;
        var query = "update culled_qstn_bank set calculation_info = '" + questionData.cal + "' , qst_audit_by = '" + questionData.qst_audit_by + "', qst_audit_dt = CURRENT_TIMESTAMP where qb_id=" + questionData.qb_id + " and exampaper_fk = " + questionData.exampaper_fk + " and qst_lang = 'ENGLISH' and exam_fk =" + questionData.exam_fk + " ";

        sequelize.query(query, { type: sequelize.QueryTypes.UPDATE }).then(caldata => {

            res.send({
                code: 0,
                message: "success",
                obj: caldata
            })
        })
    },




    updateoptions: function (req, res) {

        importMethods.checkValidUser(req, res);
        var questionData = req.body;
        var qst_body = questionData.qst_body;
        var qta_pk = questionData.qta_pk;
        var exam_fk = questionData.exam_fk;
        var exampaper_fk = questionData.exampaper_fk;
        culled_qstn_alternatives.update({
            qta_alt_desc: qst_body

        }, {
            where: sequelize.and({ qta_pk: qta_pk },
                { exam_fk: exam_fk },
                { exampaper_fk: exampaper_fk })
        }).then(questionUpdates => {
            culled_qstn_bank.update({
                qst_audit_by: questionData.qst_audit_by,
                qst_audit_dt: sequelize.fn('NOW')
            }, {
                where: sequelize.and({ qb_id: questionData.qb_id },
                    { exam_fk: exam_fk },
                    { exampaper_fk: exampaper_fk },
                    { qst_lang: 'ENGLISH' })
            }).then(q => {
                res.send({
                    code: 0,
                    message: "success",
                    obj: questionUpdates
                });
            })
        });

    },

    editVetterQuestionsInline: function (req, res) {
        importMethods.checkValidUser(req, res);
        var questionData = req.body;

        for (var i = 0; i < questionData.length; i++) {
            if (!questionData[i].qst_neg_marks) {
                questionData[i].qst_neg_marks = 0
            }
            culled_qstn_bank.update({
                qst_body: questionData[i].qst_body,
                audit_qst_body: questionData[i].qst_body,
                qst_marks: questionData[i].qst_marks,
                qst_neg_marks: questionData[i].qst_neg_marks,
                qst_no_of_altr: questionData[i].qst_no_of_altr,
                qst_remarks: questionData[i].qst_remarks != '' ? questionData[i].qst_remarks : null,
                qst_audit_by: questionData[i].qst_audit_by,
                qst_expiry_dt: new Date(),
                qst_audit_dt: sequelize.fn('NOW'),
                reference_info: questionData[i].reference_info != '' ? questionData[i].reference_info : null,
                calculation_info: questionData[i].calculation_info != '' ? questionData[i].calculation_info : null
            }, {
                where: sequelize.and({ qb_pk: questionData[i].qb_pk },
                    { exam_fk: questionData[i].exam_fk },
                    { exampaper_fk: questionData[i].exampaper_fk })
            })
        }
        res.send({
            code: 0,
            message: "success"
        });
    },

    savevettercsqchildRecords: function (req, res) {
        importMethods.checkValidUser(req, res);
        var questionData = req.body;

        if (!questionData.negativeMarks) {
            questionData.negativeMarks = 0
        }

        sequelize.query("select nextval('qb_id_val') as val", { type: sequelize.QueryTypes.SELECT })
            .then(next_qb_id => {

                qstn_bank.create({
                    qst_type: questionData.type,
                    qst_lang: 'ENGLISH',
                    qst_pid: questionData.parentId,
                    qst_sub_seq_no: '0',
                    qst_body: questionData.question,
                    qst_marks: questionData.marks,
                    qst_neg_marks: questionData.negativeMarks,
                    qst_expiry_dt: new Date(),
                    qst_no_of_altr: questionData.numOfAlternatives,
                    qst_img_fk: null,
                    qst_remarks: questionData.remark != '' ? questionData.remark : null,
                    qst_fk_tpc_pk: '0',
                    qst_dimension: 'Dimension',
                    qst_is_active: 'A',
                    qst_audit_by: questionData.userName,
                    author_name: questionData.userName,
                    qst_audit_dt: new Date(),
                    qb_assigned_to: '0',
                    qb_status_fk: '0',
                    qba_topic_fk: questionData.topicId,
                    qba_subject_fk: questionData.subjectId,
                    qba_course_fk: questionData.courseId,
                    reference_info: questionData.reference != '' ? questionData.reference : null,
                    calculation_info: questionData.calculations != '' ? questionData.calculations : null,
                    qb_id: next_qb_id[0].val,
                    qba_module_fk: questionData.moduleId
                }).then(question => {

                    var arr_alternatives = [];
                    for (var i = 1; i <= questionData.numOfAlternatives; i++) {
                        var obj = new Object();
                        obj.qta_qst_id = question.qb_pk;
                        obj.qta_id = question.qb_id;
                        obj.qta_alt_desc = questionData.alternatives[i - 1].text;
                        obj.qta_order = i;
                        obj.qta_is_corr_alt = questionData.alternatives[i - 1].isCorrect;
                        obj.qta_is_active = 'A';
                        obj.qta_audit_by = questionData.userName;
                        obj.qta_audit_dt = new Date();
                        arr_alternatives.push(obj);
                    }
                    qstn_alternatives.bulkCreate(arr_alternatives).then(() => {
                        res.send({
                            code: 0,
                            message: "success",
                            obj: question
                        })
                    });
                })
            })
    },



    editVetterOptions: function (req, res) {
        importMethods.checkValidUser(req, res);
        var questionData = req.body;
        for (var i = 0; i < questionData.length; i++) {
            for (var j = 0; j < questionData[i].qstn_alternatives.length; j++) {
                culled_qstn_alternatives.create({
                    qta_qst_id: questionData[i].qb_pk,
                    // qst_body_clean_text: questionData.questionTextSave,
                    qta_id: questionData[i].qb_id,
                    qta_alt_desc: questionData[i].qstn_alternatives[j].qta_alt_desc,
                    qta_audit_alt_desc: questionData[i].qstn_alternatives[j].qta_alt_desc,
                    qta_order: questionData[i].qstn_alternatives[j].qta_order,
                    qta_is_corr_alt: questionData[i].qstn_alternatives[j].qta_is_corr_alt,
                    qta_is_active: 'A',
                    qta_audit_by: 'vetter',//questionData[i].qstn_alternatives[j].qta_audit_by,
                    qta_audit_dt: new Date(),
                    exam_fk: questionData[i].exam_fk,
                    exampaper_fk: questionData[i].exampaper_fk
                })
            }
        }
        res.send({
            code: 0,
            message: "success"
        });
    },

    delVetterOptions: function (req, res) {
        importMethods.checkValidUser(req, res);
        var questionData = req.body;
        for (var i = 0; i < questionData.length; i++) {
            culled_qstn_alternatives.destroy({
                where: sequelize.and({ qta_qst_id: questionData[i].qb_pk },
                    { exam_fk: questionData[i].exam_fk },
                    { exampaper_fk: questionData[i].exampaper_fk })
            })
        }
        res.send({
            code: 0,
            message: "success"
        })
    },


    deleteVetterOptions: function (req, res) {
        importMethods.checkValidUser(req, res);
        var questionData = req.body;
        for (var i = 0; i < questionData.length; i++) {
            culled_qstn_alternatives.destroy({
                where: sequelize.and({ qta_pk: questionData[i].qta_pk },
                    { exam_fk: questionData[i].exam_fk },
                    {
                        exampaper_fk: questionData[i].exampaper_fk,
                    })
            })
        }
        res.send({
            code: 0,
            message: "success"
        })



    },


    editandsaveVetterOptions: function (req, res) {
        importMethods.checkValidUser(req, res);
        var questionData = req.body;
        for (var i = 0; i < questionData.length; i++) {
            for (var j = 0; j < questionData[i].qstn_alternatives.length; j++) {
                culled_qstn_alternatives.create({
                    qta_qst_id: questionData[i].qb_pk,
                    qta_id: questionData[i].qb_id,
                    qta_alt_desc: questionData[i].qstn_alternatives[j].qta_alt_desc,
                    qta_audit_alt_desc: questionData[i].qstn_alternatives[j].qta_alt_desc,
                    qta_order: questionData[i].qstn_alternatives[j].qta_order,
                    qta_is_corr_alt: questionData[i].qstn_alternatives[j].qta_is_corr_alt,
                    qta_is_active: 'A',
                    qta_audit_by: 'vetter',//questionData[i].qstn_alternatives[j].qta_audit_by,
                    qta_audit_dt: new Date(),
                    exam_fk: questionData[i].exam_fk,
                    exampaper_fk: questionData[i].exampaper_fk
                })
            }
        }
        res.send({
            code: 0,
            message: "success"
        });
    },



    editMcq: function (req, res) {
        importMethods.checkValidUser(req, res);
        var questionData = req.body;
        if (!questionData.negativeMarks) {
            questionData.negativeMarks = 0
        }
        qstn_bank.update({
            qst_body: questionData.question,
            qst_marks: questionData.marks,
            qst_neg_marks: questionData.negativeMarks,
            qst_no_of_altr: questionData.numOfAlternatives,
            qst_remarks: questionData.remark != '' ? questionData.remark : null,
            qst_audit_by: questionData.userName,
            qst_expiry_dt: new Date(),
            qst_audit_dt: new Date(),
            qba_topic_fk: questionData.selectedTopic,
            qba_subject_fk: questionData.selectedSubject,
            qba_course_fk: questionData.selectedCourse,
            reference_info: questionData.reference != '' ? questionData.reference : null,
            calculation_info: questionData.calculations != '' ? questionData.calculations : null,
            qba_module_fk: questionData.selectedModule
        }, {
            where: { qb_pk: questionData.qb_pk }

        }).then(questionUpdate => {
            var arr_alternatives = [];
            qstn_alternatives.destroy({
                where: {
                    qta_qst_id: questionData.qb_pk
                }
            }).then(altDelete => {
                var arr_alternatives = [];
                for (var i = 1; i <= questionData.numOfAlternatives; i++) {
                    var obj = new Object();
                    obj.qta_qst_id = questionData.qb_pk;
                    obj.qta_id = questionData.qb_id;
                    obj.qta_alt_desc = questionData.alternatives[i - 1].text;
                    obj.qta_order = i;
                    obj.qta_is_corr_alt = questionData.alternatives[i - 1].isCorrect;
                    obj.qta_is_active = 'A';
                    obj.qta_audit_by = questionData.userName;
                    obj.qta_audit_dt = new Date();
                    arr_alternatives.push(obj);
                }

                qstn_alternatives.bulkCreate(arr_alternatives).then(() => {
                    if (questionData.exampaper_fk != '') {
                        culled_qstn_bank.update({
                            qst_body: questionData.question,
                            qst_marks: questionData.marks,
                            qst_neg_marks: questionData.negativeMarks,
                            qst_no_of_altr: questionData.numOfAlternatives,
                            qst_remarks: questionData.remark != '' ? questionData.remark : null,
                            qst_audit_by: questionData.userName,
                            qst_expiry_dt: new Date(),
                            qst_audit_dt: new Date(),
                            qba_topic_fk: questionData.selectedTopic,
                            qba_subject_fk: questionData.selectedSubject,
                            qba_course_fk: questionData.selectedCourse,
                            reference_info: questionData.reference != '' ? questionData.reference : null,
                            calculation_info: questionData.calculations != '' ? questionData.calculations : null,
                            qba_module_fk: questionData.selectedModule,
                        }, {
                            where: {
                                qb_pk: questionData.qb_pk,
                                exam_fk: questionData.exam_fk,
                                exampaper_fk: questionData.exampaper_fk
                            }
                        }).then(questionDataCulled => {
                            culled_qstn_alternatives.destroy({
                                where: {
                                    qta_qst_id: questionData.qb_pk,
                                    exam_fk: questionData.exam_fk,
                                    exampaper_fk: questionData.exampaper_fk
                                }
                            }).then(altDelete => {
                                var arr_alternatives = [];
                                for (var i = 1; i <= questionData.numOfAlternatives; i++) {
                                    var obj = new Object();
                                    obj.qta_qst_id = questionData.qb_pk;
                                    obj.qta_id = questionData.qb_id;
                                    obj.qta_alt_desc = questionData.alternatives[i - 1].text;
                                    obj.qta_order = i;
                                    obj.qta_is_corr_alt = questionData.alternatives[i - 1].isCorrect;
                                    obj.qta_is_active = 'A';
                                    obj.qta_audit_by = questionData.userName;
                                    obj.qta_audit_dt = new Date();
                                    obj.exam_fk = questionData.exam_fk;
                                    obj.exampaper_fk = questionData.exampaper_fk
                                    arr_alternatives.push(obj);
                                }
                                culled_qstn_alternatives.bulkCreate(arr_alternatives).then(() => {
                                    res.send({
                                        code: 0,
                                        message: "success",
                                        obj: {}
                                    })
                                });
                            })
                        })
                    }
                    else {
                        res.send({
                            code: 0,
                            message: "success",
                            obj: {}
                        })
                    }
                });
            });
        });

    },

    saveCSQParent: function (req, res) {
        importMethods.checkValidUser(req, res);
        var parentQuestionData = req.body;

        sequelize.query("select nextval('qb_id_val') as val", { type: sequelize.QueryTypes.SELECT })
            .then(next_qb_id => {

                qstn_bank.create({
                    qst_type: 'CS',
                    qst_lang: 'ENGLISH',
                    qst_pid: '0',
                    qst_sub_seq_no: '0',
                    qst_body: parentQuestionData.question,
                    qst_marks: 0,
                    qst_neg_marks: 0,
                    qst_expiry_dt: new Date(),
                    qst_no_of_altr: 0,
                    qst_img_fk: null,
                    qst_remarks: null,
                    qst_fk_tpc_pk: '0',
                    qst_dimension: 'Dimension',
                    qst_is_active: 'A',
                    qst_audit_by: parentQuestionData.userName,
                    author_name: parentQuestionData.userName,
                    qst_audit_dt: new Date(),
                    qb_assigned_to: '0',
                    qb_status_fk: '0',
                    qba_topic_fk: parentQuestionData.topicId,
                    qba_subject_fk: parentQuestionData.subjectId,
                    qba_course_fk: parentQuestionData.courseId,
                    no_of_question: '0',
                    reference_info: null,
                    calculation_info: null,
                    qb_id: next_qb_id[0].val,
                    qba_module_fk: parentQuestionData.moduleId,
                    qst_audit_by: 'admin'
                }).then(question => {
                    res.send({
                        code: 0,
                        message: "success",
                        obj: question
                    })
                })
            })

    },


    saveCSQParentVetter: function (req, res) {
        importMethods.checkValidUser(req, res);
        var parentQuestionData = req.body;

        sequelize.query("select nextval('qb_id_val') as val", { type: sequelize.QueryTypes.SELECT })
            .then(next_qb_id => {

                qstn_bank.create({
                    qst_type: 'CS',
                    qst_lang: 'ENGLISH',
                    qst_pid: '0',
                    qst_sub_seq_no: '0',
                    qst_body: parentQuestionData.parent_body,
                    qst_marks: 0,
                    qst_neg_marks: 0,
                    qst_expiry_dt: new Date(),
                    qst_no_of_altr: 0,
                    qst_img_fk: null,
                    qst_remarks: null,
                    qst_fk_tpc_pk: '0',
                    qst_dimension: 'Dimension',
                    qst_is_active: 'A',
                    qst_audit_by: parentQuestionData.userName,
                    author_name: parentQuestionData.userName,
                    qst_audit_dt: new Date(),
                    qb_assigned_to: '0',
                    qb_status_fk: '0',
                    qba_topic_fk: parentQuestionData.topicId,
                    qba_subject_fk: parentQuestionData.subjectId,
                    qba_course_fk: parentQuestionData.courseId,
                    no_of_question: '0',
                    reference_info: null,
                    calculation_info: null,
                    qb_id: next_qb_id[0].val,
                    qba_module_fk: parentQuestionData.moduleId,
                    qst_audit_by: 'admin'
                }).then(question => {
                    res.send({
                        code: 0,
                        message: "success",
                        obj: question
                    })
                })
            })

    },

    saveCSQParentAdmin: function (req, res) {
        importMethods.checkValidUser(req, res);
        var parentQuestionData = req.body;

        sequelize.query("select nextval('qb_id_val') as val", { type: sequelize.QueryTypes.SELECT })
            .then(next_qb_id => {

                qstn_bank.create({
                    qst_type: 'CS',
                    qst_lang: 'ENGLISH',
                    qst_pid: '0',
                    qst_sub_seq_no: '0',
                    qst_body: parentQuestionData.question,
                    qst_marks: 0,
                    qst_neg_marks: 0,
                    qst_expiry_dt: new Date(),
                    qst_no_of_altr: 0,
                    qst_img_fk: null,
                    qst_remarks: null,
                    qst_fk_tpc_pk: '0',
                    qst_dimension: 'Dimension',
                    qst_is_active: 'A',
                    qst_audit_by: parentQuestionData.userName,
                    author_name: parentQuestionData.userName,
                    qst_audit_dt: new Date(),
                    qb_assigned_to: '0',
                    qb_status_fk: '0',
                    qba_topic_fk: parentQuestionData.topicId,
                    qba_subject_fk: parentQuestionData.subjectId,
                    qba_course_fk: parentQuestionData.courseId,
                    no_of_question: '0',
                    reference_info: null,
                    calculation_info: null,
                    qb_id: next_qb_id[0].val,
                    qba_module_fk: parentQuestionData.moduleId,
                    qst_audit_by: 'admin'
                }).then(question => {
                    res.send({
                        code: 0,
                        message: "success",
                        obj: question
                    })
                })
            })

    },

    savevettercsqRecords: function (req, res) {
        importMethods.checkValidUser(req, res);
        var parentQuestionData = req.body;

        sequelize.query("select nextval('qb_id_val') as val", { type: sequelize.QueryTypes.SELECT })
            .then(next_qb_id => {

                qstn_bank.create({
                    qst_type: 'CS',
                    qst_lang: 'ENGLISH',
                    qst_pid: '0',
                    qst_sub_seq_no: '0',
                    qst_body: parentQuestionData.question,
                    qst_marks: 0,
                    qst_neg_marks: 0,
                    qst_expiry_dt: new Date(),
                    qst_no_of_altr: 0,
                    qst_img_fk: null,
                    qst_remarks: null,
                    qst_fk_tpc_pk: '0',
                    qst_dimension: 'Dimension',
                    qst_is_active: 'A',
                    qst_audit_by: parentQuestionData.userName,
                    author_name: parentQuestionData.userName,
                    qst_audit_dt: new Date(),
                    qb_assigned_to: '0',
                    qb_status_fk: '0',
                    qba_topic_fk: parentQuestionData.topicId,
                    qba_subject_fk: parentQuestionData.subjectId,
                    qba_course_fk: parentQuestionData.courseId,
                    no_of_question: '0',
                    reference_info: null,
                    calculation_info: null,
                    qb_id: next_qb_id[0].val,
                    qba_module_fk: parentQuestionData.moduleId,
                    qst_audit_by: 'admin'
                }).then(question => {
                    res.send({
                        code: 0,
                        message: "success",
                        obj: question
                    })
                })
            })

    },
    updateChildCount: function (req, res) {
        importMethods.checkValidUser(req, res);
        var parentQuestion = req.body;
        var query = "update qstn_bank set no_of_question = no_of_question + 1 where qb_pk =  " + parentQuestion.qb_pk;
        sequelize.query(query, { type: sequelize.QueryTypes.UPDATE }).then(parentQues => {

            res.send({
                code: 0,
                message: "success",
                obj: parentQues
            })
        })
    },
    loadCourses: function (req, res) {
        importMethods.checkValidUser(req, res);
        var courseId = req.body.id;
        qba_course_master.findAll({ where: { qba_course_pk: req.body.id } }).then(courses => {

            res.send({
                code: 0,
                message: "success",
                obj: courses
            })
        })
    },

    loadalldata: function (req, res) {
        importMethods.checkValidUser(req, res);
        var parameters = req.body;
        var query = "select *,exam_name,exam_date,qba_course_code,qba_subject_pk,qba_course_pk,total_qts,total_marks,exam_master.qba_course_fk,exam_master.is_active,subject_abbreviation,case_question,case_marks,qba_subject_code ,qba_course_name,subject_name,qba_subject_code from exam_master left join qba_course_master on qba_course_fk = qba_course_pk left join qba_subject_master on qba_subject_fk = qba_subject_pk where exam_name =  '" + parameters.exam_name + "' ";

        sequelize.query(query, { type: sequelize.QueryTypes.UPDATE }).then(allculleddata => {

            res.send({
                code: 0,
                message: "success",
                obj: allculleddata
            })
        })
    },

    loadSubjects: function (req, res) {
        importMethods.checkValidUser(req, res);
        var courseId = req.body.id;
        qba_subject_master.findAll({ where: { qba_subject_pk: courseId } })
            .then(subjects => {
                res.send({
                    code: 0,
                    message: "success",
                    obj: subjects
                })
            })
    },
    loadModules: function (req, res) {
        importMethods.checkValidUser(req, res);
        var subjectId = req.body.id;
        if (subjectId == '') {
            subjectId = null
        }
        qba_module_mstr.findAll({ where: { qba_subject_fk: subjectId, is_active: 'Y' } })
            .then(modules => {
                res.send({
                    code: 0,
                    message: "success",
                    obj: modules
                })
            })
    },
    loadTopics: function (req, res) {
        importMethods.checkValidUser(req, res);
        var moduleId = req.body.id;
        var language = req.body.language;

        var languageCondition = "";
        if (language != null && language != '') {
            languageCondition = "and qst_lang = '" + language + "'";
        }
        if (moduleId == undefined) {
            moduleId = null
        }

        var query = "SELECT max(qba_topic_pk) as qba_topic_pk, max(qba_topic_code) as qba_topic_code , max(topic_name) as topic_name,max(qba_topic_master.qba_module_fk) as qba_module_fk,max(module_name) as module_name,COUNT(qstn_bank.qb_pk) AS qcount, CS.cs_count , MCQ.mcq_count " +
            "FROM qba_topic_master LEFT JOIN qstn_bank " +
            "ON qba_topic_master.qba_topic_pk = qstn_bank.qba_topic_fk " + languageCondition + " " +
            "AND (qstn_bank.qst_type = 'M' and qstn_bank.qst_is_active ='A' OR (qstn_bank.qst_type= 'CS' AND " +
            "qstn_bank.qst_pid > '0' and qstn_bank.qst_is_active ='A')) LEFT JOIN qba_module_mstr on qba_topic_master.qba_module_fk = qba_module_mstr.qba_module_pk " +
            " LEFT JOIN (select count(qb_pk) cs_count,qba_topic_fk from qstn_bank where qst_type= 'CS' AND qst_pid > '0' and qstn_bank.qst_is_active ='A' " + languageCondition + " group by qba_topic_fk) CS on qba_topic_master.qba_topic_pk = CS.qba_topic_fk " +
            " LEFT JOIN (select count(qb_pk) mcq_count,qba_topic_fk from qstn_bank where qst_type= 'M' and qstn_bank.qst_is_active ='A' " + languageCondition + " group by qba_topic_fk) MCQ on qba_topic_master.qba_topic_pk = MCQ.qba_topic_fk " +
            " WHERE qba_topic_master.qba_module_fk in (" + moduleId + ") " + languageCondition + " " +
            " GROUP BY qba_topic_master.qba_topic_pk,qba_module_mstr.module_name,CS.cs_count , MCQ.mcq_count ORDER BY qba_module_mstr.module_name ASC;"
        sequelize.query(query, { type: sequelize.QueryTypes.SELECT })
            .then(topics => {
                res.send({
                    code: 0,
                    message: "success",
                    obj: topics
                })
            });
    },
    parseRepoQuestionBankData: function (req, res) {
        var qbdata = req.body.result;
        var qstcount = req.body.count;

        var listQuestionData = [];
        var questionData = {};
        var qta_alt_desce, qstbody;
        if (qbdata.length > 0) {
            for (var i = 0; i < qbdata.length; i++) {
                qta_alt_desce = undefined;
                qstbody = undefined;
                if (qbdata[i].qimage) {
                    var data = rootPath + '/server/controllers/output/' + qbdata[i].qimage
                    var dimensions = sizeOf(data);
                }
                if (qbdata[i].qimage != null && !qbdata[i].qst_body) {
                    qstbody = ' <img  src="static/controllers/output/' + qbdata[i].qimage + '" style="width:' + dimensions.width + 'px;height:' + dimensions.height + 'px" >';
                } else if (qbdata[i].qimage != null && qbdata[i].qst_body != null) {
                    qstbody = qbdata[i].qst_body + ' <img  src="static/controllers/output/' + qbdata[i].qimage + '" style="width:' + dimensions.width + 'px;height:' + dimensions.height + 'px" >';
                } else {
                    qstbody = qbdata[i].qst_body;
                }
                if (i == 0) {
                    //push first row
                    var tw = qbdata[i].total_weightage, total_marks;
                    if (tw - Math.floor(tw) == 0) {
                        total_marks = parseInt(tw);
                    }
                    else {
                        total_marks = tw;
                    }
                    questionData = {
                        log_count: qbdata[i].log_count,
                        total_marks: total_marks,
                        no_of_question: qbdata[i].no_of_question,
                        qb_pk: qbdata[i].qb_pk,
                        qb_id: qbdata[i].qb_id,
                        qst_pid: qbdata[i].qst_pid,
                        qst_lang: qbdata[i].qst_lang,
                        qst_type: qbdata[i].qst_type,
                        qba_topic_fk: qbdata[i].qba_topic_fk,
                        qba_module_fk: qbdata[i].qba_module_fk,
                        qba_subject_fk: qbdata[i].qba_subject_fk,
                        qba_course_fk: qbdata[i].qba_course_fk,
                        qst_marks: qbdata[i].qst_marks,
                        qst_neg_marks: qbdata[i].qst_neg_marks,
                        qst_body: qstbody,
                        qst_no_of_altr: qbdata[i].qst_no_of_altr,
                        no_of_question: qbdata[i].no_of_question,
                        copied_from_repo: qbdata[i].copied_from_repository,
                        qstn_alternatives: [],
                        culled_qstn_alternatives_log: [],
                        qbank_image: { qbi_image_name: qbdata[i].qimage },
                        qba_topic_master: {
                            topic_name: qbdata[i].topic_name,
                            qba_topic_code: qbdata[i].qba_topic_code,
                            qba_topic_pk: qbdata[i].qba_topic_fk
                        },
                        qst_audit_dt: qbdata[i].qst_audit_dt,
                        qst_audit_by: qbdata[i].qst_audit_by,
                        qst_remarks: qbdata[i].qst_remarks,
                        reference_info: qbdata[i].reference_info,
                        calculation_info: qbdata[i].calculation_info,
                        qb_id: qbdata[i].qb_id,
                        qta_pk: qbdata[i].qta_pk,
                        qba_module_mstr: {
                            module_name: qbdata[i].module_name,
                            qba_module_fk: qbdata[i].qba_module_pk
                        },
                        qba_subject_master: {
                            subject_name: qbdata[i].subject_name,
                            qba_subject_fk: qbdata[i].qba_subject_pk,
                            qba_subject_code: qbdata[i].qba_subject_code
                        },
                        qba_course_master: {
                            qba_course_name: qbdata[i].qba_course_name,
                            qba_course_fk: qbdata[i].qba_course_pk,
                            qba_course_code: qbdata[i].qba_course_code
                        },
                        exam_fk: qbdata[i].culled_exam_fk,
                        exampaper_fk: qbdata[i].culled_exampaper_fk,
                        current_time: qbdata[i].current_time,
                        qst_request_status: qbdata[i].qst_request_status,
                        qst_request_remarks: qbdata[i].qst_request_remarks,
                        copied_from_repo: qbdata[i].copied_from_repository,
                        qst_status: qbdata[i].qst_is_active
                    };



                    if ((qbdata[i].qst_type == "CS" && qbdata[i].qst_pid != 0) || qbdata[i].qst_type == "M") {
                        if (qbdata[i].aimage) {
                            var data = rootPath + '/server/controllers/output/' + qbdata[i].aimage
                            var dimensions = sizeOf(data);
                        }
                        if (qbdata[i].aimage != null && !qbdata[i].qta_alt_desc) {
                            qta_alt_desce = ' <img  src="static/controllers/output/' + qbdata[i].aimage + '" style="width:' + dimensions.width + 'px;height:' + dimensions.height + 'px" >';
                        } else if (qbdata[i].aimage != null && qbdata[i].qta_alt_desc != null) {
                            qta_alt_desce = qbdata[i].qta_alt_desc + ' <img  src="static/controllers/output/' + qbdata[i].aimage + '" style="width:' + dimensions.width + 'px;height:' + dimensions.height + 'px" >';
                        } else {
                            qta_alt_desce = qbdata[i].qta_alt_desc;
                        }
                        questionData.qstn_alternatives.push({
                            qta_alt_desc: qta_alt_desce,
                            qta_order: qbdata[i].qta_order,
                            qta_is_corr_alt: qbdata[i].qta_is_corr_alt,
                            qta_pk: qbdata[i].qta_pk,
                            qbank_image: { qbi_image_name: qbdata[i].aimage }
                        });

                    }

                    var final_log = [];
                    if (qbdata[i].new_answer != undefined) {
                        for (var j = 0; j < qbdata[i].new_answer.length; j++) {
                            questionData.culled_qstn_alternatives_log.push('Correct ' + qbdata[i].log_status[j] + ' changed from ' + qbdata[i].old_answer[j] + ' to ' + qbdata[i].new_answer[j] + ' by ' + qbdata[i].log_by[j] + ' on ' + qbdata[i].log_date[j] + ' ');
                        }
                    }
                }
                else {
                    if (questionData.qb_pk == qbdata[i].qb_pk) {
                        if (qbdata[i].aimage) {
                            var data = rootPath + '/server/controllers/output/' + qbdata[i].aimage
                            var dimensions = sizeOf(data);
                        }
                        if (qbdata[i].aimage != null && !qbdata[i].qta_alt_desc) {
                            qta_alt_desce = ' <img  src="static/controllers/output/' + qbdata[i].aimage + '" style="width:' + dimensions.width + 'px;height:' + dimensions.height + 'px">';
                        } else if (qbdata[i].aimage != null && qbdata[i].qta_alt_desc != null) {
                            qta_alt_desce = qbdata[i].qta_alt_desc + ' <img  src="static/controllers/output/' + qbdata[i].aimage + '" style="width:' + dimensions.width + 'px;height:' + dimensions.height + 'px">';
                        } else {
                            qta_alt_desce = qbdata[i].qta_alt_desc;
                        }
                        questionData.qstn_alternatives.push({
                            qta_alt_desc: qta_alt_desce,
                            qta_order: qbdata[i].qta_order,
                            qta_pk: qbdata[i].qta_pk,
                            qta_is_corr_alt: qbdata[i].qta_is_corr_alt,
                            qbank_image: { qbi_image_name: qbdata[i].aimage },
                            qba_topic_master: { topic_name: qbdata[i].topic_name }
                        });

                    }
                    else {
                        listQuestionData.push(questionData);
                        questionData = {};

                        //push new questionData
                        var tw = qbdata[i].total_weightage, total_marks;
                        if (tw - Math.floor(tw) == 0) {
                            total_marks = parseInt(tw);
                        }
                        else {
                            total_marks = tw;
                        }
                        questionData = {
                            log_count: qbdata[i].log_count,
                            total_marks: total_marks,
                            no_of_question: qbdata[i].no_of_question,
                            qb_pk: qbdata[i].qb_pk,
                            qb_id: qbdata[i].qb_id,
                            qst_lang: qbdata[i].qst_lang,
                            qst_pid: qbdata[i].qst_pid,
                            qst_type: qbdata[i].qst_type,
                            qba_topic_fk: qbdata[i].qba_topic_fk,
                            qba_module_fk: qbdata[i].qba_module_fk,
                            qba_subject_fk: qbdata[i].qba_subject_fk,
                            qba_course_fk: qbdata[i].qba_course_fk,
                            qst_marks: qbdata[i].qst_marks,
                            qst_neg_marks: qbdata[i].qst_neg_marks,
                            qst_body: qstbody,
                            qst_no_of_altr: qbdata[i].qst_no_of_altr,
                            no_of_question: qbdata[i].no_of_question,
                            copied_from_repo: qbdata[i].copied_from_repository,
                            qstn_alternatives: [],
                            culled_qstn_alternatives_log: [],
                            qbank_image: { qbi_image_name: qbdata[i].qimage },
                            qba_topic_master: {
                                topic_name: qbdata[i].topic_name,
                                qba_topic_code: qbdata[i].qba_topic_code,
                                qba_topic_pk: qbdata[i].qba_topic_fk
                            },
                            qst_audit_dt: qbdata[i].qst_audit_dt,
                            qst_audit_by: qbdata[i].qst_audit_by,
                            qst_remarks: qbdata[i].qst_remarks,
                            reference_info: qbdata[i].reference_info,
                            calculation_info: qbdata[i].calculation_info,
                            qb_id: qbdata[i].qb_id,
                            qta_pk: qbdata[i].qta_pk,
                            qba_module_mstr: {
                                module_name: qbdata[i].module_name,
                                qba_module_fk: qbdata[i].qba_module_pk
                            },
                            qba_subject_master: {
                                subject_name: qbdata[i].subject_name,
                                qba_subject_fk: qbdata[i].qba_subject_pk,
                                qba_subject_code: qbdata[i].qba_subject_code
                            },
                            qba_course_master: {
                                qba_course_name: qbdata[i].qba_course_name,
                                qba_course_fk: qbdata[i].qba_course_pk,
                                qba_course_code: qbdata[i].qba_course_code
                            },
                            exam_fk: qbdata[i].culled_exam_fk,
                            exampaper_fk: qbdata[i].culled_exampaper_fk,
                            current_time: qbdata[i].current_time,
                            qst_request_status: qbdata[i].qst_request_status,
                            qst_request_remarks: qbdata[i].qst_request_remarks,
                            copied_from_repo: qbdata[i].copied_from_repository,
                            qst_status: qbdata[i].qst_is_active

                        };

                        if ((qbdata[i].qst_type == "CS" && qbdata[i].qst_pid != 0) || qbdata[i].qst_type == "M") {
                            qta_alt_desce = undefined;
                            if (qbdata[i].aimage) {
                                var data = rootPath + '/server/controllers/output/' + qbdata[i].aimage
                                var dimensions = sizeOf(data);
                            }
                            if (qbdata[i].aimage != null && !qbdata[i].qta_alt_desc) {
                                qta_alt_desce = ' <img  src="static/controllers/output/' + qbdata[i].aimage + '" style="width:' + dimensions.width + 'px;height:' + dimensions.height + 'px" >';
                            } else if (qbdata[i].aimage != null && qbdata[i].qta_alt_desc != null) {
                                qta_alt_desce = qbdata[i].qta_alt_desc + ' <img  src="static/controllers/output/' + qbdata[i].aimage + '" style="width:' + dimensions.width + 'px;height:' + dimensions.height + 'px" >';
                            } else {
                                qta_alt_desce = qbdata[i].qta_alt_desc;
                            }
                            questionData.qstn_alternatives.push({
                                qta_alt_desc: qta_alt_desce,
                                qta_order: qbdata[i].qta_order,
                                qta_pk: qbdata[i].qta_pk,
                                qta_is_corr_alt: qbdata[i].qta_is_corr_alt,
                                qbank_image: { qbi_image_name: qbdata[i].aimage }
                            });


                        }
                        var final_log = [];
                        if (qbdata[i].new_answer != undefined) {
                            for (var j = 0; j < qbdata[i].new_answer.length; j++) {
                                questionData.culled_qstn_alternatives_log.push('Correct ' + qbdata[i].log_status[j] + ' changed from ' + qbdata[i].old_answer[j] + ' to ' + qbdata[i].new_answer[j] + ' by ' + qbdata[i].log_by[j] + ' on ' + qbdata[i].log_date[j] + ' ');
                            }
                        }



                    }

                }

                if (i == qbdata.length - 1) {
                    listQuestionData.push(questionData);
                }
            }
            res.send({
                code: 0,
                message: "Data Found",
                data: listQuestionData,
                count: qstcount
            })
        }
        else {
            res.send({
                code: 1,
                message: "No Records Found",
                data: []
            })
        }
    },
    parseQuestionBankData: function (req, res) {
        var qbdata = req.body.result;
        var qstcount = req.body.count;
        var qstcount1 = req.body.count1

        var listQuestionData = [];
        var questionData = {};
        if (qbdata.length > 0) {
            for (var i = 0; i < qbdata.length; i++) {
                if (i == 0) {
                    //push first row
                    var tw = qbdata[i].total_weightage, total_marks;
                    if (tw - Math.floor(tw) == 0) {
                        total_marks = parseInt(tw);
                    }
                    else {
                        total_marks = tw;
                    }
                    questionData = {
                        log_count: qbdata[i].log_count,
                        total_marks: total_marks,
                        no_of_question: qbdata[i].no_of_question,
                        qb_pk: qbdata[i].qb_pk,
                        qb_id: qbdata[i].qb_id,
                        qst_pid: qbdata[i].qst_pid,
                        qst_type: qbdata[i].qst_type,
                        qba_topic_fk: qbdata[i].qba_topic_fk,
                        qst_lang: qbdata[i].qst_lang,
                        qba_module_fk: qbdata[i].qba_module_fk,
                        qba_subject_fk: qbdata[i].qba_subject_fk,
                        qba_course_fk: qbdata[i].qba_course_fk,
                        qst_marks: qbdata[i].qst_marks,
                        qst_neg_marks: qbdata[i].qst_neg_marks,
                        qst_body: qbdata[i].qst_body,
                        //comments: qbdata[i].comments,
                        qst_no_of_altr: qbdata[i].qst_no_of_altr,
                        no_of_question: qbdata[i].no_of_question,
                        copied_from_repo: qbdata[i].copied_from_repository,
                        qstn_alternatives: [],
                        culled_qstn_alternatives_log: [],
                        qbank_image: { qbi_image_name: qbdata[i].qimage },
                        qba_topic_master: {
                            topic_name: qbdata[i].topic_name,
                            qba_topic_code: qbdata[i].qba_topic_code,
                            qba_topic_pk: qbdata[i].qba_topic_fk
                        },
                        qst_audit_dt: qbdata[i].qst_audit_dt,
                        qst_audit_by: qbdata[i].qst_audit_by,
                        qst_remarks: qbdata[i].qst_remarks,
                        reference_info: qbdata[i].reference_info,
                        calculation_info: qbdata[i].calculation_info,
                        qb_id: qbdata[i].qb_id,
                        qta_pk: qbdata[i].qta_pk,
                        qba_module_mstr: {
                            module_name: qbdata[i].module_name,
                            qba_module_fk: qbdata[i].qba_module_pk
                        },
                        qba_subject_master: {
                            subject_name: qbdata[i].subject_name,
                            qba_subject_fk: qbdata[i].qba_subject_pk,
                            qba_subject_code: qbdata[i].qba_subject_code
                        },
                        qba_course_master: {
                            qba_course_name: qbdata[i].qba_course_name,
                            qba_course_fk: qbdata[i].qba_course_pk,
                            qba_course_code: qbdata[i].qba_course_code
                        },
                        exam_fk: qbdata[i].culled_exam_fk,
                        exampaper_fk: qbdata[i].culled_exampaper_fk,
                        current_time: qbdata[i].current_time,
                        qst_request_status: qbdata[i].qst_request_status,
                        qst_request_remarks: qbdata[i].qst_request_remarks,
                        copied_from_repo: qbdata[i].copied_from_repository,
                        qst_status: qbdata[i].qst_is_active
                    };



                    if ((qbdata[i].qst_type == "CS" && qbdata[i].qst_pid != 0) || qbdata[i].qst_type == "M") {
                        questionData.qstn_alternatives.push({
                            qta_alt_desc: qbdata[i].qta_alt_desc,
                            qta_order: qbdata[i].qta_order,
                            qta_is_corr_alt: qbdata[i].qta_is_corr_alt,
                            qta_pk: qbdata[i].qta_pk,
                            qbank_image: { qbi_image_name: qbdata[i].aimage }
                        });

                    }
                    var final_log = [];
                    if (qbdata[i].new_answer != undefined) {
                        for (var j = 0; j < qbdata[i].new_answer.length; j++) {
                            questionData.culled_qstn_alternatives_log.push('Correct ' + qbdata[i].log_status[j] + ' changed from ' + qbdata[i].old_answer[j] + ' to ' + qbdata[i].new_answer[j] + ' by ' + qbdata[i].log_by[j] + ' on ' + qbdata[i].log_date[j] + ' ');
                        }
                    }
                }
                else {
                    if (questionData.qb_pk == qbdata[i].qb_pk) {

                        questionData.qstn_alternatives.push({
                            qta_alt_desc: qbdata[i].qta_alt_desc,
                            qta_order: qbdata[i].qta_order,
                            qta_pk: qbdata[i].qta_pk,
                            qta_is_corr_alt: qbdata[i].qta_is_corr_alt,
                            qbank_image: { qbi_image_name: qbdata[i].aimage },
                            qba_topic_master: { topic_name: qbdata[i].topic_name }
                        });

                    }
                    else {
                        listQuestionData.push(questionData);
                        questionData = {};

                        //push new questionData
                        var tw = qbdata[i].total_weightage, total_marks;
                        if (tw - Math.floor(tw) == 0) {
                            total_marks = parseInt(tw);
                        }
                        else {
                            total_marks = tw;
                        }
                        questionData = {
                            log_count: qbdata[i].log_count,
                            total_marks: total_marks,
                            no_of_question: qbdata[i].no_of_question,
                            qb_pk: qbdata[i].qb_pk,
                            qb_id: qbdata[i].qb_id,
                            qst_pid: qbdata[i].qst_pid,
                            qst_type: qbdata[i].qst_type,
                            qba_topic_fk: qbdata[i].qba_topic_fk,
                            qst_lang: qbdata[i].qst_lang,
                            qba_module_fk: qbdata[i].qba_module_fk,
                            qba_subject_fk: qbdata[i].qba_subject_fk,
                            qba_course_fk: qbdata[i].qba_course_fk,
                            qst_marks: qbdata[i].qst_marks,
                            qst_neg_marks: qbdata[i].qst_neg_marks,
                            qst_body: qbdata[i].qst_body,
                            // comments: qbdata[i].comments,
                            qst_no_of_altr: qbdata[i].qst_no_of_altr,
                            no_of_question: qbdata[i].no_of_question,
                            copied_from_repo: qbdata[i].copied_from_repository,
                            qstn_alternatives: [],
                            culled_qstn_alternatives_log: [],
                            qbank_image: { qbi_image_name: qbdata[i].qimage },
                            qba_topic_master: {
                                topic_name: qbdata[i].topic_name,
                                qba_topic_code: qbdata[i].qba_topic_code,
                                qba_topic_pk: qbdata[i].qba_topic_fk
                            },
                            qst_audit_dt: qbdata[i].qst_audit_dt,
                            qst_audit_by: qbdata[i].qst_audit_by,
                            qst_remarks: qbdata[i].qst_remarks,
                            reference_info: qbdata[i].reference_info,
                            calculation_info: qbdata[i].calculation_info,
                            qb_id: qbdata[i].qb_id,
                            qta_pk: qbdata[i].qta_pk,
                            qba_module_mstr: {
                                module_name: qbdata[i].module_name,
                                qba_module_fk: qbdata[i].qba_module_pk
                            },
                            qba_subject_master: {
                                subject_name: qbdata[i].subject_name,
                                qba_subject_fk: qbdata[i].qba_subject_pk,
                                qba_subject_code: qbdata[i].qba_subject_code
                            },
                            qba_course_master: {
                                qba_course_name: qbdata[i].qba_course_name,
                                qba_course_fk: qbdata[i].qba_course_pk,
                                qba_course_code: qbdata[i].qba_course_code
                            },
                            exam_fk: qbdata[i].culled_exam_fk,
                            exampaper_fk: qbdata[i].culled_exampaper_fk,
                            current_time: qbdata[i].current_time,
                            qst_request_status: qbdata[i].qst_request_status,
                            qst_request_remarks: qbdata[i].qst_request_remarks,
                            copied_from_repo: qbdata[i].copied_from_repository,
                            qst_status: qbdata[i].qst_is_active

                        };

                        if (qbdata[i].aimage != null) {
                            var qta_alt_desc = qbdata[i].qta_alt_desc + ' <img  src="static/controllers/output/{{alternative.qbank_image.qbi_image_name}}" >';
                        } else {
                            var qta_alt_desc = qbdata[i].qta_alt_desc;
                        }
                        if ((qbdata[i].qst_type == "CS" && qbdata[i].qst_pid != 0) || qbdata[i].qst_type == "M") {
                            questionData.qstn_alternatives.push({
                                qta_alt_desc: qbdata[i].qta_alt_desc,
                                qta_order: qbdata[i].qta_order,
                                qta_pk: qbdata[i].qta_pk,
                                qta_is_corr_alt: qbdata[i].qta_is_corr_alt,
                                qbank_image: { qbi_image_name: qbdata[i].aimage }
                            });


                        }
                        var final_log = [];
                        if (qbdata[i].new_answer != undefined) {
                            for (var j = 0; j < qbdata[i].new_answer.length; j++) {
                                questionData.culled_qstn_alternatives_log.push('Correct ' + qbdata[i].log_status[j] + ' changed from ' + qbdata[i].old_answer[j] + ' to ' + qbdata[i].new_answer[j] + ' by ' + qbdata[i].log_by[j] + ' on ' + qbdata[i].log_date[j] + ' ');
                            }
                        }
                    }

                }

                if (i == qbdata.length - 1) {
                    listQuestionData.push(questionData);
                }
            }
            res.send({
                code: 0,
                message: "Data Found",
                data: listQuestionData,
                count: qstcount,
                count1: qstcount1
            })
        }
        else {
            res.send({
                code: 1,
                message: "No Records Found",
                data: []
            })
        }
    },
    loadQuestions: function (req, res) {
        importMethods.checkValidUser(req, res);
        var topicId = req.body.id;
        var language = req.body.language;
        var start = req.body.off;
        var end = req.body.lim;

        var query = "WITH d1 as ( select *, qta_is_corr_alt, qta_alt_desc, alterimage.qbi_image_name as aimage, total_weightage from ( select no_of_question, qb_pk, qba_course_name, subject_name, module_name, topic_name, qba_topic_code, qst_marks, qst_neg_marks, qst_lang, qst_type, qst_pid, qst_body, qst_no_of_altr, qst_remarks, calculation_info, reference_info, qst_is_active, qst_audit_by, no_of_question, qst_audit_dt, questionimage.qbi_image_name as qimage, qb_id , ( CASE WHEN qst_type='CS' AND qst_pid > 0 THEN qst_pid::varchar || '.' || lpad(qb_id::varchar,8,'0')::varchar ELSE CASE WHEN qst_type = 'M' THEN qb_id::varchar ELSE qb_id::varchar END END )::numeric(16,10) as qb_id1 from ( select qb_pk un_id, * from qba.qstn_bank a where ( case when qst_type = 'CS' and qst_pid > 0 then 1 else 2 end ) = 2 union ALL select a.qb_pk un_id, b.* from qba.qstn_bank a inner join qba.qstn_bank b on a.qst_lang = b.qst_lang and a.qb_id = b.qst_pid where a.qst_type = 'CS' and a.qst_pid = 0 ) qstn_bank inner join qba.qba_topic_master on ( qba_topic_master.qba_topic_pk = qstn_bank.qba_topic_fk ) inner join qba.qba_module_mstr on ( qba_module_mstr.qba_module_pk = qba_topic_master.qba_module_fk ) inner join qba.qba_subject_master on ( qba_subject_master.qba_subject_pk = qba_module_mstr.qba_subject_fk ) inner join qba.qba_course_master on ( qba_course_master.qba_course_pk = qba_subject_master.qba_course_fk ) LEFT OUTER JOIN qba.qbank_images as questionimage ON ( qstn_bank.qst_img_fk = questionimage.qbi_pk ) where qba_topic_fk = " + topicId + " and qst_lang = '" + language + "' and qst_is_active = 'A' order by qb_pk ) a left join qba.qstn_alternatives on( qstn_alternatives.qta_qst_id = a.qb_pk ) and qta_is_active IN ('Y', 'A') left join ( select sum(cu.qst_marks) total_weightage, max(cu.qst_pid) qstpid from qba.qstn_bank cu group by cu.qst_pid having (cu.qst_pid)> 0 ) tw on (a.qb_id = tw.qstpid) LEFT OUTER JOIN qba.qbank_images as alterimage ON ( qstn_alternatives.qta_img_fk = alterimage.qbi_pk ) ), d2 as ( SELECT case when qst_type = 'CS' then dense_rank() over(ORDER BY qst_type, module_name,qba_topic_code,qb_id1, qb_pk) else dense_rank() over(ORDER BY qst_type, module_name,qba_topic_code, qst_marks,qb_id, qb_pk) end as dr, * FROM ( SELECT * FROM d1 )t ) SELECT qst_type, qb_id, qst_pid, module_name, qba_topic_code,qst_marks,qta_pk, * FROM d2 where qst_is_active != 'X' and dr between " + start + " and  " + end + " ORDER BY dr,qta_order";
        qstn_bank.count({
            where: sequelize.and({ qba_topic_fk: topicId },
                sequelize.and({ qst_lang: language }))
        }).then(c => {
            sequelize.query(query, { type: sequelize.QueryTypes.SELECT })
                .then(searchResult => {

                    req.body.result = searchResult;
                    req.body.count = c;
                    importMethods.parseRepoQuestionBankData(req, res);
                })
        })
    },
    loadVetterQuestions: function (req, res) {
        importMethods.checkValidUser(req, res);
        var moduleId = req.body.id;
        var start = req.body.off;
        var end = req.body.lim;
        var exam_pk = req.body.examPk;
        var exampaper_pk = req.body.examPaperPk;
        var filter = req.body.filter

        var paginationCondition = "";

        if (!(isNaN(end) && end == 'ALL')) {
            paginationCondition = "where dr between " + start + " and  " + end;
        }
        var query = "WITH d1 AS ( SELECT DISTINCT * , qta_is_corr_alt,alterimage.qbi_image_name as aimage,qta_pk, qta_alt_desc, now() AS CURRENT_TIME FROM ( SELECT replace_id,qst_request_status,qst_request_remarks,qba_subject_code,qba_course_code, log_count, total_weightage, no_of_question, un_id, qb_pk, qba_topic_fk, qba_subject_pk, qba_course_pk, qba_module_pk, qba_course_name, subject_name, module_name, topic_name, qba_topic_code, qst_marks, qst_neg_marks, qst_lang, qst_type, qst_pid, qst_body, qst_no_of_altr, qst_remarks, qst_request_remarks, calculation_info, reference_info, qst_is_active, qst_audit_by, qst_audit_dt, culled_qstn_bank.qb_id, ( CASE WHEN culled_qstn_bank.qst_type='CS' AND culled_qstn_bank.qst_pid > 0 THEN culled_qstn_bank.qst_pid::varchar || '.' || lpad(culled_qstn_bank.qb_id::varchar,8,'0')::varchar ELSE culled_qstn_bank.qb_id::varchar END )::numeric(16,10) as qb_id1, culled_qstn_bank.exam_fk AS culled_exam_fk , culled_qstn_bank.exampaper_fk AS culled_exampaper_fk , culled_qb_pk, copied_from_repository FROM ( SELECT culled_qb_pk un_id, * FROM qba.culled_qstn_bank a WHERE (CASE WHEN qst_type = 'CS' AND qst_pid > 0 THEN 1 ELSE 2 END) =2 UNION ALL SELECT a.culled_qb_pk un_id, b.* FROM qba.culled_qstn_bank a INNER JOIN qba.culled_qstn_bank b ON a.qst_lang= b.qst_lang AND a.qb_id=b.qst_pid AND a.exampaper_fk=b.exampaper_fk WHERE a.qst_type = 'CS' AND a.qst_pid = 0 ) culled_qstn_bank INNER JOIN qba.qba_topic_master ON (qba_topic_master.qba_topic_pk=culled_qstn_bank.qba_topic_fk) INNER JOIN qba.qba_module_mstr ON (qba_module_mstr.qba_module_pk=qba_topic_master.qba_module_fk) INNER JOIN qba.qba_subject_master ON (qba_subject_master.qba_subject_pk=qba_module_mstr.qba_subject_fk) INNER JOIN qba.qba_course_master ON (qba_course_master.qba_course_pk=qba_subject_master.qba_course_fk) LEFT JOIN ( SELECT SUM(cu.qst_marks) total_weightage, MAX(cu.qst_pid) qstpid FROM qba.culled_qstn_bank cu WHERE cu.exam_fk =" + exam_pk + " AND cu.exampaper_fk = " + exampaper_pk + " AND cu.qst_lang='ENGLISH' and cu.qst_is_active = 'A' and (cu.qba_module_fk IN (" + moduleId + ") or cu.qba_module_fk is null) GROUP BY cu.qst_pid HAVING(cu.qst_pid)> 1 ) tw ON (culled_qstn_bank.qb_id = tw.qstpid) LEFT JOIN ( SELECT old_qta_fk log_count, qb_id, exam_fk, exampaper_fk FROM qba.culled_qstn_alternatives_log WHERE qta_log_pk IN ( SELECT MAX(qta_log_pk) FROM qba.culled_qstn_alternatives_log WHERE exam_fk=" + exam_pk + " AND exampaper_fk=" + exampaper_pk + " AND status='Answer'  GROUP BY qb_id ) ) log ON (log.qb_id=culled_qstn_bank.qb_id AND log.exam_fk=" + exam_pk + " AND log.exampaper_fk=" + exampaper_pk + ") WHERE qst_is_active = 'A' AND culled_qstn_bank.exam_fk =" + exam_pk + " AND culled_qstn_bank.exampaper_fk= " + exampaper_pk + " AND qst_lang='ENGLISH' and (culled_qstn_bank.qba_module_fk IN (" + moduleId + ") or culled_qstn_bank.qba_module_fk is null) ORDER BY module_name, topic_name, qst_marks, qb_id ) a LEFT JOIN qba.culled_qstn_alternatives ON(culled_qstn_alternatives.qta_qst_id=a.qb_pk AND culled_qstn_alternatives.exam_fk=" + exam_pk + " AND culled_qstn_alternatives.exampaper_fk=" + exampaper_pk + ") left join qbank_images alterimage on (alterimage.qbi_pk=culled_qstn_alternatives.qta_img_fk)  WHERE qst_type = 'CS'  ORDER BY module_name, qba_topic_code, qst_type DESC, qst_marks, qb_id1 ), d2 AS ( SELECT * FROM d1 ORDER BY module_name,topic_name, qst_type, qb_id ), d3 AS ( SELECT DISTINCT * , qta_is_corr_alt,alterimage.qbi_image_name as aimage,qta_pk, qta_alt_desc, now() AS CURRENT_TIME FROM ( SELECT replace_id,qst_request_status,qst_request_remarks,qba_subject_code,qba_course_code, log_count, total_weightage, no_of_question, un_id, qb_pk, qba_topic_fk, qba_subject_pk, qba_course_pk, qba_module_pk, qba_course_name, subject_name, module_name, topic_name, qba_topic_code, qst_marks, qst_neg_marks, qst_lang, qst_type, qst_pid, qst_body, qst_no_of_altr, qst_remarks, qst_request_remarks, calculation_info, reference_info, qst_is_active, qst_audit_by, qst_audit_dt, culled_qstn_bank.qb_id, ( CASE WHEN culled_qstn_bank.qst_type = 'M' THEN culled_qstn_bank.qb_id::varchar ELSE NULL END )::numeric(10,5) as qb_id1, culled_qstn_bank.exam_fk AS culled_exam_fk , culled_qstn_bank.exampaper_fk AS culled_exampaper_fk , culled_qb_pk, copied_from_repository FROM ( SELECT culled_qb_pk un_id, * FROM qba.culled_qstn_bank a WHERE (CASE WHEN qst_type = 'CS' AND qst_pid > 0 THEN 1 ELSE 2 END) =2 UNION ALL SELECT a.culled_qb_pk un_id, b.* FROM qba.culled_qstn_bank a INNER JOIN qba.culled_qstn_bank b ON a.qst_lang= b.qst_lang AND a.qb_id=b.qst_pid AND a.exampaper_fk=b.exampaper_fk WHERE a.qst_type = 'CS' AND a.qst_pid = 0 ) culled_qstn_bank INNER JOIN qba.qba_topic_master ON (qba_topic_master.qba_topic_pk=culled_qstn_bank.qba_topic_fk) INNER JOIN qba.qba_module_mstr ON (qba_module_mstr.qba_module_pk=qba_topic_master.qba_module_fk) INNER JOIN qba.qba_subject_master ON (qba_subject_master.qba_subject_pk=qba_module_mstr.qba_subject_fk) INNER JOIN qba.qba_course_master ON (qba_course_master.qba_course_pk=qba_subject_master.qba_course_fk) LEFT JOIN ( SELECT SUM(cu.qst_marks) total_weightage, MAX(cu.qst_pid) qstpid FROM qba.culled_qstn_bank cu WHERE cu.exam_fk =" + exam_pk + " AND cu.exampaper_fk= " + exampaper_pk + " AND cu.qst_lang='ENGLISH' GROUP BY cu.qst_pid HAVING(cu.qst_pid)> 1 ) tw ON (culled_qstn_bank.qb_id = tw.qstpid) LEFT JOIN ( SELECT old_qta_fk log_count, qb_id, exam_fk, exampaper_fk FROM qba.culled_qstn_alternatives_log WHERE qta_log_pk IN ( SELECT MAX(qta_log_pk) FROM qba.culled_qstn_alternatives_log WHERE exam_fk=" + exam_pk + " AND exampaper_fk=" + exampaper_pk + " AND status='Answer' GROUP BY qb_id ) ) log ON (log.qb_id=culled_qstn_bank.qb_id AND log.exam_fk=" + exam_pk + " AND log.exampaper_fk=" + exampaper_pk + ") WHERE qst_is_active = 'A'  AND culled_qstn_bank.exam_fk =" + exam_pk + " AND culled_qstn_bank.exampaper_fk= " + exampaper_pk + " AND qst_lang='ENGLISH' and (culled_qstn_bank.qba_module_fk IN (" + moduleId + ") or culled_qstn_bank.qba_module_fk is null) ORDER BY module_name, topic_name, qst_marks, qb_id ) a LEFT JOIN qba.culled_qstn_alternatives ON(culled_qstn_alternatives.qta_qst_id=a.qb_pk AND culled_qstn_alternatives.exam_fk=" + exam_pk + " AND culled_qstn_alternatives.exampaper_fk=" + exampaper_pk + ") left join qbank_images alterimage on (alterimage.qbi_pk=culled_qstn_alternatives.qta_img_fk)  WHERE qst_type = 'M' ORDER BY module_name, qba_topic_code, qst_type DESC, qst_marks ) , "; "WITH d1 AS ( SELECT DISTINCT * , qta_is_corr_alt,alterimage.qbi_image_name as aimage,qta_pk, qta_alt_desc, now() AS CURRENT_TIME FROM ( SELECT replace_id,qst_request_status,qst_request_remarks,qba_subject_code,qba_course_code, log_count, total_weightage, no_of_question, un_id, qb_pk, qba_topic_fk, qba_subject_pk, qba_course_pk, qba_module_pk, qba_course_name, subject_name, module_name, topic_name, qba_topic_code, qst_marks, qst_neg_marks, qst_lang, qst_type, qst_pid, qst_body, qst_no_of_altr, qst_remarks, qst_request_remarks, calculation_info, reference_info, qst_is_active, qst_audit_by, qst_audit_dt, culled_qstn_bank.qb_id, ( CASE WHEN culled_qstn_bank.qst_type='CS' AND culled_qstn_bank.qst_pid > 0 THEN culled_qstn_bank.qst_pid::varchar || '.' || lpad(culled_qstn_bank.qb_id::varchar,8,'0')::varchar ELSE culled_qstn_bank.qb_id::varchar END )::numeric(16,10) as qb_id1, culled_qstn_bank.exam_fk AS culled_exam_fk , culled_qstn_bank.exampaper_fk AS culled_exampaper_fk , culled_qb_pk, copied_from_repository FROM ( SELECT culled_qb_pk un_id, * FROM qba.culled_qstn_bank a WHERE (CASE WHEN qst_type = 'CS' AND qst_pid > 0 THEN 1 ELSE 2 END) =2 UNION ALL SELECT a.culled_qb_pk un_id, b.* FROM qba.culled_qstn_bank a INNER JOIN qba.culled_qstn_bank b ON a.qst_lang= b.qst_lang AND a.qb_id=b.qst_pid AND a.exampaper_fk=b.exampaper_fk WHERE a.qst_type = 'CS' AND a.qst_pid = 0 ) culled_qstn_bank INNER JOIN qba.qba_topic_master ON (qba_topic_master.qba_topic_pk=culled_qstn_bank.qba_topic_fk) INNER JOIN qba.qba_module_mstr ON (qba_module_mstr.qba_module_pk=qba_topic_master.qba_module_fk) INNER JOIN qba.qba_subject_master ON (qba_subject_master.qba_subject_pk=qba_module_mstr.qba_subject_fk) INNER JOIN qba.qba_course_master ON (qba_course_master.qba_course_pk=qba_subject_master.qba_course_fk) LEFT JOIN ( SELECT SUM(cu.qst_marks) total_weightage, MAX(cu.qst_pid) qstpid FROM qba.culled_qstn_bank cu WHERE cu.exam_fk =" + exam_pk + " AND cu.exampaper_fk = " + exampaper_pk + " AND cu.qst_lang='ENGLISH' and cu.qst_is_active = 'A' and (cu.qba_module_fk IN (" + moduleId + ") or cu.qba_module_fk is null) GROUP BY cu.qst_pid HAVING(cu.qst_pid)> 1 ) tw ON (culled_qstn_bank.qb_id = tw.qstpid) LEFT JOIN ( SELECT old_qta_fk log_count, qb_id, exam_fk, exampaper_fk FROM qba.culled_qstn_alternatives_log WHERE qta_log_pk IN ( SELECT MAX(qta_log_pk) FROM qba.culled_qstn_alternatives_log WHERE exam_fk=" + exam_pk + " AND exampaper_fk=" + exampaper_pk + " AND status='Answer'  GROUP BY qb_id ) ) log ON (log.qb_id=culled_qstn_bank.qb_id AND log.exam_fk=" + exam_pk + " AND log.exampaper_fk=" + exampaper_pk + ") WHERE qst_is_active = 'A' AND culled_qstn_bank.exam_fk =" + exam_pk + " AND culled_qstn_bank.exampaper_fk= " + exampaper_pk + " AND qst_lang='ENGLISH' and (culled_qstn_bank.qba_module_fk IN (" + moduleId + ") or culled_qstn_bank.qba_module_fk is null) ORDER BY module_name, topic_name, qst_marks, qb_id ) a LEFT JOIN qba.culled_qstn_alternatives ON(culled_qstn_alternatives.qta_qst_id=a.qb_pk AND culled_qstn_alternatives.exam_fk=" + exam_pk + " AND culled_qstn_alternatives.exampaper_fk=" + exampaper_pk + ") left join qbank_images alterimage on (alterimage.qbi_pk=culled_qstn_alternatives.qta_img_fk)  WHERE qst_type = 'CS'  ORDER BY module_name, qba_topic_code, qst_type DESC, qst_marks, qb_id1 ), d2 AS ( SELECT * FROM d1 ORDER BY module_name,topic_name, qst_type, qb_id ), d3 AS ( SELECT DISTINCT * , qta_is_corr_alt,alterimage.qbi_image_name as aimage,qta_pk, qta_alt_desc, now() AS CURRENT_TIME FROM ( SELECT replace_id,qst_request_status,qst_request_remarks,qba_subject_code,qba_course_code, log_count, total_weightage, no_of_question, un_id, qb_pk, qba_topic_fk, qba_subject_pk, qba_course_pk, qba_module_pk, qba_course_name, subject_name, module_name, topic_name, qba_topic_code, qst_marks, qst_neg_marks, qst_lang, qst_type, qst_pid, qst_body, qst_no_of_altr, qst_remarks, qst_request_remarks, calculation_info, reference_info, qst_is_active, qst_audit_by, qst_audit_dt, culled_qstn_bank.qb_id, ( CASE WHEN culled_qstn_bank.qst_type = 'M' THEN culled_qstn_bank.qb_id::varchar ELSE NULL END )::numeric(10,5) as qb_id1, culled_qstn_bank.exam_fk AS culled_exam_fk , culled_qstn_bank.exampaper_fk AS culled_exampaper_fk , culled_qb_pk, copied_from_repository FROM ( SELECT culled_qb_pk un_id, * FROM qba.culled_qstn_bank a WHERE (CASE WHEN qst_type = 'CS' AND qst_pid > 0 THEN 1 ELSE 2 END) =2 UNION ALL SELECT a.culled_qb_pk un_id, b.* FROM qba.culled_qstn_bank a INNER JOIN qba.culled_qstn_bank b ON a.qst_lang= b.qst_lang AND a.qb_id=b.qst_pid AND a.exampaper_fk=b.exampaper_fk WHERE a.qst_type = 'CS' AND a.qst_pid = 0 ) culled_qstn_bank INNER JOIN qba.qba_topic_master ON (qba_topic_master.qba_topic_pk=culled_qstn_bank.qba_topic_fk) INNER JOIN qba.qba_module_mstr ON (qba_module_mstr.qba_module_pk=qba_topic_master.qba_module_fk) INNER JOIN qba.qba_subject_master ON (qba_subject_master.qba_subject_pk=qba_module_mstr.qba_subject_fk) INNER JOIN qba.qba_course_master ON (qba_course_master.qba_course_pk=qba_subject_master.qba_course_fk) LEFT JOIN ( SELECT SUM(cu.qst_marks) total_weightage, MAX(cu.qst_pid) qstpid FROM qba.culled_qstn_bank cu WHERE cu.exam_fk =" + exam_pk + " AND cu.exampaper_fk= " + exampaper_pk + " AND cu.qst_lang='ENGLISH' GROUP BY cu.qst_pid HAVING(cu.qst_pid)> 1 ) tw ON (culled_qstn_bank.qb_id = tw.qstpid) LEFT JOIN ( SELECT old_qta_fk log_count, qb_id, exam_fk, exampaper_fk FROM qba.culled_qstn_alternatives_log WHERE qta_log_pk IN ( SELECT MAX(qta_log_pk) FROM qba.culled_qstn_alternatives_log WHERE exam_fk=" + exam_pk + " AND exampaper_fk=" + exampaper_pk + " AND status='Answer' GROUP BY qb_id ) ) log ON (log.qb_id=culled_qstn_bank.qb_id AND log.exam_fk=" + exam_pk + " AND log.exampaper_fk=" + exampaper_pk + ") WHERE qst_is_active = 'A'  AND culled_qstn_bank.exam_fk =" + exam_pk + " AND culled_qstn_bank.exampaper_fk= " + exampaper_pk + " AND qst_lang='ENGLISH' and (culled_qstn_bank.qba_module_fk IN (" + moduleId + ") or culled_qstn_bank.qba_module_fk is null) ORDER BY module_name, topic_name, qst_marks, qb_id ) a LEFT JOIN qba.culled_qstn_alternatives ON(culled_qstn_alternatives.qta_qst_id=a.qb_pk AND culled_qstn_alternatives.exam_fk=" + exam_pk + " AND culled_qstn_alternatives.exampaper_fk=" + exampaper_pk + ") left join qbank_images alterimage on (alterimage.qbi_pk=culled_qstn_alternatives.qta_img_fk)  WHERE qst_type = 'M' ORDER BY module_name, qba_topic_code, qst_type DESC, qst_marks ) , ";
        if (filter == 'Default')
            query = query + "d4 AS (SELECT case when qst_type = 'CS' then dense_rank() over(ORDER BY qst_type, module_name,qba_topic_code,qb_id1, qb_pk) else dense_rank() over(ORDER BY qst_type, module_name,qba_topic_code,qst_marks,qb_id1,qb_pk) end as dr, * FROM ( SELECT * FROM d2 UNION ALL SELECT * FROM d3 )t ) SELECT qst_type, qb_id, qst_pid, module_name, qba_topic_code,qst_marks, * FROM d4  " + paginationCondition + " ORDER BY dr,qta_order"
        if (filter == 'Shortfall')
            query = query + "d4 AS (SELECT case when qst_type = 'CS' then dense_rank() over(ORDER BY case when qst_body = '' or qst_body is null then 1 else 2 end,qst_type, module_name,qba_topic_code,qb_id1, qb_pk) else dense_rank() over(ORDER BY case when qst_body = '' or qst_body is null then 1 else 2 end,qst_type, module_name,qba_topic_code,qst_marks,qb_id1,qb_pk) end as dr, * FROM ( SELECT * FROM d2 UNION ALL SELECT * FROM d3 )t ) SELECT qst_type, qb_id, qst_pid, module_name, qba_topic_code,qst_marks, * FROM d4  " + paginationCondition + " ORDER BY dr,qta_order"
        if (filter == 'Replace/Remove Request')
            query = query + "d4 AS (SELECT dense_rank() over(ORDER BY case when qst_type = 'CS' and (qst_request_status = 'Replacement request approved' or qst_request_status = 'Deletion request approved' or qst_request_status = 'Child of replacement status') then 1 when qst_type = 'M' and (qst_request_status = 'Replacement request approved' or qst_request_status = 'Deletion request approved') then 2 else 4 end,qst_type, module_name,qba_topic_code,qb_id1, qb_pk,case when qst_type = 'M' then qst_marks else null end, qb_id1,qb_pk) as dr, * FROM ( SELECT * FROM d2 UNION ALL SELECT * FROM d3 )t ) SELECT qst_type, qb_id, qst_pid, module_name, qba_topic_code,qst_marks, * FROM d4  " + paginationCondition + " ORDER BY dr,qta_order"
        var moduleArray = moduleId

        var querydata = "SELECT count(*) AS count FROM qba.culled_qstn_bank AS culled_qstn_bank WHERE culled_qstn_bank.qba_module_fk IN (" + moduleArray + ") AND culled_qstn_bank.exam_fk = '" + exam_pk + "' AND culled_qstn_bank.exampaper_fk = '" + exampaper_pk + "' AND culled_qstn_bank.qst_is_active = 'A' AND (culled_qstn_bank.qst_type = 'M'OR (culled_qstn_bank.qst_type = 'CS' AND culled_qstn_bank.qst_pid != '0')) AND culled_qstn_bank.qst_lang = 'ENGLISH';"
        sequelize.query(querydata, { type: sequelize.QueryTypes.SELECT })
            .then(c => {


                sequelize.query(query, { type: sequelize.QueryTypes.SELECT })
                    .then(searchResult => {

                        req.body.result = searchResult;
                        req.body.count1 = c;
                        var querydata1 = "SELECT count(*) AS count FROM qba.culled_qstn_bank AS culled_qstn_bank WHERE culled_qstn_bank.qba_module_fk IN (" + moduleArray + ") AND culled_qstn_bank.exam_fk = '" + exam_pk + "' AND culled_qstn_bank.exampaper_fk = '" + exampaper_pk + "' AND culled_qstn_bank.qst_is_active = 'A' AND culled_qstn_bank.qst_lang = 'ENGLISH';"

                        sequelize.query(querydata1, { type: sequelize.QueryTypes.SELECT })
                            .then(c1 => {
                                req.body.count = c1;
                                importMethods.parseQuestionBankData(req, res);
                            })
                    });
            });


    },

    loadVetterQuestionsForPrint: function (req, res) {
        importMethods.checkValidUser(req, res);
        var moduleId = req.body.id;
        var start = req.body.off;
        var end = req.body.lim;
        var exam_pk = req.body.examPk;
        var exampaper_pk = req.body.examPaperPk;

        var paginationCondition = "";



        var query = "WITH d1 AS ( SELECT DISTINCT *, qta_is_corr_alt, qta_pk, qta_alt_desc, now() AS CURRENT_TIME FROM ( SELECT replace_id, qst_request_status, qst_request_remarks, qba_subject_code, qba_course_code, log_count, new_answer, old_answer, log_status, log_by, log_date, total_weightage, no_of_question, un_id, qb_pk, qba_topic_fk, qba_subject_pk, qba_course_pk, qba_module_pk, qba_course_name, subject_name, module_name, topic_name, qba_topic_code, qst_marks, qst_neg_marks, qst_lang, qst_type, qst_pid, qst_body, qst_no_of_altr, qst_remarks, qst_request_remarks, calculation_info, reference_info, qst_is_active, qst_audit_by, qst_audit_dt, culled_qstn_bank.qb_id, ( CASE WHEN culled_qstn_bank.qst_type = 'CS' AND culled_qstn_bank.qst_pid > 0 THEN culled_qstn_bank.qst_pid :: varchar || '.' || lpad( culled_qstn_bank.qb_id :: varchar, 8, '0' ):: varchar ELSE culled_qstn_bank.qb_id :: varchar END ):: numeric(16, 10) as qb_id1, culled_qstn_bank.exam_fk AS culled_exam_fk, culled_qstn_bank.exampaper_fk AS culled_exampaper_fk, culled_qb_pk, copied_from_repository FROM ( SELECT culled_qb_pk un_id, * FROM qba.culled_qstn_bank a WHERE ( CASE WHEN qst_type = 'CS' AND qst_pid > 0 THEN 1 ELSE 2 END ) = 2 UNION ALL SELECT a.culled_qb_pk un_id, b.* FROM qba.culled_qstn_bank a INNER JOIN qba.culled_qstn_bank b ON a.qst_lang = b.qst_lang AND a.qb_id = b.qst_pid AND a.exampaper_fk = b.exampaper_fk WHERE a.qst_type = 'CS' AND a.qst_pid = 0 ) culled_qstn_bank INNER JOIN qba.qba_topic_master ON ( qba_topic_master.qba_topic_pk = culled_qstn_bank.qba_topic_fk ) INNER JOIN qba.qba_module_mstr ON ( qba_module_mstr.qba_module_pk = qba_topic_master.qba_module_fk ) INNER JOIN qba.qba_subject_master ON ( qba_subject_master.qba_subject_pk = qba_module_mstr.qba_subject_fk ) INNER JOIN qba.qba_course_master ON ( qba_course_master.qba_course_pk = qba_subject_master.qba_course_fk ) LEFT JOIN ( SELECT SUM(cu.qst_marks) total_weightage, MAX(cu.qst_pid) qstpid FROM qba.culled_qstn_bank cu WHERE cu.exam_fk = " + exam_pk + " AND cu.exampaper_fk = " + exampaper_pk + " AND cu.qst_lang = 'ENGLISH' and cu.qst_is_active = 'A' and ( cu.qba_module_fk IN (" + moduleId + ") or cu.qba_module_fk is null ) GROUP BY cu.qst_pid HAVING (cu.qst_pid)> 1 ) tw ON ( culled_qstn_bank.qb_id = tw.qstpid ) LEFT JOIN ( SELECT old_qta_fk log_count, qb_id, exam_fk, exampaper_fk FROM qba.culled_qstn_alternatives_log WHERE qta_log_pk IN ( SELECT MAX(qta_log_pk) FROM qba.culled_qstn_alternatives_log WHERE exam_fk = " + exam_pk + " AND exampaper_fk = " + exampaper_pk + " AND status = 'Answer' GROUP BY qb_id ) ) log ON ( log.qb_id = culled_qstn_bank.qb_id AND log.exam_fk = " + exam_pk + " AND log.exampaper_fk = " + exampaper_pk + " ) LEFT JOIN ( SELECT array_agg(new_answer) new_answer, array_agg(old_answer) old_answer, array_agg(status) log_status, array_agg(qta_audit_by) log_by, array_agg(add_date) log_date, qb_id, exam_fk, exampaper_fk FROM qba.culled_qstn_alternatives_log WHERE exam_fk = " + exam_pk + " AND exampaper_fk = " + exampaper_pk + " GROUP BY qb_id, exam_fk, exampaper_fk ) log1 ON ( log1.qb_id = culled_qstn_bank.qb_id AND log1.exam_fk = " + exam_pk + " AND log1.exampaper_fk = " + exampaper_pk + " ) WHERE qst_is_active = 'A' AND culled_qstn_bank.exam_fk = " + exam_pk + " AND culled_qstn_bank.exampaper_fk = " + exampaper_pk + " AND qst_lang = 'ENGLISH' and ( culled_qstn_bank.qba_module_fk IN (" + moduleId + ") or culled_qstn_bank.qba_module_fk is null ) ORDER BY module_name, topic_name, qst_marks, qb_id ) a LEFT JOIN qba.culled_qstn_alternatives ON( culled_qstn_alternatives.qta_qst_id = a.qb_pk AND culled_qstn_alternatives.exam_fk = " + exam_pk + " AND culled_qstn_alternatives.exampaper_fk = " + exampaper_pk + " ) WHERE qst_type = 'CS' ORDER BY module_name, qba_topic_code, qst_type DESC, qst_marks, qb_id1 ), d2 AS ( SELECT * FROM d1 ORDER BY module_name, topic_name, qst_type, qb_id ), d3 AS ( SELECT DISTINCT *, qta_is_corr_alt, qta_pk, qta_alt_desc, now() AS CURRENT_TIME FROM ( SELECT replace_id, qst_request_status, qst_request_remarks, qba_subject_code, qba_course_code, log_count, new_answer, old_answer, log_status, log_by, log_date, total_weightage, no_of_question, un_id, qb_pk, qba_topic_fk, qba_subject_pk, qba_course_pk, qba_module_pk, qba_course_name, subject_name, module_name, topic_name, qba_topic_code, qst_marks, qst_neg_marks, qst_lang, qst_type, qst_pid, qst_body, qst_no_of_altr, qst_remarks, qst_request_remarks, calculation_info, reference_info, qst_is_active, qst_audit_by, qst_audit_dt, culled_qstn_bank.qb_id, ( CASE WHEN culled_qstn_bank.qst_type = 'M' THEN culled_qstn_bank.qb_id :: varchar ELSE NULL END ):: numeric(10, 5) as qb_id1, culled_qstn_bank.exam_fk AS culled_exam_fk, culled_qstn_bank.exampaper_fk AS culled_exampaper_fk, culled_qb_pk, copied_from_repository FROM ( SELECT culled_qb_pk un_id, * FROM qba.culled_qstn_bank a WHERE ( CASE WHEN qst_type = 'CS' AND qst_pid > 0 THEN 1 ELSE 2 END ) = 2 UNION ALL SELECT a.culled_qb_pk un_id, b.* FROM qba.culled_qstn_bank a INNER JOIN qba.culled_qstn_bank b ON a.qst_lang = b.qst_lang AND a.qb_id = b.qst_pid AND a.exampaper_fk = b.exampaper_fk WHERE a.qst_type = 'CS' AND a.qst_pid = 0 ) culled_qstn_bank INNER JOIN qba.qba_topic_master ON ( qba_topic_master.qba_topic_pk = culled_qstn_bank.qba_topic_fk ) INNER JOIN qba.qba_module_mstr ON ( qba_module_mstr.qba_module_pk = qba_topic_master.qba_module_fk ) INNER JOIN qba.qba_subject_master ON ( qba_subject_master.qba_subject_pk = qba_module_mstr.qba_subject_fk ) INNER JOIN qba.qba_course_master ON ( qba_course_master.qba_course_pk = qba_subject_master.qba_course_fk ) LEFT JOIN ( SELECT SUM(cu.qst_marks) total_weightage, MAX(cu.qst_pid) qstpid FROM qba.culled_qstn_bank cu WHERE cu.exam_fk = " + exam_pk + " AND cu.exampaper_fk = " + exampaper_pk + " AND cu.qst_lang = 'ENGLISH' GROUP BY cu.qst_pid HAVING (cu.qst_pid)> 1 ) tw ON ( culled_qstn_bank.qb_id = tw.qstpid ) LEFT JOIN ( SELECT old_qta_fk log_count, qb_id, exam_fk, exampaper_fk FROM qba.culled_qstn_alternatives_log WHERE qta_log_pk IN ( SELECT MAX(qta_log_pk) FROM qba.culled_qstn_alternatives_log WHERE exam_fk = " + exam_pk + " AND exampaper_fk = " + exampaper_pk + " AND status = 'Answer' GROUP BY qb_id ) ) log ON ( log.qb_id = culled_qstn_bank.qb_id AND log.exam_fk = " + exam_pk + " AND log.exampaper_fk = " + exampaper_pk + " ) LEFT JOIN ( SELECT array_agg(new_answer) new_answer, array_agg(old_answer) old_answer, array_agg(status) log_status, array_agg(qta_audit_by) log_by, array_agg(add_date) log_date, qb_id, exam_fk, exampaper_fk FROM qba.culled_qstn_alternatives_log WHERE exam_fk = " + exam_pk + " AND exampaper_fk = " + exampaper_pk + " GROUP BY qb_id, exam_fk, exampaper_fk ) log1 ON ( log1.qb_id = culled_qstn_bank.qb_id AND log1.exam_fk = " + exam_pk + " AND log1.exampaper_fk = " + exampaper_pk + " ) WHERE qst_is_active = 'A' AND culled_qstn_bank.exam_fk = " + exam_pk + " AND culled_qstn_bank.exampaper_fk = " + exampaper_pk + " AND qst_lang = 'ENGLISH' and ( culled_qstn_bank.qba_module_fk IN (" + moduleId + ") or culled_qstn_bank.qba_module_fk is null ) ORDER BY module_name, topic_name, qst_marks, qb_id ) a LEFT JOIN qba.culled_qstn_alternatives ON( culled_qstn_alternatives.qta_qst_id = a.qb_pk AND culled_qstn_alternatives.exam_fk = " + exam_pk + " AND culled_qstn_alternatives.exampaper_fk = " + exampaper_pk + " ) WHERE qst_type = 'M' ORDER BY module_name, qba_topic_code, qst_type DESC, qst_marks ), d4 AS ( SELECT case when qst_type = 'CS' then dense_rank() over( ORDER BY qst_type, module_name, qba_topic_code, qb_id1, qb_pk ) else dense_rank() over( ORDER BY qst_type, module_name, qba_topic_code, qb_id1, qst_marks, qb_pk ) end as dr, * FROM ( SELECT * FROM d2 UNION ALL SELECT * FROM d3 ) t ) SELECT qst_type, qb_id, qst_pid, module_name, qba_topic_code, qst_marks, * FROM d4 ORDER BY dr, qta_order";

        var moduleArray = moduleId.split(',');

        var querydata = "SELECT count(*) AS count FROM qba.culled_qstn_bank AS culled_qstn_bank WHERE culled_qstn_bank.qba_module_fk IN (" + moduleArray + ") AND culled_qstn_bank.exam_fk = '" + exam_pk + "' AND culled_qstn_bank.exampaper_fk = '" + exampaper_pk + "' AND culled_qstn_bank.qst_is_active = 'A' AND (culled_qstn_bank.qst_type = 'M'OR (culled_qstn_bank.qst_type = 'CS' AND culled_qstn_bank.qst_pid != '0'));"
        sequelize.query(querydata, { type: sequelize.QueryTypes.SELECT })
            .then(c => {


                sequelize.query(query, { type: sequelize.QueryTypes.SELECT })
                    .then(searchResult => {
                        req.body.result = searchResult;
                        req.body.count = c;
                        importMethods.parseQuestionBankData(req, res);
                    });
            });


    },

    // function added by shilpa
    loadCasePassageChild: function (req, res) {
        var exam_pk = req.body.examPk;
        var exampaper_pk = req.body.examPaperPk;
        var qb_id = req.body.qb_id;
        var query = "select qta_order,qta_is_corr_alt,qta_alt_desc,total_weightage,no_of_question,dense_rank()over(order by  qst_pid) rnk,qb_pk, qba_topic_fk,qst_request_status,qst_request_remarks, qba_subject_pk, qba_course_pk, qba_module_pk, qba_course_name,subject_name,culled_qstn_bank.qba_course_fk,culled_qstn_bank.qba_subject_fk,culled_qstn_bank.qba_module_fk,module_name,topic_name,qba_topic_code,qst_marks,qst_neg_marks, qst_lang,qst_type,qst_pid,qst_body,qst_no_of_altr,qst_remarks,calculation_info,  reference_info,qst_is_active,qst_audit_by,qst_audit_dt,qb_id ,culled_qstn_bank.exam_fk as culled_exam_fk ,culled_qstn_bank.exampaper_fk as culled_exampaper_fk ,culled_qb_pk,copied_from_repository from culled_qstn_bank inner join qba_topic_master on (qba_topic_master.qba_topic_pk=culled_qstn_bank.qba_topic_fk) inner join qba_module_mstr on (qba_module_mstr.qba_module_pk=culled_qstn_bank.qba_module_fk) inner join qba_subject_master on (qba_subject_master.qba_subject_pk=culled_qstn_bank.qba_subject_fk) inner join qba_course_master on (qba_course_master.qba_course_pk=culled_qstn_bank.qba_course_fk) left join (select sum(cu.qst_marks) total_weightage,max(cu.qst_pid) qstpid from culled_qstn_bank cu where cu.exam_fk =" + exam_pk + " and cu.exampaper_fk= " + exampaper_pk + " and cu.qst_lang='ENGLISH' group by cu.qst_pid having(cu.qst_pid)> 1) tw on (culled_qstn_bank.qb_id = tw.qstpid) left join culled_qstn_alternatives on(culled_qstn_alternatives.qta_qst_id=culled_qstn_bank.qb_pk and culled_qstn_alternatives.exam_fk= " + exam_pk + " and   culled_qstn_alternatives.exampaper_fk=" + exampaper_pk + ") where culled_qstn_bank.exam_fk =" + exam_pk + " and culled_qstn_bank.exampaper_fk= " + exampaper_pk + " and culled_qstn_bank.qst_is_active = 'A' and culled_qstn_bank.qst_lang='ENGLISH' and (culled_qstn_bank.qb_id = " + qb_id + " or culled_qstn_bank.qst_pid = " + qb_id + ") order by culled_qstn_bank.qst_pid,culled_qstn_bank.qb_id";
        culled_qstn_bank.count({
            where: sequelize.and(
                { exam_fk: exam_pk },
                { exampaper_fk: exampaper_pk },
                { qst_is_active: 'A' },
                { qst_type: 'CS' },
                sequelize.or(
                    { qb_id: qb_id },
                    { qst_pid: qb_id }
                )
            )
        }).then(c => {

            sequelize.query(query, { type: sequelize.QueryTypes.SELECT })
                .then(searchResult => {

                    req.body.result = searchResult;
                    req.body.count = c;
                    importMethods.parseQuestionBankData(req, res);
                });
        });
    },


    getCasePassageDetails: function (req, res) {
        var qb_id = req.body.qb_id;
        var query = "select qta_order,qta_is_corr_alt,qta_alt_desc,total_weightage,no_of_question,dense_rank()over(order by  qst_pid) rnk,qb_pk, qba_topic_fk, qba_subject_pk, qba_course_pk, qba_module_pk, qba_course_name,subject_name,qstn_bank.qba_course_fk,qstn_bank.qba_subject_fk,qstn_bank.qba_module_fk,module_name,topic_name,qba_topic_code,qst_marks,qst_neg_marks, qst_lang,qst_type,qst_pid,qst_body,qst_no_of_altr,qst_remarks,calculation_info,  reference_info,qst_is_active,qst_audit_by,qst_audit_dt,qb_id ,qb_pk from qstn_bank inner join qba_topic_master on (qba_topic_master.qba_topic_pk=qstn_bank.qba_topic_fk) inner join qba_module_mstr on (qba_module_mstr.qba_module_pk=qstn_bank.qba_module_fk) inner join qba_subject_master on (qba_subject_master.qba_subject_pk=qstn_bank.qba_subject_fk) inner join qba_course_master on (qba_course_master.qba_course_pk=qstn_bank.qba_course_fk) left join (select sum(cu.qst_marks) total_weightage,max(cu.qst_pid) qstpid from qstn_bank cu where cu.qst_lang='ENGLISH' group by cu.qst_pid having(cu.qst_pid)> 1) tw on (qstn_bank.qb_id = tw.qstpid) left join qstn_alternatives on(qstn_alternatives.qta_qst_id=qstn_bank.qb_pk) where qstn_bank.qst_is_active = 'A' and qstn_bank.qst_lang='ENGLISH' and (qstn_bank.qb_id = " + qb_id + " or qstn_bank.qst_pid = " + qb_id + ") order by qstn_bank.qst_pid,qstn_bank.qb_id";
        qstn_bank.count({
            where: sequelize.and(
                { qst_is_active: 'A' },
                { qst_type: 'CS' },
                sequelize.or(
                    { qb_id: qb_id },
                    { qst_pid: qb_id }
                )
            )
        }).then(c => {

            sequelize.query(query, { type: sequelize.QueryTypes.SELECT })
                .then(searchResult => {

                    req.body.result = searchResult;
                    req.body.count = c;
                    importMethods.parseQuestionBankData(req, res);
                });
        });
    },

    getAlternativesLog: function (req, res) {
        importMethods.checkValidUser(req, res);
        let exam_fk = req.body.exam_fk;
        let exampaper_fk = req.body.exampaper_fk;
        let qb_id = req.body.qb_id;

        var query = "select old_answer,new_answer,qta_audit_by as add_by,add_date,status from culled_qstn_alternatives_log where exam_fk =" + exam_fk + " and exampaper_fk =" + exampaper_fk + " and qb_id =" + qb_id;
        sequelize.query(query, { type: sequelize.QueryTypes.SELECT })
            .then(result => {
                res.send({
                    code: 0,
                    msg: "success",
                    obj: result
                });


            });

    },

    removeVettingLogDetails: function (req, res) {
        var logData = req.body;

        var params = [];
        for (var i = 0; i < logData.questData.length; i++) {
            qba_vatting_log.destroy({
                where: {
                    vlog_qb_fk: logData.questData[i].qb_pk,
                    exampaper_fk: logData.exampaper_pk
                }
            }).then(response => {

            });
        }
        res.send({
            code: 0,
            message: "success"
        });
    },
    updateVettingLogDetails: function (req, res) {
        var logData = req.body;
        var params = [];
        for (var i = 0; i < logData.questData.length; i++) {
            var vetting_log_data = {
                seq: 0,
                vlog_qb_fk: logData.questData[i].qb_pk,
                vlog_exam_fk: logData.exam_id,
                status: "E",
                remarks: "Question Edited",
                created_dt: new Date(),
                created_by: logData.id,
                updated_dt: new Date(),
                updated_by: logData.id,
                qb_id: logData.questData[i].qb_id,
                exampaper_fk: logData.exampaper_pk
            };
            params.push(vetting_log_data)
        }
        qba_vatting_log.bulkCreate(params, { returning: true })
            .then(response => {
                res.send({
                    code: 0,
                    message: "success",
                    data: response
                });
            })
    },

    getChangeLogDetails: function (req, res) {
        if (req.body.role == "ADM") {
            var where = {
                status: "E",
                vlog_exam_fk: req.body.exam_fk,
                exampaper_fk: req.body.examPaper
            };
        } else {
            var where = {
                created_by: req.body.user_id,
                status: "E",
                vlog_exam_fk: req.body.exam_id,
                exampaper_fk: req.body.examFk
            };
        }
        qba_vatting_log.findAll({
            where: where,
            attributes: [
                [sequelize.fn('DISTINCT', sequelize.col('vlog_qb_fk')), 'vlog_qb_fk'],
                [sequelize.col('exampaper_fk'), 'exampaper_fk'],
                [sequelize.col('qb_id'), 'qb_id']
            ]
        }).then(logDetails => {
            res.send({
                code: 0,
                message: "success",
                data: logDetails

            });
        });

    },
    /*@Author Dhiraj*/
    loadPkQuestion: function (req, res) {
        var query = "select *, qta_is_corr_alt,qta_alt_desc,alterimage.qbi_image_name as aimage from  " +
            "(select dense_rank()over(order by  un_id) rnk,qb_pk, qba_course_name,subject_name,module_name,topic_name,qba_topic_code,qst_marks,qst_neg_marks, qst_lang,qst_type, " +
            "qst_pid,qst_body,qst_no_of_altr,qst_remarks,calculation_info,  reference_info,qst_is_active,qst_audit_by,qst_audit_dt,questionimage.qbi_image_name as qimage,qb_id " +
            "from  ( select qb_pk un_id,* from qstn_bank a   where (case when  qst_type  = 'CS' and qst_pid  > 0  then 1 else 2 end) =2 " +
            "union ALL " +
            "select a.qb_pk un_id,b.* from qstn_bank a   inner join  qstn_bank b on  a.qst_lang= b.qst_lang and a.qb_id=b.qst_pid  " +
            "where  a.qst_type = 'CS' and a.qst_pid = 0   )qstn_bank " +
            "inner join qba_topic_master on (qba_topic_master.qba_topic_pk=qstn_bank.qba_topic_fk) " +
            "inner join qba_module_mstr on (qba_module_mstr.qba_module_pk=qba_topic_master.qba_module_fk) " +
            "inner join qba_subject_master on (qba_subject_master.qba_subject_pk=qba_module_mstr.qba_subject_fk) " +
            "inner join qba_course_master on (qba_course_master.qba_course_pk=qba_subject_master.qba_course_fk) " +
            "LEFT OUTER JOIN qbank_images as questionimage ON  (qstn_bank.qst_img_fk = questionimage.qbi_pk) where " +
            "qstn_bank.qb_pk =" + req.body.qid + " )a " +
            "left join qstn_alternatives on(qstn_alternatives.qta_qst_id=a.qb_pk) " +
            "LEFT OUTER JOIN qbank_images as alterimage  ON (qstn_alternatives.qta_img_fk = alterimage.qbi_pk) " +
            " order by rnk,qb_pk,qta_order";
        sequelize.query(query, { type: sequelize.QueryTypes.SELECT })
            .then(searchResult => {
                req.body.result = searchResult;
                req.body.count = 1;
                importMethods.parseQuestionBankData(req, res);
            });
    },

    loadSummaryDetails: function (req, res) {
        importMethods.checkValidUser(req, res);
        var moduleId = req.body.moduleId;
        var exam_id = req.body.examId;
        var exampaper_id = req.body.exam_paper_fk;
        var qstnpaper_id = req.body.qstnpaper_id;
        var moduleIds = JSON.parse("[" + moduleId + "]");

        var query = "SELECT qba.qba_topic_master.qba_topic_code as topic_code, qba.qba_topic_master.topic_name,qba_module_mstr.module_name,sum(summary_question) as summary_question,topic_pk,sum(summary_marks) as summary_marks,sum(short_fall_qstn) as short_fall_qstn, (select count(qb_id) from culled_qstn_bank where exam_fk = \'" + exam_id + "\' and  exampaper_fk =\'" + exampaper_id + "\' and qst_lang = 'ENGLISH' and qb_id in (select qb_id from qba_vatting_log where qstnpaper_id = \'" + qstnpaper_id + "\' and admin_status = 'Approved') and qst_type = 'M' and qba_topic_fk = qba_summary_admin.topic_pk) as total_replaced_quest, (select sum(qst_marks) from culled_qstn_bank where exam_fk = \'" + exam_id + "\' AND exampaper_fk =\'" + exampaper_id + "\' and qst_lang = 'ENGLISH' and qb_id in (select qb_id from qba_vatting_log where qstnpaper_id = \'" + qstnpaper_id + "\' and admin_status = 'Approved') and qst_type = 'M' and qba_topic_fk = qba_summary_admin.topic_pk) as total_replace_question_marks FROM qba.qba_summary_admin left join qba.qba_module_mstr on qba_summary_admin.module_fk = qba_module_mstr.qba_module_pk inner join qba.qba_topic_master on (qba.qba_topic_master.qba_topic_pk = qba_summary_admin.topic_pk) where qstn_paper_id =\'" + qstnpaper_id + "\'  AND exam_fk = \'" + exam_id + "\' AND qba.qba_summary_admin.exampaper_fk =\'" + exampaper_id + "\' group by qba_module_mstr.module_name,qba.qba_topic_master.topic_name,topic_pk, qba.qba_topic_master.qba_topic_code order by module_name, qba.qba_topic_master.qba_topic_code, qba_summary_admin.topic_pk";


        sequelize.query(query, { type: sequelize.QueryTypes.SELECT })
            .then(Summary => {
                var sf_count = "select qba_topic_fk,count(qb_id) from qba.culled_qstn_bank where qst_type = 'M' and qst_pid = 0 and copied_from_repository = 'N' and exam_fk =\'" + exam_id + "\' AND exampaper_fk = \'" + exampaper_id + "\'  group by qba_topic_fk "
                sequelize.query(sf_count, { type: sequelize.QueryTypes.SELECT })
                    .then(sfmcqcount => {
                        res.send({
                            code: 0,
                            message: "success",
                            obj: Summary,
                            shortfall_count: sfmcqcount
                        });
                    })
                // We don't need spread here, since only the results will be returned for select queries
            })

    },
    loadCaseParentMarksMap: function (req, res) {
        importMethods.checkValidUser(req, res);
        var subjectKey = req.body.subjectId;
        var query = "select q.qst_pid, qba.qb_pk,q.qst_marks as parent_marks, count(q.qst_marks) as child_count from qstn_bank q join qstn_bank qba on(qba.qb_id = q.qst_pid) where q.qst_pid in(select qb_id from qstn_bank where qba_subject_fk =" + subjectKey + " and qst_type = 'CS' and qst_pid =0) group by q.qst_pid, q.qst_marks, qba.qb_pk"
        sequelize.query(query, { type: sequelize.QueryTypes.SELECT })

            .then(parentData => {
                var parentMarksMap = {};

                for (var i = 0; i < parentData.length; i++) {
                    var key = parentData[i].qb_pk;
                    parentMarksMap[key] = parentData[i].parent_marks;
                    parentMarksMap[key + "child"] = parentData[i].child_count
                }

                res.send({
                    code: 0,
                    message: "success",
                    obj: parentMarksMap
                })

            })
    },
    loadQuestionsforPreview: function (req, res) {
        importMethods.checkValidUser(req, res);
        var qbPks = req.body.qbPkArray;
        var start = req.body.off;
        var end = req.body.lim;
        var childLimit = req.body.childLimit;
        var paginationCondition = "";

        if (!(isNaN(end) && end == 'ALL')) {
            paginationCondition = " where   rnk between " + start + " and  " + end;
        }

        var query = "select *, qta_is_corr_alt,qta_alt_desc,alterimage.qbi_image_name as aimage,total_weightage from  " +
            "(select no_of_question,dense_rank() over (order by  qst_lang,qst_type,module_name,qba_topic_code,case when qst_type = 'M' then qst_marks end,qb_id) rnk,qb_pk,qba_topic_fk, qba_course_name,subject_name,module_name,topic_name,qba_topic_code,qst_marks,qst_neg_marks, qst_lang,qst_type, " +
            "qst_pid,qst_body,qst_no_of_altr,qst_remarks,calculation_info,  reference_info,qst_is_active,qst_audit_by,qst_audit_dt,questionimage.qbi_image_name as qimage,qb_id " +
            "from  ( select qb_pk un_id,* from qstn_bank )qstn_bank " +
            "inner join qba_topic_master on (qba_topic_master.qba_topic_pk=qstn_bank.qba_topic_fk) " +
            "inner join qba_module_mstr on (qba_module_mstr.qba_module_pk=qba_topic_master.qba_module_fk) " +
            "inner join qba_subject_master on (qba_subject_master.qba_subject_pk=qba_module_mstr.qba_subject_fk) " +
            "inner join qba_course_master on (qba_course_master.qba_course_pk=qba_subject_master.qba_course_fk) " +
            "LEFT OUTER JOIN qbank_images as questionimage ON  (qstn_bank.qst_img_fk = questionimage.qbi_pk) where " +
            "qb_pk in (" + qbPks + ") " +
            "or qb_pk in " +
            "( " +
            "SELECT x.qb_pk FROM (SELECT ROW_NUMBER() OVER (PARTITION BY qst_pid ORDER BY qb_pk) AS r, t.qst_pid, t.qb_pk, t.qst_type " +
            "FROM qstn_bank t " +
            "where qst_pid in (select qb_id from qstn_bank where qb_pk in(" + qbPks + ")) " +
            ") x WHERE qst_pid <> 0 AND  qst_type= 'CS' AND x.r <= " + childLimit + " " +
            ") " +
            "order by qst_lang,qst_type,module_name,qba_topic_code,case when qst_type = 'M' then qst_marks end,qb_id )a " +
            "left join qstn_alternatives on(qstn_alternatives.qta_qst_id=a.qb_pk) " +
            "LEFT OUTER JOIN qbank_images as alterimage  ON (qstn_alternatives.qta_img_fk = alterimage.qbi_pk)  " +
            "left join (select sum(cu.qst_marks) total_weightage,max(cu.qst_pid) qstpid from qstn_bank cu  group by cu.qst_pid having(cu.qst_pid)> 0) tw on (a.qb_id = tw.qstpid) " +
            " " + paginationCondition + " order by rnk,qta_order";

        var a = now1()
        sequelize.query(query, { type: sequelize.QueryTypes.SELECT })
            .then(searchResult => {
                var mcqcsqchildcount = "select count(*) from qstn_bank where qst_lang='ENGLISH' and ((qb_pk in (" + qbPks + ") and qst_type = 'M') or (qb_pk in (select qb_pk from qstn_bank where qst_pid in (select qb_id from qstn_bank where qb_pk in (" + qbPks + ")) and qst_type ='CS' and qst_pid <> 0 )))";
                sequelize.query(mcqcsqchildcount, { type: sequelize.QueryTypes.SELECT })
                    .then(c => {
                        var b = now1()
                        console.log("Preview ", (b - a).toFixed(3))
                        req.body.result = searchResult;
                        req.body.count = c;
                        importMethods.parseQuestionBankData(req, res);
                    })
            })
        // });
    },

    getTotalQuestionCount: function (req, res) {
        importMethods.checkValidUser(req, res);
        qstn_bank.count({
            where: sequelize.or({ qst_type: 'M' },
                sequelize.and({ qst_type: 'CS' }, { qst_pid: '0' })
            )
        })
            .then(result => {
                res.send({
                    code: 0,
                    message: "success",
                    count: result
                })
            })
    },
    validateUser: function (req, res) {

        var loginData = req.body;
        var hashpass = bcrypt.hashSync(loginData.pass);
        var hashuname = bcrypt.hashSync(loginData.name);
        var flag = "invalid";
        User.findOne({

            where: { 'user_id': loginData.name, 'user_status': 'A' },
            include: [{
                model: um_user_role_mapping,
                required: true,
                include: [{
                    model: um_role_mstr,
                }]
            }]
        })
            .then(function (result) {
                if (result != null) {
                    if (bcrypt.compareSync(loginData.pass, result.user_password)) {

                        req.session.userCredentials = {
                            user_name: result.user_id,
                            password: hashpass,
                            role: result.um_user_role_mapping.user_role_pk, // added by shilpa
                            id: result.user_pk // added by shilpa
                        };

                        flag = "success";

                    }
                    else
                        flag = "invalidPass";

                }
                else
                    flag = "invalidUser";

                if (flag == "success") {

                    var token = jwt.sign({ user_id: result.user_id, user_password: result.user_password }, process.env.SECRET, {
                        expiresIn: 60 * 60 * 24
                    });
                    res.send({
                        code: 0,
                        token: token,
                        message: "done",
                        data: {
                            name: result.user_id, pass: result.user_password, id: result.user_pk,
                            role: result.um_user_role_mapping.um_role_mstr.role_code
                        }
                    });
                }
                else if (flag == "invalidPass") {
                    res.send({
                        code: 10,
                        message: "Incorrect Password",
                        data: {}
                    });
                }
                else {
                    res.send({
                        code: 11,
                        message: "Invalid User",
                        data: {}
                    });
                }
            });


    },
    checkValidUser: function (req, res) {
        var sess = req.session.userCredentials;
        if (sess == undefined) {
            res.send({
                code: 401,
                data: {
                    "asd": "asd"
                }
            });
            return 0;
        }
        else {
        }

    },
    checkCredentials: function (req, res) {
        var a = importMethods.checkValidUser(req, res);
        if (a != 0) {
            res.send({
                code: 200,
                message: "success"
            })
        }
    },
    logOut: function (req, res) {
        importMethods.checkValidUser(req, res);
        req.session.destroy((err) => {
            if (err) {
                return res.send({
                    code: 500,
                    message: "error"
                })
            }
            return res.send({
                code: 200,
                message: "success"
            })
        })
    },
    searchQb: function (req, res) {
        importMethods.checkValidUser(req, res);
        var responseData = req.body;
        var srcquery = responseData.searchQry;
        var cntqurey = responseData.countQry
        var lim = responseData.limit;
        var offset = responseData.offset;
        cntqurey += "and  (case when  qst_type  = 'CS' and qst_pid  > 0  then 1 else 2 end) =2";

        srcquery += ")a left join qstn_alternatives on(qstn_alternatives.qta_qst_id=a.qb_pk)" +
            " LEFT OUTER JOIN qbank_images as alterimage  ON (qstn_alternatives.qta_img_fk = alterimage.qbi_pk) " +
            " where  rnk between " + offset + " and  " + lim + " order by rnk,qb_pk,qta_order";

        sequelize.query(cntqurey, { type: sequelize.QueryTypes.SELECT })
            .then(count => {

                var qstcount = count[0].qcount;
                sequelize.query(srcquery, { type: sequelize.QueryTypes.SELECT })
                    .then(qbdata => {

                        req.body.result = qbdata;
                        req.body.count = qstcount;
                        importMethods.parseQuestionBankData(req, res);
                    })
            })
    },

    getVetterDetails: function (req, res) {
        var requestData = req.body;

        var query = "select exam_name,* from vetting_details inner join qba_exam_paper on (exampaper_pk = exampaper_fk) " +
            "where vetting_details.vetter_fk = '" + parseInt(requestData.vetter_fk) + "' and vetting_status='Active'";
        sequelize.query(query, { type: sequelize.QueryTypes.SELECT })
            .then(result => {
                res.send({
                    code: 0,
                    message: "done",
                    obj: result
                });
            })
    },

    checkVetterRequestPresent: function (req, res) {
        var checkForReq = req.body;
        qba_vatting_log.findAll({
            where: {
                vlog_qb_fk: checkForReq.vlog_qb_fk,
                vlog_exam_fk: checkForReq.vlog_exam_fk,
                created_by: checkForReq.created_by,
                exampaper_fk: checkForReq.exampaper_fk
            }
        }).then(requestPresnt => {
            res.send({
                code: 0,
                message: "success",
                obj: requestPresnt
            })

        });
    },

    vetterReqForReplaceQuestion: function (req, res) {
        // added by shilpa
        if (req.body.status == 'QP') {
            var admin_status = "Approved";
        } else if (req.body.status == 'QB') {
            var admin_status = "Approved";
        }
        else {
            var admin_status = "";
        }
        // end by shilpa

        var vetterReq = {
            seq: req.body.seq,
            vlog_qb_fk: req.body.vlog_qb_fk,
            vlog_exam_fk: req.body.vlog_exam_fk,
            status: req.body.status,
            remarks: req.body.remarks,
            created_dt: req.body.created_dt,
            created_by: req.body.created_by,
            updated_dt: req.body.updated_dt,
            updated_by: req.body.updated_by,
            qb_id: req.body.qb_id,
            qstnpaper_id: req.body.qstnpaper_id,
            exam_name: req.body.exam_name,
            exampaper_fk: req.body.exampaper_fk,
            admin_status: admin_status // added by shilpa
        }
        qba_vatting_log.findAll({
            where: {
                status: req.body.status,//status:'R',
                qb_id: req.body.qb_id,
                exampaper_fk: req.body.exampaper_fk,
                created_by: req.body.created_by
            }
        }).then(checkForReplace => {
            if (checkForReplace.length == 0) {
                qba_vatting_log.create(vetterReq).then(requestResponse => {
                    res.send({
                        code: 0,
                        message: "success",
                        obj: requestResponse
                    })
                });
            } else {
                res.send({ message: "RequestPresent" });
            }
        });
    },

    updatevetterReqForReplaceRemoveQuestion: function (req, res) {
        var checkForReq = req.body;
        qba_vatting_log.findAll({
            where: {
                vlog_qb_fk: checkForReq.vlog_qb_fk,
                vlog_exam_fk: checkForReq.vlog_exam_fk,
                created_by: checkForReq.created_by
            }
        }).then(requestPresnt => {

            qba_vatting_log.update({
                updated_dt: new Date(),
                status: checkForReq.status
            },
                {
                    where: {
                        vlog_qb_fk: checkForReq.vlog_qb_fk,
                        vlog_exam_fk: checkForReq.vlog_exam_fk,
                        created_by: checkForReq.created_by
                    }
                })

            res.send({
                code: 0,
                message: "success",
                obj: requestPresnt
            });

        });
    },

    getListofVetterRequest: function (req, res) {
        importMethods.checkValidUser(req, res);
        var reqStatus = req.body.status;
        var reqQstpaperId = req.body.qstnpaperid;
        var query = "select * from qba_vatting_log inner join um_user_mstr on (qba_vatting_log.updated_by = um_user_mstr.user_pk)   where  (status = " + "'" + reqStatus + "'" + " or status='RM') and is_active IS NULL and qstnpaper_id = " + "'" + reqQstpaperId + "'" + "";
        sequelize.query(query, { type: sequelize.QueryTypes.SELECT })
            .then(requestList => {
                res.send({
                    code: 0,
                    message: "success",
                    obj: requestList
                })
            });
    },


    getListofVetterRequestbyUser: function (req, res) {
        importMethods.checkValidUser(req, res);
        var reqStatus = req.body.status;
        var reqQstpaperId = req.body.qstnpaperid;
        var created_by = req.body.created_by;
        var query = "select *,qba_vatting_log.updated_dt from qba_vatting_log inner join um_user_mstr on (qba_vatting_log.updated_by = um_user_mstr.user_pk)   where  (status = " + "'" + reqStatus + "'" + " or status='RM') and qstnpaper_id = " + "'" + reqQstpaperId + "' and created_by =  " + "'" + created_by + "'";//created_by
        sequelize.query(query, { type: sequelize.QueryTypes.SELECT }).then(requestList => {
            res.send({
                code: 0,
                message: "success",
                obj: requestList

            })
        });


    },


    getPendingVetterModuleIds: function (req, res) {
        importMethods.checkValidUser(req, res);
        var reqDetails = req.body;
        vetting_details.update({
            vetting_flag: 'D',
            vetting_status: 'Done'
        }, {
            where: {
                exam_fk: reqDetails.exam_id,
                module_ids: reqDetails.mod_id,
                vetter_fk: reqDetails.user_id,
                exampaper_fk: reqDetails.exampaper_fk
            }
        }).then(pendingVetterIds => {
            res.send({
                code: 0,
                message: "success",
                obj: pendingVetterIds
            })
        });
    },


    approvalofVetterRequest: function (req, res) {
        importMethods.checkValidUser(req, res);
        var reqParameters = req.body;
        var query = "select * from qba.qba_vatting_log where exampaper_fk = '" + reqParameters.exampaper_fk + "' and (admin_status = 'Approved' or admin_status = 'Rejected') and vlog_qb_fk in (" + reqParameters.vlog_qb_fk + ")";
        qba_vatting_log.findAll({
            where: {
                vlog_qb_fk: reqParameters.vlog_qb_fk,
                created_by: reqParameters.created_by,
                status: reqParameters.status,
                qb_id: reqParameters.qb_id
            }
        }).then(adminStatus => {
            qba_vatting_log.update({
                updated_dt: new Date(),
                admin_status: req.body.admin_status,
                approved_by: req.body.admin_login
            },
                {
                    where: {
                        created_by: reqParameters.created_by,
                        status: reqParameters.status,
                        //qb_id: reqParameters.qb_id
                        vlog_qb_fk: reqParameters.vlog_qb_fk
                    }
                }).then(finalResponse => {

                    sequelize.query(query, { type: sequelize.QueryTypes.SELECT }).then(queryresult => {
                        res.send({
                            code: 0,
                            message: "success",
                            obj: queryresult
                        });

                    });

                })

        });

    },


    activationofQuestionStatus: function (req, res) {
        var id = req.body.finalQstId;
        qstn_bank.update({
            qst_is_active: 'A'
        }, {
            where: {
                qb_pk: id
            }
        }).then(questionStatus => {
            res.send({
                code: 0,
                message: "success",
                obj: questionStatus
            });
        });
    },


    getVettingStatus: function (req, res) {
        importMethods.checkValidUser(req, res);
        var id = req.body.qpPprId
        vetting_details.findAll({
            where: { 'qstnpaper_id': id },
            include: [{
                model: User,
                include: [{
                    model: um_user_role_mapping,
                    required: true,
                    include: [{
                        model: um_role_mstr
                    }]
                }]
            }]
        })
            .then(function (result) {
                res.send({
                    code: 0,
                    message: "done",
                    data: result,
                    vetter_status: result.vetting_status

                });
            })
    },


    inActivateQuestionStatus: function (req, res) {
        var id = req.body.finalQstId;
        qstn_bank.update({
            qst_is_active: 'I'
        }, {
            where: {
                qb_pk: id
            }
        }).then(questionStatus => {
            res.send({
                code: 0,
                message: "success",
                obj: questionStatus
            });
        });

    },

    updateQbActive: function (req, res) {
        var ids = req.body.checkedQuests;
        str = "";
        for (var i = 0; i < ids.length; i++) {

            if (str != "") {
                str += ','
            }
            str += ids[i]

        }
        var update = "update qstn_bank set qst_is_active = 'I' where qb_pk in (select qb_pk from culled_qstn_bank where qst_request_remarks != 'Removed from QP' and qst_request_remarks like '%Removed%' and exam_fk = " + req.body.exam_fk + " and exampaper_fk = " + req.body.exampaper_fk + " )";
        sequelize.query(update, { type: sequelize.QueryTypes.UPDATE })
            .then(status => {
                res.send({
                    code: 0,
                    message: "success",
                    obj: update
                });
            });

    },

    updatePubStatus: function (req, res) {
        var ids = req.body.checkedqbids;

        str = "";
        for (var i = 0; i < ids.length; i++) {

            if (str != "") {
                str += ','
            }
            str += ids[i]

        }

        var query = "update  culled_qstn_bank set pub_status ='' " +
            " where exam_fk = " + req.body.exam_fk + " and exampaper_fk = " + req.body.exampaper_fk + " and qba_module_fk in (" + req.body.mod_id + ") and " +
            " qb_id not in (" + str + ")";
        sequelize.query(query, { type: sequelize.QueryTypes.UPDATE })
        qba_exam_paper.update({
            published_qb_pk: ids
        },
            {
                where: {
                    exam_fk: req.body.exam_fk,
                    exampaper_pk: req.body.exampaper_fk
                }
            }).then(publisherStatus => {
                res.send({
                    code: 0,
                    message: "success",
                    obj: publisherStatus
                });
            });
    },

    updateAlter: function (req, res) {
        var ids = req.body.checkedQuests;

        str = "";
        for (var i = 0; i < ids.length; i++) {

            if (str != "") {
                str += ','
            }
            str += ids[i]

        }

        var query = "update  culled_qstn_alternatives set qta_is_active ='' " +
            " where exam_fk = " + req.body.exam_fk + " and exampaper_fk = " + req.body.exampaper_fk + "  and " +
            " qta_qst_id not in (" + str + ")";
        sequelize.query(query, { type: sequelize.QueryTypes.UPDATE })
            .then(publisherStatus => {
                res.send({
                    code: 0,
                    message: "success",
                    obj: publisherStatus
                })
            });
    },

    updateAdminStatus: function (req, res) {
        var id = req.body.qb_pk;
        var query = "update culled_qstn_bank set admin_status = 'A' where exam_fk=" + req.body.exam_fk + " and exampaper_fk =" + req.body.exampaper_fk + " and pub_status='A' and qb_id in (select qb_id from culled_qstn_bank where qb_pk in (" + id + "))"
        sequelize.query(query).then({
        })
        for (var i = 0; i < id.length; i++) {
            culled_qstn_bank.update({
                admin_status: 'A'
            }, {
                where: {
                    qb_pk: id[i]
                }
            }).then(adminStatus => {

            });
        }
        qba_exam_paper.update({
            created_dt: new Date()
        }, {
            where: {
                exam_fk: req.body.exam_fk,
                exampaper_pk: req.body.exampaper_fk
            }
        }).then(qbpkUpdate => {
            res.send({
                code: 0,
                message: "success"
            });
        })
    },

    /// Added by shilpa
    updateQBody: function (req, res) {
        var id = req.body.qb_pk;
        var qBody = req.body.qb_body;
        var qst_remarks = req.body.qst_remarks;
        var reference_info = req.body.reference_info;
        var calculation_info = req.body.calculation_info;
        var qbalter = req.body.qb_alterbody;
        var no_of_question = req.body.no_of_question
        for (var i = 0; i < id.length; i++) {
            qstn_bank.update({
                qst_body: qBody[i],
                qst_remarks: qst_remarks[id[i]] != '' ? qst_remarks[id[i]] : null,
                reference_info: reference_info[id[i]] != '' ? reference_info[id[i]] : null,
                calculation_info: calculation_info[id[i]] != '' ? calculation_info[id[i]] : null,
                no_of_question: no_of_question[i]
            }, {
                where: {
                    qb_pk: id[i]
                }
            });
        }

        for (var k = 0; k < qbalter.length; k++) {
            qstn_alternatives.update({
                qta_alt_desc: qbalter[k].qta_alt_desc
            }, {
                where: {
                    qta_id: qbalter[k].qta_id,
                    qta_order: qbalter[k].qta_order,
                    qta_qst_id: qbalter[k].qta_qst_id
                }
            });
        }

        if (k == qbalter.length) {
            res.send({
                code: 0,
                message: "success"

            });
        }
    },

    getPendingPublisherModuleIds: function (req, res) {
        importMethods.checkValidUser(req, res);
        var reqDetails = req.body;
        vetting_details.update({
            vetting_flag: 'D',
            vetting_status: 'Done'
        }, {
            where: {
                exam_fk: reqDetails.exam_id,
                module_ids: reqDetails.mod_id,
                vetter_fk: reqDetails.user_id,
                exampaper_fk: reqDetails.exampaper_fk
            }
        }).then(pendingPublisherIds => {
            res.send({
                code: 0,
                message: "success",
                obj: pendingPublisherIds
            })
        });


    },


    loadFinalExamPaper: function (req, res) {


        var qb_pk = req.body.qbPkArray;

        var topicId = req.body.id;

        var start = req.body.off;
        var end = req.body.lim;
        var fQuery = "select *, qta_is_corr_alt,qta_alt_desc,alterimage.qbi_image_name as aimage from  " +
            "(select dense_rank()over(order by  un_id) rnk,qb_pk, qba_course_name,subject_name,module_name,topic_name,qba_topic_code,qst_marks,qst_neg_marks, qst_lang,qst_type, " +
            "qst_pid,qst_body,qst_no_of_altr,qst_remarks,calculation_info,  reference_info,qst_is_active,qst_audit_by,qst_audit_dt,questionimage.qbi_image_name as qimage,qb_id " +
            "from  ( select qb_pk un_id,* from qstn_bank a   where (case when  qst_type  = 'CS' and qst_pid  > 0  then 1 else 2 end) =2 " +
            "union ALL " +
            "select a.qb_pk un_id,b.* from qstn_bank a   inner join  qstn_bank b on  a.qst_lang= b.qst_lang and a.qb_id=b.qst_pid  " +
            "where  a.qst_type = 'CS' and a.qst_pid = 0   )qstn_bank " +
            "inner join qba_topic_master on (qba_topic_master.qba_topic_pk=qstn_bank.qba_topic_fk) " +
            "inner join qba_module_mstr on (qba_module_mstr.qba_module_pk=qba_topic_master.qba_module_fk) " +
            "inner join qba_subject_master on (qba_subject_master.qba_subject_pk=qba_module_mstr.qba_subject_fk) " +
            "inner join qba_course_master on (qba_course_master.qba_course_pk=qba_subject_master.qba_course_fk) " +
            "LEFT OUTER JOIN qbank_images as questionimage ON  (qstn_bank.qst_img_fk = questionimage.qbi_pk) where " +
            "qb_pk in (" + qb_pk + ") order by qb_pk)a " +
            "left join qstn_alternatives on(qstn_alternatives.qta_qst_id=a.qb_pk) " +
            "LEFT OUTER JOIN qbank_images as alterimage  ON (qstn_alternatives.qta_img_fk = alterimage.qbi_pk)  where  rnk between " + start + " and  " + end + "  order by rnk,qb_pk,qta_order";
        //  res.send(fQuery);
        qstn_bank.count({
            where: sequelize.and({ qb_pk: qb_pk },
                sequelize.or({ qst_type: 'M' },
                    sequelize.and({ qst_type: 'CS' }, { qst_pid: '0' })))
        }).then(c => {
            sequelize.query(fQuery, { type: sequelize.QueryTypes.SELECT })
                .then(searchResult => {
                    req.body.result = searchResult;
                    req.body.count = c;
                    importMethods.parseQuestionBankData(req, res);
                })
        });
    },

    loadAllQuestion: function (req, res) {
        var query = "SELECT * FROM qstn_bank INNER JOIN qba_course_master ON (qstn_bank.qba_course_fk = qba_course_master.qba_course_pk) LEFT JOIN qba_module_mstr on (qstn_bank.qba_module_fk = qba_module_mstr.qba_module_pk) where qst_is_active = 'I';"

        sequelize.query(query, { type: sequelize.QueryTypes.SELECT })
            .then(populateQuestions => {
                res.send({
                    code: 0,
                    message: "success",
                    obj: populateQuestions
                });
                // We don't need spread here, since only the results will be returned for select queries
            })
    },

    //load Question from qstn_bank with equal marks and qst_type = 'M' except replaced and appeared ids


    loadInactiveQuestions: function (req, res) {
        var qb_pk = req.body.qb_pk;
        var qst_marks = req.body.qst_marks;
        var qba_topic_fk = req.body.qba_topic_fk;
        var moduleId = req.body.moduleId;
        var created_by = req.body.created_by;
        var exampaper_fk = req.body.exampaper_fk;
        var exam_fk = req.body.exam_fk;
        var qstType = req.body.qst_type;
        var caseCondition = "";

        var filteredQuery = "with d1 as (select qb_id, qst_pid, *, qta_is_corr_alt, qta_alt_desc, alterimage.qbi_image_name as aimage from ( select ( CASE WHEN qstn_bank.qst_type='CS' AND qstn_bank.qst_pid > 0 THEN qstn_bank.qst_pid::varchar || '.' || qstn_bank.qb_id::varchar ELSE qstn_bank.qb_id::varchar END )::numeric(10,5) as qb_id1, qb_pk, qba_topic_fk, qstn_bank.qba_module_fk, qba_course_name, subject_name, module_name, topic_name, qba_topic_code, qst_marks, qst_neg_marks, qst_lang, qst_type, qst_pid, qst_body, qst_no_of_altr, qst_remarks, calculation_info, reference_info, qst_is_active, no_of_question, qst_audit_by, qst_audit_dt, questionimage.qbi_image_name as qimage, qb_id from ( select qb_pk un_id, * from qba.qstn_bank a where ( case when qst_type = 'CS' and qst_pid > 0 then 1 else 2 end ) = 2 union ALL select a.qb_pk un_id, b.* from qba.qstn_bank a inner join qba.qstn_bank b on a.qst_lang = b.qst_lang and a.qb_id = b.qst_pid where a.qst_type = 'CS' and a.qst_pid = 0 ) qstn_bank inner join qba.qba_topic_master on ( qba_topic_master.qba_topic_pk = qstn_bank.qba_topic_fk ) inner join qba.qba_module_mstr on ( qba_module_mstr.qba_module_pk = qba_topic_master.qba_module_fk ) inner join qba.qba_subject_master on ( qba_subject_master.qba_subject_pk = qba_module_mstr.qba_subject_fk ) inner join qba.qba_course_master on ( qba_course_master.qba_course_pk = qba_subject_master.qba_course_fk ) LEFT OUTER JOIN qba.qbank_images as questionimage ON ( qstn_bank.qst_img_fk = questionimage.qbi_pk ) where qstn_bank.qba_module_fk IN (" + moduleId + ") and qst_type = '" + qstType + "' and qst_lang = 'ENGLISH' and qstn_bank.qst_is_active = 'A' order by qb_pk ) a left join qba.qstn_alternatives on( qstn_alternatives.qta_qst_id = a.qb_pk ) LEFT OUTER JOIN qba.qbank_images as alterimage ON ( qstn_alternatives.qta_img_fk = alterimage.qbi_pk ) where qb_pk :: text not in ( select unnest(exam_qb_pk) from qba.qba_exam_paper where exampaper_pk :: text in( select unnest(new_exampaper_pk) from qba.qba_exam_paper where exampaper_pk = " + exampaper_fk + ") ) and qst_pid not in (select qb_id from qstn_bank where qb_pk :: text in ( select unnest(exam_qb_pk) from qba.qba_exam_paper where exampaper_pk :: text in( select unnest(new_exampaper_pk) from qba.qba_exam_paper where exampaper_pk = " + exampaper_fk + ") )) and qba_topic_fk = '" + qba_topic_fk + "' and qb_id not in ( select qb_id from qba.culled_qstn_bank where exampaper_fk = '" + exampaper_fk + "' and exam_fk = '" + exam_fk + "' )), d2 as ( select case when qst_type ='CS' then dense_rank() over(ORDER BY qst_type, module_name,qba_topic_code,qb_id1, qb_pk) else dense_rank() over(ORDER BY qst_type, module_name,qba_topic_code,qst_marks,qb_id1, qb_pk) end as dr , * from d1) select dr, * from d2 order by dr, qta_order";


        var countQuery = "select count(1) as qst_count from qstn_bank where qba_module_fk in (" + moduleId + ") and qst_lang = 'ENGLISH' and  (case when  qst_type  = 'CS' and qst_pid  > 0  then 1 else 2 end) =2 " +
            "and qst_marks = '" + qst_marks + "' and qst_type = '" + qstType + "' and qba_topic_fk = '" + qba_topic_fk + "' " + caseCondition +
            "and qb_id not in (select qb_id from culled_qstn_bank where exampaper_fk = '" + exampaper_fk + "' and exam_fk = '" + exam_fk + "')";

        sequelize.query(countQuery, { type: sequelize.QueryTypes.SELECT })
            .then(c => {

                sequelize.query(filteredQuery, { type: sequelize.QueryTypes.SELECT })
                    .then(searchResult => {

                        req.body.result = searchResult;
                        req.body.count = c[0].qst_count;
                        importMethods.parseQuestionBankData(req, res);
                    });
            });
    },


    loadInactiveQuestionsModuleWise: function (req, res) {
        var qb_pk = req.body.qb_pk;
        var qst_marks = req.body.qst_marks;
        var qba_topic_fk = req.body.qba_topic_fk;
        var moduleId = req.body.m_id;
        var created_by = req.body.created_by;
        var exampaper_fk = req.body.exampaper_fk;
        var exam_fk = req.body.exam_fk;
        var qstType = req.body.qst_type;
        var caseCondition = "";

        var filteredQuery = "with d1 as (select qb_id, qst_pid, *, qta_is_corr_alt, qta_alt_desc, alterimage.qbi_image_name as aimage from ( select ( CASE WHEN qstn_bank.qst_type='CS' AND qstn_bank.qst_pid > 0 THEN qstn_bank.qst_pid::varchar || '.' || qstn_bank.qb_id::varchar ELSE qstn_bank.qb_id::varchar END )::numeric(10,5) as qb_id1, qb_pk, qba_topic_fk, qstn_bank.qba_module_fk, qba_course_name, subject_name, module_name, topic_name, qba_topic_code, qst_marks, qst_neg_marks, qst_lang, qst_type, qst_pid, qst_body, qst_no_of_altr, qst_remarks, calculation_info, reference_info, qst_is_active, no_of_question, qst_audit_by, qst_audit_dt, questionimage.qbi_image_name as qimage, qb_id from ( select qb_pk un_id, * from qba.qstn_bank a where ( case when qst_type = 'CS' and qst_pid > 0 then 1 else 2 end ) = 2 union ALL select a.qb_pk un_id, b.* from qba.qstn_bank a inner join qba.qstn_bank b on a.qst_lang = b.qst_lang and a.qb_id = b.qst_pid where a.qst_type = 'CS' and a.qst_pid = 0 ) qstn_bank inner join qba.qba_topic_master on ( qba_topic_master.qba_topic_pk = qstn_bank.qba_topic_fk ) inner join qba.qba_module_mstr on ( qba_module_mstr.qba_module_pk = qba_topic_master.qba_module_fk ) inner join qba.qba_subject_master on ( qba_subject_master.qba_subject_pk = qba_module_mstr.qba_subject_fk ) inner join qba.qba_course_master on ( qba_course_master.qba_course_pk = qba_subject_master.qba_course_fk ) LEFT OUTER JOIN qba.qbank_images as questionimage ON ( qstn_bank.qst_img_fk = questionimage.qbi_pk ) where qstn_bank.qba_module_fk IN (" + moduleId + ") and qst_type = '" + qstType + "' and qst_lang = 'ENGLISH' and qstn_bank.qst_is_active = 'A' order by qb_pk ) a left join qba.qstn_alternatives on( qstn_alternatives.qta_qst_id = a.qb_pk ) LEFT OUTER JOIN qba.qbank_images as alterimage ON ( qstn_alternatives.qta_img_fk = alterimage.qbi_pk ) where qba_module_fk IN (" + moduleId + ") and qb_id not in ( select qb_id from qba.culled_qstn_bank where exampaper_fk = '" + exampaper_fk + "' and exam_fk = '" + exam_fk + "' and qba_module_fk IN (" + moduleId + ") ) ), d2 as( select dense_rank() over(ORDER BY qst_type, module_name,qba_topic_code,qb_id1, qb_pk) as dr, * from d1 ) select dr, * from d2 order by dr, qta_order";

        var countQuery = "select count(1) as qst_count from qstn_bank where qba_module_fk in (" + moduleId + ") and qst_lang = 'ENGLISH' and  (case when  qst_type  = 'CS' and qst_pid  > 0  then 1 else 2 end) =2 " +
            "and qst_marks = '" + qst_marks + "' and qst_type = '" + qstType + "' and qba_module_fk IN (" + moduleId + ") " + caseCondition +
            "and qb_id not in (select qb_id from culled_qstn_bank where exampaper_fk = '" + exampaper_fk + "' and exam_fk = '" + exam_fk + "' and qst_marks = '" + qst_marks + "'   and qba_module_fk IN (" + moduleId + "))";

        sequelize.query(countQuery, { type: sequelize.QueryTypes.SELECT })
            .then(c => {

                sequelize.query(filteredQuery, { type: sequelize.QueryTypes.SELECT })
                    .then(searchResult => {

                        req.body.result = searchResult;
                        req.body.count = c[0].qst_count;
                        importMethods.parseQuestionBankData(req, res);
                    });
            });
    },

    loadInactiveQuestionsSubjectWise: function (req, res) {
        var qb_pk = req.body.qb_pk;
        var qst_marks = req.body.qst_marks;
        var qba_topic_fk = req.body.qba_topic_fk;
        var moduleId = req.body.m_id;
        var created_by = req.body.created_by;
        var exampaper_fk = req.body.exampaper_fk;
        var exam_fk = req.body.exam_fk;
        var qstType = req.body.qst_type;
        var caseCondition = "";
        var subject_id = req.body.s_id;

        var filteredQuery = "with d1 as (select qb_id, qst_pid, *, qta_is_corr_alt, qta_alt_desc, alterimage.qbi_image_name as aimage from ( select ( CASE WHEN qstn_bank.qst_type='CS' AND qstn_bank.qst_pid > 0 THEN qstn_bank.qst_pid::varchar || '.' || qstn_bank.qb_id::varchar ELSE qstn_bank.qb_id::varchar END )::numeric(10,5) as qb_id1, qb_pk, qba_topic_fk, qstn_bank.qba_module_fk, qstn_bank.qba_subject_fk, qba_course_name, subject_name, module_name, topic_name, qba_topic_code, qst_marks, qst_neg_marks, qst_lang, qst_type, qst_pid, qst_body, qst_no_of_altr, qst_remarks, calculation_info, reference_info, qst_is_active, no_of_question, qst_audit_by, qst_audit_dt, questionimage.qbi_image_name as qimage, qb_id from ( select qb_pk un_id, * from qba.qstn_bank a where ( case when qst_type = 'CS' and qst_pid > 0 then 1 else 2 end ) = 2 union ALL select a.qb_pk un_id, b.* from qba.qstn_bank a inner join qba.qstn_bank b on a.qst_lang = b.qst_lang and a.qb_id = b.qst_pid where a.qst_type = 'CS' and a.qst_pid = 0 ) qstn_bank inner join qba.qba_topic_master on ( qba_topic_master.qba_topic_pk = qstn_bank.qba_topic_fk ) inner join qba.qba_module_mstr on ( qba_module_mstr.qba_module_pk = qba_topic_master.qba_module_fk ) inner join qba.qba_subject_master on ( qba_subject_master.qba_subject_pk = qba_module_mstr.qba_subject_fk ) inner join qba.qba_course_master on ( qba_course_master.qba_course_pk = qba_subject_master.qba_course_fk ) LEFT OUTER JOIN qba.qbank_images as questionimage ON ( qstn_bank.qst_img_fk = questionimage.qbi_pk ) where qstn_bank.qba_subject_fk = '" + subject_id + "' and qst_type = 'CS' and qst_lang = 'ENGLISH' and qst_is_active = 'A' order by qb_pk ) a left join qba.qstn_alternatives on( qstn_alternatives.qta_qst_id = a.qb_pk ) LEFT OUTER JOIN qba.qbank_images as alterimage ON ( qstn_alternatives.qta_img_fk = alterimage.qbi_pk ) where qba_subject_fk = '" + subject_id + "' and qst_is_active = 'A' and qb_id not in ( select qb_id from qba.culled_qstn_bank where exampaper_fk = '" + exampaper_fk + "' and exam_fk = '" + exam_fk + "' and qba_subject_fk = '" + subject_id + "' )), d2 as ( select dense_rank() over(ORDER BY qst_type, module_name,qba_topic_code,qb_id1, qb_pk) as dr, * from d1 ) select dr, * from d2 order by dr, qta_order";


        var countQuery = "select count(1) as qst_count from qstn_bank where qba_subject_fk ='" + subject_id + "' and qst_lang = 'ENGLISH' and  (case when  qst_type  = 'CS' and qst_pid  > 0  then 1 else 2 end) =2 " +
            "and qst_marks = '" + qst_marks + "' and qst_type = '" + qstType + "' and qba_subject_fk ='" + subject_id + "' " + caseCondition +
            "and qb_id not in (select qb_id from culled_qstn_bank where exampaper_fk = '" + exampaper_fk + "' and exam_fk = '" + exam_fk + "' and qst_marks = '" + qst_marks + "'   and qba_subject_fk ='" + subject_id + "')";

        sequelize.query(countQuery, { type: sequelize.QueryTypes.SELECT })
            .then(c => {

                sequelize.query(filteredQuery, { type: sequelize.QueryTypes.SELECT })
                    .then(searchResult => {

                        req.body.result = searchResult;
                        req.body.count = c[0].qst_count;
                        importMethods.parseQuestionBankData(req, res);
                    });
            });
    },

    saveReplaceQstnHistory: function (req, res) {
        qba_replaceqstn_history.create({
            rep_qb_pk: req.body.rep_qb_pk,
            rep_id_marks: req.body.rep_id_marks,
            rep_id_qsttype: req.body.rep_id_qsttype,
            req_id_module: req.body.req_id_module,
            req_id_user: req.body.req_id_user,
            req_id_isapproved: req.body.req_id_isapproved,
            rep_act_qb_pk: req.body.rep_act_qb_pk,
            exampaper_fk: req.body.exampaper_fk,
            exam_fk: req.body.exam_fk
        })
            .then(saveResponse => {
                res.send({
                    code: 0,
                    message: "success",
                    obj: saveResponse
                });
            });
    },

    updateReplaceQstnHistory: function (req, res) {
        var id = req.body.finalQstId;

        qba_replaceqstn_history.findAll({

            where: {
                rep_qb_pk: req.body.rep_qb_pk,
                req_id_user: req.body.req_id_user

            }

        }).then(questionStatus => {

            qba_replaceqstn_history.update({
                req_id_isapproved: true
            }, {
                where: {
                    rep_qb_pk: req.body.rep_qb_pk,
                    req_id_user: req.body.req_id_user
                }
            }).then(updatedStaus => {
                res.send({
                    code: 0,
                    message: "success",
                    obj: updatedStaus
                });
            });

        });

    },

    updateReplaceQstnHistoryWithActivatedQuestion: function (req, res) {

        qba_replaceqstn_history.findAll({

            where: {
                rep_qb_pk: req.body.rep_qb_pk,
            }

        }).then(questionStatus => {
            qba_replaceqstn_history.update({
                rep_act_qb_pk: req.body.rep_act_qb_pk,
                rep_act_qb_id: req.body.rep_act_qb_id
            }, {
                where: {
                    rep_qb_pk: req.body.rep_qb_pk,
                }
            }).then(updatedStaus => {
                res.send({
                    code: 0,
                    message: "success",
                    obj: updatedStaus
                });
            });

        });

    },
    loadReplaceQuestionHistory: function (req, res) {
        var loadQuery = "select * from qba_replaceqstn_history where req_id_isapproved = 'true'";

        sequelize.query(loadQuery, { type: sequelize.QueryTypes.SELECT })
            .then(populateQuestions => {
                res.send({
                    code: 0,
                    message: "success",
                    obj: populateQuestions
                });
                // We don't need spread here, since only the results will be returned for select queries
            })

    },
    //replaced qb_pk against requested qb_pk (for replacement), below list show unique questions which not activated earlier.

    updateQuestToPublish: function (req, res) {
        var questData = req.body;
        for (var i = 0; i < questData.length; i++) {
            qstn_bank.update({
                qst_body: questData[i].qst_body,
                qst_is_active: questData[i].qst_status,
                qst_audit_dt: new Date(),
                qba_module_fk: questData[i].qba_module_mstr.qba_module_fk,
                qba_topic_fk: questData[i].qba_topic_fk,
                qst_marks: questData[i].qst_marks,
                qst_neg_marks: questData[i].qst_neg_marks,
                qst_img_fk: null,
                qst_remarks: questData[i].qst_remarks != '' ? questData[i].qst_remarks : null,
                reference_info: questData[i].reference_info != '' ? questData[i].reference_info : null,
                calculation_info: questData[i].calculation_info != '' ? questData[i].calculation_info : null,
                qst_audit_by: questData[i].qst_audit_by
            }, {
                where: {
                    qb_pk: parseInt(questData[i].qb_pk)
                }
            }).then(updtQuest => {

            });
        }
        res.send({
            code: 0,
            message: "success"
        })
    },
    updateAltToPublish: function (req, res) {
        var questData = req.body;
        async.each(questData, function (arr1Element, callback) {
            async.each(arr1Element.qstn_alternatives, function (arr2Element, callback2) {
                qstn_alternatives.update({
                    qta_alt_desc: arr2Element.qta_alt_desc,
                    qta_audit_dt: new Date()
                }, {
                    where: {
                        qta_qst_id: parseInt(arr1Element.qb_pk)
                    }
                }).then(updtOpt => {
                    res.send({
                        code: 0,
                        message: "success",
                        obj: updtOpt
                    })
                });
                callback2();
            });
            callback();
        });
    },
    insertQuestToPublish: function (req, res) {
        var questData = req.body;
        var arr_alternatives;
        var qb_id;
        var exam_fk;
        var exampaper_fk;
        var qb_pk;
        for (var i = 0; i < questData.length; i++) {

            arr_alternatives = questData[i].qstn_alternatives;

            qb_id = parseInt(questData[i].qb_id);
            exam_fk = questData[i].exam_fk;
            exampaper_fk = questData[i].exampaper_fk;
            qb_pk = questData[i].qb_pk;
            qstn_bank.create({
                qb_pk: qb_pk,
                qst_lang: 'ENGLISH',
                qst_sub_seq_no: '0',
                qst_body: questData[i].qst_body,
                qst_marks: questData[i].qst_marks,
                qst_expiry_dt: new Date(),
                qst_img_fk: null,
                qst_fk_tpc_pk: '0',
                qst_is_active: 'A',
                qst_audit_dt: new Date(),
                qb_assigned_to: '0',
                qb_status_fk: '0',
                qba_topic_fk: parseInt(questData[i].qba_topic_fk),
                qba_subject_fk: parseInt(questData[i].qba_subject_master.qba_subject_fk),
                qba_course_fk: parseInt(questData[i].qba_course_master.qba_course_fk),
                qst_type: questData[i].qst_type,
                qba_module_fk: parseInt(questData[i].qba_module_mstr.qba_module_fk),
                qst_pid: questData[i].qst_pid,
                qst_audit_by: questData[i].qst_audit_by,
                author_name: questData[i].qst_audit_by,
                qst_dimension: 'Dimension',
                qst_neg_marks: '0',
                qb_id: qb_id,
                calculation_info: questData[i].calculation_info != '' ? questData[i].calculation_info : null,
                reference_info: questData[i].reference_info != '' ? questData[i].reference_info : null,
                qst_remarks: questData[i].qst_remarks != '' ? questData[i].qst_remarks : null,
                qst_no_of_altr: questData[i].qst_no_of_altr,
                no_of_question: questData[i].no_of_question
            }).then(insRepoQuest => {

                var copy_qstn_alternative_query = "insert into qstn_alternatives(qta_qst_id,qta_id,qta_alt_desc,qta_order,qta_is_corr_alt,qta_is_active,qta_audit_by,qta_audit_dt) select " + insRepoQuest.qb_pk + ",qta_id,qta_alt_desc,qta_order,qta_is_corr_alt,qta_is_active,0,now() from culled_qstn_alternatives where qta_id = " + insRepoQuest.qb_id + " and exam_fk = " + parseInt(exam_fk) + " and  exampaper_fk = " + parseInt(exampaper_fk) + " ";
                sequelize.query(copy_qstn_alternative_query).then(data => {
                    culled_qstn_bank.update({
                        copied_from_repository: 'Y',
                        qb_pk: parseInt(insRepoQuest.qb_pk)

                    }, {
                        where: {
                            exam_fk: exam_fk,
                            exampaper_fk: exampaper_fk,
                            qb_id: insRepoQuest.qb_id

                        }

                    });

                    culled_qstn_alternatives.update({
                        qta_qst_id: parseInt(insRepoQuest.qb_pk)


                    }, {
                        where: {
                            exam_fk: exam_fk,
                            exampaper_fk: exampaper_fk,
                            qta_id: insRepoQuest.qb_id,
                            qta_is_active: 'A'

                        }

                    });
                });





            });
        }
        if (i == questData.length) {
            res.send({
                code: 0,
                message: "success"
            })
        }

    },
    insertAltToPublish: function (req, res) {
        var questData = req.body;
        async.each(questData, function (arr1Element, callback) {
            async.each(arr1Element.qstn_alternatives, function (arr2Element, callback2) {
                qstn_alternatives.create({
                    qta_qst_id: parseInt(arr1Element.qb_pk),
                    qta_id: parseInt(arr1Element.qb_id),
                    qta_alt_desc: (arr2Element.qta_alt_desc == null) ? '' : arr2Element.qta_alt_desc,
                    qta_order: (arr2Element.qta_order == null) ? 0 : parseInt(arr2Element.qta_order),
                    qta_is_corr_alt: (arr2Element.qta_is_corr_alt == null) ? '' : arr2Element.qta_is_corr_alt,
                    qta_is_active: 'Y',
                    qta_audit_by: '0',
                    qta_audit_dt: new Date()
                }).then(insAlt => {

                });
                callback2();
            });
            callback();
        });
        res.send({
            code: 0,
            message: "success"
        })
    },
    removeAltToPublish: function (req, res) {
        var questData = req.body;
        for (var i = 0; i < questData.length; i++) {
            qstn_alternatives.destroy({
                where: {
                    qta_qst_id: parseInt(questData[i].qb_pk)
                }
            }).then(removeOpt => {

            });
        }
        res.send({
            code: 0,
            message: "success"
        });
    },

    insertExamPaperQbpk: function (req, res) {
        qba_exam_paper.update({
            status: 'A',
            published_qb_pk: req.body.qb_pk
        }, {
            where: {
                exam_fk: req.body.exam_fk,
                exampaper_pk: req.body.exampaper_fk
            }
        }).then(qbpkUpdate => {
            res.send({
                code: 0,
                message: "success",
                obj: qbpkUpdate
            });
        })
    },

    loadUniqueActivatedQuestionList: function (req, res) {
        var query = "select * from qba_replaceqstn_history INNER JOIN qstn_bank ON (qba_replaceqstn_history.rep_act_qb_pk = qstn_bank.qb_pk) where qstn_bank.qst_is_active = 'A'";


        sequelize.query(query, { type: sequelize.QueryTypes.SELECT })
            .then(populateQuestions => {
                res.send({
                    code: 0,
                    message: "success",
                    obj: populateQuestions
                });
            })
    },
    addExamPaper: function (req, res) {
        var dataa = req.body;

        var query = "select count (*) from qba_exam_paper";

        sequelize.query(query, { type: sequelize.QueryTypes.SELECT })
            .then(examlistcount => {
                var qstnpaper_id = req.body.qstnpaper_id + "-" + (parseInt(examlistcount[0].count) + parseInt(1));

                qba_exam_paper.create({
                    qstnpaper_id: qstnpaper_id,
                    exam_name: req.body.exam_name,
                    created_dt: req.body.created_dt,
                    exam_qb_pk: req.body.exam_qb_pk,
                    qba_subject_fk: req.body.qba_subject_fk,
                    qba_course_fk: req.body.qba_course_fk,
                    exam_fk: req.body.exam_fk,
                    new_exampaper_pk: req.body.new_exampaper_pk
                }).then(saveResponse => {
                    res.send({
                        code: 0,
                        message: "success",
                        obj: saveResponse,
                        qstnpaper_id: qstnpaper_id,
                    });
                });

                // We don't need spread here, since only the results will be returned for select queries
            })

    },

    loadExamPaperList: function (req, res) {

        var query = "select case when role_fk  ='3' and vetting_status = 'Active' then 'Vetting in progress' " +
            "when role_fk  ='3' and vetting_status = 'Done' then 'Vetting done' " +
            "when role_fk  ='2' and vetting_status = 'Active' then 'Publisher in progress'" +
            "when role_fk  ='2' and vetting_status = 'Done' then 'Publisher is done' else 'culled' end progress_detail" +
            ",*,qba_exam_paper.qstnpaper_id,qba_exam_paper.exam_fk,qba_exam_paper.status,qba_course_name " +
            "from qba_exam_paper " +
            "inner join qba_subject_master on (qba_subject_master.qba_subject_pk=qba_exam_paper.qba_subject_fk) " +
            "left join qba_course_master on (qba_course_master.qba_course_pk=qba_exam_paper.qba_course_fk) " +
            "left join (select  rank()over(partition by qstnpaper_id order by audit_dt desc) rnk, vd_pk,exam_fk,vetter_fk,vetting_status,audit_by,audit_dt,module_names,module_ids,vetting_flag,summary_id_fk,qstnpaper_id," +
            "exampaper_fk  from vetting_details ) vetting_details on rnk=1 and (vetting_details.qstnpaper_id = qba_exam_paper.qstnpaper_id) " +
            "left join um_user_role_mapping on (um_user_role_mapping.user_fk = vetting_details.vetter_fk) where status ISNULL";

        sequelize.query(query, { type: sequelize.QueryTypes.SELECT })
            .then(examlist => {
                res.send({
                    code: 0,
                    message: "success",
                    obj: examlist
                });
                // We don't need spread here, since only the results will be returned for select queries
            })
    },


    loadsubjectadminList: function (req, res) {
        importMethods.checkValidUser(req, res);
        var subject_name = req.body.subject_id;

        var query = "select qba_subject_code from qba_subject_master where qba_subject_pk = " + req.body.subject_id;

        sequelize.query(query, { type: sequelize.QueryTypes.SELECT })
            .then(subjectlistname => {
                res.send({
                    code: 0,
                    message: "success",
                    obj: subjectlistname
                });
                // We don't need spread here, since only the results will be returned for select queries
            })
    },

    loadmoduleadminList: function (req, res) {
        importMethods.checkValidUser(req, res);
        var moduleId = req.body.moduleId;

        var query = "select qba_module_pk,module_name from qba_module_mstr where qba_module_pk IN ( " + req.body.moduleId + " )";

        sequelize.query(query, { type: sequelize.QueryTypes.SELECT })
            .then(modulename => {
                res.send({
                    code: 0,
                    message: "success",
                    obj: modulename
                });
                // We don't need spread here, since only the results will be returned for select queries
            })
    },

    loadmodulenamedminList: function (req, res) {
        importMethods.checkValidUser(req, res);
        var moduleID = req.body.moduleID;

        var query = "select module_name from qba_module_mstr where qba_module_pk = " + req.body.moduleID + " ";

        sequelize.query(query, { type: sequelize.QueryTypes.SELECT })
            .then(moduleName => {
                res.send({
                    code: 0,
                    message: "success",
                    obj: moduleName
                });
                // We don't need spread here, since only the results will be returned for select queries
            })
    },

    loadtopicnamedminList: function (req, res) {
        importMethods.checkValidUser(req, res);
        var topicunit = req.body.topicunit;

        var query = "select qba_topic_code,topic_name from qba_topic_master where qba_topic_pk = " + req.body.topicunit + " ";

        sequelize.query(query, { type: sequelize.QueryTypes.SELECT })
            .then(topicName => {
                res.send({
                    code: 0,
                    message: "success",
                    obj: topicName
                });
                // We don't need spread here, since only the results will be returned for select queries
            })
    },


    saveSummaryForAdmin: function (req, res) {
        var topics = req.body;
        for (var i = 0; i < topics.topicDetails.length; i++) {
            qba_summary_admin.create({
                topic_name: topics.topicDetails[i].topic_name,
                total_question: topics.topicDetails[i].summaryQuestions,
                total_marks: topics.topicDetails[i].summaryMarks,
                qstn_paper_id: topics.questionpaper_id,    //added by dipika
                audit_date: now,
                summary_question: topics.topicDetails[i].summaryQuestions,
                summary_marks: topics.topicDetails[i].summaryMarks,
                audit_date: now,
                total_question: topics.topicDetails[i].totalQuestion,
                total_marks: topics.topicDetails[i].totalMarks,
                short_fall_qstn: topics.topicDetails[i].fallShortQuest,
                total_short_fall_question: topics.topicDetails[i].totalFallShortQuest,
                topic_pk: topics.topicDetails[i].topic_pk,
                module_fk: topics.topicDetails[i].module_fk,
                exam_fk: topics.exam_fk,
                exampaper_fk: topics.exampaper_fk
            }).then(summaryAdmin => {
            })
        }
        if (i == topics.topicDetails.length || i == 0) {
            res.send({
                code: 0,
                message: "success"
            });
        }
    },

    loadSummaryForAdmin: function (req, res) {

        importMethods.checkValidUser(req, res);
        var qpID = req.body.qpid;
        var exam_id = req.body.exam_fk;
        var exampaper_id = req.body.examPaper;
        var moduleId = req.body.moduleId;
        var moduleIds = JSON.parse("[" + moduleId + "]");
        var query = "select qba_topic_master.qba_topic_code,qba_topic_master.topic_name,qba_module_mstr.module_name,sum(summary_question) as summary_question, sum(summary_marks) as summary_marks, total_question,total_marks,sum(short_fall_qstn) as short_fall_qstn,total_short_fall_question,module_fk,topic_pk,exam_fk,exampaper_fk ,(select count(qb_id) from culled_qstn_bank where qst_lang = 'ENGLISH' and qb_id in (select qb_id from qba_vatting_log where qstnpaper_id = \'" + qpID + "\' and admin_status = 'Approved') and qst_type = 'M' AND exam_fk = \'" + exam_id + "\' AND exampaper_fk =\'" + exampaper_id + "\' and qba_topic_fk = qba_summary_admin.topic_pk) as total_replaced_quest, (select sum(qst_marks) from culled_qstn_bank where exampaper_fk =\'" + exampaper_id + "\' and qst_lang = 'ENGLISH' and qb_id in (select qb_id from qba_vatting_log where qstnpaper_id = \'" + qpID + "\' and admin_status = 'Approved') and qst_type = 'M' and qba_topic_fk = qba_summary_admin.topic_pk) as total_replace_question_marks from qba_summary_admin left join qba_module_mstr on qba_summary_admin.module_fk = qba_module_mstr.qba_module_pk inner join qba_topic_master on qba_topic_master.qba_topic_pk = qba_summary_admin.topic_pk WHERE qstn_paper_id = \'" + qpID + "\'  AND exam_fk = \'" + exam_id + "\' and exampaper_fk = \'" + exampaper_id + "\' group by qba_topic_master.qba_topic_code,qba_topic_master.topic_name,qba_module_mstr.module_name,qstn_paper_id, total_question,total_marks,total_short_fall_question,module_fk,topic_pk,exam_fk,exampaper_fk order by module_name, qba_topic_master.qba_topic_code";

        sequelize.query(query, { type: sequelize.QueryTypes.SELECT })
            .then(summary => {

                res.send({
                    code: 0,
                    message: "success",
                    obj: summary
                });
                // We don't need spread here, since only the results will be returned for select queries
            })
    },



    //added by dipika
    savevettermcqRecords: function (req, res) {

        importMethods.checkValidUser(req, res);

        var questionData = req.body;
        if (!questionData.negativeMarks) {
            questionData.negativeMarks = 0
        }
        sequelize.query("select nextval('qb_id_val') as val, nextval('s_qstnbank_qbpk') as qb_pk", { type: sequelize.QueryTypes.SELECT })
            .then(next_qb_id => {
                var qb_id = next_qb_id[0].val;
                var qb_pk = next_qb_id[0].qb_pk
                var responseOBJ
                qstn_bank.create({
                    qst_type: questionData.type,
                    qst_lang: 'ENGLISH',
                    qst_pid: questionData.parentId,
                    qst_sub_seq_no: '0',
                    qst_body: questionData.question,
                    qst_marks: questionData.marks,
                    qst_neg_marks: questionData.negativeMarks,
                    qst_expiry_dt: new Date(),
                    qst_no_of_altr: questionData.numOfAlternatives,
                    qst_img_fk: null,
                    qst_remarks: questionData.remark != '' ? questionData.remark : null,
                    qst_fk_tpc_pk: '0',
                    qst_dimension: 'Dimension',
                    qst_is_active: 'A',
                    qst_audit_by: questionData.userName,
                    author_name: questionData.userName,
                    qst_audit_dt: new Date(),
                    qb_assigned_to: '0',
                    qb_status_fk: '0',
                    qba_topic_fk: questionData.topicId,
                    qba_subject_fk: questionData.subjectId,
                    qba_course_fk: questionData.courseId,
                    reference_info: questionData.reference != '' ? questionData.reference : null,
                    calculation_info: questionData.calculations != '' ? questionData.calculations : null,
                    qb_id: next_qb_id[0].val,
                    qba_module_fk: questionData.moduleId
                }).then(question => {
                    culled_qstn_bank.create({
                        qst_lang: 'ENGLISH',
                        qst_sub_seq_no: '0',
                        qst_body: questionData.question,
                        qst_marks: questionData.marks,
                        qst_expiry_dt: new Date(),
                        qst_img_fk: null,
                        qst_fk_tpc_pk: '0',
                        qst_is_active: 'A',
                        qst_audit_dt: new Date(),
                        qb_assigned_to: '0',
                        qb_status_fk: '0',
                        qba_topic_fk: questionData.topicId,
                        qba_subject_fk: questionData.subjectId,
                        qba_course_fk: questionData.courseId,
                        qst_type: questionData.type,
                        qba_module_fk: questionData.moduleId,
                        qst_no_of_altr: questionData.numOfAlternatives,
                        no_of_question: '0',
                        qst_pid: '0',
                        qst_audit_by: questionData.userName,
                        author_name: questionData.userName,
                        qst_dimension: 'Dimension',
                        qst_neg_marks: 0,
                        qb_id: qb_id,
                        copied_from_repository: 'Y',
                        exam_fk: questionData.examPk,
                        exampaper_fk: questionData.exampaper_fk,
                        qst_request_remarks: questionData.qst_remarks,
                        calculation_info: questionData.calculations != '' ? questionData.calculations : null,
                        reference_info: questionData.reference != '' ? questionData.reference : null,
                        qst_remarks: questionData.remark != '' ? questionData.remark : null,
                        qst_request_status: null,
                        pub_status: 'A',
                        qb_pk: qb_pk
                    }).then(response => { // added by shilpa
                        var query = "update culled_qstn_bank set replace_id=" + response.culled_qb_pk + " where exam_fk = " + questionData.examPk + " and exampaper_fk = " + questionData.exampaper_fk + " and culled_qb_pk = " + response.culled_qb_pk;
                        responseOBJ = response
                        sequelize.query(query, { type: sequelize.QueryTypes.UPDATE }).then(parentQues => {

                        });

                    })

                    var arr_alternatives = [];
                    for (var i = 1; i <= questionData.numOfAlternatives; i++) {
                        var obj = new Object();
                        obj.qta_qst_id = qb_pk;
                        obj.qta_id = qb_id;
                        obj.qta_alt_desc = questionData.alternatives[i - 1].text;
                        obj.qta_order = i;
                        obj.qta_is_corr_alt = questionData.alternatives[i - 1].isCorrect;
                        obj.qta_is_active = 'A';
                        obj.qta_audit_by = questionData.userName;
                        obj.qta_audit_dt = new Date();
                        arr_alternatives.push(obj);
                    }
                    qstn_alternatives.bulkCreate(arr_alternatives).then(() => {

                    });
                    var culled_arr_alternatives = [];
                    for (var i = 1; i <= questionData.numOfAlternatives; i++) {
                        var obj = new Object();
                        obj.qta_qst_id = qb_pk;
                        obj.qta_id = qb_id;
                        obj.qta_alt_desc = questionData.alternatives[i - 1].text;
                        obj.qta_order = i;
                        obj.qta_is_corr_alt = questionData.alternatives[i - 1].isCorrect;
                        obj.qta_is_active = 'A';
                        obj.qta_audit_by = questionData.userName;
                        obj.qta_audit_dt = new Date();
                        obj.exam_fk = questionData.examPk;
                        obj.exampaper_fk = questionData.exampaper_fk;
                        culled_arr_alternatives.push(obj);
                    }

                    culled_qstn_alternatives.bulkCreate(culled_arr_alternatives).then(() => {

                        res.send({
                            code: 0,
                            message: "success",
                            obj: responseOBJ,
                            qb_id: qb_id,
                            qb_pk: qb_pk
                        })

                    });




                })
            })
    },

    saveChildShortFall: function (req, res) {
        importMethods.checkValidUser(req, res);

        var questionData = req.body;
        sequelize.query("select nextval('qb_id_val') as val, nextval('s_qstnbank_qbpk') as qb_pk", { type: sequelize.QueryTypes.SELECT })
            .then(next_qb_id => {
                var qb_id = next_qb_id[0].val;
                var qb_pk = next_qb_id[0].qb_pk;
                culled_qstn_bank.create({
                    qst_lang: 'ENGLISH',
                    qst_sub_seq_no: '0',
                    qst_body: questionData.question,
                    qst_marks: questionData.marks,
                    qst_expiry_dt: new Date(),
                    qst_no_of_altr: questionData.numOfAlternatives,
                    qst_img_fk: null,
                    qst_fk_tpc_pk: '0',
                    qst_is_active: 'A',
                    qst_audit_dt: new Date(),
                    qb_assigned_to: '0',
                    qb_status_fk: '0',
                    qba_topic_fk: questionData.topicId,
                    qba_subject_fk: questionData.subjectId,
                    qba_course_fk: questionData.courseId,
                    qst_type: questionData.type,
                    qba_module_fk: questionData.moduleId,
                    qst_no_of_altr: questionData.numOfAlternatives,
                    no_of_question: '0',
                    qst_pid: questionData.qbId,
                    qst_audit_by: questionData.userName,
                    author_name: questionData.userName,
                    qst_dimension: 'Dimension',
                    qst_neg_marks: '0',
                    qb_id: qb_id,
                    copied_from_repository: 'N',
                    exam_fk: questionData.exam_fk,
                    exampaper_fk: questionData.exampaper_fk,
                    //qst_request_remarks: questionData.remark,
                    reference_info: questionData.reference != '' ? questionData.reference : null,
                    calculation_info: questionData.calculations != '' ? questionData.calculations : null,
                    qst_remarks: questionData.remark != '' ? questionData.remark : null,
                    qst_request_status: null,
                    pub_status: 'A',
                    qb_pk: qb_pk,
                    qst_request_remarks: 'Newly added Shortfall case question'
                }).then(response => { // added by shilpa
                    var query = "update culled_qstn_bank set replace_id=" + response.culled_qb_pk + " where exam_fk = " + questionData.exam_fk + " and exampaper_fk = " + questionData.exampaper_fk + " and culled_qb_pk = " + response.culled_qb_pk;

                    sequelize.query(query, { type: sequelize.QueryTypes.UPDATE }).then(parentQues => {

                    });
                    var culled_arr_alternatives = [];
                    for (var i = 1; i <= questionData.numOfAlternatives; i++) {
                        var obj = new Object();
                        obj.qta_qst_id = response.qb_pk;
                        obj.qta_id = response.qb_id;
                        obj.qta_alt_desc = questionData.alternatives[i - 1].text;
                        obj.qta_order = i;
                        obj.qta_is_corr_alt = questionData.alternatives[i - 1].isCorrect;
                        obj.qta_is_active = 'A';
                        obj.qta_audit_by = questionData.userName;
                        obj.qta_audit_dt = questionData.qst_audit_dt;
                        obj.exam_fk = questionData.exam_fk;
                        obj.exampaper_fk = questionData.exampaper_fk;
                        culled_arr_alternatives.push(obj);
                    }

                    culled_qstn_alternatives.bulkCreate(culled_arr_alternatives).then(() => {
                        res.send({
                            code: 0,
                            message: "success",
                            obj: questionData
                        })
                    });

                })



            })

    },



    saveCSQVetter: function (req, res) {
        importMethods.checkValidUser(req, res);

        var questionData = req.body;

        var qb_id = questionData.qbId;
        culled_qstn_bank.create({
            qst_lang: 'ENGLISH',
            qst_sub_seq_no: '0',
            qst_body: questionData.question,
            qst_marks: 0,
            qst_expiry_dt: new Date(),
            qst_no_of_altr: 0,
            qst_img_fk: null,
            qst_fk_tpc_pk: '0',
            qst_is_active: 'A',
            qst_audit_dt: new Date(),
            qb_assigned_to: '0',
            qb_status_fk: '0',
            qba_topic_fk: questionData.topicId,
            qba_subject_fk: questionData.subjectId,
            qba_course_fk: questionData.courseId,
            qst_type: 'CS',
            qba_module_fk: questionData.moduleId,
            qst_no_of_altr: 0,
            no_of_question: 0,
            qst_pid: '0',
            qst_audit_by: questionData.userName,
            author_name: questionData.userName,
            qst_dimension: 'Dimension',
            qst_neg_marks: 0,
            qb_id: qb_id,
            copied_from_repository: 'Y',
            exam_fk: questionData.exam_fk,
            exampaper_fk: questionData.exampaper_fk,
            qst_request_remarks: questionData.remark,
            qst_request_status: null,
            pub_status: 'A',
            qb_pk: questionData.qb_pk
        }).then(response => { // added by shilpa
            var query = "update culled_qstn_bank set replace_id=" + response.culled_qb_pk + " where exam_fk = " + questionData.exam_fk + " and exampaper_fk = " + questionData.exampaper_fk + " and culled_qb_pk = " + response.culled_qb_pk;

            sequelize.query(query, { type: sequelize.QueryTypes.UPDATE }).then(parentQues => {

                if (questionData.actiontype == 'remove') {
                    var update = "update culled_qstn_bank set qst_request_remarks = 'Question Permanently Removed and Replaced by QB ID " + qb_id + "',qst_request_status ='null',qst_audit_by='" + questionData.userName + "' where qb_id = " + questionData.old_qb_id + " and exam_fk = " + questionData.exam_fk + " and exampaper_fk=" + questionData.exampaper_fk;

                }
                else {
                    var update = "update culled_qstn_bank set qst_request_remarks = 'Question Replaced by QB ID " + qb_id + "',qst_request_status ='null',qst_audit_by='" + questionData.userName + "' where qb_id = " + questionData.old_qb_id + " and exam_fk = " + questionData.exam_fk + " and exampaper_fk=" + questionData.exampaper_fk;

                }

                sequelize.query(update, { type: sequelize.QueryTypes.UPDATE }).then(parentQues => {


                    if (questionData.actiontype == 'remove') {
                        var update_child = "update culled_qstn_bank set qst_request_remarks = 'Question Permanently Removed and Replaced by QB ID " + qb_id + "',qst_request_status ='null',qst_audit_by='" + questionData.userName + "' where qst_pid = " + questionData.old_qb_id + " and exam_fk = " + questionData.exam_fk + " and exampaper_fk=" + questionData.exampaper_fk;

                    }
                    else {
                        var update_child = "update culled_qstn_bank set qst_request_remarks = 'Question Replaced by QB ID " + qb_id + "',qst_request_status ='null',qst_audit_by='" + questionData.userName + "' where qst_pid = " + questionData.old_qb_id + " and exam_fk = " + questionData.exam_fk + " and exampaper_fk=" + questionData.exampaper_fk;
                    }

                    sequelize.query(update_child, { type: sequelize.QueryTypes.UPDATE }).then(parentQues => {
                    });


                });

            });

            res.send({
                code: 0,
                message: "success",
                obj: questionData,
                qb_id: qb_id
            });
        });

    },


    saveCSQAdmin: function (req, res) {
        importMethods.checkValidUser(req, res);

        var questionData = req.body;
        var qb_id = questionData.qbId;
        culled_qstn_bank.create({
            qst_lang: 'ENGLISH',
            qst_sub_seq_no: '0',
            qst_body: questionData.question,
            qst_marks: 0,
            qst_expiry_dt: new Date(),
            qst_no_of_altr: 0,
            qst_img_fk: null,
            qst_fk_tpc_pk: '0',
            qst_is_active: 'A',
            qst_audit_dt: new Date(),
            qb_assigned_to: '0',
            qb_status_fk: '0',
            qba_topic_fk: questionData.topicId,
            qba_subject_fk: questionData.subjectId,
            qba_course_fk: questionData.courseId,
            qst_type: 'CS',
            qba_module_fk: questionData.moduleId,
            qst_no_of_altr: 0,
            no_of_question: 0,
            qst_pid: '0',
            qst_audit_by: questionData.userName,
            author_name: questionData.userName,
            qst_dimension: 'Dimension',
            qst_neg_marks: 0,
            qb_id: qb_id,
            copied_from_repository: 'Y',
            exam_fk: questionData.exam_fk,
            exampaper_fk: questionData.exampaper_fk,
            qst_request_remarks: questionData.remark,
            qst_request_status: null,
            pub_status: 'A',
            no_of_question: questionData.no_of_questions,
            qb_pk: questionData.qb_pk
        }).then(response => { // added by shilpa

            res.send({
                code: 0,
                message: "success",
                obj: questionData,
                qb_id: qb_id
            });
        });
    },




    updatereplacementforvetter: function (req, res) {

        var updateCulledTable = req.body;
        var query = "update culled_qstn_bank set qst_request_remarks='" + req.body.qst_request_remarks + "' ,qst_request_status='" + req.body.qst_request_status + "' ,qst_audit_by='" + req.body.username + "' where exam_fk=" + req.body.exam_fk + " and exampaper_fk=" + req.body.exampaper_fk + " and qb_id in (select qb_id from culled_qstn_bank where exam_fk=" + req.body.exam_fk + " and exampaper_fk=" + req.body.exampaper_fk + " and qb_pk=" + updateCulledTable.qb_pk + ")";

        sequelize.query(query).then(updatedStaus => {
            res.send({
                code: 0,
                message: "success",
                obj: updatedStaus,
                username: req.body.username
            });
        })

    },









    getShortFallQstnForModule: function (req, res) {
        importMethods.checkValidUser(req, res);
        var m_id = req.body.m_id;
        var qp_id = req.body.qp_id;
        qba_summary_admin.findAll({
            where: { module_id: m_id, qstn_paper_id: qp_id }
        }).then(module_id => {
            res.send({
                code: 0,
                message: "success",
                obj: module_id
            })
        })
    },
    loadExamMasterTable: function (req, res) {

        importMethods.checkValidUser(req, res);
        var parameters = req.body;
        var query = "select *,qba_subject_code,subject_name from exam_master left join qba_subject_master on qba_subject_fk = qba_subject_pk where exam_master.is_active = 'Y' and (exam_pk not in (select exam_fk from qba_exam_paper) or exam_pk not in (select exam_fk from qba_exam_paper where array_length(published_qb_pk, 1) > 0)) ";

        sequelize.query(query, { type: sequelize.QueryTypes.UPDATE }).then(examMaster => {

            res.send({
                code: 0,
                message: "success",
                obj: examMaster
            })
        })
    },


    loadQbRepoCourses: function (req, res) {

        qba_course_master.findAll().then(courses => {
            importMethods.checkValidUser(req, res);
            qba_course_master.findAll({ where: { is_active: 'Y' } }).then(courses => {
                res.send({
                    code: 0,
                    message: "success",
                    obj: courses
                })
            })
        });
    },


    loadQbRepoSubjects: function (req, res) {
        var courseId = req.body.id;
        if (courseId == '') {
            courseId = null
        }
        qba_subject_master.findAll({ where: { qba_course_fk: courseId, is_active: 'Y' } })
            .then(subjects => {
                res.send({
                    code: 0,
                    message: "success",
                    obj: subjects
                })
            })
    },

    loadAppearedExamInfo: function (req, res) {
        importMethods.checkValidUser(req, res);
        var qstnId = req.body.questionId;
        var query = "select qstnpaper_id,exam_name, to_char(created_dt,'yyyy')as year from qba_exam_paper where status = 'A' and published_qb_pk::text ~'\\y" + qstnId + "\\y'";


        sequelize.query(query, { type: sequelize.QueryTypes.SELECT })
            .then(examlist => {
                res.send({
                    code: 0,
                    message: "success",
                    obj: examlist
                });
                // We don't need spread here, since only the results will be returned for select queries
            })
    },


    saveTopicwiseShortfallDetails: function (req, res) {
        importMethods.checkValidUser(req, res);

        var records = req.body;
        sequelize.query("select nextval('qb_id_val') as val, nextval('s_qstnbank_qbpk') as qb_pk", { type: sequelize.QueryTypes.SELECT })
            .then(next_qb_id => {
                var qb_id = next_qb_id[0].val;
                var qb_pk = next_qb_id[0].qb_pk;
                for (var i = 0; i < records.shortfall.length; i++) {
                    for (var j = 0; j < records.shortfall[i].eachFallShortQuestion; j++) {
                        culled_qstn_bank.create({
                            qst_lang: 'ENGLISH',
                            qst_sub_seq_no: '0',
                            qst_body: '',
                            qst_marks: records.shortfall[i].marks,
                            qst_expiry_dt: new Date(),
                            qst_img_fk: null,
                            qst_fk_tpc_pk: '0',
                            qst_is_active: 'A',
                            qst_audit_dt: new Date(),
                            qb_assigned_to: '0',
                            qb_status_fk: '0',
                            qba_topic_fk: records.shortfall[i].topic_pk,
                            qba_subject_fk: records.shortfall[i].subject,
                            qba_course_fk: records.shortfall[i].course,
                            qst_type: 'M',
                            qba_module_fk: records.shortfall[i].module_fk,
                            qst_pid: '0',
                            qst_audit_by: records.username,
                            author_name: records.username,
                            qst_dimension: 'Dimension',
                            qst_neg_marks: 0,
                            qb_id: qb_id,
                            copied_from_repository: 'N',
                            exam_fk: records.exam_id,
                            exampaper_fk: records.exampprId,
                            qb_pk: qb_pk,
                            pub_status: 'A'
                        }).then(topicwiseShortfall => {
                            var query = "update culled_qstn_bank set replace_id=" + topicwiseShortfall.culled_qb_pk + " where exam_fk = " + records.exam_id + " and exampaper_fk = " + records.exampprId + " and culled_qb_pk = " + topicwiseShortfall.culled_qb_pk;

                            sequelize.query(query, { type: sequelize.QueryTypes.UPDATE }).then(parentQues => {

                            });
                        })
                        qb_id = parseInt(qb_id) + 1
                        qb_pk = parseInt(qb_pk) + 1
                    }
                }
                var get_val_query = "select max(qb_id), max(qb_pk) as qb_id from culled_qstn_bank"
                sequelize.query(get_val_query, { type: sequelize.QueryTypes.SELECT })
                    .then((next_val) => {
                        var set_val_query = "select setval('qb_id_val'," + next_val[0].qb_id + "), setval('s_qstnbank_qbpk'," + next_val[0].qb_pk + ")"
                        sequelize.query(set_val_query, { type: sequelize.QueryTypes.SELECT })
                    })
                res.send({
                    code: 0,
                    message: "success",
                });
            })
    },

    saveTopicwiseCaseShortfallDetails: function (req, res) {
        importMethods.checkValidUser(req, res);

        var records = req.body;

        sequelize.query("select nextval('qb_id_val') as val, nextval('s_qstnbank_qbpk') as qb_pk", { type: sequelize.QueryTypes.SELECT })
            .then(next_qb_id => {
                var qb_id = next_qb_id[0].val;
                var qb_pk = next_qb_id[0].qb_pk;
                for (var i = 0; i < records.shortfall.length; i++) {
                    for (var j = 0; j < records.shortfall[i].shortfallCount; j++) {
                        culled_qstn_bank.create({
                            qst_lang: 'ENGLISH',
                            qst_sub_seq_no: '0',
                            qst_body: '',
                            qst_marks: '0',
                            qst_no_of_altr: 0,
                            qst_expiry_dt: new Date(),
                            qst_fk_tpc_pk: '0',
                            qst_is_active: 'A',
                            qst_audit_dt: new Date(),
                            qb_assigned_to: '0',
                            qb_status_fk: '0',
                            qba_topic_fk: records.shortfall[i].topic_pk,
                            qba_subject_fk: records.shortfall[i].subject_pk,
                            qba_course_fk: records.shortfall[i].course_pk,
                            no_of_question: '0',
                            qst_type: 'CS',
                            qba_module_fk: records.shortfall[i].module_pk,
                            qst_pid: '0',
                            qst_audit_by: records.userName,
                            author_name: records.userName,
                            qst_dimension: 'Dimension',
                            qst_neg_marks: '0',
                            qb_id: qb_id,
                            copied_from_repository: 'N',
                            exam_fk: records.exam_id,
                            exampaper_fk: records.exampprId,
                            qb_pk: qb_pk,
                            pub_status: 'A',
                            qst_request_remarks: 'Please add ' + records.shortfall[i].no_of_child_questions + ' child questions'
                        }).then(topicwiseShortfall => {
                            var query = "update culled_qstn_bank set replace_id=" + topicwiseShortfall.culled_qb_pk + " where exam_fk = " + records.exam_id + " and exampaper_fk = " + records.exampprId + " and culled_qb_pk = " + topicwiseShortfall.culled_qb_pk;

                            sequelize.query(query, { type: sequelize.QueryTypes.UPDATE }).then(parentQues => {

                            });

                        })
                        qb_id = parseInt(qb_id) + 1
                        qb_pk = parseInt(qb_pk) + 1
                    }
                }
                var get_val_query = "select max(qb_id), max(qb_pk) as qb_id from culled_qstn_bank"
                sequelize.query(get_val_query, { type: sequelize.QueryTypes.SELECT })
                    .then((next_val) => {
                        var set_val_query = "select setval('qb_id_val'," + next_val[0].qb_id + "), setval('s_qstnbank_qbpk'," + next_val[0].qb_pk + ")"
                        sequelize.query(set_val_query, { type: sequelize.QueryTypes.SELECT })
                    })
                res.send({
                    code: 0,
                    message: "success"
                });
            })
    },


    AddQuestionInAdmin: function (req, res) {
        importMethods.checkValidUser(req, res);

        var questionData = req.body;
        var qb_id = questionData.qb_id;
        var image = questionData.qbank_image.qbi_image_name
        if (image) {
            questionData.qst_body = questionData.qst_body + '<img src="static/controllers/output/' + image + '">'
        }
        culled_qstn_bank.create({
            qst_lang: 'ENGLISH',
            qst_sub_seq_no: '0',
            qst_body: questionData.qst_body,
            qst_marks: questionData.qst_marks,
            qst_expiry_dt: new Date(),
            qst_no_of_altr: questionData.qst_no_of_altr,
            qst_img_fk: null,
            qst_fk_tpc_pk: '0',
            qst_is_active: 'A',
            qst_audit_dt: new Date(),
            qb_assigned_to: '0',
            qb_status_fk: '0',
            qba_topic_fk: questionData.qba_topic_fk,
            qba_subject_fk: questionData.qba_subject_fk,
            qba_course_fk: questionData.qba_course_fk,
            qst_type: questionData.qst_type,
            qba_module_fk: questionData.qba_module_fk,
            no_of_question: '0',
            qst_pid: '0',
            qst_audit_by: 'Admin',
            author_name: 'Admin',
            qst_dimension: 'Dimension',
            qst_neg_marks: 0,
            qb_id: qb_id,
            copied_from_repository: 'Y',
            exam_fk: questionData.exam_id,
            exampaper_fk: questionData.exampaper_id,
            qst_request_remarks: questionData.remark,
            qst_request_status: null,
            pub_status: 'A',
            qb_pk: questionData.qb_pk
        }).then(response => { // added by shilpa
            var query = "update culled_qstn_bank set replace_id=" + response.culled_qb_pk + " where exam_fk = " + questionData.exam_id + " and exampaper_fk = " + questionData.exampaper_id + " and culled_qb_pk = " + response.culled_qb_pk;

            sequelize.query(query, { type: sequelize.QueryTypes.UPDATE }).then(parentQues => {

            });
            var culled_arr_alternatives = [];
            for (var i = 1; i <= questionData.qst_no_of_altr; i++) {
                var obj = new Object();
                obj.qta_qst_id = questionData.qb_pk;
                obj.qta_id = questionData.qb_id;
                obj.qta_alt_desc = questionData.qstn_alternatives[i - 1].qta_alt_desc;
                obj.qta_order = i;
                obj.qta_is_corr_alt = questionData.qstn_alternatives[i - 1].qta_is_corr_alt;
                obj.qta_is_active = 'A';
                obj.qta_audit_by = questionData.qst_audit_by;
                obj.qta_audit_dt = questionData.qst_audit_dt;
                obj.exam_fk = questionData.exam_id;
                obj.exampaper_fk = questionData.exampaper_id;
                culled_arr_alternatives.push(obj);
            }

            culled_qstn_alternatives.bulkCreate(culled_arr_alternatives).then(() => {
                res.send({
                    code: 0,
                    message: "success",
                    obj: questionData
                })
            });

        })
    },

    AddparentQuestionInAdmin: function (req, res) {
        importMethods.checkValidUser(req, res);

        var questionData = req.body;
        var qb_id = questionData.qb_id;
        var image = questionData.qbank_image.qbi_image_name
        if (image) {
            questionData.qst_body = questionData.qst_body + '<img src="static/controllers/output/' + image + '">'
        }
        culled_qstn_bank.create({
            qst_lang: 'ENGLISH',
            qst_sub_seq_no: '0',
            qst_body: questionData.qst_body,
            qst_marks: questionData.qst_marks,
            qst_expiry_dt: new Date(),
            qst_no_of_altr: questionData.qst_no_of_altr,
            qst_img_fk: null,
            qst_fk_tpc_pk: '0',
            qst_is_active: 'A',
            qst_audit_dt: new Date(),
            qb_assigned_to: '0',
            qb_status_fk: '0',
            qba_topic_fk: questionData.qba_topic_fk,
            qba_subject_fk: questionData.qba_subject_fk,
            qba_course_fk: questionData.qba_course_fk,
            qst_type: questionData.qst_type,
            qba_module_fk: questionData.qba_module_fk,
            qst_no_of_altr: questionData.numOfAlternatives,
            no_of_question: questionData.no_of_question,
            qst_pid: '0',
            qst_audit_by: 'Admin',
            author_name: 'Admin',
            qst_dimension: 'Dimension',
            qst_neg_marks: 0,
            qb_id: qb_id,
            copied_from_repository: 'Y',
            exam_fk: questionData.exam_id,
            exampaper_fk: questionData.exampaper_id,
            qst_request_remarks: questionData.remark,
            qst_request_status: null,
            pub_status: 'A',
            qb_pk: questionData.qb_pk
        }).then(response => { // added by shilpa
            var query = "update culled_qstn_bank set replace_id=" + response.culled_qb_pk + " where exam_fk = " + questionData.exam_id + " and exampaper_fk = " + questionData.exampaper_id + " and culled_qb_pk = " + response.culled_qb_pk;

            sequelize.query(query, { type: sequelize.QueryTypes.UPDATE }).then(parentQues => {

            });
            res.send({
                code: 0,
                message: "success",
                obj: questionData,
                qb_id: qb_id
            });
        });
    },

    AddchildQuestionInAdmin: function (req, res) {
        importMethods.checkValidUser(req, res);

        var questionData = req.body;

        var copy_qstn_bank_query = "insert into culled_qstn_bank(qb_pk,qst_type, qst_lang,qst_pid,qst_sub_seq_no, qst_body , qst_marks, qst_neg_marks, qst_expiry_dt, " +
            "qst_no_of_altr , qst_remarks , qst_fk_tpc_pk , qst_dimension , qst_is_active , qst_audit_by , " +
            "qst_audit_dt, qb_assigned_to , qb_status_fk , qba_topic_fk  , qba_subject_fk  ,  qba_course_fk  , " +
            "no_of_question, reference_info , calculation_info ,  qb_id ,  qba_module_fk , author_name , " +
            "exam_fk , exampaper_fk , copied_from_repository,pub_status, qst_request_remarks ) " +
            "select qb_pk,qst_type, qst_lang,qst_pid,qst_sub_seq_no, " +
            "case when (qbank_images.qbi_image_name is not null and qbank_images.qbi_image_name <> '') then " +
            "qst_body || ' <img src=\"static/controllers/output/'||qbank_images.qbi_image_name||'\" >'  " +
            "else qst_body end as question_body , " +
            "qst_marks, qst_neg_marks, qst_expiry_dt, " +
            "qst_no_of_altr , qst_remarks , qst_fk_tpc_pk , qst_dimension , qst_is_active , '" + questionData.userName + "' , " +
            "qst_audit_dt, qb_assigned_to , qb_status_fk , qba_topic_fk  , qba_subject_fk  ,  qba_course_fk  , " +
            "no_of_question, reference_info , calculation_info ,  qb_id ,  qba_module_fk , author_name ,"
            + questionData.exam_fk + "," + questionData.exampaper_fk + ",'Y','A', " +
            "'" + questionData.remark + "'" +
            "from qstn_bank left join qbank_images on " +
            "(qstn_bank.qst_img_fk = qbank_images.qbi_pk) " +
            "where qst_pid = " + questionData.qbId + " ";
        var query2 = "select qb_pk from qstn_bank where qst_pid=" + questionData.qbId;


        var copy_qstn_alternative_query = "insert into culled_qstn_alternatives(qta_qst_id, " +
            "qta_id,qta_alt_desc,qta_order,qta_is_corr_alt,qta_is_active,qta_audit_by,qta_audit_dt, " +
            "exam_fk,exampaper_fk) select qta_qst_id,qta_id, " +
            "case when (qbank_images.qbi_image_name is not null and qbank_images.qbi_image_name <> '') then " +
            "qta_alt_desc || ' <img src=\"static/controllers/output/'||qbank_images.qbi_image_name||'\" >' " +
            "else qta_alt_desc end as alternative_body, " +
            "qta_order,qta_is_corr_alt,qta_is_active,qta_audit_by,qta_audit_dt, "
            + questionData.exam_fk + "," + questionData.exampaper_fk +
            " from qstn_alternatives left join qbank_images on " +
            "(qstn_alternatives.qta_img_fk = qbank_images.qbi_pk) " +
            "where qta_qst_id in (select qb_pk from qstn_bank where qst_pid=" + questionData.qbId + ")"; //qb_pk


        sequelize.query(copy_qstn_bank_query).spread((results, metadata) => {

            var query3 = "select no_of_question from qba.qstn_bank  where qb_id = " + questionData.qbId + ""
            sequelize.query(query3, { type: sequelize.QueryTypes.SELECT }).then(response => {
                var update_child = "update culled_qstn_bank set no_of_question=" + response[0].no_of_question + " where exam_fk = " + questionData.exam_fk + " and exampaper_fk = " + questionData.exampaper_fk + " and qb_id = " + questionData.qbId + " ";
                sequelize.query(update_child, { type: sequelize.QueryTypes.UPDATE }).then(responses => {

                });
            });

            sequelize.query(copy_qstn_alternative_query).spread((results2, metadata2) => {
                res.send({
                    code: 0,
                    message: "success"
                })
            })
        })

    },


    AddchildQuestionInvetter: function (req, res) {
        importMethods.checkValidUser(req, res);

        var questionData = req.body;

        var copy_qstn_bank_query = "insert into culled_qstn_bank(qb_pk,qst_type, qst_lang,qst_pid,qst_sub_seq_no, qst_body , qst_marks, qst_neg_marks, qst_expiry_dt, " +
            "qst_no_of_altr , qst_remarks , qst_fk_tpc_pk , qst_dimension , qst_is_active , qst_audit_by , " +
            "qst_audit_dt, qb_assigned_to , qb_status_fk , qba_topic_fk  , qba_subject_fk  ,  qba_course_fk  , " +
            "no_of_question, reference_info , calculation_info ,  qb_id ,  qba_module_fk , author_name , " +
            "exam_fk , exampaper_fk , copied_from_repository,pub_status, qst_request_remarks ) " +
            "select qb_pk,qst_type, qst_lang,qst_pid,qst_sub_seq_no, " +
            "case when (qbank_images.qbi_image_name is not null and qbank_images.qbi_image_name <> '') then " +
            "qst_body || ' <img src=\"static/controllers/output/'||qbank_images.qbi_image_name||'\" >'  " +
            "else qst_body end as question_body , " +
            "qst_marks, qst_neg_marks, qst_expiry_dt, " +
            "qst_no_of_altr , qst_remarks , qst_fk_tpc_pk , qst_dimension , qst_is_active , '" + questionData.userName + "' , " +
            "qst_audit_dt, qb_assigned_to , qb_status_fk , qba_topic_fk  , qba_subject_fk  ,  qba_course_fk  , " +
            "no_of_question, reference_info , calculation_info ,  qb_id ,  qba_module_fk , author_name ,"
            + questionData.exam_fk + "," + questionData.exampaper_fk + ",'Y','A', " +
            "'" + questionData.remark + "'" +
            "from qstn_bank left join qbank_images on " +
            "(qstn_bank.qst_img_fk = qbank_images.qbi_pk) " +
            "where qst_pid = " + questionData.qbId + " ";
        var query2 = "select qb_pk from qstn_bank where qst_pid=" + questionData.qbId;


        var copy_qstn_alternative_query = "insert into culled_qstn_alternatives(qta_qst_id, " +
            "qta_id,qta_alt_desc,qta_order,qta_is_corr_alt,qta_is_active,qta_audit_by,qta_audit_dt, " +
            "exam_fk,exampaper_fk) select qta_qst_id,qta_id, " +
            "case when (qbank_images.qbi_image_name is not null and qbank_images.qbi_image_name <> '') then " +
            "qta_alt_desc || ' <img src=\"static/controllers/output/'||qbank_images.qbi_image_name||'\" >' " +
            "else qta_alt_desc end as alternative_body, " +
            "qta_order,qta_is_corr_alt,qta_is_active,qta_audit_by,qta_audit_dt, "
            + questionData.exam_fk + "," + questionData.exampaper_fk +
            " from qstn_alternatives left join qbank_images on " +
            "(qstn_alternatives.qta_img_fk = qbank_images.qbi_pk) " +
            "where qta_qst_id in (select qb_pk from qstn_bank where qst_pid=" + questionData.qbId + ")"; //qb_pk


        sequelize.query(copy_qstn_bank_query).spread((results, metadata) => {


            sequelize.query(copy_qstn_alternative_query).spread((results2, metadata2) => {

            })
        })
        var query3 = "select no_of_question from qba.qstn_bank  where qb_id = " + questionData.qbId + ""
        sequelize.query(query3, { type: sequelize.QueryTypes.SELECT }).then(response => {
            var update_child = "update culled_qstn_bank set no_of_question=" + response[0].no_of_question + " where exam_fk = " + questionData.exam_fk + " and exampaper_fk = " + questionData.exampaper_fk + " and qb_id = " + questionData.qbId + " ";
            sequelize.query(update_child, { type: sequelize.QueryTypes.UPDATE }).then(responses => {
                res.send({
                    code: 0,
                    message: "success"
                })
            });
        });

    },



    updateReplacedQstRemarksVetter: function (req, res) {

        var updateCulledTable = req.body;
        var query = "select qb_id,qst_type from culled_qstn_bank where exam_fk = " + req.body.exam_fk + "and exampaper_fk = " + req.body.exampaper_fk + "and qb_pk = " + req.body.qb_pk + "";

        sequelize.query(query, { type: sequelize.QueryTypes.SELECT })
            .then(result => {
                var qb_id = result[0].qb_id;
                var qst_type = result[0].qst_type;
                if (qst_type == 'CS') {
                    culled_qstn_bank.update({
                        qst_request_remarks: req.body.qst_request_remarks,
                        qst_request_status: req.body.qst_request_status,
                        qst_is_active: req.body.qst_is_active,
                        qst_audit_by: req.body.username
                    }, {
                        where: {
                            exam_fk: req.body.exam_fk,
                            exampaper_fk: req.body.exampaper_fk,
                            qst_pid: req.body.qb_id
                        }

                    }).then(Status => {
                    });
                }
            });
    },



    saveShortfallRecords: function (req, res) {
        importMethods.checkValidUser(req, res);
        var newQuestionData = req.body;

        if (!newQuestionData.qst_neg_marks) {
            newQuestionData.qst_neg_marks = 0
        }
        culled_qstn_bank.update({
            qst_body: newQuestionData.question,
            qst_neg_marks: newQuestionData.qst_neg_marks,
            qst_no_of_altr: newQuestionData.numOfAlternatives,
            qst_remarks: newQuestionData.remark != '' ? newQuestionData.remark : null,
            calculation_info: newQuestionData.calculations != '' ? newQuestionData.calculations : null,
            reference_info: newQuestionData.reference != '' ? newQuestionData.reference : null,
            qst_audit_by: newQuestionData.userName
        }, {
            where: sequelize.and({ qb_pk: newQuestionData.qb_pk },
                { exam_fk: newQuestionData.exam_fk }, { exampaper_fk: newQuestionData.exampaper_fk })
        }).then(questionUpdate => {

            var arr_alternatives = [];
            for (var i = 1; i <= newQuestionData.numOfAlternatives; i++) {
                var obj = new Object();
                obj.qta_qst_id = newQuestionData.qb_pk;
                obj.qta_id = newQuestionData.qId;
                obj.qta_alt_desc = newQuestionData.alternatives[i - 1].text;
                obj.qta_order = i;
                obj.qta_is_corr_alt = newQuestionData.alternatives[i - 1].isCorrect;
                obj.qta_is_active = 'A';
                obj.qta_audit_by = newQuestionData.userName;
                obj.qta_audit_dt = new Date();
                obj.exam_fk = newQuestionData.exam_fk;
                obj.exampaper_fk = newQuestionData.exampaper_fk;
                arr_alternatives.push(obj);
            }
            culled_qstn_alternatives.bulkCreate(arr_alternatives).then(() => {
                var query = "update qba.qba_summary_admin SET short_fall_qstn = (case when short_fall_qstn >= 1 then short_fall_qstn -1 else short_fall_qstn end ), total_short_fall_question = (case when total_short_fall_question >= 1 then total_short_fall_question - 1 else total_short_fall_question end )where qba_summary_admin.module_fk IN (" + newQuestionData.module_fk + ") and exam_fk = " + newQuestionData.exam_fk + " AND exampaper_fk = " + newQuestionData.exampaper_fk + " AND topic_pk = " + newQuestionData.topicId + ""
                sequelize.query(query, { type: sequelize.QueryTypes.SELECT })
                    .then(shortfallqstn => {
                        res.send({
                            code: 0,
                            message: "success",
                            obj1: shortfallqstn,
                            obj: newQuestionData
                        })
                    });
            });                                           // added by dipika


        });
    },
    saveCSQParentShortfall: function (req, res) {
        importMethods.checkValidUser(req, res);
        var newParentQuestionData = req.body;

        var check = "select case_summary_id_pk as pk from qba_case_summary_admin where short_fall_qstn != 0 and  exampaper_fk = " + newParentQuestionData.exampaper_fk + " and exam_fk =" + newParentQuestionData.exam_fk + " and topic_pk = " + newParentQuestionData.topicId + " order by case_summary_id_pk limit 1"
        sequelize.query(check).then(checkData => {
            var query = "update qba_case_summary_admin set short_fall_qstn = short_fall_qstn -1, child_count = child_count + " + parseInt(newParentQuestionData.summary_no_of_question) + ", summary_marks = summary_marks + " + parseInt(newParentQuestionData.summary_no_of_question) + " where short_fall_qstn != 0 and  exampaper_fk = " + newParentQuestionData.exampaper_fk + " and exam_fk =" + newParentQuestionData.exam_fk + " and topic_pk = " + newParentQuestionData.topicId + " and case_summary_id_pk =" + checkData[0][0].pk;
            sequelize.query(query).then(() => {
                culled_qstn_bank.update({
                    qst_body: newParentQuestionData.question,
                    qst_audit_by: newParentQuestionData.userName,
                    author_name: newParentQuestionData.userName,
                    copied_from_repository: 'N',
                    qba_module_fk: newParentQuestionData.moduleId,
                    qst_request_remarks: 'Newly added Shortfall case'
                }, {
                    where: sequelize.and({ qb_pk: newParentQuestionData.qb_pk },
                        { exam_fk: newParentQuestionData.exam_fk }, { exampaper_fk: newParentQuestionData.exampaper_fk }, { qst_type: newParentQuestionData.qst_type })
                }).then(questionUpdate => {
                    res.send({
                        code: 0,
                        message: "success",
                        obj: questionUpdate
                    })
                })
            });
        })

    },


    saveMCQShortfall: function (req, res) {
        importMethods.checkValidUser(req, res);
        var newParentQuestionData = req.body;

        culled_qstn_bank.update({
            qst_body: newParentQuestionData.question,
            qst_audit_by: newParentQuestionData.userName,
            author_name: newParentQuestionData.userName,
            copied_from_repository: 'N',
            qst_no_of_altr: newParentQuestionData.numOfAlternatives,
            qst_remarks: newParentQuestionData.remark != '' ? newParentQuestionData.remark : null,
            reference_info: newParentQuestionData.reference != '' ? newParentQuestionData.reference : null,
            calculation_info: newParentQuestionData.calculations != '' ? newParentQuestionData.calculations : null
        }, {
            where: sequelize.and({ qb_pk: newParentQuestionData.qb_pk },
                { exam_fk: newParentQuestionData.examPk }, { exampaper_fk: newParentQuestionData.exampaper_fk }, { qst_type: newParentQuestionData.qst_type })
        }).then(questionUpdate => {
            var culled_arr_alternatives = [];
            for (var i = 1; i <= newParentQuestionData.numOfAlternatives; i++) {
                var obj = new Object();
                obj.qta_qst_id = newParentQuestionData.qb_pk;
                obj.qta_id = newParentQuestionData.qId;
                obj.qta_alt_desc = newParentQuestionData.alternatives[i - 1].text;
                obj.qta_order = i;
                obj.qta_is_corr_alt = newParentQuestionData.alternatives[i - 1].isCorrect;
                obj.qta_is_active = 'A';
                obj.qta_audit_by = newParentQuestionData.userName;
                obj.qta_audit_dt = new Date();
                obj.exam_fk = newParentQuestionData.examPk;
                obj.exampaper_fk = newParentQuestionData.exampaper_fk;
                culled_arr_alternatives.push(obj);
            }
            culled_qstn_alternatives.bulkCreate(culled_arr_alternatives).then(() => {
                var update_query = "update culled_qstn_bank set qst_request_remarks = 'Newly added Shortfall MCQ ' where qb_pk =" + newParentQuestionData.qb_pk + " and exampaper_fk = " + newParentQuestionData.exampaper_fk + " and exam_fk =" + newParentQuestionData.examPk;
                sequelize.query(update_query).then(() => { })
                var query = "update qba.qba_summary_admin SET short_fall_qstn = (case when short_fall_qstn >= 1 then short_fall_qstn -1 else short_fall_qstn end ), total_short_fall_question = (case when total_short_fall_question >= 1 then total_short_fall_question - 1 else total_short_fall_question end )where qba_summary_admin.module_fk IN (" + newParentQuestionData.moduleId + ") and exam_fk = " + newParentQuestionData.examPk + " AND exampaper_fk = " + newParentQuestionData.exampaper_fk + " AND topic_pk = " + newParentQuestionData.topicId + "";
                sequelize.query(query).then(() => {
                    res.send({
                        code: 0,
                        message: "success",
                        obj: questionUpdate,
                        questionData: newParentQuestionData
                    })
                })
            });
        });

    },


    saveCSQChildShortfall: function (req, res) {
        importMethods.checkValidUser(req, res);
        var newChildQuestionData = req.body;

        if (!newChildQuestionData.negativeMarks) {
            newChildQuestionData.negativeMarks = 0
        }

        sequelize.query("select nextval('qb_id_val') as val", { type: sequelize.QueryTypes.SELECT })
            .then(next_qb_id => {
                var qb_id = next_qb_id[0].val;
                qstn_bank.create({
                    qst_type: 'CS',
                    qst_lang: 'ENGLISH',
                    qst_pid: newChildQuestionData.parentId,
                    qst_sub_seq_no: '0',
                    qst_body: newChildQuestionData.question,
                    qst_marks: newChildQuestionData.marks,
                    qst_neg_marks: newChildQuestionData.negativeMarks,
                    qst_expiry_dt: new Date(),
                    qst_no_of_altr: newChildQuestionData.numOfAlternatives,
                    qst_img_fk: null,
                    qst_remarks: newChildQuestionData.remark != '' ? newChildQuestionData.remark : null,
                    qst_fk_tpc_pk: '0',
                    qst_dimension: 'Dimension',
                    qst_is_active: 'A',
                    qst_audit_by: newChildQuestionData.userName,
                    author_name: newChildQuestionData.userName,
                    qst_audit_dt: new Date(),
                    qb_assigned_to: '0',
                    qb_status_fk: '0',
                    qba_topic_fk: newChildQuestionData.topicId,
                    qba_subject_fk: newChildQuestionData.subjectId,
                    qba_course_fk: newChildQuestionData.courseId,
                    reference_info: newChildQuestionData.reference != '' ? newChildQuestionData.reference : null,
                    calculation_info: newChildQuestionData.calculations != '' ? newChildQuestionData.calculations : null,
                    qb_id: qb_id,
                    qba_module_fk: newChildQuestionData.moduleId
                }).then(question => {
                    culled_qstn_bank.create({
                        qst_lang: 'ENGLISH',
                        qst_sub_seq_no: '0',
                        qst_body: newChildQuestionData.question,
                        qst_marks: newChildQuestionData.marks,
                        qst_expiry_dt: new Date(),
                        qst_fk_tpc_pk: '0',
                        qst_is_active: 'A',
                        qst_audit_dt: new Date(),
                        qst_no_of_altr: newChildQuestionData.numOfAlternatives,
                        qb_assigned_to: '0',
                        qb_status_fk: '0',
                        qba_topic_fk: newChildQuestionData.topicId,
                        qba_subject_fk: newChildQuestionData.subjectId,
                        qba_course_fk: newChildQuestionData.courseId,
                        qst_type: 'CS',
                        qba_module_fk: newChildQuestionData.moduleId,
                        qst_pid: newChildQuestionData.parentId,
                        qst_audit_by: newChildQuestionData.userName,
                        author_name: newChildQuestionData.userName,
                        qst_neg_marks: newChildQuestionData.negativeMarks,
                        qb_id: qb_id,
                        copied_from_repository: 'Y',
                        exam_fk: newChildQuestionData.examFk,
                        exampaper_fk: newChildQuestionData.exampaperFk,
                        qb_pk: question.qb_pk,
                        qst_remarks: newChildQuestionData.remark != 0 ? newChildQuestionData.remark : null,
                        reference_info: newChildQuestionData.reference != 0 ? newChildQuestionData.reference : null,
                        calculation_info: newChildQuestionData.calculations != 0 ? newChildQuestionData.calculations : null,
                        no_of_question: '0',
                        pub_status: 'A',
                        qst_dimension: 'Dimension'
                    }).then(result => {
                        var query = "update culled_qstn_bank set replace_id=" + result.culled_qb_pk + " where exam_fk = " + newChildQuestionData.examFk + " and exampaper_fk = " + newChildQuestionData.exampaperFk + " and culled_qb_pk = " + result.culled_qb_pk;

                        sequelize.query(query, { type: sequelize.QueryTypes.UPDATE }).then(parentQues => {

                        });
                        var arr_alternatives = [];
                        for (var i = 1; i <= newChildQuestionData.numOfAlternatives; i++) {
                            var obj = new Object();
                            obj.qta_qst_id = result.qb_pk;
                            obj.qta_id = result.qb_id;
                            obj.qta_alt_desc = newChildQuestionData.alternatives[i - 1].text;
                            obj.qta_order = i;
                            obj.qta_is_corr_alt = newChildQuestionData.alternatives[i - 1].isCorrect;
                            obj.qta_is_active = 'A';
                            obj.qta_audit_by = newChildQuestionData.userName;
                            obj.qta_audit_dt = new Date();
                            obj.exam_fk = newChildQuestionData.examFk;
                            obj.exampaper_fk = newChildQuestionData.exampaperFk;
                            arr_alternatives.push(obj);
                        }
                        culled_qstn_alternatives.bulkCreate(arr_alternatives).then(() => {
                            res.send({
                                code: 0,
                                message: "success",
                                obj: newChildQuestionData
                            })
                        });

                    });
                });
            });

    },

    updateChildCountShortfall: function (req, res) {
        importMethods.checkValidUser(req, res);
        var parentQuestion = req.body;
        var query = "update culled_qstn_bank set no_of_question = no_of_question + 1 where qb_pk =  " + parentQuestion.qb_pk +
            " and exam_fk = " + parentQuestion.exam_fk + " and exampaper_fk = " + parentQuestion.exampaper_fk;

        sequelize.query(query, { type: sequelize.QueryTypes.UPDATE }).then(parentQues => {

            res.send({
                code: 0,
                message: "success",
                obj: parentQues
            })

        })
    },

    updateChildCountCaseShortfall: function (req, res) {
        importMethods.checkValidUser(req, res);
        var parentQuestion = req.body;
        var query = "update culled_qstn_bank set no_of_question = no_of_question + 1 where qb_pk =  " + parentQuestion.qb_pk +
            " and exam_fk = " + parentQuestion.exam_fk + " and exampaper_fk = " + parentQuestion.exampaper_fk;

        sequelize.query(query, { type: sequelize.QueryTypes.UPDATE }).then(parentQues => {

            res.send({
                code: 0,
                message: "success",
                obj: parentQues
            })

        })
    },

    loadallcount: function (req, res) {
        importMethods.checkValidUser(req, res);
        var parentQuestion = req.body;
        var count_data = [];
        var query = "SELECT count(*) AS count ,sum(qst_marks) as total_marks FROM qba.culled_qstn_bank AS culled_qstn_bank WHERE culled_qstn_bank.qba_module_fk IN (" + parentQuestion.module_id + ") AND culled_qstn_bank.exam_fk = " + parentQuestion.e_id + " AND culled_qstn_bank.exampaper_fk = " + parentQuestion.e_pk + " AND culled_qstn_bank.qst_is_active = 'A' AND (culled_qstn_bank.qst_type = 'M'OR (culled_qstn_bank.qst_type = 'CS' AND culled_qstn_bank.qst_pid != '0')) AND culled_qstn_bank.qst_lang = 'ENGLISH' AND culled_qstn_bank.qst_request_remarks != 'Removed from QB'";


        sequelize.query(query, { type: sequelize.QueryTypes.UPDATE }).then(result => {
            count_data.push(result[0].count);
            var query1 = "select total_qts,total_marks,case_question,case_marks from qba.exam_master where exam_pk = " + parentQuestion.e_id + "";
            sequelize.query(query1, { type: sequelize.QueryTypes.UPDATE }).then(result1 => {
                count_data.push(result1[0].count);
                res.send({
                    code: 0,
                    message: "success",
                    obj: result,
                    obj1: result1
                })
            })
        })
    },


    updateChildCountInAdmin: function (req, res) {
        importMethods.checkValidUser(req, res);
        var parentQuestion = req.body;
        var query = "update culled_qstn_bank set no_of_question = no_of_question + 1 where qb_pk =  " + parentQuestion.qb_pk +
            " and exam_fk = " + parentQuestion.exam_fk + " and exampaper_fk = " + parentQuestion.exampaper_fk;

        sequelize.query(query, { type: sequelize.QueryTypes.UPDATE }).then(parentQues => {

            res.send({
                code: 0,
                message: "success",
                obj: parentQues
            })

        })
    },

    copyQuestionsInCulledTable: function (req, res) {
        importMethods.checkValidUser(req, res);
        var finalId = req.body;
        var maxChildLimit = finalId.maxChildLimit;
        maxChildLimit = (maxChildLimit != undefined) ? maxChildLimit : 0;
        var remarks = finalId.qst_request_remarks;
        var addby = finalId.userName;
        remarks = (remarks != null) ? remarks : null;
        var copy_qstn_bank_query = "insert into culled_qstn_bank(qb_pk,qst_type, qst_lang,qst_pid,qst_sub_seq_no, qst_body , qst_marks, qst_neg_marks, qst_expiry_dt, " +
            "qst_no_of_altr , qst_remarks , qst_fk_tpc_pk , qst_dimension , qst_is_active , qst_audit_by , " +
            "qst_audit_dt, qb_assigned_to , qb_status_fk , qba_topic_fk  , qba_subject_fk  ,  qba_course_fk  , " +
            "no_of_question, reference_info , calculation_info ,  qb_id ,  qba_module_fk , author_name , " +
            "exam_fk , exampaper_fk , copied_from_repository,pub_status, qst_request_remarks ) " +
            "select qb_pk,qst_type, qst_lang,qst_pid,qst_sub_seq_no, " +
            "case when (qbank_images.qbi_image_name is not null and qbank_images.qbi_image_name <> '') then " +
            "concat(qst_body, ' <img src=\"static/controllers/output/'||qbank_images.qbi_image_name||'\" style=\"width:'||qbank_images.image_width||'px;height:'||qbank_images.image_height||'px\" >')  " +
            "else qst_body end as question_body , " +
            "qst_marks, qst_neg_marks, qst_expiry_dt, " +
            "qst_no_of_altr , qst_remarks , qst_fk_tpc_pk , qst_dimension , qst_is_active , '" + addby + "' , " +
            "qst_audit_dt, qb_assigned_to , qb_status_fk , qba_topic_fk  , qba_subject_fk  ,  qba_course_fk  , " +
            "no_of_question, reference_info , calculation_info ,  qb_id ,  qba_module_fk , author_name ,"
            + finalId.examId + "," + finalId.examPaperId + ",'Y','A', " +
            "'" + remarks + "' " +
            "from qstn_bank left join qbank_images on " +
            "(qstn_bank.qst_img_fk = qbank_images.qbi_pk) " +
            "where qb_id in (select qb_id from qstn_bank where qb_pk in (" + finalId.finalQstId + ")) " +
            " or qb_id in ( " +
            "SELECT x2.qb_id FROM (SELECT x.qst_pid,x.qb_id, x.qb_pk, x.r FROM (SELECT ROW_NUMBER() OVER (PARTITION BY qst_pid ORDER BY qb_pk) AS r, t.qst_pid,t.qb_id, t.qb_pk " +
            "FROM qstn_bank t " +
            "where qst_pid in (select qb_id from qstn_bank where qb_pk in(" + finalId.finalQstId + ")) " +
            ") x WHERE qst_pid <> 0 ) AS x2 " +
            ") order by qb_id "; //qb_id
        var copy_qstn_alternative_query = "insert into culled_qstn_alternatives(qta_qst_id, qta_id,qta_alt_desc,qta_order,qta_is_corr_alt,qta_is_active,qta_audit_by,qta_audit_dt, exam_fk,exampaper_fk) select qta_qst_id,qta_id,case when (qbank_images.qbi_image_name is not null and qbank_images.qbi_image_name <> '' and qta_alt_desc is not NULL) then qta_alt_desc || ' <img src=\"static/controllers/output/'||qbank_images.qbi_image_name||'\" style=\"width:'||qbank_images.image_width||'px;height:'||qbank_images.image_height||'px;\" >' when (qta_alt_desc is NULL ) then '<img src=\"static/controllers/output/'||qbank_images.qbi_image_name||'\" >'	else qta_alt_desc end as alternative_body, qta_order,qta_is_corr_alt,qta_is_active,qta_audit_by,qta_audit_dt," + finalId.examId + "," + finalId.examPaperId + " from qstn_alternatives left join qbank_images on (qstn_alternatives.qta_img_fk = qbank_images.qbi_pk)where qta_id in (select qb_id from qstn_bank where qb_pk in (" + finalId.finalQstId + "))  or qta_id in ( SELECT x2.qb_id FROM (SELECT x.qst_pid,x.qb_id, x.qb_pk, x.r FROM (SELECT ROW_NUMBER() OVER (PARTITION BY qst_pid ORDER BY qb_pk) AS r, t.qst_pid,t.qb_id, t.qb_pk FROM qstn_bank t where qst_pid in (select qb_id from qstn_bank where qb_pk in (" + finalId.finalQstId + ")) ) x WHERE qst_pid <> 0) AS x2 )";

        sequelize.query(copy_qstn_bank_query, { type: sequelize.QueryTypes.UPDATE }).then(parentQuess => {
            if (finalId.examId == undefined) {
                finalId.examId = null
            }
            if (finalId.examPaperId == undefined) {
                finalId.examPaperId = null
            }
            if (parentQuess.culled_qb_pk == undefined) {
                parentQuess.culled_qb_pk = null
            }

            var query = "update culled_qstn_bank set replace_id=" + parentQuess.culled_qb_pk + " where exam_fk = " + finalId.examId + " and exampaper_fk = " + finalId.examPaperId + " and culled_qb_pk = " + parentQuess.culled_qb_pk;

            sequelize.query(query, { type: sequelize.QueryTypes.UPDATE }).then(parentQues => {

            });

            sequelize.query(copy_qstn_alternative_query).spread((results2, metadata2) => {
                res.send({
                    code: 0,
                    message: "success"
                })
            })
        })
    },

    updateReplaceCaseSummary: function (req, res) {
        importMethods.checkValidUser(req, res);
        var data = req.body
        var check = "select case_summary_id_pk as pk from qba_case_summary_admin where exam_fk = " + data.exam_fk + " and exampaper_fk =" + data.exampaper_fk + " and topic_pk = " + data.qba_topic_master.qba_topic_pk + " order by case_summary_id_pk limit 1"
        sequelize.query(check).then(checkData => {
            var query = "update qba_case_summary_admin set parent_count = parent_count + 1, child_count = child_count + " + parseInt(data.no_of_question) + ", summary_marks = summary_marks + " + parseFloat(data.qst_marks) + " where exam_fk = " + data.exam_fk + " and exampaper_fk =" + data.exampaper_fk + " and topic_pk = " + data.qba_topic_master.qba_topic_pk + " and case_summary_id_pk =" + checkData[0][0].pk;
            sequelize.query(query, { type: sequelize.QueryTypes.UPDATE }).then(responseData => {
                res.send({
                    code: 0,
                    message: 'success',
                    obj: responseData
                })
            })
        })
    },

    updateReplaceMCQSummary: function (req, res) {
        importMethods.checkValidUser(req, res);
        var data = req.body
        var check = "select summary_id_pk as pk from qba_summary_admin where exam_fk = " + data.exam_fk + " and exampaper_fk =" + data.exampaper_fk + " and topic_pk = " + data.qba_topic_master.qba_topic_pk + " order by summary_id_pk limit 1"
        sequelize.query(check).then(checkData => {
            var query = "update qba_summary_admin set summary_question = summary_question + 1, summary_marks = summary_marks + " + parseFloat(data.qst_marks) + " where exam_fk = " + data.exam_fk + " and exampaper_fk =" + data.exampaper_fk + " and topic_pk = " + data.qba_topic_master.qba_topic_pk + " and summary_id_pk = " + checkData[0][0].pk;
            sequelize.query(query, { type: sequelize.QueryTypes.UPDATE }).then(responseData => {
                res.send({
                    code: 0,
                    message: 'success',
                    obj: responseData
                })
            })
        })
    },

    insertparentandchildInAdmin: function (req, res) {
        importMethods.checkValidUser(req, res);
        var finalId = req.body;
        var maxChildLimit = finalId.maxChildLimit;
        maxChildLimit = (maxChildLimit != undefined) ? maxChildLimit : 0;
        var remarks = finalId.qst_request_remarks;
        var addby = finalId.userName;
        remarks = (remarks != null) ? remarks : null;
        var copy_qstn_bank_query = "insert into culled_qstn_bank(qb_pk,qst_type, qst_lang,qst_pid,qst_sub_seq_no, qst_body , qst_marks, qst_neg_marks, qst_expiry_dt, " +
            "qst_no_of_altr , qst_remarks , qst_fk_tpc_pk , qst_dimension , qst_is_active , qst_audit_by , " +
            "qst_audit_dt, qb_assigned_to , qb_status_fk , qba_topic_fk  , qba_subject_fk  ,  qba_course_fk  , " +
            "no_of_question, reference_info , calculation_info ,  qb_id ,  qba_module_fk , author_name , " +
            "exam_fk , exampaper_fk , copied_from_repository,pub_status, qst_request_remarks ) " +
            "select qb_pk,qst_type, qst_lang,qst_pid,qst_sub_seq_no, " +
            "case when (qbank_images.qbi_image_name is not null and qbank_images.qbi_image_name <> '') then " +
            "qst_body || ' <img src=\"static/controllers/output/'||qbank_images.qbi_image_name||'\" >'  " +
            "else qst_body end as question_body , " +
            "qst_marks, qst_neg_marks, qst_expiry_dt, " +
            "qst_no_of_altr , qst_remarks , qst_fk_tpc_pk , qst_dimension , qst_is_active , '" + addby + "' , " +
            "qst_audit_dt, qb_assigned_to , qb_status_fk , qba_topic_fk  , qba_subject_fk  ,  qba_course_fk  , " +
            "no_of_question, reference_info , calculation_info ,  qb_id ,  qba_module_fk , author_name ,"
            + finalId.examId + "," + finalId.examPaperId + ",'Y','A', " +
            "'" + remarks + "' " +
            "from qstn_bank left join qbank_images on " +
            "(qstn_bank.qst_img_fk = qbank_images.qbi_pk) " +
            "where qb_id in (select qb_id from qstn_bank where qb_pk in (" + finalId.finalQstId + ")) " +
            " or qb_id in ( " +
            "SELECT x2.qb_id FROM (SELECT x.qst_pid,x.qb_id, x.qb_pk, x.r FROM (SELECT ROW_NUMBER() OVER (PARTITION BY qst_pid ORDER BY qb_pk) AS r, t.qst_pid,t.qb_id, t.qb_pk " +
            "FROM qstn_bank t " +
            "where qst_pid in (select qb_id from qstn_bank where qb_pk in(" + finalId.finalQstId + ")) " +
            ") x WHERE qst_pid <> 0 AND    x.r <= " + maxChildLimit + " ) AS x2 " +
            ") order by qb_id ";

        var copy_qstn_alternative_query = "insert into culled_qstn_alternatives(qta_qst_id, " +
            "qta_id,qta_alt_desc,qta_order,qta_is_corr_alt,qta_is_active,qta_audit_by,qta_audit_dt, " +
            "exam_fk,exampaper_fk) select qta_qst_id,qta_id, " +
            "case when (qbank_images.qbi_image_name is not null and qbank_images.qbi_image_name <> '') then " +
            "qta_alt_desc || ' <img src=\"static/controllers/output/'||qbank_images.qbi_image_name||'\" >' " +
            "else qta_alt_desc end as alternative_body, " +
            "qta_order,qta_is_corr_alt,qta_is_active,qta_audit_by,qta_audit_dt, "
            + finalId.examId + "," + finalId.examPaperId +
            " from qstn_alternatives left join qbank_images on " +
            "(qstn_alternatives.qta_img_fk = qbank_images.qbi_pk) " +
            "where qta_id in (select qb_id from qstn_bank where qb_pk in (" + finalId.finalQstId + ")) " +
            " or qta_id in ( " +
            "SELECT x2.qb_id FROM (SELECT x.qst_pid,x.qb_id, x.qb_pk, x.r FROM (SELECT ROW_NUMBER() OVER (PARTITION BY qst_pid ORDER BY qb_pk) AS r, t.qst_pid,t.qb_id, t.qb_pk " +
            "FROM qstn_bank t " +
            "where qst_pid in (select qb_id from qstn_bank where qb_pk in(" + finalId.finalQstId + ")) " +
            ") x WHERE qst_pid <> 0 AND    x.r <= " + maxChildLimit + " ) AS x2 " +
            ") ";


        sequelize.query(copy_qstn_bank_query).spread((results, metadata) => {

            sequelize.query(copy_qstn_alternative_query).spread((results2, metadata2) => {
                res.send({
                    code: 0,
                    message: "success"
                })
            })
        })
    },

    loadCaseQuestionCullingReport: function (req, res) {
        var count_marks = 0;
        var course_fk = req.body.course;
        var subject_fk = req.body.subject;
        var e_pk = req.body.e_pk
        // var admin_e_pk = req.body.admin_e_pk
        var str = ""
        /*if (admin_e_pk[0] != '0') {
            str = " and qst_pid in(select qb_id from qba.qstn_bank where"+ 
            " qb_pk:: text  in ( select (case when published_qb_pk is null then unnest(exam_qb_pk) else "+
            " unnest(published_qb_pk) end) from qba.qba_exam_paper where exampaper_pk in (" + admin_e_pk + "))) "
        }*/
        var query = "select  coalesce(qba_topic_pk,qba_topic_pk1) topic_pk,coalesce(qba_topic_master.qba_module_fk,qba_module_fk1) module_fk,coalesce(topic_name,topic_name1) topic_name,coalesce(qba_topic_code,qba_topic_code1) qba_topic_code, " +
            " coalesce(qst_marks,qst_marks1) qst_marks ,  qst_pid as parent_count, child_count  from  (select count(qst_pid) as qst_pid,child_count,qst_marks,qba_topic_fk," +
            " qba_module_fk,qba_course_fk,qba_subject_fk,qst_lang,qst_type,qst_is_active from (SELECT count (qb_pk) child_count,qst_marks,qba_topic_fk,qba_module_fk,qst_pid," +
            " qba_course_fk,qba_subject_fk,qst_lang,qst_type,qst_is_active FROM qba.qstn_bank where qst_lang = 'ENGLISH' and qst_pid!=0 and qst_type='CS' and qst_is_active ='A'" +
            " and qst_pid not in(select qb_id from qba.qstn_bank where" +
            " qb_pk:: text  in ( select (case when published_qb_pk is null then unnest(exam_qb_pk) else " +
            " unnest(published_qb_pk) end) from qba.qba_exam_paper where exampaper_pk in (" + e_pk + "))) " + str +
            " GROUP BY qst_marks,qba_topic_fk,qst_pid,qba_module_fk,qba_course_fk,qba_subject_fk,qst_lang,qst_type,qst_is_active having " +
            " count(qst_pid)>1  order by qst_marks) a group by qst_marks,qba_topic_fk,child_count,qba_module_fk,qba_course_fk,qba_subject_fk," +
            " qst_lang,qst_type,qst_is_active order by qst_marks) qstn_bank " +
            " inner join qba.qba_topic_master on (qba_topic_pk=qba_topic_fk) and qstn_bank.qba_course_fk=" + course_fk +
            " And qstn_bank.qba_subject_fk=" + subject_fk + " and qst_is_active ='A' and qst_lang = 'ENGLISH' and qst_type= 'CS' " +
            " and qst_pid <> 0 right join (SELECT * FROM (SELECT DISTINCT qba_topic_pk qba_topic_pk1,qba_topic_master.qba_module_fk qba_module_fk1,topic_name topic_name1,qba_topic_code qba_topic_code1 " +
            " FROM qba.qba_topic_master INNER JOIN qba.qstn_bank ON (qba_topic_pk = qba_topic_fk and qst_lang = 'ENGLISH') WHERE qstn_bank.qba_course_fk = " + course_fk +
            " AND qstn_bank.qba_subject_fk = " + subject_fk + " and qst_is_active ='A') a " +
            " INNER JOIN (SELECT DISTINCT qst_marks qst_marks1 FROM qba.qstn_bank where qst_lang = 'ENGLISH' and qst_type= 'CS' and qst_pid <> 0 ) b ON 1 = 1 ) b  on  topic_name = topic_name1 " +
            " inner join qba.qba_module_mstr on (qba_module_pk = qba.qba_topic_master.qba_module_fk) and   qst_marks = qst_marks1 " +
            " group by qba_topic_pk,qba_topic_pk1,qba_module_fk1,topic_name,qba_topic_code,qst_pid,qst_marks,topic_name1,qba_topic_code1,qst_marks1,child_count, qba.qba_module_mstr.module_name " +
            " order by qba.qba_module_mstr.module_name, qba_topic_code,child_count desc, 5,2,3,1 ,3, 4";

        var countQuery = "select distinct qst_marks as qst_count from qstn_bank " +
            " where qst_type='CS' and qst_pid <> 0 and qst_lang='ENGLISH'";
        sequelize.query(countQuery, { type: sequelize.QueryTypes.SELECT })
            .then(function (count) {
                if (count.length > 0) {
                    count_marks = count[0].qst_count;

                    sequelize.query(query, { type: sequelize.QueryTypes.SELECT })
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
                                        case_marks_count: []
                                    };
                                    topic.case_marks_count.push({
                                        case_marks: topicData[i].qst_marks,
                                        case_count_questions: topicData[i].parent_count,
                                        case_count_child_questions: topicData[i].child_count,
                                        parent_userCount: 0,
                                        child_userCount: 0
                                    })
                                    topicDataList.push(topic);
                                }

                                res.send({
                                    code: 0,
                                    message: "Data Found",
                                    data: { case_topicList: topicDataList, case_marksCnt: count }
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

    loadAdminQuestions: function (req, res) {
        importMethods.checkValidUser(req, res);
        var start = req.body.off;
        var end = req.body.lim;
        var exam_pk = req.body.exam_fk;
        var exampaper_pk = req.body.examPaper;
        var language = req.body.language;
        var paginationCondition = "";
        var status = req.body.es; // added by shilpa exam status

        if (!(isNaN(end) && end == 'ALL')) {
            paginationCondition = "where  dr between " + start + " and  " + end;
        }
        if (status == 'N') {
            var query = "WITH d1 AS ( SELECT DISTINCT *, culled_qstn_alternatives.qta_is_corr_alt, alterimage.qbi_image_name as aimage, culled_qstn_alternatives.qta_alt_desc, now() AS CURRENT_TIME FROM ( SELECT replace_id, log_count, total_weightage, no_of_question, un_id, qb_pk, qba_topic_fk, qba_subject_pk, qba_course_pk, qba_module_pk, qba_course_name, subject_name, module_name, topic_name, qba_topic_code, qst_marks, qst_neg_marks, qst_lang, qst_type, qst_pid, qst_body, qst_no_of_altr, qst_remarks, qst_request_remarks, calculation_info, reference_info, qst_is_active, qst_audit_by, qst_audit_dt, culled_qstn_bank.qb_id, ( CASE WHEN culled_qstn_bank.qst_type='CS' AND culled_qstn_bank.qst_pid > 0 THEN culled_qstn_bank.qst_pid :: varchar || '.' || lpad(culled_qstn_bank.qb_id :: varchar,8,'0')::varchar ELSE culled_qstn_bank.qb_id :: varchar END ):: numeric(16, 10) as qb_id1, culled_qstn_bank.exam_fk AS culled_exam_fk, culled_qstn_bank.exampaper_fk AS culled_exampaper_fk, culled_qb_pk, copied_from_repository FROM ( SELECT culled_qb_pk un_id, * FROM qba.culled_qstn_bank a WHERE ( CASE WHEN qst_type = 'CS' AND qst_pid > 0 THEN 1 ELSE 2 END ) = 2 UNION ALL SELECT a.culled_qb_pk un_id, b.* FROM qba.culled_qstn_bank a INNER JOIN qba.culled_qstn_bank b ON a.qst_lang = b.qst_lang AND a.qb_id = b.qst_pid AND a.exampaper_fk = b.exampaper_fk WHERE a.qst_type = 'CS' AND a.qst_pid = 0 ) culled_qstn_bank INNER JOIN qba.qba_topic_master ON ( qba_topic_master.qba_topic_pk = culled_qstn_bank.qba_topic_fk ) INNER JOIN qba.qba_module_mstr ON ( qba_module_mstr.qba_module_pk = qba_topic_master.qba_module_fk ) INNER JOIN qba.qba_subject_master ON ( qba_subject_master.qba_subject_pk = qba_module_mstr.qba_subject_fk ) INNER JOIN qba.qba_course_master ON ( qba_course_master.qba_course_pk = qba_subject_master.qba_course_fk ) LEFT JOIN ( SELECT SUM(cu.qst_marks) total_weightage, MAX(cu.qst_pid) qstpid FROM qba.culled_qstn_bank cu WHERE cu.exam_fk = " + exam_pk + " AND cu.exampaper_fk = " + exampaper_pk + " AND cu.qst_lang = '" + language + "' and cu.pub_status = 'A' and cu.qst_is_active = 'A' GROUP BY cu.qst_pid HAVING (cu.qst_pid)> 1 ) tw ON ( culled_qstn_bank.qb_id = tw.qstpid ) LEFT JOIN ( SELECT old_qta_fk log_count, qb_id, exam_fk, exampaper_fk FROM qba.culled_qstn_alternatives_log WHERE qta_log_pk IN ( SELECT MAX(qta_log_pk) FROM qba.culled_qstn_alternatives_log WHERE exam_fk = " + exam_pk + " AND exampaper_fk = " + exampaper_pk + " AND status = 'Answer' GROUP BY qb_id ) ) log ON ( log.qb_id = culled_qstn_bank.qb_id AND log.exam_fk = " + exam_pk + " AND log.exampaper_fk = " + exampaper_pk + " ) WHERE qst_is_active = 'A' AND pub_status = 'A' AND culled_qstn_bank.exam_fk = " + exam_pk + " AND culled_qstn_bank.exampaper_fk = " + exampaper_pk + " AND qst_lang = '" + language + "' ORDER BY module_name, qba_topic_code, qst_marks, qb_id ) a LEFT JOIN qba.culled_qstn_alternatives ON ( culled_qstn_alternatives.qta_qst_id = a.qb_pk AND culled_qstn_alternatives.qta_id = a.qb_id AND culled_qstn_alternatives.exam_fk = " + exam_pk + " AND culled_qstn_alternatives.exampaper_fk = " + exampaper_pk + " ) left join qba.qbank_images alterimage on ( alterimage.qbi_pk = culled_qstn_alternatives.qta_img_fk ) WHERE qst_type = 'CS' ORDER BY module_name, topic_name, qst_type DESC, qst_marks, qb_id1 ), d2 AS ( SELECT * FROM d1 ORDER BY module_name, topic_name, qst_type, qb_id ), d3 AS ( SELECT DISTINCT *, culled_qstn_alternatives.qta_is_corr_alt, alterimage.qbi_image_name as aimage, culled_qstn_alternatives.qta_alt_desc, now() AS CURRENT_TIME FROM ( SELECT replace_id, log_count, total_weightage, no_of_question, un_id, qb_pk, qba_topic_fk, qba_subject_pk, qba_course_pk, qba_module_pk, qba_course_name, subject_name, module_name, topic_name, qba_topic_code, qst_marks, qst_neg_marks, qst_lang, qst_type, qst_pid, qst_body, qst_no_of_altr, qst_remarks, qst_request_remarks, calculation_info, reference_info, qst_is_active, qst_audit_by, qst_audit_dt, culled_qstn_bank.qb_id,( CASE WHEN culled_qstn_bank.qst_type='CS' AND culled_qstn_bank.qst_pid > 0 THEN culled_qstn_bank.qst_pid :: varchar || '.' || lpad(culled_qstn_bank.qb_id :: varchar,8,'0')::varchar ELSE culled_qstn_bank.qb_id :: varchar END ):: numeric(16, 10) as qb_id1, culled_qstn_bank.exam_fk AS culled_exam_fk, culled_qstn_bank.exampaper_fk AS culled_exampaper_fk, culled_qb_pk, copied_from_repository FROM ( SELECT culled_qb_pk un_id, * FROM qba.culled_qstn_bank a WHERE ( CASE WHEN qst_type = 'CS' AND qst_pid > 0 THEN 1 ELSE 2 END ) = 2 UNION ALL SELECT a.culled_qb_pk un_id, b.* FROM qba.culled_qstn_bank a INNER JOIN qba.culled_qstn_bank b ON a.qst_lang = b.qst_lang AND a.qb_id = b.qst_pid AND a.exampaper_fk = b.exampaper_fk WHERE a.qst_type = 'CS' AND a.qst_pid = 0 ) culled_qstn_bank INNER JOIN qba.qba_topic_master ON ( qba_topic_master.qba_topic_pk = culled_qstn_bank.qba_topic_fk ) INNER JOIN qba.qba_module_mstr ON ( qba_module_mstr.qba_module_pk = qba_topic_master.qba_module_fk ) INNER JOIN qba.qba_subject_master ON ( qba_subject_master.qba_subject_pk = qba_module_mstr.qba_subject_fk ) INNER JOIN qba.qba_course_master ON ( qba_course_master.qba_course_pk = qba_subject_master.qba_course_fk ) LEFT JOIN ( SELECT SUM(cu.qst_marks) total_weightage, MAX(cu.qst_pid) qstpid FROM qba.culled_qstn_bank cu WHERE cu.exam_fk = " + exam_pk + " AND cu.exampaper_fk = " + exampaper_pk + " AND cu.qst_lang = '" + language + "' and cu.pub_status='A' and cu.qst_is_active = 'A' GROUP BY cu.qst_pid HAVING (cu.qst_pid)> 1 ) tw ON ( culled_qstn_bank.qb_id = tw.qstpid ) LEFT JOIN ( SELECT old_qta_fk log_count, qb_id, exam_fk, exampaper_fk FROM qba.culled_qstn_alternatives_log WHERE qta_log_pk IN ( SELECT MAX(qta_log_pk) FROM qba.culled_qstn_alternatives_log WHERE exam_fk = " + exam_pk + " AND exampaper_fk = " + exampaper_pk + " AND status = 'Answer' GROUP BY qb_id ) ) log ON ( log.qb_id = culled_qstn_bank.qb_id AND log.exam_fk = " + exam_pk + " AND log.exampaper_fk = " + exampaper_pk + " ) WHERE qst_is_active = 'A' AND pub_status = 'A' AND culled_qstn_bank.exam_fk = " + exam_pk + " AND culled_qstn_bank.exampaper_fk = " + exampaper_pk + " AND qst_lang = '" + language + "' ORDER BY module_name, topic_name, qb_id ) a LEFT JOIN qba.culled_qstn_alternatives ON( culled_qstn_alternatives.qta_qst_id = a.qb_pk AND culled_qstn_alternatives.exam_fk = " + exam_pk + " AND culled_qstn_alternatives.exampaper_fk = " + exampaper_pk + " ) left join qba.qbank_images alterimage on ( alterimage.qbi_pk = culled_qstn_alternatives.qta_img_fk ) WHERE qst_type = 'M' ORDER BY module_name, qba_topic_code, qst_type DESC, qst_marks ), d4 AS (SELECT case when qst_type = 'CS' then dense_rank() over(ORDER BY qst_type, module_name,qba_topic_code,qb_id1, qb_pk) else dense_rank() over(ORDER BY qst_type, module_name,qba_topic_code,qst_marks, qb_id1,qb_pk) end as dr, * FROM ( SELECT * FROM d2 UNION ALL SELECT * FROM d3 )t ) SELECT qst_type, qb_id, qst_pid, module_name, qba_topic_code,qst_marks,qta_pk, * FROM d4 " + paginationCondition + " ORDER BY dr,qta_order ";
        } else {
            var query = "WITH d1 AS ( SELECT DISTINCT * ,alterimage.qbi_image_name as aimage, culled_qstn_alternatives.qta_is_corr_alt, culled_qstn_alternatives.qta_alt_desc, now() AS CURRENT_TIME FROM ( SELECT admin_status,replace_id, log_count, total_weightage, no_of_question, dense_rank()over ( ORDER BY un_id) rnk, qb_pk, qba_topic_fk, qba_subject_pk, qba_course_pk, qba_module_pk, qba_course_name, subject_name, module_name, topic_name, qba_topic_code, qst_marks, qst_neg_marks, qst_lang, qst_type, qst_pid, qst_body, qst_no_of_altr, qst_remarks, qst_request_remarks, calculation_info, reference_info, qst_is_active, qst_audit_by, qst_audit_dt, culled_qstn_bank.qb_id, ( CASE WHEN culled_qstn_bank.qst_type='CS' AND culled_qstn_bank.qst_pid > 0 THEN culled_qstn_bank.qst_pid::varchar || '.' || lpad(culled_qstn_bank.qb_id :: varchar,8,'0')::varchar ELSE culled_qstn_bank.qb_id :: varchar END ):: numeric(16, 10) as qb_id1, culled_qstn_bank.exam_fk AS culled_exam_fk , culled_qstn_bank.exampaper_fk AS culled_exampaper_fk , culled_qb_pk, copied_from_repository FROM ( SELECT culled_qb_pk un_id, * FROM qba.culled_qstn_bank a WHERE (CASE WHEN qst_type = 'CS' AND qst_pid > 0 THEN 1 ELSE 2 END) =2 and admin_status ='A' UNION ALL SELECT a.culled_qb_pk un_id, b.* FROM qba.culled_qstn_bank a INNER JOIN qba.culled_qstn_bank b ON a.qst_lang= b.qst_lang AND a.qb_id=b.qst_pid AND a.exampaper_fk=b.exampaper_fk WHERE a.admin_status='A' and a.qst_type = 'CS' AND a.qst_pid = 0 ) culled_qstn_bank INNER JOIN qba.qba_topic_master ON (qba_topic_master.qba_topic_pk=culled_qstn_bank.qba_topic_fk) INNER JOIN qba.qba_module_mstr ON (qba_module_mstr.qba_module_pk=qba_topic_master.qba_module_fk) INNER JOIN qba.qba_subject_master ON (qba_subject_master.qba_subject_pk=qba_module_mstr.qba_subject_fk) INNER JOIN qba.qba_course_master ON (qba_course_master.qba_course_pk=qba_subject_master.qba_course_fk) LEFT JOIN ( SELECT SUM(cu.qst_marks) total_weightage, MAX(cu.qst_pid) qstpid FROM qba.culled_qstn_bank cu WHERE cu.exam_fk =" + exam_pk + " AND cu.exampaper_fk= " + exampaper_pk + " AND cu.qst_lang='" + language + "' and cu.admin_status = 'A' and cu.qst_is_active = 'A' GROUP BY cu.qst_pid HAVING(cu.qst_pid)> 1 ) tw ON (culled_qstn_bank.qb_id = tw.qstpid) LEFT JOIN ( SELECT old_qta_fk log_count, qb_id, exam_fk, exampaper_fk FROM qba.culled_qstn_alternatives_log WHERE qta_log_pk IN ( SELECT MAX(qta_log_pk) FROM qba.culled_qstn_alternatives_log WHERE exam_fk=" + exam_pk + " AND exampaper_fk=" + exampaper_pk + " AND status='Answer' GROUP BY qb_id ) ) log ON (log.qb_id=culled_qstn_bank.qb_id AND log.exam_fk=" + exam_pk + " AND log.exampaper_fk=" + exampaper_pk + ") WHERE qst_is_active = 'A' AND admin_status = 'A' AND culled_qstn_bank.exam_fk =" + exam_pk + " AND culled_qstn_bank.exampaper_fk= " + exampaper_pk + " AND qst_lang='" + language + "' ORDER BY module_name, topic_name, qst_marks, qb_id ) a LEFT JOIN qba.culled_qstn_alternatives ON (culled_qstn_alternatives.qta_qst_id=a.qb_pk AND culled_qstn_alternatives.exam_fk=" + exam_pk + " AND culled_qstn_alternatives.exampaper_fk=" + exampaper_pk + ") left join qbank_images alterimage on (alterimage.qbi_pk=culled_qstn_alternatives.qta_img_fk)  WHERE qst_type = 'CS' ORDER BY module_name, qba_topic_code, qst_type DESC, qst_marks, qb_id1 ), d2 AS ( SELECT * FROM d1 ORDER BY module_name,topic_name, qst_type, qb_id ), d3 AS ( SELECT DISTINCT * ,alterimage.qbi_image_name as aimage,culled_qstn_alternatives.qta_is_corr_alt, culled_qstn_alternatives.qta_alt_desc, now() AS CURRENT_TIME FROM ( SELECT admin_status,replace_id, log_count, total_weightage, no_of_question, dense_rank()over ( ORDER BY un_id) rnk, qb_pk, qba_topic_fk, qba_subject_pk, qba_course_pk, qba_module_pk, qba_course_name, subject_name, module_name, topic_name, qba_topic_code, qst_marks, qst_neg_marks, qst_lang, qst_type, qst_pid, qst_body, qst_no_of_altr, qst_remarks, qst_request_remarks, calculation_info, reference_info, qst_is_active, qst_audit_by, qst_audit_dt, culled_qstn_bank.qb_id, ( CASE WHEN culled_qstn_bank.qst_type='CS' AND culled_qstn_bank.qst_pid > 0 THEN culled_qstn_bank.qst_pid::varchar || '.' || lpad(culled_qstn_bank.qb_id :: varchar,8,'0')::varchar ELSE culled_qstn_bank.qb_id :: varchar END ):: numeric(16, 10) as qb_id1, culled_qstn_bank.exam_fk AS culled_exam_fk , culled_qstn_bank.exampaper_fk AS culled_exampaper_fk , culled_qb_pk, copied_from_repository FROM ( SELECT culled_qb_pk un_id, * FROM qba.culled_qstn_bank a WHERE (CASE WHEN qst_type = 'CS' AND qst_pid > 0 THEN 1 ELSE 2 END) =2  UNION ALL SELECT a.culled_qb_pk un_id, b.* FROM qba.culled_qstn_bank a INNER JOIN qba.culled_qstn_bank b ON a.qst_lang= b.qst_lang AND a.qb_id=b.qst_pid AND a.exampaper_fk=b.exampaper_fk WHERE a.qst_type = 'CS' AND a.qst_pid = 0 ) culled_qstn_bank INNER JOIN qba.qba_topic_master ON (qba_topic_master.qba_topic_pk=culled_qstn_bank.qba_topic_fk) INNER JOIN qba.qba_module_mstr ON (qba_module_mstr.qba_module_pk=qba_topic_master.qba_module_fk) INNER JOIN qba.qba_subject_master ON (qba_subject_master.qba_subject_pk=qba_module_mstr.qba_subject_fk) INNER JOIN qba.qba_course_master ON (qba_course_master.qba_course_pk=qba_subject_master.qba_course_fk) LEFT JOIN ( SELECT SUM(cu.qst_marks) total_weightage, MAX(cu.qst_pid) qstpid FROM qba.culled_qstn_bank cu WHERE cu.exam_fk =" + exam_pk + " AND cu.exampaper_fk= " + exampaper_pk + " AND cu.qst_lang='" + language + "' and cu.admin_status='A' and cu.qst_is_active = 'A' GROUP BY cu.qst_pid HAVING(cu.qst_pid)> 1 ) tw ON (culled_qstn_bank.qb_id = tw.qstpid) LEFT JOIN ( SELECT old_qta_fk log_count, qb_id, exam_fk, exampaper_fk FROM qba.culled_qstn_alternatives_log WHERE qta_log_pk IN ( SELECT MAX(qta_log_pk) FROM qba.culled_qstn_alternatives_log WHERE exam_fk=" + exam_pk + " AND exampaper_fk=" + exampaper_pk + " AND status='Answer' GROUP BY qb_id ) ) log ON (log.qb_id=culled_qstn_bank.qb_id AND log.exam_fk=" + exam_pk + " AND log.exampaper_fk=" + exampaper_pk + ") WHERE qst_is_active = 'A' AND admin_status = 'A' AND culled_qstn_bank.exam_fk =" + exam_pk + " AND culled_qstn_bank.exampaper_fk= " + exampaper_pk + " AND qst_lang='" + language + "' ORDER BY module_name, topic_name, qst_marks, qb_id ) a LEFT JOIN qba.culled_qstn_alternatives ON (culled_qstn_alternatives.qta_qst_id=a.qb_pk AND culled_qstn_alternatives.qta_id = a.qb_id AND culled_qstn_alternatives.exam_fk=" + exam_pk + " AND culled_qstn_alternatives.exampaper_fk=" + exampaper_pk + ") left join qbank_images alterimage on (alterimage.qbi_pk=culled_qstn_alternatives.qta_img_fk) WHERE admin_status = 'A' and qst_type = 'M'  ORDER BY module_name, qba_topic_code, qst_type DESC, qst_marks ), d4 AS (SELECT case when qst_type = 'CS' then dense_rank() over(ORDER BY qst_type, module_name,qba_topic_code,qb_id1, qb_pk) else dense_rank() over(ORDER BY qst_type, module_name,qba_topic_code,qst_marks, qb_id1, qb_pk) end as dr, * FROM ( SELECT * FROM d2 UNION ALL SELECT * FROM d3 )t ) SELECT * FROM d4   " + paginationCondition + " ORDER BY dr,qta_order";
        }

        if (status == 'A') {
            var pstatus = " culled_qstn_bank.admin_status = 'A' ";
        } else {
            var pstatus = " culled_qstn_bank.pub_status = 'A' ";
        }
        var querydata = "SELECT count(*) AS count FROM qba.culled_qstn_bank AS culled_qstn_bank WHERE culled_qstn_bank.exam_fk = '" + exam_pk + "' AND culled_qstn_bank.exampaper_fk = '" + exampaper_pk + "' AND culled_qstn_bank.qst_is_active = 'A' AND " + pstatus + " AND ((qst_pid != 0 and qst_type = 'CS') OR qst_type = 'M') AND culled_qstn_bank.qst_lang = '" + language + "'";

        sequelize.query(querydata, { type: sequelize.QueryTypes.SELECT })
            .then(c => {

                sequelize.query(query, { type: sequelize.QueryTypes.SELECT })
                    .then(searchResult => {

                        if (searchResult.length != 0) {
                            req.body.result = searchResult;
                            req.body.count1 = c;
                            var querydata1 = "SELECT count(*) AS count FROM qba.culled_qstn_bank AS culled_qstn_bank WHERE culled_qstn_bank.exam_fk = '" + exam_pk + "' AND culled_qstn_bank.exampaper_fk = '" + exampaper_pk + "' AND culled_qstn_bank.qst_is_active = 'A' AND " + pstatus + " AND culled_qstn_bank.qst_lang = '" + language + "'";

                            sequelize.query(querydata1, { type: sequelize.QueryTypes.SELECT })
                                .then(c1 => {
                                    req.body.count = c1;
                                    importMethods.parseQuestionBankData(req, res);
                                })
                        }
                        else {
                            res.send({
                                code: 1,
                                message: "error",
                                obj: []
                            })
                        }
                    });
            });



    },


    loadAdminQuestionsForPrint: function (req, res) {
        importMethods.checkValidUser(req, res);
        var exam_pk = req.body.exam_fk;
        var exampaper_pk = req.body.examPaper;
        var language = req.body.language;
        var status = req.body.es; // added by shilpa exam status

        if (status == 'A') {
            var query = "WITH d1 AS ( SELECT DISTINCT *, qta_is_corr_alt, qta_alt_desc, alterimage.qbi_image_name as aimage, culled_qstn_alternatives.qta_alt_desc, now() AS CURRENT_TIME FROM ( SELECT replace_id, log_count, new_answer, old_answer, log_status, log_by, log_date, total_weightage, no_of_question, un_id, qb_pk, qba_topic_fk, qba_subject_pk, qba_course_pk, qba_module_pk, qba_course_name, subject_name, module_name, topic_name, qba_topic_code, qst_marks, qst_neg_marks, qst_lang, qst_type, qst_pid, qst_body, qst_no_of_altr, qst_remarks, qst_request_remarks, calculation_info, reference_info, qst_is_active, qst_audit_by, qst_audit_dt, culled_qstn_bank.qb_id, ( CASE WHEN culled_qstn_bank.qst_type = 'CS' AND culled_qstn_bank.qst_pid > 0 THEN culled_qstn_bank.qst_pid :: varchar || '.' || lpad(culled_qstn_bank.qb_id :: varchar,8,'0')::varchar ELSE culled_qstn_bank.qb_id :: varchar END ):: numeric(16, 10) as qb_id1, culled_qstn_bank.exam_fk AS culled_exam_fk, culled_qstn_bank.exampaper_fk AS culled_exampaper_fk, culled_qb_pk, copied_from_repository FROM ( SELECT culled_qb_pk un_id, * FROM qba.culled_qstn_bank a WHERE ( CASE WHEN qst_type = 'CS' AND qst_pid > 0 THEN 1 ELSE 2 END ) = 2 UNION ALL SELECT a.culled_qb_pk un_id, b.* FROM qba.culled_qstn_bank a INNER JOIN qba.culled_qstn_bank b ON a.qst_lang = b.qst_lang AND a.qb_id = b.qst_pid AND a.exampaper_fk = b.exampaper_fk WHERE a.qst_type = 'CS' AND a.qst_pid = 0 ) culled_qstn_bank INNER JOIN qba.qba_topic_master ON ( qba_topic_master.qba_topic_pk = culled_qstn_bank.qba_topic_fk ) INNER JOIN qba.qba_module_mstr ON ( qba_module_mstr.qba_module_pk = qba_topic_master.qba_module_fk ) INNER JOIN qba.qba_subject_master ON ( qba_subject_master.qba_subject_pk = qba_module_mstr.qba_subject_fk ) INNER JOIN qba.qba_course_master ON ( qba_course_master.qba_course_pk = qba_subject_master.qba_course_fk ) LEFT JOIN ( SELECT SUM(cu.qst_marks) total_weightage, MAX(cu.qst_pid) qstpid FROM qba.culled_qstn_bank cu WHERE cu.exam_fk = " + exam_pk + " AND cu.exampaper_fk = " + exampaper_pk + " AND cu.qst_lang = 'ENGLISH' GROUP BY cu.qst_pid HAVING (cu.qst_pid)> 1 ) tw ON ( culled_qstn_bank.qb_id = tw.qstpid ) LEFT JOIN ( SELECT old_qta_fk log_count, qb_id, exam_fk, exampaper_fk FROM qba.culled_qstn_alternatives_log WHERE qta_log_pk IN ( SELECT MAX(qta_log_pk) FROM qba.culled_qstn_alternatives_log WHERE exam_fk = " + exam_pk + " AND exampaper_fk = " + exampaper_pk + " AND status = 'Answer' GROUP BY qb_id ) ) log ON ( log.qb_id = culled_qstn_bank.qb_id AND log.exam_fk = " + exam_pk + " AND log.exampaper_fk = " + exampaper_pk + " ) LEFT JOIN ( SELECT array_agg(new_answer) new_answer, array_agg(old_answer) old_answer, array_agg(status) log_status, array_agg(qta_audit_by) log_by, array_agg(add_date) log_date, qb_id, exam_fk, exampaper_fk FROM qba.culled_qstn_alternatives_log WHERE exam_fk = " + exam_pk + " AND exampaper_fk = " + exampaper_pk + " GROUP BY qb_id, exam_fk, exampaper_fk ) log1 ON ( log1.qb_id = culled_qstn_bank.qb_id AND log1.exam_fk = " + exam_pk + " AND log1.exampaper_fk = " + exampaper_pk + " ) WHERE qst_is_active = 'A' AND admin_status = 'A' AND culled_qstn_bank.exam_fk = " + exam_pk + " AND culled_qstn_bank.exampaper_fk = " + exampaper_pk + " AND qst_lang = 'ENGLISH' ORDER BY module_name, qba_topic_code, qst_marks, qb_id ) a LEFT JOIN qba.culled_qstn_alternatives ON( culled_qstn_alternatives.qta_qst_id = a.qb_pk AND culled_qstn_alternatives.exam_fk = " + exam_pk + " AND culled_qstn_alternatives.exampaper_fk = " + exampaper_pk + " ) left join qba.qbank_images alterimage on ( alterimage.qbi_pk = culled_qstn_alternatives.qta_img_fk ) WHERE qst_type = 'CS' ORDER BY module_name, topic_name, qst_type DESC, qst_marks, qb_id1 ), d2 AS ( SELECT * FROM d1 ORDER BY module_name, topic_name, qst_type, qb_id ), d3 AS ( SELECT DISTINCT *, qta_is_corr_alt, qta_alt_desc, alterimage.qbi_image_name as aimage, culled_qstn_alternatives.qta_alt_desc, now() AS CURRENT_TIME FROM ( SELECT replace_id, log_count, new_answer, old_answer, log_status, log_by, log_date, total_weightage, no_of_question, un_id, qb_pk, qba_topic_fk, qba_subject_pk, qba_course_pk, qba_module_pk, qba_course_name, subject_name, module_name, topic_name, qba_topic_code, qst_marks, qst_neg_marks, qst_lang, qst_type, qst_pid, qst_body, qst_no_of_altr, qst_remarks, qst_request_remarks, calculation_info, reference_info, qst_is_active, qst_audit_by, qst_audit_dt, culled_qstn_bank.qb_id, ( CASE WHEN culled_qstn_bank.qst_type = 'M' THEN coalesce(nullif(culled_qstn_bank.qst_marks, 0.5),0) || '.' || culled_qstn_bank.qb_id :: varchar ELSE NULL END ):: numeric(10, 5) as qb_id1, culled_qstn_bank.exam_fk AS culled_exam_fk, culled_qstn_bank.exampaper_fk AS culled_exampaper_fk, culled_qb_pk, copied_from_repository FROM ( SELECT culled_qb_pk un_id, * FROM qba.culled_qstn_bank a WHERE ( CASE WHEN qst_type = 'CS' AND qst_pid > 0 THEN 1 ELSE 2 END ) = 2 UNION ALL SELECT a.culled_qb_pk un_id, b.* FROM qba.culled_qstn_bank a INNER JOIN qba.culled_qstn_bank b ON a.qst_lang = b.qst_lang AND a.qb_id = b.qst_pid AND a.exampaper_fk = b.exampaper_fk WHERE a.qst_type = 'CS' AND a.qst_pid = 0 ) culled_qstn_bank INNER JOIN qba.qba_topic_master ON ( qba_topic_master.qba_topic_pk = culled_qstn_bank.qba_topic_fk ) INNER JOIN qba.qba_module_mstr ON ( qba_module_mstr.qba_module_pk = qba_topic_master.qba_module_fk ) INNER JOIN qba.qba_subject_master ON ( qba_subject_master.qba_subject_pk = qba_module_mstr.qba_subject_fk ) INNER JOIN qba.qba_course_master ON ( qba_course_master.qba_course_pk = qba_subject_master.qba_course_fk ) LEFT JOIN ( SELECT SUM(cu.qst_marks) total_weightage, MAX(cu.qst_pid) qstpid FROM qba.culled_qstn_bank cu WHERE cu.exam_fk = " + exam_pk + " AND cu.exampaper_fk = " + exampaper_pk + " AND cu.qst_lang = 'ENGLISH' GROUP BY cu.qst_pid HAVING (cu.qst_pid)> 1 ) tw ON ( culled_qstn_bank.qb_id = tw.qstpid ) LEFT JOIN ( SELECT old_qta_fk log_count, qb_id, exam_fk, exampaper_fk FROM qba.culled_qstn_alternatives_log WHERE qta_log_pk IN ( SELECT MAX(qta_log_pk) FROM qba.culled_qstn_alternatives_log WHERE exam_fk = " + exam_pk + " AND exampaper_fk = " + exampaper_pk + " AND status = 'Answer' GROUP BY qb_id ) ) log ON ( log.qb_id = culled_qstn_bank.qb_id AND log.exam_fk = " + exam_pk + " AND log.exampaper_fk = " + exampaper_pk + " ) LEFT JOIN ( SELECT array_agg(new_answer) new_answer, array_agg(old_answer) old_answer, array_agg(status) log_status, array_agg(qta_audit_by) log_by, array_agg(add_date) log_date, qb_id, exam_fk, exampaper_fk FROM qba.culled_qstn_alternatives_log WHERE exam_fk = " + exam_pk + " AND exampaper_fk = " + exampaper_pk + " GROUP BY qb_id, exam_fk, exampaper_fk ) log1 ON ( log1.qb_id = culled_qstn_bank.qb_id AND log1.exam_fk = " + exam_pk + " AND log1.exampaper_fk = " + exampaper_pk + " ) WHERE qst_is_active = 'A' AND admin_status = 'A' AND culled_qstn_bank.exam_fk = " + exam_pk + " AND culled_qstn_bank.exampaper_fk = " + exampaper_pk + " AND qst_lang = 'ENGLISH' ORDER BY module_name, topic_name, qb_id ) a LEFT JOIN qba.culled_qstn_alternatives ON( culled_qstn_alternatives.qta_qst_id = a.qb_pk AND culled_qstn_alternatives.qta_id = a.qb_id AND culled_qstn_alternatives.exam_fk = " + exam_pk + " AND culled_qstn_alternatives.exampaper_fk = " + exampaper_pk + " ) left join qba.qbank_images alterimage on ( alterimage.qbi_pk = culled_qstn_alternatives.qta_img_fk ) WHERE qst_type = 'M' ORDER BY module_name, qba_topic_code, qst_type DESC, qst_marks ), d4 AS ( SELECT case when qst_type = 'CS' then dense_rank() over( ORDER BY qst_type, module_name, qba_topic_code, qb_id1, qb_pk ) else dense_rank() over( ORDER BY qst_type, module_name, qba_topic_code, qb_id1, qst_marks, qb_pk ) end as dr, * FROM ( SELECT * FROM d2 UNION ALL SELECT * FROM d3 ) t ) SELECT qst_type, qb_id, qst_pid, module_name, qba_topic_code, qst_marks, qta_pk, * FROM d4 ORDER BY dr, qta_order";
        }

        else {
            var query = "WITH d1 AS ( SELECT DISTINCT *, qta_is_corr_alt, qta_alt_desc, alterimage.qbi_image_name as aimage, culled_qstn_alternatives.qta_alt_desc, now() AS CURRENT_TIME FROM ( SELECT replace_id, log_count, new_answer, old_answer, log_status, log_by, log_date, total_weightage, no_of_question, un_id, qb_pk, qba_topic_fk, qba_subject_pk, qba_course_pk, qba_module_pk, qba_course_name, subject_name, module_name, topic_name, qba_topic_code, qst_marks, qst_neg_marks, qst_lang, qst_type, qst_pid, qst_body, qst_no_of_altr, qst_remarks, qst_request_remarks, calculation_info, reference_info, qst_is_active, qst_audit_by, qst_audit_dt, culled_qstn_bank.qb_id, ( CASE WHEN culled_qstn_bank.qst_type = 'CS' AND culled_qstn_bank.qst_pid > 0 THEN culled_qstn_bank.qst_pid :: varchar || '.' || lpad(culled_qstn_bank.qb_id :: varchar,8,'0')::varchar ELSE culled_qstn_bank.qb_id :: varchar END ):: numeric(16, 10) as qb_id1, culled_qstn_bank.exam_fk AS culled_exam_fk, culled_qstn_bank.exampaper_fk AS culled_exampaper_fk, culled_qb_pk, copied_from_repository FROM ( SELECT culled_qb_pk un_id, * FROM qba.culled_qstn_bank a WHERE ( CASE WHEN qst_type = 'CS' AND qst_pid > 0 THEN 1 ELSE 2 END ) = 2 UNION ALL SELECT a.culled_qb_pk un_id, b.* FROM qba.culled_qstn_bank a INNER JOIN qba.culled_qstn_bank b ON a.qst_lang = b.qst_lang AND a.qb_id = b.qst_pid AND a.exampaper_fk = b.exampaper_fk WHERE a.qst_type = 'CS' AND a.qst_pid = 0 ) culled_qstn_bank INNER JOIN qba.qba_topic_master ON ( qba_topic_master.qba_topic_pk = culled_qstn_bank.qba_topic_fk ) INNER JOIN qba.qba_module_mstr ON ( qba_module_mstr.qba_module_pk = qba_topic_master.qba_module_fk ) INNER JOIN qba.qba_subject_master ON ( qba_subject_master.qba_subject_pk = qba_module_mstr.qba_subject_fk ) INNER JOIN qba.qba_course_master ON ( qba_course_master.qba_course_pk = qba_subject_master.qba_course_fk ) LEFT JOIN ( SELECT SUM(cu.qst_marks) total_weightage, MAX(cu.qst_pid) qstpid FROM qba.culled_qstn_bank cu WHERE cu.exam_fk = " + exam_pk + " AND cu.exampaper_fk = " + exampaper_pk + " AND cu.qst_lang = '" + language + "' GROUP BY cu.qst_pid HAVING (cu.qst_pid)> 1 ) tw ON ( culled_qstn_bank.qb_id = tw.qstpid ) LEFT JOIN ( SELECT old_qta_fk log_count, qb_id, exam_fk, exampaper_fk FROM qba.culled_qstn_alternatives_log WHERE qta_log_pk IN ( SELECT MAX(qta_log_pk) FROM qba.culled_qstn_alternatives_log WHERE exam_fk = " + exam_pk + " AND exampaper_fk = " + exampaper_pk + " AND status = 'Answer' GROUP BY qb_id ) ) log ON ( log.qb_id = culled_qstn_bank.qb_id AND log.exam_fk = " + exam_pk + " AND log.exampaper_fk = " + exampaper_pk + " ) LEFT JOIN ( SELECT array_agg(new_answer) new_answer, array_agg(old_answer) old_answer, array_agg(status) log_status, array_agg(qta_audit_by) log_by, array_agg(add_date) log_date, qb_id, exam_fk, exampaper_fk FROM qba.culled_qstn_alternatives_log WHERE exam_fk = " + exam_pk + " AND exampaper_fk = " + exampaper_pk + " GROUP BY qb_id, exam_fk, exampaper_fk ) log1 ON ( log1.qb_id = culled_qstn_bank.qb_id AND log1.exam_fk = " + exam_pk + " AND log1.exampaper_fk = " + exampaper_pk + " ) WHERE qst_is_active = 'A' AND pub_status = 'A' AND culled_qstn_bank.exam_fk = " + exam_pk + " AND culled_qstn_bank.exampaper_fk = " + exampaper_pk + " AND qst_lang = '" + language + "' ORDER BY module_name, qba_topic_code, qst_marks, qb_id ) a LEFT JOIN qba.culled_qstn_alternatives ON( culled_qstn_alternatives.qta_qst_id = a.qb_pk AND culled_qstn_alternatives.exam_fk = " + exam_pk + " AND culled_qstn_alternatives.exampaper_fk = " + exampaper_pk + " ) left join qba.qbank_images alterimage on ( alterimage.qbi_pk = culled_qstn_alternatives.qta_img_fk ) WHERE qst_type = 'CS' ORDER BY module_name, topic_name, qst_type DESC, qst_marks, qb_id1 ), d2 AS ( SELECT * FROM d1 ORDER BY module_name, topic_name, qst_type, qb_id ), d3 AS ( SELECT DISTINCT *, qta_is_corr_alt, qta_alt_desc, alterimage.qbi_image_name as aimage, culled_qstn_alternatives.qta_alt_desc, now() AS CURRENT_TIME FROM ( SELECT replace_id, log_count, new_answer, old_answer, log_status, log_by, log_date, total_weightage, no_of_question, un_id, qb_pk, qba_topic_fk, qba_subject_pk, qba_course_pk, qba_module_pk, qba_course_name, subject_name, module_name, topic_name, qba_topic_code, qst_marks, qst_neg_marks, qst_lang, qst_type, qst_pid, qst_body, qst_no_of_altr, qst_remarks, qst_request_remarks, calculation_info, reference_info, qst_is_active, qst_audit_by, qst_audit_dt, culled_qstn_bank.qb_id, ( CASE WHEN culled_qstn_bank.qst_type = 'M' THEN coalesce(nullif(culled_qstn_bank.qst_marks, 0.5),0) || '.' || culled_qstn_bank.qb_id :: varchar ELSE NULL END ):: numeric(10, 5) as qb_id1, culled_qstn_bank.exam_fk AS culled_exam_fk, culled_qstn_bank.exampaper_fk AS culled_exampaper_fk, culled_qb_pk, copied_from_repository FROM ( SELECT culled_qb_pk un_id, * FROM qba.culled_qstn_bank a WHERE ( CASE WHEN qst_type = 'CS' AND qst_pid > 0 THEN 1 ELSE 2 END ) = 2 UNION ALL SELECT a.culled_qb_pk un_id, b.* FROM qba.culled_qstn_bank a INNER JOIN qba.culled_qstn_bank b ON a.qst_lang = b.qst_lang AND a.qb_id = b.qst_pid AND a.exampaper_fk = b.exampaper_fk WHERE a.qst_type = 'CS' AND a.qst_pid = 0 ) culled_qstn_bank INNER JOIN qba.qba_topic_master ON ( qba_topic_master.qba_topic_pk = culled_qstn_bank.qba_topic_fk ) INNER JOIN qba.qba_module_mstr ON ( qba_module_mstr.qba_module_pk = qba_topic_master.qba_module_fk ) INNER JOIN qba.qba_subject_master ON ( qba_subject_master.qba_subject_pk = qba_module_mstr.qba_subject_fk ) INNER JOIN qba.qba_course_master ON ( qba_course_master.qba_course_pk = qba_subject_master.qba_course_fk ) LEFT JOIN ( SELECT SUM(cu.qst_marks) total_weightage, MAX(cu.qst_pid) qstpid FROM qba.culled_qstn_bank cu WHERE cu.exam_fk = " + exam_pk + " AND cu.exampaper_fk = " + exampaper_pk + " AND cu.qst_lang = '" + language + "' GROUP BY cu.qst_pid HAVING (cu.qst_pid)> 1 ) tw ON ( culled_qstn_bank.qb_id = tw.qstpid ) LEFT JOIN ( SELECT old_qta_fk log_count, qb_id, exam_fk, exampaper_fk FROM qba.culled_qstn_alternatives_log WHERE qta_log_pk IN ( SELECT MAX(qta_log_pk) FROM qba.culled_qstn_alternatives_log WHERE exam_fk = " + exam_pk + " AND exampaper_fk = " + exampaper_pk + " AND status = 'Answer' GROUP BY qb_id ) ) log ON ( log.qb_id = culled_qstn_bank.qb_id AND log.exam_fk = " + exam_pk + " AND log.exampaper_fk = " + exampaper_pk + " ) LEFT JOIN ( SELECT array_agg(new_answer) new_answer, array_agg(old_answer) old_answer, array_agg(status) log_status, array_agg(qta_audit_by) log_by, array_agg(add_date) log_date, qb_id, exam_fk, exampaper_fk FROM qba.culled_qstn_alternatives_log WHERE exam_fk = " + exam_pk + " AND exampaper_fk = " + exampaper_pk + " GROUP BY qb_id, exam_fk, exampaper_fk ) log1 ON ( log1.qb_id = culled_qstn_bank.qb_id AND log1.exam_fk = " + exam_pk + " AND log1.exampaper_fk = " + exampaper_pk + " ) WHERE qst_is_active = 'A' AND pub_status = 'A' AND culled_qstn_bank.exam_fk = " + exam_pk + " AND culled_qstn_bank.exampaper_fk = " + exampaper_pk + " AND qst_lang = '" + language + "' ORDER BY module_name, topic_name, qb_id ) a LEFT JOIN qba.culled_qstn_alternatives ON( culled_qstn_alternatives.qta_qst_id = a.qb_pk AND culled_qstn_alternatives.qta_id = a.qb_id AND culled_qstn_alternatives.exam_fk = " + exam_pk + " AND culled_qstn_alternatives.exampaper_fk = " + exampaper_pk + " ) left join qba.qbank_images alterimage on ( alterimage.qbi_pk = culled_qstn_alternatives.qta_img_fk ) WHERE qst_type = 'M' ORDER BY module_name, qba_topic_code, qst_type DESC, qst_marks ), d4 AS ( SELECT case when qst_type = 'CS' then dense_rank() over( ORDER BY qst_type, module_name, qba_topic_code, qb_id1, qb_pk ) else dense_rank() over( ORDER BY qst_type, module_name, qba_topic_code, qb_id1, qst_marks, qb_pk ) end as dr, * FROM ( SELECT * FROM d2 UNION ALL SELECT * FROM d3 ) t ) SELECT qst_type, qb_id, qst_pid, module_name, qba_topic_code, qst_marks, qta_pk, * FROM d4 ORDER BY dr, qta_order";

        }

        var querydata = "SELECT count(*) AS count FROM qba.culled_qstn_bank AS culled_qstn_bank WHERE culled_qstn_bank.exam_fk = '" + exam_pk + "' AND culled_qstn_bank.exampaper_fk = '" + exampaper_pk + "' AND culled_qstn_bank.qst_is_active = 'A' AND culled_qstn_bank.pub_status = 'A' AND ((qst_pid != 0 and qst_type='CS') OR qst_type='M') AND culled_qstn_bank.qst_lang = '" + language + "'";

        sequelize.query(querydata, { type: sequelize.QueryTypes.SELECT })
            .then(c => {


                sequelize.query(query, { type: sequelize.QueryTypes.SELECT })
                    .then(searchResult => {

                        req.body.result = searchResult;
                        req.body.count = c;
                        importMethods.parseQuestionBankData(req, res);
                    });
            });



    },

    loadLanguages: function (req, res) {
        importMethods.checkValidUser(req, res);
        qba_lang_mstr.findAll().then(languages => {
            res.send({
                code: 0,
                message: "success",
                obj: languages
            })
        })
    },

    //added by milan on 22.12.2017
    addEmptyQstForReplacedOrDeletedQuestion: function (req, res) {
        importMethods.checkValidUser(req, res);
        var records = req.body;
        sequelize.query("select nextval('qb_id_val') as val, nextval('s_qstnbank_qbpk') as qb_pk", { type: sequelize.QueryTypes.SELECT })
            .then(next_qb_id => {
                var qb_id = next_qb_id[0].val;
                var qb_pk = next_qb_id[0].qb_pk;
                culled_qstn_bank.create({
                    qst_lang: 'ENGLISH',
                    qst_sub_seq_no: '0',
                    qst_body: '',
                    qst_marks: records.qst_marks,
                    qst_expiry_dt: new Date(),
                    qst_img_fk: null,
                    qst_fk_tpc_pk: '0',
                    qst_is_active: 'A',
                    qst_audit_dt: new Date(),
                    qb_assigned_to: '0',
                    qb_status_fk: '0',
                    qba_topic_fk: records.qba_topic_fk,
                    qba_subject_fk: records.qba_subject_fk,
                    qba_course_fk: records.qba_course_fk,
                    qst_type: records.qst_type,
                    qba_module_fk: records.qba_module_fk,
                    no_of_question: '0',
                    qst_pid: '0',
                    qst_audit_by: 'Admin',
                    author_name: 'Admin',
                    qst_dimension: 'Dimension',
                    qst_neg_marks: 0,
                    qb_id: qb_id,
                    copied_from_repository: 'N',
                    exam_fk: records.exam_fk,
                    exampaper_fk: records.exampaper_fk,
                    qst_request_remarks: records.qst_request_remarks,
                    qst_request_status: records.qst_request_status,
                    qb_pk: qb_pk,
                    replace_id: qb_pk
                }).then(response => {
                    res.send({
                        code: 0,
                        message: "success",
                        obj: response
                    });
                })

            })
    },

    updateCulledTableForReplacedQstRemarks: function (req, res) {

        var updateCulledTable = req.body;
        var query = "select qb_id,qst_type from culled_qstn_bank where exam_fk = " + req.body.exam_fk + "and exampaper_fk = " + req.body.exampaper_fk + "and qb_pk = " + req.body.qb_pk + "";

        sequelize.query(query, { type: sequelize.QueryTypes.SELECT })
            .then(result => {
                var qb_id = result[0].qb_id;
                var qst_type = result[0].qst_type;
                if (qst_type == 'CS') {
                    culled_qstn_bank.update({
                        qst_request_remarks: req.body.qst_request_remarks,
                        qst_request_status: req.body.qst_request_status,
                        qst_is_active: req.body.qst_is_active,
                        qst_audit_by: req.body.username
                    }, {
                        where: {
                            exam_fk: req.body.exam_fk,
                            exampaper_fk: req.body.exampaper_fk,
                            qst_pid: qb_id
                        }

                    }).then(Status => {
                    });
                }
            });

        var query1 = "update culled_qstn_bank set qst_request_remarks='" + req.body.qst_request_remarks + "' ,qst_request_status='" + req.body.qst_request_status + "' ,qst_audit_by='" + req.body.username + "' where exam_fk=" + req.body.exam_fk + " and exampaper_fk=" + req.body.exampaper_fk + " and qb_id in (select qb_id from culled_qstn_bank where exam_fk=" + req.body.exam_fk + " and exampaper_fk=" + req.body.exampaper_fk + " and qb_pk=" + updateCulledTable.qb_pk + ")";
        sequelize.query(query1).then(updatedStaus => {

            res.send({
                code: 0,
                message: "success",
                obj: updatedStaus,
                username: req.body.username
            });
        })

    },

    updateCulledTableForReplacedQstStatus: function (req, res, next) {
        var reqData = req.body;

        var query = "select * from qba.qba_vatting_log where exampaper_fk = '" + reqData[0].exampaper_fk + "' and (admin_status = 'Approved' or admin_status = 'Rejected')";

        sequelize.query(query, { type: sequelize.QueryTypes.SELECT })
            .then(Approvedculled => {
                for (var i = 0; i < reqData.length; i++) {
                    culled_qstn_bank.update({
                        qst_request_status: reqData[i].qst_request_status
                    }, {


                        where: {
                            qb_pk: reqData[i].qb_pk,
                            exam_fk: reqData[i].exam_fk,
                            exampaper_fk: reqData[i].exampaper_fk,
                            qb_id: reqData[i].qb_id
                        }


                    })
                    var q = "select qb_id, exampaper_fk, qst_type from culled_qstn_bank where exam_fk =" + reqData[i].exam_fk + "and exampaper_fk = " + reqData[i].exampaper_fk + " and qb_id =" + reqData[i].qb_id;
                    sequelize.query(q, { type: sequelize.QueryTypes.SELECT })
                        .then(result_query => {
                            if (result_query[0].qst_type == 'CS') {
                                culled_qstn_bank.update({
                                    qst_request_status: 'Child of replacement status'
                                }, {
                                    where: {
                                        exampaper_fk: result_query[0].exampaper_fk,
                                        qst_pid: result_query[0].qb_id
                                    }
                                })
                            }

                        })
                }
            }).then(tasks => {
                res.send({
                    code: 0,
                    message: "success",
                    obj: tasks
                });
                return next();
            });

    },

    changePassword: function (req, res) {
        User.findOne({
            where: { 'user_pk': req.body.userPk }
        }).then(function (result) {
            if (bcrypt.compareSync(req.body.oldPassword, result.user_password) == true) {
                if (req.body.newPassword != req.body.confirmPassword) {
                    res.send({
                        code: 1,
                        message: "New password and confirm password does not match",
                        obj: []
                    });
                } else {
                    var newPasswordHash = bcrypt.hashSync(req.body.newPassword);
                    User.update({
                        user_password: newPasswordHash
                    }, {
                        where: {
                            user_pk: req.body.userPk
                        }
                    }).then(userUpdate => {
                        res.send({
                            code: 0,
                            message: "Password has been changed successfully",
                            obj: userUpdate
                        });
                    });
                }
            } else {
                res.send({
                    code: 1,
                    message: "Incorrect old password",
                    obj: []
                });
            }

        });

    },
    addExamforExamMaster: function (req, res) {
        var reqParameters = {
            exam_name: req.body.examName,
            exam_date: new Date(),
            qba_course_fk: req.body.selectedCourse_fk,
            qba_subject_fk: req.body.selectedSubject_fk,
            total_qts: req.body.totalQstn,
            total_marks: req.body.totalMarks,
            subject_abbreviation: req.body.subject_abbreviation,
            case_question: req.body.case_question,
            case_marks: req.body.case_marks,
            audit_by: req.body.audit_by,
            audit_dt: new Date(),
            // qba_ct_fk: 1,
            is_active: 'Y'
        }

        if (reqParameters.case_question == '') {
            reqParameters.case_question = null;
        }
        else {
            reqParameters.case_question = req.body.case_question;
        }


        if (reqParameters.case_marks == '') {
            reqParameters.case_marks = null;
        }
        else {
            reqParameters.case_marks = req.body.case_marks;
        }
        exam_master.findAll({ where: { exam_name: req.body.examName, is_active: 'Y' } }).then(checkResponse => {
            if (checkResponse.length == 0) {
                exam_master.create(reqParameters).then(insertResponse => {

                    res.send({
                        code: 0,
                        message: "success",
                        obj: insertResponse
                    })
                });
            } else {
                res.send({
                    code: 1,
                    message: "Exam name already exists!",
                    obj: []
                })
            }
        });
    },
    updateExamforExamMaster: function (req, res) {
        exam_master.findAll({
            exam_pk: req.body.exam_pk
        }).then(response => {
            if (response.length >= 1) {
                exam_master.update({
                    exam_date: new Date(),
                    exam_name: req.body.examName,
                    qba_course_fk: req.body.selectedCourse_fk,
                    qba_subject_fk: req.body.selectedSubject_fk,
                    total_qts: req.body.totalQstn,
                    total_marks: req.body.totalMarks,
                    case_marks: req.body.case_marks,
                    case_question: req.body.case_question,
                    updated_by: req.body.updated_by,
                    updated_dt: new Date()
                },
                    {
                        where: {
                            exam_pk: req.body.exam_pk
                        }
                    }
                ).then(responsetest => {
                    res.send({
                        code: 0,
                        message: "success",
                        obj: responsetest
                    });
                });
            }
        });
    },

    deleteExamforExamMaster: function (req, res) {
        qba_exam_paper.findAll({
            where: {
                exam_fk: req.body.exam_pk
            }
        }).then(isExamfkexist => {
            if (isExamfkexist.length >= 1) {
                res.send({
                    code: 0,
                    message: "Exam exists",
                    obj: isExamfkexist
                })
            } else {
                exam_master.findAll({
                    exam_pk: req.body.exam_pk
                }).then(response => {
                    exam_master.update({
                        is_active: req.body.is_active
                    }, {
                        where: {
                            exam_pk: req.body.exam_pk
                        },
                    });
                }).then(affectedRows => {
                    return exam_master.findAll({
                        where: {
                            is_active: 'N'
                        }
                    });
                }).then(tasks => {
                    res.send({
                        code: 0,
                        message: "success",
                        obj: tasks
                    });
                });
            }
        });
    },
    loadExamMasterForAdmin: function (req, res) {
        var reqParams = req.body;
        var str = "";

        if (reqParams.course_selected != undefined && reqParams.course_selected != '' && (reqParams.course_selected.qba_course_pk != undefined && reqParams.course_selected.qba_course_pk != '')) {
            str += "and qba_course_master.qba_course_pk =" + reqParams.course_selected.qba_course_pk;
        }
        else if (reqParams.subject_selected != undefined && reqParams.subject_selected != '' && (reqParams.subject_selected.qba_subject_pk != undefined && reqParams.subject_selected.qba_subject_pk != '')) {
            str += "and qba_subject_pk = " + reqParams.subject_selected.qba_subject_pk;
        }
        else if (reqParams.exam_name != undefined && reqParams.exam_name != '') {
            str += "and exam_name ILIKE '%" + reqParams.exam_name + "%'";
        }
        else if (reqParams.total_qstn != undefined && reqParams.total_qstn != '') {
            str += "and total_qts = '" + reqParams.total_qstn + "'";
        }
        else if (reqParams.total_marks != undefined && reqParams.total_marks != '') {
            str += "and total_marks = '" + reqParams.total_marks + "'";
        }


        var query = "select *,exam_master.audit_by,exam_master.audit_dt,exam_master.updated_by,exam_master.updated_dt from exam_master inner join qba_subject_master on (qba_subject_master.qba_subject_pk = exam_master.qba_subject_fk)" +
            "inner join qba_course_master on (qba_course_master.qba_course_pk = exam_master.qba_course_fk) where  exam_master.is_active = 'Y'" + str;

        sequelize.query(query, { type: sequelize.QueryTypes.SELECT })
            .then(examMasterList => {
                res.send({
                    code: 0,
                    message: "success",
                    obj: examMasterList
                });
                // We don't need spread here, since only the results will be returned for select queries
            })
    },

    loadmodulename: function (req, res) {
        importMethods.checkValidUser(req, res);
        let module_ID = req.body.module_ID;
        let course_fk = req.body.course;
        let subject_fk = req.body.subject;
        let exam_fk = req.body.exam_pk;
        let selected_e_pk = req.body.e_pk; //exampaper_pk

        var query = "select tm.qba_topic_pk,tm.qba_module_fk,m.module_name from  qba.qba_topic_master tm left join qba_module_mstr m on (m.qba_module_pk = tm.qba_module_fk) where tm.qba_module_fk IN (" + module_ID + ") and tm.is_active='Y'";
        sequelize.query(query, { type: sequelize.QueryTypes.SELECT })
            .then(modulename => {
                res.send({
                    code: 0,
                    message: "success",
                    obj: modulename
                });
            });
    },

    loadmodulenameadmin: function (req, res) {

        importMethods.checkValidUser(req, res);
        let module_ID = req.body.module_fk;
        let exam_fk = req.body.exam_pk;
        let e_pk = req.body.e_pk;


        var query = "select m.module_name,sum(summary_question) as summary_qstn,sum(summary_marks) summary_marks, sum(short_fall_qstn) short_fall_qstn,(select count(qb_id) from culled_qstn_bank where exampaper_fk = " + e_pk + " and qst_lang = 'ENGLISH' and qb_id in (select qb_id from qba_vatting_log where exampaper_fk = " + e_pk + " and admin_status = 'Approved') and qst_type = 'M' and qba_module_fk = sa.module_fk) as total_replace_question, (select sum(qst_marks) from culled_qstn_bank where exampaper_fk = " + e_pk + " and qst_lang = 'ENGLISH' and qb_id in (select qb_id from qba_vatting_log where exampaper_fk = " + e_pk + " and admin_status = 'Approved') and qst_type = 'M' and qba_module_fk = sa.module_fk) as total_replace_question_marks from qba.qba_summary_admin sa left join qba.qba_module_mstr m on m.qba_module_pk = sa.module_fk where sa.exampaper_fk = " + e_pk + " and sa.exam_fk =" + exam_fk + " group by m.qba_module_pk, m.module_name, sa.module_fk order by m.module_name ";
        sequelize.query(query, { type: sequelize.QueryTypes.SELECT })
            .then(modulenameadmin => {
                res.send({
                    code: 0,
                    message: "success",
                    obj: modulenameadmin
                });
            });


    },

    get_modulewisedataadmin: function (req, res) {

        importMethods.checkValidUser(req, res);
        let module_ID = req.body.module_fk;
        let exam_fk = req.body.exam_fk;
        let e_pk = req.body.examPaper_fk;
        var query = "select m.module_name,sum(parent_count) as parent_count,sum(child_count) child_count,sum(summary_marks) summary_marks,sum(short_fall_qstn) short_fall_qstn, (select count(qb_id) from culled_qstn_bank where exampaper_fk = " + req.body.examPaper + " and qst_lang = 'ENGLISH' and ((qst_pid in (select qb_id from qba_vatting_log where exampaper_fk = " + req.body.examPaper + " and admin_status = 'Approved') and qst_pid != 0) or (qb_id in (select qb_id from qba_vatting_log where exampaper_fk = " + req.body.examPaper + " and admin_status = 'Approved') and qst_pid != 0)) and qst_type = 'CS' and qba_module_fk = m.qba_module_pk) as total_replace_child_question, (select sum(qst_marks) from culled_qstn_bank where exampaper_fk = " + req.body.examPaper + " and qst_lang = 'ENGLISH' and ((qst_pid in (select qb_id from qba_vatting_log where exampaper_fk = " + req.body.examPaper + " and admin_status = 'Approved') and qst_pid != 0) or (qb_id in (select qb_id from qba_vatting_log where exampaper_fk = " + req.body.examPaper + " and admin_status = 'Approved') and qst_pid != 0)) and qst_type = 'CS' and qba_module_fk = m.qba_module_pk) as total_replace_question_marks, (select count(distinct qst_pid) from culled_qstn_bank where exampaper_fk = " + req.body.examPaper + " and  qst_pid in (select qb_id from qba_vatting_log where exampaper_fk = " + req.body.examPaper + " and admin_status = 'Approved') and qst_lang = 'ENGLISH' and qst_type = 'CS' and qba_module_fk = m.qba_module_pk) as total_replace_parent_question from qba.qba_case_summary_admin sa left join qba.qba_module_mstr m on m.qba_module_pk = sa.module_fk where sa.exampaper_fk = " + req.body.examPaper + " and sa.exam_fk =" + exam_fk + " group by m.qba_module_pk order by m.module_name"
        sequelize.query(query, { type: sequelize.QueryTypes.SELECT })
            .then(modulenamecsqadmin => {
                res.send({
                    code: 0,
                    message: "success",
                    obj: modulenamecsqadmin
                });
            });


    },

    get_mcq_totalquestion: function (req, res) {

        importMethods.checkValidUser(req, res);
        let module_ID = req.body.module_ID;
        let exam_fk = req.body.exam_pk;
        let e_pk = req.body.e_pk;

        var query = "select sum(summary_question) as summary_question from qba.qba_summary_admin where exam_fk = " + exam_fk + " and exampaper_fk =" + e_pk + " and module_fk =(" + module_ID + ")";

        sequelize.query(query, { type: sequelize.QueryTypes.SELECT })
            .then(totalquestion => {
                res.send({
                    code: 0,
                    message: "success",
                    obj: totalquestion
                });
            });


    },

    getCourseList: function (req, res) {
        qba_course_master.findAll({ where: { is_active: 'Y' } }).then(courseList => {
            res.send({
                code: 0,
                message: "success",
                obj: courseList
            });
        })
    },

    saveCourse: function (req, res) {
        var course = req.body;
        qba_course_master.findAll({
            where: {
                [Op.or]: { qba_course_code: { [Op.iLike]: course.courseCode }, qba_course_name: { [Op.iLike]: course.courseName } },
                is_active: 'Y'
            }
        })
            .then(courseDetails => {
                if (courseDetails.length == 0) {
                    var params = {
                        qba_course_code: course.courseCode,
                        qba_course_name: course.courseName,
                        is_active: 'Y',
                        audit_by: course.audit_by,
                        qba_audit_dt: new Date()
                    };
                    qba_course_master.create(params).then(course => {
                        res.send({
                            code: 0,
                            message: "success",
                            obj: course
                        })
                    })
                    return;
                }
                res.send({
                    code: 0,
                    message: "Already Exists",
                    obj: {}
                })
            })
    },

    updateCourse: function (req, res) {
        importMethods.checkValidUser(req, res);
        var course = req.body
        qba_course_master.findAll({
            where: {
                qba_course_pk: {
                    [Op.ne]: course.courseId
                },
                [Op.or]: [{ qba_course_code: course.courseCode }, { qba_course_name: course.courseName }],
                is_active: 'Y',
            }
        })
            .then(updateCourseDetails => {
                if (updateCourseDetails.length == 0) {
                    qba_course_master.update({
                        qba_course_name: course.courseName,
                        qba_course_code: course.courseCode,
                        updated_by: req.body.updated_by,
                        updated_dt: new Date()
                    }, {
                        where: {
                            qba_course_pk: course.courseId
                        }
                    }).then(updatedCourse => {
                        res.send({
                            code: 0,
                            message: "success",
                            obj: updatedCourse
                        });
                    });
                    return;
                }
                res.send({
                    code: 0,
                    message: "Already Exists",
                    obj: {}
                })
            })
    },

    removeCourse: function (req, res) {
        var course = req.body;
        qba_exam_paper.findAll({
            where: {
                qba_course_fk: course.courseId
            }
        }).then(iscousrsefkexist => {
            if (iscousrsefkexist.length >= 1) {
                res.send({
                    code: 0,
                    message: "Course exists",
                    obj: iscousrsefkexist
                })
            } else {
                qba_course_master.update({
                    is_active: 'N'
                }, {
                    where: {
                        qba_course_pk: course.courseId
                    }
                }).then(removedCourse => {
                    res.send({
                        code: 0,
                        message: "success",
                        obj: removedCourse

                    });
                });
            }
        });
    },

    searchCourse: function (req, res) {
        var course = req.body;
        var str = '';
        if (course.courseName != null && course.courseName != undefined && course.courseName != '') {
            str += "and qba_course_name ILIKE '%" + course.courseName + "%'"
        }
        if (course.courseCode != null && course.courseCode != undefined && course.courseCode != '') {
            str += "and qba_course_code ILIKE '%" + course.courseCode + "%'"
        }
        var query = "select * from qba_course_master where is_active = 'Y'" + str + " order by qba_course_code";
        sequelize.query(query, { type: sequelize.QueryTypes.SELECT })
            .then(searchedCourse => {
                res.send({
                    code: 0,
                    message: "success",
                    obj: searchedCourse
                });
            });
    },

    getSubjectList: function (req, res) {
        importMethods.checkValidUser(req, res);
        qba_subject_master.findAll({
            where: { is_active: 'Y' }
        }).then(SubjectList => {
            res.send({
                code: 0,
                message: "success",
                obj: SubjectList
            });
        });
    },

    saveSubject: function (req, res) {
        var subject = req.body;
        qba_subject_master.findAll({
            where: {
                [Op.or]: {
                    qba_subject_code: { [Op.iLike]: subject.subjectCode },
                    subject_name: { [Op.iLike]: subject.subjectName }
                },
                is_active: 'Y',
                qba_course_fk: subject.course_pk
            }
        })
            .then(subjectDetails => {
                if (subjectDetails.length == 0) {
                    var params = {
                        qba_course_fk: subject.course_pk,
                        qba_subject_code: subject.subjectCode,
                        subject_name: subject.subjectName,
                        is_active: 'Y',
                        audit_by: subject.audit_by,
                        audit_dt: new Date()
                    };
                    qba_subject_master.create(params).then(subject => {
                        res.send({
                            code: 0,
                            message: "success",
                            obj: subject
                        })
                    })
                    return;
                }
                res.send({
                    code: 0,
                    message: "Already Exists",
                    obj: {}
                })
            })
    },

    updateSubject: function (req, res) {
        importMethods.checkValidUser(req, res);
        var subject = req.body
        qba_subject_master.findAll({
            where: {
                qba_subject_pk: {
                    [Op.ne]: subject.subjectId
                },
                [Op.or]: [{ subject_name: subject.subjectName }, { qba_subject_code: subject.subjectCode }],
                is_active: 'Y',
            }
        })
            .then(subjectDetails => {
                if (subjectDetails.length == 0) {
                    qba_subject_master.update({
                        subject_name: subject.subjectName,
                        qba_subject_code: subject.subjectCode,
                        qba_course_fk: subject.course.qba_course_pk,
                        updated_by: subject.updated_by,
                        updated_dt: new Date()
                    }, {
                        where: {
                            qba_subject_pk: subject.subjectId
                        }
                    }).then(updatedsubject => {
                        res.send({
                            code: 0,
                            message: "success",
                            obj: updatedsubject
                        });
                    });
                    return;
                }
                res.send({
                    code: 0,
                    message: "Already exists",
                    obj: {}
                })
            })
    },

    removeSubject: function (req, res) {
        importMethods.checkValidUser(req, res);
        var subject = req.body;
        qba_exam_paper.findAll({
            where: {
                qba_subject_fk: subject.subjectId
            }
        }).then(issubjectfkexist => {
            if (issubjectfkexist.length >= 1) {
                res.send({
                    code: 0,
                    message: "Subject exists",
                    obj: issubjectfkexist
                })
            } else {
                qba_subject_master.update({
                    is_active: 'N'
                }, {
                    where: {
                        qba_subject_pk: subject.subjectId
                    }
                }).then(removedSubject => {
                    res.send({

                        code: 0,
                        message: "success",
                        obj: removedSubject
                    });
                });
            }
        });
    },

    checkVetterPublisherRequestStatusCulledQstnbank: function (req, res) {
        var reqParams = req.body;
        var query = "select qst_request_status,qst_request_remarks,* from culled_qstn_bank where exampaper_fk = '" + reqParams.exampaper_fk + "' and qba_module_fk in (" + reqParams.qba_module_fk + ")";
        sequelize.query(query, { type: sequelize.QueryTypes.SELECT }).then(response => {
            res.send({
                code: 0,
                message: "success",
                obj: response
            });
        });
    },

    checkVetterPublisherRequestStatusVettingLog: function (req, res) {
        var reqParams = req.body;
        var query = "select * from qba_vatting_log inner join vetting_details on (vetting_details.exampaper_fk = qba_vatting_log.exampaper_fk) " +
            "inner join (select distinct qb_id ,qba_module_fk  from  culled_qstn_bank) culled_qstn_bank on culled_qstn_bank.qb_id = qba_vatting_log.qb_id " +
            "and  length( replace (module_ids,qba_module_fk::character varying,''))!=length(module_ids) where qba_vatting_log.exampaper_fk = '" + reqParams.exampaper_fk + "' " +
            "and vetting_details.module_ids::character varying in ('" + reqParams.qba_module_fk + "') and vetting_details.vetter_fk = '" + reqParams.vetter_fk + "'";
        sequelize.query(query, { type: sequelize.QueryTypes.SELECT }).then(response => {
            res.send({
                code: 0,
                message: "success",
                obj: response
            });
        });
    },

    inActivateVettingLogStatus: function (req, res) {
        var reqParams = req.body;
        qba_vatting_log.update({
            is_active: reqParams.is_active
        }, {
            where: {
                admin_status: null,
                exampaper_fk: reqParams.exampaper_fk
            },
            returning: true,
            plain: true
        }).then(updateStaus => {
            res.send({
                code: 0,
                message: "success",
                obj: updateStaus
            });
        });
    },

    searchSubject: function (req, res) {
        importMethods.checkValidUser(req, res);
        var subject = req.body;
        var str = '';
        //course_pk
        if (subject.subjectName != null && subject.subjectName != undefined && subject.subjectName != '') {
            str += "and subject_name ILIKE '%" + subject.subjectName + "%'"
        }
        if (subject.subjectCode != null && subject.subjectCode != undefined && subject.subjectCode != '') {
            str += "and qba_subject_code ILIKE '%" + subject.subjectCode + "%'";
        }
        if (subject.courseId != null && subject.courseId != undefined && subject.courseId != '') {
            str += "and qba_course_fk = " + subject.courseId;
        }
        var query = "select *,qba_subject_master.audit_by,qba_subject_master.is_active,qba_subject_master.audit_dt,qba_subject_master.updated_by,qba_subject_master.updated_dt from qba_subject_master inner join qba_course_master on (qba_course_pk = qba_course_fk) " +
            "where qba_subject_master.is_active = 'Y'" + str + " order by qba_subject_code";
        sequelize.query(query, { type: sequelize.QueryTypes.SELECT })
            .then(searchedSubject => {
                res.send({
                    code: 0,
                    message: "success",
                    obj: searchedSubject
                });
            })
    },

    getModuleList: function (req, res) {
        importMethods.checkValidUser(req, res);
        qba_module_mstr.findAll({ where: { is_active: 'Y' } }).then(moduleList => {
            res.send({
                code: 0,
                message: "success",
                obj: moduleList
            });
        });
    },

    getTopicList: function (req, res) {
        importMethods.checkValidUser(req, res);
        qba_topic_master.findAll({ where: { is_active: 'Y' } }).then(topicList => {
            res.send({
                code: 0,
                message: "success",
                obj: topicList
            });
        });
    },

    saveTopic: function (req, res) {
        var topic = req.body;
        var query = "select * from qba_topic_master inner join qba_module_mstr on (qba_topic_master.qba_module_fk = qba_module_mstr.qba_module_pk) " +
            "inner join qba_subject_master on (qba_module_mstr.qba_subject_fk = qba_subject_master.qba_subject_pk) " +
            "inner join qba_course_master on (qba_course_master.qba_course_pk = qba_subject_master.qba_course_fk) " +
            "where qba_module_mstr.qba_module_pk = " + topic.moduleId + " and qba_module_mstr.qba_subject_fk = " + topic.qba_subject_pk + " and qba_subject_master.qba_course_fk = " + topic.qba_course_fk + " " +
            "and qba_topic_master.topic_name ILIKE '" + topic.topicName + "'";
        sequelize.query(query, { type: sequelize.QueryTypes.SELECT })

            .then(topicDetails => {
                if (topicDetails.length == 0) {
                    var params = {
                        qba_topic_code: topic.topicCode,
                        topic_name: topic.topicName,
                        is_active: 'Y',
                        audit_by: topic.audit_by,
                        audit_dt: new Date(),
                        qba_module_fk: topic.moduleId
                    };
                    qba_topic_master.create(params).then(topic => {
                        res.send({
                            code: 0,
                            message: "success",
                            obj: topic
                        })
                    })
                    return;
                }
                res.send({
                    code: 0,
                    message: "Already Exists",
                    obj: {}
                })
            })
    },

    updateTopic: function (req, res) {
        importMethods.checkValidUser(req, res);
        var topic = req.body;
        qba_topic_master.update({
            topic_name: topic.topicName,
            qba_topic_code: topic.topicCode,
            qba_module_fk: topic.moduleId,
            updated_by: topic.updated_by,
            updated_dt: new Date()
        }, {
            where: {
                qba_topic_pk: topic.topicId
            }
        }).then(updatedtopic => {
            res.send({
                code: 0,
                message: "success",
                obj: updatedtopic
            });
        });
    },


    removeTopic: function (req, res) {
        importMethods.checkValidUser(req, res);
        var topic = req.body;
        qba_topic_master.update({
            is_active: 'N'
        }, {
            where: {
                qba_topic_pk: topic.topicId
            }
        }).then(removedTopic => {
            res.send({
                code: 0,
                message: "success",
                obj: removedTopic
            });
        });
    },

    searchTopic: function (req, res) {
        importMethods.checkValidUser(req, res);
        var topic = req.body;
        var str = '';
        if (topic.topicName != null && topic.topicName != undefined && topic.topicName != '') {
            str += "and topic_name ILIKE '%" + topic.topicName + "%'"
        }
        if (topic.topicCode != null && topic.topicCode != undefined && topic.topicCode != '') {
            str += "and qba_topic_code = " + topic.topicCode;
        }
        if (topic.courseId != null && topic.courseId != undefined && topic.courseId != '') {
            str += "and qba_course_fk = " + topic.courseId;
        }
        if (topic.subjectId != null && topic.subjectId != undefined && topic.subjectId != '') {
            str += "and qba_subject_fk = " + topic.subjectId;
        }
        if (topic.moduleId != null && topic.moduleId != undefined && topic.moduleId != '') {
            str += "and qba_module_fk = " + topic.moduleId;
        }
        var query = "select *,qba_topic_master.updated_by,qba_topic_master.is_active,qba_topic_master.updated_dt from qba_topic_master inner join qba_module_mstr on (qba_module_pk = qba_module_fk) " +
            "inner join qba_subject_master on (qba_subject_pk = qba_subject_fk) " +
            "inner join qba_course_master on (qba_course_pk = qba_course_fk) " +
            "where qba_topic_master.is_active = 'Y'" + str + " order by qba_topic_code";
        sequelize.query(query, { type: sequelize.QueryTypes.SELECT })
            .then(searchedTopic => {
                res.send({
                    code: 0,
                    message: "success",
                    obj: searchedTopic
                });
            })
    },

    saveModule: function (req, res) {
        var module = req.body;
        qba_module_mstr.findAll({
            where: {
                qba_subject_fk: module.subjectId,
                module_name: { [Op.iLike]: module.moduleName },
                is_active: 'Y'
            }
        })
            .then(moduleDetails => {
                if (moduleDetails.length == 0) {
                    var params = {
                        module_name: module.moduleName,
                        qba_subject_fk: module.subjectId,
                        is_active: 'Y',
                        audit_by: module.audit_by,
                        audit_dt: new Date()
                    };
                    qba_module_mstr.create(params).then(module => {
                        res.send({
                            code: 0,
                            message: "success",
                            obj: module
                        })
                    })
                    return;
                }
                res.send({
                    code: 0,
                    message: "Already Exists",
                    obj: {}
                })
            })
    },

    updateModule: function (req, res) {
        importMethods.checkValidUser(req, res);
        var module = req.body;
        qba_module_mstr.update({
            module_name: module.moduleName,
            qba_subject_fk: module.subjectId.qba_subject_pk,
            updated_by: module.updated_by,
            updated_dt: new Date()
        }, {
            where: {
                qba_module_pk: module.moduleId
            }
        }).then(updatedModule => {
            res.send({
                code: 0,
                message: "success",
                obj: updatedModule
            });
        });
    },

    removeModule: function (req, res) {
        importMethods.checkValidUser(req, res);
        var module = req.body;
        qba_module_mstr.update({
            is_active: 'N'
        }, {
            where: {
                qba_module_pk: module.moduleId
            }
        }).then(removedModule => {
            res.send({
                code: 0,
                message: "success",
                obj: removedModule
            });
        });
    },

    searchModule: function (req, res) {
        importMethods.checkValidUser(req, res);
        var module = req.body;
        var str = '';
        if (module.moduleName != null && module.moduleName != undefined && module.moduleName != '') {
            str += "and module_name ILIKE '%" + module.moduleName + "%'"
        }
        if (module.subjectId != null && module.subjectId != undefined && module.subjectId != '') {
            str += "and qba_subject_fk = " + module.subjectId;
        }
        var query = "select *,qba_module_mstr.updated_by,qba_module_mstr.updated_dt,qba_module_mstr.audit_by,qba_module_mstr.audit_dt from qba_module_mstr inner join qba_subject_master on (qba_subject_pk = qba_subject_fk) " +
            "where qba_subject_master.is_active = 'Y' and qba_module_mstr.is_active = 'Y'" + str + " order by module_name";
        sequelize.query(query, { type: sequelize.QueryTypes.SELECT })
            .then(searchedModule => {
                res.send({
                    code: 0,
                    message: "success",
                    obj: searchedModule
                });
            })
    },
    addUserForUserMaster: function (req, res) {
        var reqParams = req.body;
        var createUser = {
            user_id: reqParams.userName,
            user_password: bcrypt.hashSync(reqParams.userPassword),
            first_name: reqParams.firstName,
            middle_name: reqParams.middleName,
            last_name: reqParams.lastName,
            user_status: 'A',
            audit_by: reqParams.audit_by,
            audit_dt: new Date(),
            address: reqParams.userAddress,
            email_id: reqParams.userEmailaddress,
            mobile_no: reqParams.userMobileno,
            selectedUserrole: reqParams.selectedUserrole
        }
        User.findAll({ where: { user_id: reqParams.userName } }).then(checkResponse => {
            if (checkResponse.length == 0) {
                User.create(createUser).then(insertResponse => {
                    um_user_role_mapping.create({
                        user_fk: insertResponse.user_pk,
                        role_fk: createUser.selectedUserrole.role_pk,
                        audit_by: "SYSTEM",
                        audit_dt: new Date()
                    }).then(addUserRole => {
                        res.send({
                            code: 0,
                            message: "success",
                            obj: addUserRole
                        });

                    });
                });
            } else {
                res.send({
                    code: 1,
                    message: "User name already exists!",
                    obj: []
                })
            }
        });
    },

    loadUserFromUserMaster: function (req, res) {

        var str = "";
        var reqParams = req.body;
        if (reqParams.userName != undefined && reqParams.userName != '' && (reqParams.userName != undefined && reqParams.userName != '')) {
            str += "and user_id ILIKE '%" + reqParams.userName + "%'";
        }
        else if (reqParams.firstName != undefined && reqParams.firstName != '' && (reqParams.firstName != undefined && reqParams.firstName != '')) {
            str += "and first_name ILIKE '%" + reqParams.firstName + "%'";
        }
        else if (reqParams.lastName != undefined && reqParams.lastName != '') {
            str += "and last_name ILIKE '%" + reqParams.lastName + "%'";
        }
        else if (reqParams.userAddress != undefined && reqParams.userAddress != '') {
            str += "and address ILIKE '%" + reqParams.userAddress + "%'";
        }
        else if (reqParams.userEmailaddress != undefined && reqParams.userEmailaddress != '') {
            str += "and email_id ILIKE '%" + reqParams.userEmailaddress + "'";
        }
        else if (reqParams.userMobileno != undefined && reqParams.userMobileno != '') {
            str += "and mobile_no ILIKE '%" + reqParams.userMobileno + "%' or mobile_no = '" + reqParams.userMobileno + "'";
        }
        else if (reqParams.selectedUserrole != undefined && reqParams.selectedUserrole != '' && reqParams.selectedUserrole.role_name != undefined) {
            str += "and role_name = '" + reqParams.selectedUserrole.role_name + "'";
        }

        var query = "select um_user_mstr.user_pk,um_user_mstr.user_id,um_user_mstr.user_password,um_user_mstr.user_salutation,um_user_mstr.first_name, " +
            "um_user_mstr.middle_name,um_user_mstr.last_name,um_user_mstr.user_status,um_user_mstr.audit_by,um_user_mstr.audit_dt,um_user_mstr.address,um_user_mstr.updated_by,um_user_mstr.updated_dt, " +
            "um_user_mstr.email_id,um_user_mstr.mobile_no, um_role_mstr.role_code,um_role_mstr.role_name, um_role_mstr.role_type,um_role_mstr.role_pk from um_user_mstr " +
            "inner join um_user_role_mapping on (um_user_mstr.user_pk = um_user_role_mapping.user_fk) " +
            "inner join um_role_mstr on (um_role_mstr.role_pk = um_user_role_mapping.role_fk) where user_status = 'A'" + str;
        sequelize.query(query, { type: sequelize.QueryTypes.SELECT }).then(response => {
            res.send({
                code: 0,
                message: "success",
                obj: response
            });
        });
    },
    updateUserForUserMaster: function (req, res) {
        var reqParams = req.body;
        User.findAll({
            user_pk: req.body.user_pk
        }).then(response => {
            if (response.length >= 1) {
                User.update({
                    user_id: reqParams.userName,
                    user_password: bcrypt.hashSync(reqParams.userPassword),
                    first_name: reqParams.firstName,
                    middle_name: req.body.middleName,
                    last_name: reqParams.lastName,
                    user_status: 'A',
                    address: reqParams.userAddress,
                    email_id: reqParams.userEmailaddress,
                    mobile_no: reqParams.userMobileno,
                    selectedUserrole: reqParams.selectedUserrole,
                    updated_by: reqParams.updated_by,
                    updated_dt: new Date()
                },
                    {
                        where: {
                            user_pk: reqParams.user_pk
                        }
                    }
                ).then(responsetest => {
                    um_user_role_mapping.update({
                        role_fk: reqParams.selectedUserrole.role_pk
                    }, {
                        where: {
                            user_fk: reqParams.user_pk
                        }
                    }).then(updateUserRole => {
                        res.send({
                            code: 0,
                            message: "success",
                            obj: updateUserRole
                        });

                    });
                });
            }
        });
    },
    deleteUserForUserMaster: function (req, res) {
        var query = "select vetting_status from vetting_details where vetting_status='Active' and vetter_fk = (select user_pk from um_user_mstr where user_pk =" + req.body.user_pk + ") group by vetting_status"
        sequelize.query(query, { type: sequelize.QueryTypes.SELECT }).then(r => {
            if (r.length == 0) {
                User.findAll({
                    user_pk: req.body.user_pk
                }).then(response => {
                    User.update({
                        user_status: req.body.user_status
                    }, {
                        where: {
                            user_pk: req.body.user_pk
                        },
                    });
                }).then(affectedRows => {
                    // affectedRows will be 2
                    return User.findAll({
                        where: {
                            user_status: 'A'
                        }
                    });
                }).then(tasks => {
                    res.send({
                        code: 0,
                        message: "success",
                        obj: tasks
                    });
                });
            }
            else {
                res.send({
                    code: 1,
                    message: "failed"
                });
            }
        })
    },

    loadUserRoleMaster: function (req, res) {
        var query = "select * from um_role_mstr where role_status = 'A'";
        sequelize.query(query, { type: sequelize.QueryTypes.SELECT }).then(response => {
            res.send({
                code: 0,
                message: "success",
                obj: response
            });
        });
    },

    is_addquestion_left: function (req, res) {
        var reqParams = req.body;
        var module = req.body.module_id;

        var moduleCondition = "";
        if (module != null && module != '') {

            moduleCondition = "and qba_module_fk IN (" + module + ")";

        }

        var query = "select count(1) as count from culled_qstn_bank " +
            "where qst_lang='ENGLISH' and exam_fk = " + reqParams.exam_fk + " " +
            "and exampaper_fk = " + reqParams.exampaper_fk + " and qst_body = '' " + moduleCondition + ";";
        sequelize.query(query, { type: sequelize.QueryTypes.SELECT }).then(response => {
            res.send({
                code: 0,
                message: "success",
                obj: response
            });
        });
    },

    exoportParentQuestionsInSifyFormat: function (req, res) {
        var params = req.body;
        var examstatus = req.body.examstatus;
        let language = req.body.language;
        var filepath = rootPath + '/public/images/products/image/';
        var filepath1 = rootPath + '/server/controllers/output/';
        var count = 0;
        if (examstatus == 'N') {
            var count_query = "select count(*) as count from culled_qstn_bank where exampaper_fk = '" + parseInt(req.body.examPaper) + "' and qst_lang = '" + language + "' and pub_status = 'A' and (qst_type = 'M' or (qst_type = 'CS' and qst_pid != 0)) "
            sequelize.query(count_query, { type: sequelize.QueryTypes.SELECT })
                .then(count_data => {
                    count = parseInt(count_data[0].count) + 1
                })
            var expQuery = "SELECT row_number() over(order by qb.qba_module_fk, qb.qba_topic_fk, qb_id) as id, qb_id, qba_course_code, qba_topic_code, qba_subject_code, qst_body, no_of_question, marks,question_image " +
                "FROM (SELECT p.qst_type, p.qst_lang, (case when p.qb_id = 0 then null else p.qb_id end ), p.qba_course_fk, p.qba_subject_fk, p.qba_topic_fk,p.qba_module_fk, p.qb_pk, count(c.qb_id) as no_of_question, p.qst_body, SUM(c.qst_marks) as marks,max(b2.qbi_image_name) as question_image  " +
                "FROM culled_qstn_bank p " +
                "LEFT JOIN (select qbank_images.qbi_image_name,qstn_bank.qb_pk from qbank_images left join qstn_bank on qstn_bank.qst_img_fk = qbank_images.qbi_pk) b2 on (b2.qb_pk= p.qb_pk)" +
                "INNER JOIN culled_qstn_bank c ON (p.qb_id = c.qst_pid and c.qst_lang = '" + language + "' and c.pub_status = \'A\') " +
                "WHERE p.exampaper_fk = '" + parseInt(req.body.examPaper) + "' " +
                "AND c.exampaper_fk = '" + parseInt(req.body.examPaper) + "' " +
                "AND p.qst_type = 'CS'  and p.qst_lang = '" + language + "'  and p.pub_status = \'A\'" +
                "GROUP BY p.qst_type, p.qst_lang,p.qb_id, p.qba_course_fk, p.qba_subject_fk, p.qba_topic_fk,p.qba_module_fk, p.no_of_question, p.qst_body,p.qb_pk " +
                ") as qb " +
                "INNER JOIN qba_course_master ON (qb.qba_course_fk = qba_course_master.qba_course_pk) " +
                "INNER JOIN qba_subject_master ON (qb.qba_subject_fk = qba_subject_master.qba_subject_pk) " +
                "INNER JOIN qba_topic_master ON (qb.qba_topic_fk = qba_topic_master.qba_topic_pk) " +
                "INNER JOIN qba_module_mstr ON (qb.qba_module_fk = qba_module_mstr.qba_module_pk) " +
                "WHERE qst_type = 'CS' and qst_lang = '" + language + "' order by qb.qba_module_fk, qb.qba_topic_fk, qb_id";
        }
        else {
            var count_query = "select count(*) as count from culled_qstn_bank where exampaper_fk = '" + parseInt(req.body.examPaper) + "' and qst_lang = '" + language + "' and admin_status = 'A' and (qst_type = 'M' or (qst_type = 'CS' and qst_pid != 0)) "
            sequelize.query(count_query, { type: sequelize.QueryTypes.SELECT })
                .then(count_data => {
                    count = parseInt(count_data[0].count) + 1
                })
            var expQuery = "SELECT row_number() over(order by qb.qba_module_fk, qb.qba_topic_fk, qb_id) as id, qb_id, qba_course_code, qba_topic_code, qba_subject_code, qst_body, no_of_question, marks,question_image " +
                "FROM (SELECT p.qst_type, p.qst_lang, (case when p.qb_id = 0 then null else p.qb_id end ), p.qba_course_fk, p.qba_subject_fk, p.qba_topic_fk,p.qba_module_fk, p.qb_pk, count(c.qb_id) as no_of_question, p.qst_body, SUM(c.qst_marks) as marks,max(b2.qbi_image_name) as question_image  " +
                "FROM culled_qstn_bank p " +
                "LEFT JOIN (select qbank_images.qbi_image_name,qstn_bank.qb_pk from qbank_images left join qstn_bank on qstn_bank.qst_img_fk = qbank_images.qbi_pk) b2 on (b2.qb_pk= p.qb_pk)" +
                "INNER JOIN culled_qstn_bank c ON (p.qb_id = c.qst_pid and c.qst_lang = '" + language + "' and c.admin_status = \'A\') " +
                "WHERE p.exampaper_fk = '" + parseInt(req.body.examPaper) + "' " +
                "AND c.exampaper_fk = '" + parseInt(req.body.examPaper) + "' " +
                "AND p.qst_type = 'CS'  and p.qst_lang = '" + language + "'  and p.admin_status = \'A\'" +
                "GROUP BY p.qst_type, p.qst_lang,p.qb_id, p.qba_course_fk, p.qba_subject_fk, p.qba_topic_fk,p.qba_module_fk, p.no_of_question, p.qst_body,p.qb_pk " +
                ") as qb " +
                "INNER JOIN qba_course_master ON (qb.qba_course_fk = qba_course_master.qba_course_pk) " +
                "INNER JOIN qba_subject_master ON (qb.qba_subject_fk = qba_subject_master.qba_subject_pk) " +
                "INNER JOIN qba_topic_master ON (qb.qba_topic_fk = qba_topic_master.qba_topic_pk) " +
                "INNER JOIN qba_module_mstr ON (qb.qba_module_fk = qba_module_mstr.qba_module_pk) " +
                "WHERE qst_type = 'CS' and qst_lang = '" + language + "' order by qb.qba_module_fk, qb.qba_topic_fk, qb_id";
        }
        sequelize.query(expQuery, { type: sequelize.QueryTypes.SELECT })
            .then(expData => {
                if (expData.length > 0) {

                    var k = 0;
                    var xlsxExprtData = [];
                    var imgFileNames = [];
                    for (var i = 0; i < expData.length; i++) {
                        xlsxExprtData[k] = {};
                        xlsxExprtData[k]['id'] = count
                        count += 1
                        if (expData[i].qb_id == null) {
                            xlsxExprtData[k]['case_id'] = parseInt(expData[i].id);
                        } else {
                            xlsxExprtData[k]['case_id'] = parseInt(expData[i].id);
                        }

                        xlsxExprtData[k]['exam_code'] = expData[i].qba_course_code;
                        xlsxExprtData[k]['subject_code'] = expData[i].qba_subject_code;
                        xlsxExprtData[k]['section_code'] = expData[i].qba_topic_code;

                        if (expData[i]["qst_body"].includes("<img")) {
                            if (expData[i]["qst_body"].includes('<del ')) {
                                let start = parseInt(expData[i]["qst_body"].search('<del '));
                                let end = parseInt(expData[i]["qst_body"].search('</del>')) + parseInt(6);
                                expData[i]["qst_body"] = expData[i]["qst_body"].replace(expData[i]["qst_body"].slice(start, end), "");
                                xlsxExprtData[k]['case_text'] = striptags(expData[i].qst_body)
                            }
                            if (expData[i]["qst_body"].includes('src="/images/products/image/')) {
                                let start = parseInt(expData[i]["qst_body"].search(' src="/images/products/image/')) + parseInt(29);
                                let end = expData[i]["qst_body"].search('" style=');
                                let filename = expData[i]["qst_body"].substring(start, end).replace(/[&\/\\#,+()$~%'":*?<>{}]/g, "").trim();


                                if (fs.existsSync(filepath + filename)) {
                                    xlsxExprtData[k]['case_text'] = (expData[i].qst_body.replace(/<img[^>]*>/g, "")) + " [img]" + filename + "[/img]";
                                    imgFileNames.push(filename);
                                }
                                else {
                                    xlsxExprtData[k]['case_text'] = (expData[i].qst_body.replace(/<img[^>]*>/g, ""));
                                }
                            }
                            if (expData[i]["qst_body"].includes('src="static/controllers/output/')) {
                                let start = parseInt(expData[i]["qst_body"].search('output/')) + parseInt(7);
                                let end = expData[i]["qst_body"].search('" style=');
                                if (end == -1)
                                    end = expData[i]["qst_body"].search('>');
                                let filename = expData[i]["qst_body"].substring(start, end).replace(/[&\/\\#,+()$~%'":*?<>{}]/g, "").trim();

                                if (fs.existsSync(filepath1 + filename)) {
                                    xlsxExprtData[k]['case_text'] = (expData[i].qst_body.replace(/<img[^>]*>/g, "")) + " [img]" + filename + "[/img]";
                                    imgFileNames.push(filename);
                                }
                                else {
                                    xlsxExprtData[k]['case_text'] = (expData[i].qst_body.replace(/<img[^>]*>/g, ""));
                                }
                            }
                        } else {
                            xlsxExprtData[k]['case_text'] = (expData[i].qst_body);
                        }
                        if (expData[i].marks - Math.floor(expData[i].marks) == 0) {
                            xlsxExprtData[k]['case_marks'] = parseInt(expData[i].marks);
                        }
                        else {
                            xlsxExprtData[k]['case_marks'] = expData[i].marks;
                        }
                        if (expData[i].question_image != null) {
                            imgFileNames.push(expData[i].question_image.trim());
                        }
                        k++
                    }
                    var fields = [];

                    for (var m in xlsxExprtData[0]) fields.push(m);
                    var xlsfilename = "sify_case" + (new Date).getTime() + ".xlsx";
                    var xls = json2xls(xlsxExprtData, { fields: fields });
                    fs.writeFileSync(rootPath + '/uploads/csv_download/' + xlsfilename, xls, 'binary');

                    var csvfilepath = rootPath + '/uploads/csv_download/' + xlsfilename;

                    var getStream = function (fileName) {
                        return fs.readFileSync(fileName);
                    }
                    function onlyUnique(value, index, self) {
                        return self.indexOf(value) === index;
                    }
                    var uniqueImages = imgFileNames.filter(onlyUnique);
                    var output = fs.createWriteStream(rootPath + '/uploads/csv_download/sify_case.zip');
                    var archive = archiver('zip');
                    archive.pipe(output);
                    archive.on('error', function (err) {
                        throw err;
                    });
                    archive.append(getStream(csvfilepath), { name: xlsfilename });
                    for (var k in uniqueImages) {
                        var img = rootPath + '/server/controllers/output/' + uniqueImages[k];
                        var img1 = rootPath + '/public/images/products/image/' + uniqueImages[k];
                        if (fs.existsSync(img)) {
                            archive.append(getStream(img), { name: uniqueImages[k] });
                        }
                        else if (fs.existsSync(img1)) {
                            archive.append(getStream(img1), { name: uniqueImages[k] });
                        }
                    }
                    archive.finalize();
                    //archiver code end
                    output.on('close', function () {
                        res.send({
                            code: 1,
                            message: "success",
                            obj: "/uploads/csv_download/sify_case.zip",
                            data: expData
                        });
                    });
                } else {
                    res.send({
                        code: 0,
                        message: "success",
                        obj: ""
                    })
                }


            })
    },

    exoportChildQuestionsInSifyFormat: function (req, res) {
        let language = req.body.language;
        var params = req.body;
        var examstatus = req.body.examstatus
        var filecheck = rootPath + '/public/images/products/image/';
        var filepath = rootPath + '/public/images/products/image/';
        var filepath1 = rootPath + '/server/controllers/output/';
        var data_qb_id = req.body.data_qb_id
        if (examstatus == 'A') {
            var expQuery = "SELECT row_number() over(order by qst_type,qba_module_mstr.module_name,qba_topic_code,case when qst_type='M' then qst_marks end,qb_id) as id, qb_id, (case when qst_pid= 0 then null else qst_pid end) as case_id,qba_course_code,qba_subject_code,qba_topic_code,qst_body, " +
                "MAX(CASE WHEN o.qta_order = 1 THEN o.qta_alt_desc ELSE NULL END) as opt1, " +
                "MAX(CASE WHEN o.qta_order = 2 THEN o.qta_alt_desc ELSE NULL END) as opt2, " +
                "MAX(CASE WHEN o.qta_order = 3 THEN o.qta_alt_desc ELSE NULL END) as opt3, " +
                "MAX(CASE WHEN o.qta_order = 4 THEN o.qta_alt_desc ELSE NULL END) as opt4, " +
                "(SELECT qta_order FROM culled_qstn_alternatives a WHERE a.qta_id = o.qta_id and a.qta_qst_id = o.qta_qst_id AND " +
                "a.qta_is_corr_alt = 'Y' and a.exampaper_fk = '" + parseInt(req.body.examPaper) + "' and a.exam_fk = '" + parseInt(req.body.exam_fk) + "' and o.qta_id = cqb.qb_id) as qta_is_corr_alt1, " +
                "qst_marks, " +
                "MAX(CASE WHEN qst_type = \'CS\' THEN \'Y\' ELSE \'N\' END) as case_type " +
                "FROM culled_qstn_bank cqb " +
                "INNER JOIN qba_course_master ON (cqb.qba_course_fk = qba_course_master.qba_course_pk) " +
                "INNER JOIN qba_subject_master ON (cqb.qba_subject_fk = qba_subject_master.qba_subject_pk) " +
                "INNER JOIN qba_topic_master ON (cqb.qba_topic_fk = qba_topic_master.qba_topic_pk) " +
                "INNER JOIN qba_module_mstr on (cqb.qba_module_fk = qba_module_mstr.qba_module_pk) " +
                "INNER JOIN culled_qstn_alternatives o ON (o.qta_qst_id = cqb.qb_pk and o.qta_id = cqb.qb_id and o.exampaper_fk = cqb.exampaper_fk and o.exam_fk = cqb.exam_fk) " +
                "WHERE ((qst_pid != 0 and admin_status = 'A'  and cqb.exampaper_fk = '" + parseInt(req.body.examPaper) + "' and cqb.exam_fk = '" + parseInt(req.body.exam_fk) + "') or qst_type = 'M' and cqb.exampaper_fk = '" + parseInt(req.body.examPaper) + "' and cqb.exam_fk = '" + parseInt(req.body.exam_fk) + "' and admin_status = 'A') and cqb.qst_lang = '" + language + "' " +
                "GROUP BY qb_id,qst_pid, qba_course_code, qba_subject_code,qba_topic_code, qst_body, qst_marks, o.qta_qst_id, o.qta_id,qba_module_mstr.module_name,qst_type " +
                "ORDER BY qst_type,qba_module_mstr.module_name,qba_topic_code, case when qst_type='M' then qst_marks end,2,1";
        } else {
            var expQuery = "SELECT row_number() over(order by qst_type,qba_module_mstr.module_name,qba_topic_code,case when qst_type='M' then qst_marks end,qb_id) as id,qb_id, (case when qst_pid= 0 then null else qst_pid end) as case_id,qba_course_code,qba_subject_code,qba_topic_code,qst_body, " +
                "MAX(b2.qbi_image_name) question_image ," +
                "MAX(CASE WHEN o.qta_order = 1 THEN o.qta_alt_desc ELSE NULL END) as opt1, " +
                "MAX(CASE WHEN o.qta_order = 2 THEN o.qta_alt_desc ELSE NULL END) as opt2, " +
                "MAX(CASE WHEN o.qta_order = 3 THEN o.qta_alt_desc ELSE NULL END) as opt3, " +
                "MAX(CASE WHEN o.qta_order = 4 THEN o.qta_alt_desc ELSE NULL END) as opt4, " +
                "(SELECT a.qta_order FROM culled_qstn_alternatives a WHERE a.qta_id = o.qta_id  and a.qta_qst_id = o.qta_qst_id AND " +
                "a.qta_is_corr_alt = 'Y' and a.exampaper_fk = '" + parseInt(req.body.examPaper) + "' and a.exam_fk = '" + parseInt(req.body.exam_fk) + "' and o.qta_id = cqb.qb_id) as qta_is_corr_alt1, " +
                "qst_marks, " +
                "MAX(CASE WHEN qst_type = \'CS\' THEN \'Y\' ELSE \'N\' END) as case_type " +
                "FROM culled_qstn_bank cqb " +
                "LEFT JOIN (select qbank_images.qbi_image_name,qstn_bank.qb_pk from qbank_images left join qstn_bank on qstn_bank.qst_img_fk = qbank_images.qbi_pk) b2 on (b2.qb_pk= cqb.qb_pk)" +
                "INNER JOIN qba_course_master ON (cqb.qba_course_fk = qba_course_master.qba_course_pk) " +
                "INNER JOIN qba_subject_master ON (cqb.qba_subject_fk = qba_subject_master.qba_subject_pk) " +
                "INNER JOIN qba_topic_master ON (cqb.qba_topic_fk = qba_topic_master.qba_topic_pk) " +
                "INNER JOIN qba_module_mstr on (cqb.qba_module_fk = qba_module_mstr.qba_module_pk) " +
                "INNER JOIN culled_qstn_alternatives o ON (o.qta_qst_id = cqb.qb_pk and o.qta_id = cqb.qb_id and o.exampaper_fk = cqb.exampaper_fk and o.exam_fk = cqb.exam_fk) " +
                "WHERE cqb.qst_lang = '" + language + "' and cqb.pub_status = \'A\' and((qst_pid != 0   and cqb.exampaper_fk = '" + parseInt(req.body.examPaper) + "' and cqb.exam_fk = '" + parseInt(req.body.exam_fk) + "') or qst_type = 'M' and cqb.exampaper_fk = '" + parseInt(req.body.examPaper) + "' and cqb.exam_fk = '" + parseInt(req.body.exam_fk) + "'  ) " +
                "GROUP BY qb_id,qst_pid, qba_course_code, qba_subject_code,qba_topic_code, qst_body, qst_marks, o.qta_qst_id,o.qta_id,qba_module_mstr.module_name,qst_type " +
                "ORDER BY qst_type,qba_module_mstr.module_name,qba_topic_code, case when qst_type='M' then qst_marks end,2,1";
        }

        sequelize.query(expQuery, { type: sequelize.QueryTypes.SELECT })
            .then(expData => {
                if (expData.length > 0) {
                    var k = 0;
                    var xlsxExprtData = [];
                    var imgFileNames = [];
                    for (var i = 0; i < expData.length; i++) {
                        xlsxExprtData[k] = {};
                        xlsxExprtData[k]['question_id'] = parseInt(expData[i].id);
                        if (expData[i].case_id == null) {
                            xlsxExprtData[k]['case_id'] = expData[i].case_id;
                        } else {
                            for (var z = 0; z < data_qb_id.length; z++) {
                                if (parseInt(expData[i].case_id) == parseInt(data_qb_id[z].qb_id)) {
                                    xlsxExprtData[k]['case_id'] = parseInt(data_qb_id[z].id)
                                    break
                                }
                            }
                        }

                        xlsxExprtData[k]['exam_code'] = expData[i].qba_course_code;
                        xlsxExprtData[k]['subject_code'] = expData[i].qba_subject_code;
                        xlsxExprtData[k]['section_code'] = expData[i].qba_topic_code;
                        if (expData[i].qst_body == null) {
                            xlsxExprtData[k]['question_text'] = expData[i].qst_body;
                        }
                        else if (expData[i].qst_body.includes("<img")) {
                            if (expData[i]["qst_body"].includes('<del ')) {
                                let start = parseInt(expData[i]["qst_body"].search('<del '));
                                let end = parseInt(expData[i]["qst_body"].search('</del>')) + parseInt(6);
                                expData[i]["qst_body"] = expData[i]["qst_body"].replace(expData[i]["qst_body"].slice(start, end), "");
                                xlsxExprtData[k]['question_text'] = striptags(expData[i].qst_body);
                            }
                            if (expData[i].qst_body.includes('src="/images/products/image/')) {
                                let start = parseInt(expData[i].qst_body.search(' src="/images/products/image/')) + parseInt(29);
                                let end = expData[i].qst_body.search('" style=');
                                let filename = expData[i].qst_body.substring(start, end).replace(/[&\/\\#,+()$~%'":*?<>{}]/g, "").trim();


                                if (fs.existsSync(filepath + filename)) {
                                    imgFileNames.push(filename);
                                    xlsxExprtData[k]['question_text'] = expData[i].qst_body.replace(/<img[^>]*>/g, "");
                                    xlsxExprtData[k]['question_text'] = (xlsxExprtData[k]['question_text'] + " [img]" + filename + "[/img]");

                                }
                                else {
                                    xlsxExprtData[k]['question_text'] = expData[i].qst_body;
                                }
                            }
                            if (expData[i].qst_body.includes('src="static/controllers/output/')) {
                                let start = parseInt(expData[i].qst_body.search('output/')) + parseInt(7);
                                let end = expData[i].qst_body.search('" style=');
                                if (end == -1)
                                    end = expData[i].qst_body.search('>');
                                let filename = expData[i].qst_body.substring(start, end).replace(/[&\/\\#,+()$~%'":*?<>{}]/g, "").trim();

                                if (fs.existsSync(filepath1 + filename)) {
                                    imgFileNames.push(filename);
                                    xlsxExprtData[k]['question_text'] = expData[i].qst_body.replace(/<img[^>]*>/g, "");
                                    xlsxExprtData[k]['question_text'] = (xlsxExprtData[k]['question_text'] + " [img]" + filename + "[/img]");
                                }
                                else {
                                    xlsxExprtData[k]['question_text'] = expData[i].qst_body;
                                }
                            }
                        } else {
                            xlsxExprtData[k]['question_text'] = expData[i].qst_body;
                        }
                        if (expData[i].opt1 == null) {
                            xlsxExprtData[k]['option_1'] = expData[i].opt1;
                        }
                        else if (expData[i].opt1.includes("<img")) {
                            if (expData[i].opt1.includes('<del ')) {
                                let start = parseInt(expData[i].opt1.search('<del '));
                                let end = parseInt(expData[i].opt1.search('</del>')) + parseInt(6);
                                expData[i].opt1 = expData[i].opt1.replace(expData[i].opt1.slice(start, end), "");
                                xlsxExprtData[k]['option_1'] = striptags(expData[i].opt1);
                            }
                            if (expData[i].opt1.includes('src="/images/products/image/')) {
                                let start = parseInt(expData[i].opt1.search(' src="/images/products/image/')) + parseInt(29);
                                let end = expData[i].opt1.search('" style=');
                                let filename = expData[i].opt1.substring(start, end).replace(/[&\/\\#,+()$~%'":*?<>{}]/g, "").trim();


                                if (fs.existsSync(filepath + filename)) {
                                    xlsxExprtData[k]['option_1'] = expData[i].opt1.replace(/<img[^>]*>/g, "") + " [img]" + filename + "[/img]";

                                    imgFileNames.push(filename);
                                }
                                else {
                                    xlsxExprtData[k]['option_1'] = expData[i].opt1.replace(/<img[^>]*>/g, "");
                                }
                            }
                            if (expData[i].opt1.includes('src="static/controllers/output/')) {
                                let start = parseInt(expData[i].opt1.search('output/')) + parseInt(7);
                                let end = expData[i].opt1.search('" style=');
                                if (end == -1)
                                    end = expData[i].opt1.search('>');
                                let filename = expData[i].opt1.substring(start, end).replace(/[&\/\\#,+()$~%'":*?<>{}]/g, "").trim();

                                if (fs.existsSync(filepath1 + filename)) {
                                    xlsxExprtData[k]['option_1'] = expData[i].opt1.replace(/<img[^>]*>/g, "") + " [img]" + filename + "[/img]";
                                    imgFileNames.push(filename);
                                }
                                else {
                                    xlsxExprtData[k]['option_1'] = expData[i].opt1.replace(/<img[^>]*>/g, "");
                                }
                            }
                        }
                        else if (expData[i].opt1.includes("<img") == false) {
                            xlsxExprtData[k]['option_1'] = (expData[i].opt1);
                        }
                        else {
                            xlsxExprtData[k]['option_1'] = "";
                        }
                        if (expData[i].opt2 == null) {
                            xlsxExprtData[k]['option_2'] = expData[i].opt2;
                        }
                        else if (expData[i].opt2.includes("<img")) {
                            if (expData[i].opt2.includes('<del ')) {
                                let start = parseInt(expData[i].opt2.search('<del '));
                                let end = parseInt(expData[i].opt2.search('</del>')) + parseInt(6);
                                expData[i].opt2 = expData[i].opt2.replace(expData[i].opt2.slice(start, end), "");
                                xlsxExprtData[k]['option_2'] = striptags(expData[i].opt2);
                            }
                            if (expData[i].opt2.includes('src="/images/products/image/')) {
                                let start = parseInt(expData[i].opt2.search(' src="/images/products/image/')) + parseInt(29);
                                let end = expData[i].opt2.search('" style=');
                                let filename = expData[i].opt2.substring(start, end).replace(/[&\/\\#,+()$~%'":*?<>{}]/g, "").trim();


                                if (fs.existsSync(filepath + filename)) {
                                    xlsxExprtData[k]['option_2'] = expData[i].opt2.replace(/<img[^>]*>/g, "") + " [img]" + filename + "[/img]";
                                    imgFileNames.push(filename);
                                }
                                else {
                                    xlsxExprtData[k]['option_2'] = expData[i].opt2;
                                }
                            }
                            if (expData[i].opt2.includes('src="static/controllers/output/')) {
                                let start = parseInt(expData[i].opt2.search('output/')) + parseInt(7);
                                let end = expData[i].opt2.search('" style=');
                                if (end == -1)
                                    end = expData[i].opt2.search('>');
                                let filename = expData[i].opt2.substring(start, end).replace(/[&\/\\#,+()$~%'":*?<>{}]/g, "").trim();

                                if (fs.existsSync(filepath1 + filename)) {
                                    xlsxExprtData[k]['option_2'] = expData[i].opt2.replace(/<img[^>]*>/g, "") + " [img]" + filename + "[/img]";
                                    imgFileNames.push(filename);
                                }
                                else {
                                    xlsxExprtData[k]['option_2'] = expData[i].opt2;
                                }
                            }
                        }
                        else if (expData[i].opt2.includes("<img") == false) {
                            xlsxExprtData[k]['option_2'] = (expData[i].opt2);
                        }
                        else {
                            xlsxExprtData[k]['option_2'] = "";
                        }
                        if (expData[i].opt3 == null) {
                            xlsxExprtData[k]['option_3'] = expData[i].opt3;
                        }
                        else if (expData[i].opt3.includes("<img")) {
                            if (expData[i].opt3.includes('<del ')) {
                                let start = parseInt(expData[i].opt3.search('<del '));
                                let end = parseInt(expData[i].opt3.search('</del>')) + parseInt(6);
                                expData[i].opt3 = expData[i].opt3.replace(expData[i].opt3.slice(start, end), "");
                                xlsxExprtData[k]['option_3'] = striptags(expData[i].opt3);
                            }
                            if (expData[i].opt3.includes('src="/images/products/image/')) {
                                let start = parseInt(expData[i].opt3.search(' src="/images/products/image/')) + parseInt(29);
                                let end = expData[i].opt3.search('" style=');
                                let filename = expData[i].opt3.substring(start, end).replace(/[&\/\\#,+()$~%'":*?<>{}]/g, "").trim();


                                if (fs.existsSync(filepath + filename)) {
                                    xlsxExprtData[k]['option_3'] = expData[i].opt3.replace(/<img[^>]*>/g, "") + " [img]" + filename + "[/img]";
                                    imgFileNames.push(filename);
                                }
                                else {
                                    xlsxExprtData[k]['option_3'] = expData[i].opt3;
                                }
                            }
                            if (expData[i].opt3.includes('src="static/controllers/output/')) {
                                let start = parseInt(expData[i].opt3.search('output/')) + parseInt(7);
                                let end = expData[i].opt3.search('" style=');
                                if (end == -1)
                                    end = expData[i].opt3.search('>');
                                let filename = expData[i].opt3.substring(start, end).replace(/[&\/\\#,+()$~%'":*?<>{}]/g, "").trim();

                                if (fs.existsSync(filepath1 + filename)) {
                                    xlsxExprtData[k]['option_3'] = expData[i].opt3.replace(/<img[^>]*>/g, "") + " [img]" + filename + "[/img]";
                                    imgFileNames.push(filename);
                                }
                                else {
                                    xlsxExprtData[k]['option_3'] = expData[i].opt3;
                                }
                            }
                        }
                        else if (expData[i].opt3.includes("<img") == false) {
                            xlsxExprtData[k]['option_3'] = (expData[i].opt3);
                        }
                        else {
                            xlsxExprtData[k]['option_3'] = "";
                        }
                        if (expData[i].opt4 == null) {
                            xlsxExprtData[k]['option_4'] = expData[i].opt4;
                        }
                        else if (expData[i].opt4.includes("<img")) {
                            if (expData[i].opt4.includes('<del ')) {
                                let start = parseInt(expData[i].opt4.search('<del '));
                                let end = parseInt(expData[i].opt4.search('</del>')) + parseInt(6);
                                expData[i].opt4 = expData[i].opt4.replace(expData[i].opt4.slice(start, end), "");
                                xlsxExprtData[k]['option_4'] = striptags(expData[i].opt4);
                            }
                            if (expData[i].opt4.includes('src="/images/products/image/')) {
                                let start = parseInt(expData[i].opt4.search(' src="/images/products/image/')) + parseInt(29);
                                let end = expData[i].opt4.search('" style=');
                                let filename = expData[i].opt4.substring(start, end).replace(/[&\/\\#,+()$~%'":*?<>{}]/g, "").trim();


                                if (fs.existsSync(filepath + filename)) {
                                    xlsxExprtData[k]['option_4'] = expData[i].opt4.replace(/<img[^>]*>/g, "") + " [img]" + filename + "[/img]";
                                    imgFileNames.push(filename);
                                }
                                else {
                                    xlsxExprtData[k]['option_4'] = expData[i].opt4;
                                }
                            }
                            if (expData[i].opt4.includes('src="static/controllers/output/')) {
                                let start = parseInt(expData[i].opt4.search('output/')) + parseInt(7);
                                let end = expData[i].opt4.search('" style=');
                                if (end == -1)
                                    end = expData[i].opt4.search('>');
                                let filename = expData[i].opt4.substring(start, end).replace(/[&\/\\#,+()$~%'":*?<>{}]/g, "").trim();

                                if (fs.existsSync(filepath1 + filename)) {
                                    xlsxExprtData[k]['option_4'] = expData[i].opt4.replace(/<img[^>]*>/g, "") + " [img]" + filename + "[/img]";
                                    imgFileNames.push(filename);
                                }
                                else {
                                    xlsxExprtData[k]['option_4'] = expData[i].opt4;
                                }
                            }
                        }
                        else if (expData[i].opt4.includes("<img") == false) {
                            xlsxExprtData[k]['option_4'] = (expData[i].opt4);
                        }
                        else {
                            xlsxExprtData[k]['option_4'] = "";
                        }
                        if (!expData[i].qta_is_corr_alt1) {
                            xlsxExprtData[k]['correct_answer'] = parseInt(0);
                        } else {
                            xlsxExprtData[k]['correct_answer'] = parseInt(expData[i].qta_is_corr_alt1);
                        }

                        if (expData[i].qst_marks - Math.floor(expData[i].qst_marks) == 0) {
                            xlsxExprtData[k]['marks'] = parseFloat(expData[i].qst_marks);
                        } else {
                            xlsxExprtData[k]['marks'] = expData[i].qst_marks;
                        }

                        xlsxExprtData[k]['case_type'] = expData[i].case_type;
                        // expData[i].case_type;
                        if (expData[i].question_image != null) {
                            imgFileNames.push(expData[i].question_image);
                        }
                        k++
                    }
                    var fields = [];
                    for (var m in xlsxExprtData[0]) fields.push(m);
                    var xlsfilename = "sify_child_mcq_" + (new Date).getTime() + ".xlsx";
                    var xls = json2xls(xlsxExprtData, { fields: fields });
                    fs.writeFileSync(rootPath + '/uploads/csv_download/' + xlsfilename, xls, 'binary');

                    var csvfilepath = rootPath + '/uploads/csv_download/' + xlsfilename;

                    var getStream = function (fileName) {
                        return fs.readFileSync(fileName);
                    }

                    //archiver code start
                    function onlyUnique(value, index, self) {
                        return self.indexOf(value) === index;
                    }
                    var output = fs.createWriteStream(rootPath + '/uploads/csv_download/sify_child_mcq.zip');
                    var archive = archiver('zip');
                    archive.pipe(output);
                    archive.on('error', function (err) {
                        throw err;
                    });
                    archive.append(getStream(csvfilepath), { name: xlsfilename });
                    var uniqueImages = imgFileNames.filter(onlyUnique);
                    for (var k in uniqueImages) {
                        var img = rootPath + '/server/controllers/output/' + uniqueImages[k];
                        var img1 = rootPath + '/public/images/products/image/' + uniqueImages[k];
                        if (fs.existsSync(img)) {
                            archive.append(getStream(img), { name: uniqueImages[k] });
                        }
                        else if (fs.existsSync(img1)) {
                            archive.append(getStream(img1), { name: uniqueImages[k] });
                        }
                    }
                    archive.finalize();
                    //archiver code end

                    output.on('close', function () {
                        res.send({
                            code: 1,
                            message: "success",
                            obj: "/uploads/csv_download/sify_child_mcq.zip"
                        })
                    });
                } else {
                    res.send({
                        code: 0,
                        message: "success",
                        obj: ""
                    })
                }

            })



    },

    loadPublishedExamPaper: function (req, res) {
        var query = "select case when role_fk  ='3' and vetting_status = 'Active' then 'Vetting in progress' " +
            "when role_fk  ='3' and vetting_status = 'Done' then 'Vetting done' " +
            "when role_fk  ='2' and vetting_status = 'Active' then 'Publisher in progress'" +
            "when role_fk  ='2' and vetting_status = 'Done' then 'Publisher is done' else 'culled' end progress_detail" +
            ",*,qba_exam_paper.qstnpaper_id,qba_exam_paper.exam_fk,qba_exam_paper.status,qba_course_name " +
            "from qba_exam_paper " +
            "inner join qba_subject_master on (qba_subject_master.qba_subject_pk=qba_exam_paper.qba_subject_fk) " +
            "left join qba_course_master on (qba_course_master.qba_course_pk=qba_exam_paper.qba_course_fk) " +
            "left join (select  rank()over(partition by qstnpaper_id order by audit_dt desc) rnk, vd_pk,exam_fk,vetter_fk,vetting_status,audit_by,audit_dt,module_names,module_ids,vetting_flag,summary_id_fk,qstnpaper_id," +
            "exampaper_fk  from vetting_details ) vetting_details on rnk=1 and (vetting_details.qstnpaper_id = qba_exam_paper.qstnpaper_id) " +
            "left join um_user_role_mapping on (um_user_role_mapping.user_fk = vetting_details.vetter_fk) where status = 'A' " +
            "order by created_dt";

        sequelize.query(query, { type: sequelize.QueryTypes.SELECT })
            .then(examlist => {
                res.send({
                    code: 0,
                    message: "success",
                    obj: examlist
                });
            })
    },

    loadPublishedExamPaperCulling: function (req, res) {
        var exam_fk = req.body.exam_fk;

        var query = "select case when role_fk  ='3' and vetting_status = 'Active' then 'Vetting in progress' " +
            "when role_fk  ='3' and vetting_status = 'Done' then 'Vetting done' " +
            "when role_fk  ='2' and vetting_status = 'Active' then 'Publisher in progress'" +
            "when role_fk  ='2' and vetting_status = 'Done' then 'Publisher is done' else 'culled' end progress_detail" +
            ",*,qba_exam_paper.qstnpaper_id,qba_exam_paper.exam_fk,qba_exam_paper.status,qba_course_name " +
            "from qba_exam_paper " +
            "inner join qba_subject_master on (qba_subject_master.qba_subject_pk=qba_exam_paper.qba_subject_fk) " +
            "left join qba_course_master on (qba_course_master.qba_course_pk=qba_exam_paper.qba_course_fk) " +
            "inner join exam_master on (exam_master.exam_pk = " + exam_fk + " and qba_exam_paper.qba_subject_fk = exam_master.qba_subject_fk)" +
            "left join (select  rank()over(partition by qstnpaper_id order by audit_dt desc) rnk, vd_pk,exam_fk,vetter_fk,vetting_status,audit_by,audit_dt,module_names,module_ids,vetting_flag,summary_id_fk,qstnpaper_id," +
            "exampaper_fk  from vetting_details ) vetting_details on rnk=1 and (vetting_details.qstnpaper_id = qba_exam_paper.qstnpaper_id) " +
            "left join um_user_role_mapping on (um_user_role_mapping.user_fk = vetting_details.vetter_fk) ";
        sequelize.query(query, { type: sequelize.QueryTypes.SELECT })
            .then(examlist => {
                res.send({
                    code: 0,
                    message: "success",
                    obj: examlist
                });
            })
    },

    loadModulesForVetter: function (req, res) {
        var params = req.body;

        var query = "select distinct qba_module_fk, qba_module_mstr.module_name from culled_qstn_bank " +
            "inner join qba_module_mstr on (qba_module_pk = qba_module_fk) " +
            "where exampaper_fk = '" + parseInt(req.body.examPaperId) + "' " +
            "order by qba_module_mstr.module_name";
        sequelize.query(query, { type: sequelize.QueryTypes.SELECT })
            .then(modules => {
                res.send({
                    code: 0,
                    message: "success",
                    obj: modules
                });
            })
    },

    checkForEnablePublishing: function (req, res) {
        var params = req.body;
        var query = "select case when count > 0 then 0 else 1 end as count from (select count(1) as count from vetting_details where  exampaper_fk= '" + parseInt(req.body.examPaperId) + "' and vetter_fk in (select user_fk from  um_user_role_mapping where role_fk ='" + parseInt(req.body.role_fk) + "') and vetting_status = 'Done')a"
        sequelize.query(query, { type: sequelize.QueryTypes.SELECT })
            .then(status => {
                res.send({
                    code: 0,
                    message: "success",
                    obj: status
                });
            })
    },
    insertCaseSummary: function (req, res) {
        var caseSummaryData = req.body.caseSummary;

        if (caseSummaryData != null && caseSummaryData.length > 0) {
            for (var i = 0; i < caseSummaryData.length; i++) {
                caseSummaryData[i].audit_date = now;
                if (caseSummaryData[i].short_fall_qstn < 0) {
                    caseSummaryData[i].short_fall_qstn = 0
                }
                if (caseSummaryData[i].short_fall_qstn != 0) {
                    caseSummaryData[i].child_count = caseSummaryData[i].child_count - caseSummaryData[i].short_fall_qstn * (caseSummaryData[i].child_count / caseSummaryData[i].parent_count)
                    caseSummaryData[i].summary_marks = caseSummaryData[i].summary_marks - caseSummaryData[i].short_fall_qstn * (caseSummaryData[i].summary_marks / caseSummaryData[i].parent_count)
                }
            }
            qba_case_summary_admin.bulkCreate(caseSummaryData).then(() => {
                res.send({
                    code: 0,
                    message: "success",
                    obj: {}
                })
            });
        }
    },

    loadCaseSummaryForAdmin: function (req, res) {

        importMethods.checkValidUser(req, res);
        var qpID = req.body.qpid;
        var exam_id = req.body.exam_fk;
        var exampaper_id = req.body.examPaper;
        var moduleId = req.body.moduleId;
        var moduleIds = JSON.parse("[" + moduleId + "]");
        // comment added by Dipika
        var query = "SELECT qba_topic_master.qba_topic_code as topic_code, qba_topic_master.topic_name,qba_module_mstr.module_name,sum(parent_count) as parent_count, sum(child_count)as child_count,sum(summary_marks) as summary_marks,sum(short_fall_qstn) as short_fall_qstn,(select count(qb_id) from culled_qstn_bank where exampaper_fk =\'" + exampaper_id + "\' and qb_id in (select qb_id from qba_vatting_log where qstnpaper_id =\'" + qpID + "\' and admin_status = 'Approved') and qst_pid = 0 and  qst_type = 'CS' and qst_lang = 'ENGLISH' and qba_topic_fk = qba.qba_case_summary_admin.topic_pk) as total_replace_parent_question, (select count(qb_id) from culled_qstn_bank where exampaper_fk =\'" + exampaper_id + "\' and ((qst_pid in (select qb_id from qba_vatting_log where qstnpaper_id =\'" + qpID + "\' and admin_status = 'Approved') and qst_pid != 0) or (qb_id in (select qb_id from qba_vatting_log where qstnpaper_id =\'" + qpID + "\' and admin_status = 'Approved') and qst_pid != 0)) and qst_type = 'CS' and qst_lang = 'ENGLISH' and qba_topic_fk = qba.qba_case_summary_admin.topic_pk) as total_replace_child_question, (select sum(qst_marks) from culled_qstn_bank where exampaper_fk =\'" + exampaper_id + "\' and ((qst_pid in (select qb_id from qba_vatting_log where qstnpaper_id =\'" + qpID + "\' and admin_status = 'Approved') and qst_pid != 0) or (qb_id in (select qb_id from qba_vatting_log where qstnpaper_id =\'" + qpID + "\' and admin_status = 'Approved') and qst_pid != 0)) and qst_type = 'CS' and qst_lang = 'ENGLISH' and qba_topic_fk = qba.qba_case_summary_admin.topic_pk) as total_replace_question_marks FROM qba.qba_case_summary_admin left join qba.qba_module_mstr on qba_case_summary_admin.module_fk = qba_module_mstr.qba_module_pk inner join qba_topic_master on qba_case_summary_admin.topic_pk = qba_topic_master.qba_topic_pk where qstn_paper_id =\'" + qpID + "\' AND exam_fk =\'" + exam_id + "\' AND exampaper_fk =\'" + exampaper_id + "\' group by qba_topic_master.qba_topic_code,qba_topic_master.topic_name,qba_module_mstr.module_name,qba.qba_case_summary_admin.topic_pk order by qba_module_mstr.module_name, qba_topic_master.qba_topic_code"
        sequelize.query(query, { type: sequelize.QueryTypes.SELECT })
            .then(caseSummary => {
                res.send({
                    code: 0,
                    message: "success",
                    obj: caseSummary
                });
                // We don't need spread here, since only the results will be returned for select queries
            })

        // comment added by Dipika
    },

    loadCaseSummaryForVetter: function (req, res) {
        importMethods.checkValidUser(req, res);
        var moduleId = req.body.moduleId;
        var exam_id = req.body.examId;
        var exampaper_id = req.body.exam_paper_fk;

        var moduleIds = JSON.parse("[" + moduleId + "]");
        var qstnpaper_id = req.body.qstnpaper_id;
        var query = "SELECT qba.qba_topic_master.qba_topic_code as topic_code, qba.qba_topic_master.topic_name,qba_module_mstr.module_name,sum(parent_count) as parent_count,topic_pk,sum(child_count)as child_count,sum(summary_marks) as summary_marks,sum(short_fall_qstn) as short_fall_qstn,(select count(qb_id) from culled_qstn_bank where exam_fk = \'" + exam_id + "\' AND exampaper_fk =\'" + exampaper_id + "\' and qb_id in (select qb_id from qba_vatting_log where exampaper_fk = \'" + exampaper_id + "\' and admin_status = 'Approved') and qst_type = 'CS' and qst_pid = 0 and qst_lang = 'ENGLISH' and qba_topic_fk = qba.qba_case_summary_admin.topic_pk) as total_replace_parent_question,(select count(qb_id) from culled_qstn_bank where exam_fk = \'" + exam_id + "\' AND exampaper_fk =\'" + exampaper_id + "\' and ((qst_pid in (select qb_id from qba_vatting_log where exampaper_fk = \'" + exampaper_id + "\' and admin_status = 'Approved') and qst_pid != 0) or (qb_id in (select qb_id from qba_vatting_log where exampaper_fk = \'" + exampaper_id + "\' and admin_status = 'Approved') and qst_pid != 0)) and qst_type = 'CS' and qst_lang = 'ENGLISH' and qba_topic_fk = qba.qba_case_summary_admin.topic_pk) as total_replace_child_question, (select sum(qst_marks) from culled_qstn_bank where exam_fk = \'" + exam_id + "\' AND exampaper_fk =\'" + exampaper_id + "\' and ((qst_pid in (select qb_id from qba_vatting_log where exampaper_fk = \'" + exampaper_id + "\' and admin_status = 'Approved') and qst_pid != 0) or (qb_id in (select qb_id from qba_vatting_log where exampaper_fk = \'" + exampaper_id + "\' and admin_status = 'Approved') and qst_pid != 0)) and qst_type = 'CS' and qst_lang = 'ENGLISH' and qba_topic_fk = qba.qba_case_summary_admin.topic_pk) as total_replace_question_marks FROM qba.qba_case_summary_admin left join qba.qba_module_mstr on qba_case_summary_admin.module_fk = qba_module_mstr.qba_module_pk inner join qba.qba_topic_master on (qba_case_summary_admin.topic_pk = qba.qba_topic_master.qba_topic_pk) where qstn_paper_id =\'" + qstnpaper_id + "\'  AND exam_fk = \'" + exam_id + "\' AND exampaper_fk =\'" + exampaper_id + "\' group by topic_code,qba.qba_topic_master.topic_name,qba_module_mstr.module_name,topic_pk, qba.qba_topic_master.qba_topic_code order by qba_module_mstr.module_name, qba.qba_topic_master.qba_topic_code";
        sequelize.query(query, { type: sequelize.QueryTypes.SELECT })
            .then(caseSummary => {
                var sf_count = "select qba_topic_fk,count(qb_id) from qba.culled_qstn_bank where qst_type = 'CS' and qst_pid = 0 and copied_from_repository = 'N' and exam_fk =\'" + exam_id + "\' AND exampaper_fk = \'" + exampaper_id + "\'  group by qba_topic_fk "
                sequelize.query(sf_count, { type: sequelize.QueryTypes.SELECT })
                    .then(sfcasecount => {
                        res.send({
                            code: 0,
                            message: "success",
                            obj: caseSummary,
                            shortfall_count: sfcasecount
                        });
                    })
                // We don't need spread here, since only the results will be returned for select queries
            })
    },

    loadPkQuestionForChangeLog: function (req, res) {
        var exam_pk = req.body.exam_id;
        var exampaper_pk = req.body.qid.exampaper_fk;
        var moduleId = req.body.qba_module_fk;
        var query = "select *, qta_is_corr_alt,qta_alt_desc,now() as current_time from  " +
            "(select dense_rank()over(order by  un_id) rnk,qb_pk, qba_topic_fk,qst_request_status,qst_request_remarks, qba_subject_pk, qba_course_pk, qba_module_pk, qba_course_name,subject_name,module_name,topic_name,qba_topic_code,qst_marks,qst_neg_marks, qst_lang,qst_type, " +
            "qst_pid,qst_body,qst_no_of_altr,qst_remarks,calculation_info,  reference_info,qst_is_active,qst_audit_by,qst_audit_dt,qb_id ,exam_fk as culled_exam_fk ,exampaper_fk as culled_exampaper_fk ,culled_qb_pk,copied_from_repository " +
            "from  ( select culled_qb_pk un_id,* from culled_qstn_bank a   where (case when  qst_type  = 'CS' and qst_pid  > 0  then 1 else 2 end) =2 " +
            "union ALL " +
            "select a.culled_qb_pk un_id,b.* from culled_qstn_bank a   inner join  culled_qstn_bank b on  a.qst_lang= b.qst_lang and a.qb_id=b.qst_pid  " +
            "and a.exampaper_fk=b.exampaper_fk where  a.qst_type = 'CS' and a.qst_pid = 0   )culled_qstn_bank " +
            "inner join qba_topic_master on (qba_topic_master.qba_topic_pk=culled_qstn_bank.qba_topic_fk) " +
            "inner join qba_module_mstr on (qba_module_mstr.qba_module_pk=qba_topic_master.qba_module_fk) " +
            "inner join qba_subject_master on (qba_subject_master.qba_subject_pk=qba_module_mstr.qba_subject_fk) " +
            "inner join qba_course_master on (qba_course_master.qba_course_pk=qba_subject_master.qba_course_fk) " +
            "where culled_qstn_bank.qba_module_fk IN(" + moduleId + ") and qst_is_active = 'A' and qst_lang='ENGLISH' " +
            "and culled_qstn_bank.exam_fk =" + exam_pk + " and culled_qstn_bank.exampaper_fk= " + exampaper_pk + " order by culled_qb_pk)a " +
            "left join culled_qstn_alternatives on(culled_qstn_alternatives.qta_qst_id=a.qb_pk and " +
            "culled_qstn_alternatives.exam_fk=a.culled_exam_fk and   culled_qstn_alternatives.exampaper_fk=a.culled_exampaper_fk)  " +
            " order by culled_qb_pk,qta_order";
        sequelize.query(query, { type: sequelize.QueryTypes.SELECT })
            .then(searchResult => {
                req.body.result = searchResult;
                req.body.count = 1;
                importMethods.parseQuestionBankData(req, res);
            });
    },

    retriveforgotPassword: function (req, res) {
        User.findOne({
            where: { 'user_id': req.body.user_id }
        }).then(function (result) {
            if (result == null || result == 'null') {
                res.send({
                    code: 1,
                    message: "Usernotfound",
                    obj: []
                });
            } else {
                var newPasswordHash = bcrypt.hashSync(req.body.user_password);
                User.update({
                    user_password: newPasswordHash
                }, {
                    where: {
                        user_pk: result.user_pk
                    }
                }).then(userUpdate => {
                    res.send({
                        code: 0,
                        message: "success",
                        obj: userUpdate
                    });
                });
            }
        });
    },

    updateCaseParent: function (req, res) {
        importMethods.checkValidUser(req, res);
        var requiredParams = req.body;
        qstn_bank.update({
            qst_body: requiredParams.qst_body,
            qst_audit_by: 'admin',
            qst_audit_dt: now
        }, {
            where: {
                qb_pk: requiredParams.qb_pk
            }
        }).then(updatedCaseParent => {
            res.send({
                code: 0,
                message: "success",
                obj: updatedCaseParent
            });
        });
    },

    saveQstnBankCsqChild: function (req, res) {
        importMethods.checkValidUser(req, res);
        var newChildQuestionData = req.body;
        if (!newChildQuestionData.negativeMarks) {
            newChildQuestionData.negativeMarks = 0
        }
        sequelize.query("select nextval('qb_id_val') as val", { type: sequelize.QueryTypes.SELECT })
            .then(next_qb_id => {
                var qb_id = next_qb_id[0].val;
                qstn_bank.create({
                    qst_lang: 'ENGLISH',
                    qst_sub_seq_no: '0',
                    qst_body: newChildQuestionData.question,
                    qst_marks: newChildQuestionData.marks,
                    qst_expiry_dt: new Date(),
                    qst_fk_tpc_pk: '0',
                    qst_is_active: 'A',
                    qst_audit_dt: new Date(),
                    qst_no_of_altr: newChildQuestionData.numOfAlternatives,
                    qb_assigned_to: '0',
                    qb_status_fk: '0',
                    qba_topic_fk: newChildQuestionData.topicId,
                    qba_subject_fk: newChildQuestionData.subjectId,
                    qba_course_fk: newChildQuestionData.courseId,
                    qst_type: 'CS',
                    qba_module_fk: newChildQuestionData.moduleId,
                    qst_pid: newChildQuestionData.parentId,
                    qst_audit_by: newChildQuestionData.userName,
                    author_name: newChildQuestionData.userName,
                    qst_neg_marks: newChildQuestionData.negativeMarks,
                    qb_id: qb_id,
                    qst_remarks: newChildQuestionData.remark != 0 ? newChildQuestionData.remark : null, //Newly added child question removed by shilpa
                    reference_info: newChildQuestionData.reference != 0 ? newChildQuestionData.reference : null,
                    calculation_info: newChildQuestionData.calculations != 0 ? newChildQuestionData.calculations : null,
                    no_of_question: '0',
                    qst_dimension: 'Dimension'
                }).then(result => {
                    var qb_pk = result.qb_pk;
                    var qstn_arr_alternatives = [];
                    for (var i = 1; i <= newChildQuestionData.numOfAlternatives; i++) {
                        var obj = new Object();
                        obj.qta_qst_id = qb_pk;
                        obj.qta_id = qb_id;
                        obj.qta_alt_desc = newChildQuestionData.alternatives[i - 1].text;
                        obj.qta_order = i;
                        obj.qta_is_corr_alt = newChildQuestionData.alternatives[i - 1].isCorrect;
                        obj.qta_is_active = 'Y';
                        obj.qta_audit_by = newChildQuestionData.userName;
                        obj.qta_audit_dt = new Date();
                        qstn_arr_alternatives.push(obj);
                    }
                    qstn_alternatives.bulkCreate(qstn_arr_alternatives).then((result) => {
                        res.send({
                            code: 0,
                            message: "success",
                            qb_id: qb_id
                        });
                    });
                });
            });
    },

    updateQstnBankCsqChildCount: function (req, res) {
        importMethods.checkValidUser(req, res);
        var parentQuestion = req.body;
        var query = "update qstn_bank set no_of_question = no_of_question + 1  where qb_id =  " + parentQuestion.qb_id;


        sequelize.query(query, { type: sequelize.QueryTypes.UPDATE }).then(parentQues => {

            res.send({
                code: 0,
                message: "success",
                obj: parentQues
            })

        });
    },

    saveCSQChildAdmin: function (req, res) {
        importMethods.checkValidUser(req, res);
        var newChildQuestionData = req.body;
        if (!newChildQuestionData.negativeMarks) {
            newChildQuestionData.negativeMarks = 0
        }
        var replace_id = newChildQuestionData.replace_id;
        sequelize.query("select nextval('qb_id_val') as val, nextval('s_qstnbank_qbpk') as qb_pk", { type: sequelize.QueryTypes.SELECT })
            .then(next_qb_id => {
                var qb_id = next_qb_id[0].val;
                var qb_pk = next_qb_id[0].qb_pk

                if (newChildQuestionData.parent_child_type == 'C') {
                    var userName = newChildQuestionData.userName;
                    var update = "update culled_qstn_bank set qst_request_remarks = 'Question Replaced by QB ID " + qb_id + "',qst_audit_by='" + userName + "' where qb_id = " + replace_id + " and exam_fk = " + newChildQuestionData.examFk + " and exampaper_fk=" + newChildQuestionData.exampaperFk;
                    sequelize.query(update, { type: sequelize.QueryTypes.UPDATE }).then(parentQues => { });
                }
                qstn_bank.create({
                    qst_lang: 'ENGLISH',
                    qst_sub_seq_no: '0',
                    qst_body: newChildQuestionData.question,
                    qst_marks: newChildQuestionData.marks,
                    qst_expiry_dt: new Date(),
                    qst_fk_tpc_pk: '0',
                    qst_is_active: 'A',
                    qst_audit_dt: new Date(),
                    qst_no_of_altr: newChildQuestionData.numOfAlternatives,
                    qb_assigned_to: '0',
                    qb_status_fk: '0',
                    qba_topic_fk: newChildQuestionData.topicId,
                    qba_subject_fk: newChildQuestionData.subjectId,
                    qba_course_fk: newChildQuestionData.courseId,
                    qst_type: 'CS',
                    qba_module_fk: newChildQuestionData.moduleId,
                    qst_pid: newChildQuestionData.parentId,
                    qst_audit_by: newChildQuestionData.userName,
                    author_name: newChildQuestionData.userName,
                    qst_neg_marks: newChildQuestionData.negativeMarks,
                    qb_id: qb_id,
                    qst_remarks: newChildQuestionData.remark != 0 ? newChildQuestionData.remark : null, //Newly added child question removed by shilpa
                    reference_info: newChildQuestionData.reference != 0 ? newChildQuestionData.reference : null,
                    calculation_info: newChildQuestionData.calculations != 0 ? newChildQuestionData.calculations : null,
                    no_of_question: '0',
                    qst_dimension: 'Dimension'
                }).then(question => {
                    if (newChildQuestionData.parent_child_type == 'C') { // question added when child question removed and replaced new child question
                        var query = "select culled_qb_pk from culled_qstn_bank where qb_id = " + replace_id + " and exampaper_fk = " + newChildQuestionData.exampaperFk + " and exam_fk = " + newChildQuestionData.examFk;
                        sequelize.query(query, { type: sequelize.QueryTypes.SELECT })
                            .then(next_culled_qb_id => {
                                var replaced_cullded_qb_pk = next_culled_qb_id[0].culled_qb_pk;
                                culled_qstn_bank.create({
                                    qst_lang: 'ENGLISH',
                                    qst_sub_seq_no: '0',
                                    qst_body: newChildQuestionData.question,
                                    qst_marks: newChildQuestionData.marks,
                                    qst_expiry_dt: new Date(),
                                    qst_fk_tpc_pk: '0',
                                    qst_is_active: 'A',
                                    qst_audit_dt: new Date(),
                                    qst_no_of_altr: newChildQuestionData.numOfAlternatives,
                                    qb_assigned_to: '0',
                                    qb_status_fk: '0',
                                    qba_topic_fk: newChildQuestionData.topicId,
                                    qba_subject_fk: newChildQuestionData.subjectId,
                                    qba_course_fk: newChildQuestionData.courseId,
                                    qst_type: 'CS',
                                    qba_module_fk: newChildQuestionData.moduleId,
                                    qst_pid: newChildQuestionData.parentId,
                                    qst_audit_by: newChildQuestionData.userName,
                                    author_name: newChildQuestionData.userName,
                                    qst_neg_marks: newChildQuestionData.negativeMarks,
                                    qb_id: qb_id,
                                    copied_from_repository: 'N',
                                    exam_fk: newChildQuestionData.examFk,
                                    exampaper_fk: newChildQuestionData.exampaperFk,
                                    qb_pk: qb_pk,
                                    qst_request_remarks: "Replacement of QB ID " + replace_id + " Newly added child question",
                                    reference_info: newChildQuestionData.reference != 0 ? newChildQuestionData.reference : null,
                                    calculation_info: newChildQuestionData.calculations != 0 ? newChildQuestionData.calculations : null,
                                    qst_remarks: newChildQuestionData.remark != 0 ? newChildQuestionData.remark : null,
                                    no_of_question: '0',
                                    pub_status: 'A',
                                    replace_id: replaced_cullded_qb_pk


                                }).then(result => {
                                    var arr_alternatives = [];
                                    for (var i = 1; i <= newChildQuestionData.numOfAlternatives; i++) {
                                        var obj = new Object();
                                        obj.qta_qst_id = result.qb_pk;
                                        obj.qta_id = result.qb_id;
                                        obj.qta_alt_desc = newChildQuestionData.alternatives[i - 1].text;
                                        obj.qta_order = i;
                                        obj.qta_is_corr_alt = newChildQuestionData.alternatives[i - 1].isCorrect;
                                        obj.qta_is_active = 'A';
                                        obj.qta_audit_by = newChildQuestionData.userName;
                                        obj.qta_audit_dt = new Date();
                                        obj.exam_fk = newChildQuestionData.examFk;
                                        obj.exampaper_fk = newChildQuestionData.exampaperFk;
                                        arr_alternatives.push(obj);
                                    }
                                    culled_qstn_alternatives.bulkCreate(arr_alternatives).then((question) => {
                                        var qstn_arr_alternatives = [];
                                        for (var i = 1; i <= newChildQuestionData.numOfAlternatives; i++) {
                                            var obj = new Object();
                                            obj.qta_qst_id = qb_pk;
                                            obj.qta_id = qb_id;
                                            obj.qta_alt_desc = newChildQuestionData.alternatives[i - 1].text;
                                            obj.qta_order = i;
                                            obj.qta_is_corr_alt = newChildQuestionData.alternatives[i - 1].isCorrect;
                                            obj.qta_is_active = 'A';
                                            obj.qta_audit_by = newChildQuestionData.userName;
                                            obj.qta_audit_dt = new Date();
                                            qstn_arr_alternatives.push(obj);
                                        }
                                        qstn_alternatives.bulkCreate(qstn_arr_alternatives).then((result) => {
                                            res.send({
                                                code: 0,
                                                message: "success",
                                                replace_by_qb_id: qb_id
                                            });
                                        });
                                    });
                                });
                            });
                    } else {
                        sequelize.query("select culled_qb_pk from culled_qstn_bank where qb_id = " + replace_id + " and exampaper_fk = " + newChildQuestionData.exampaperFk + " and exam_fk = " + newChildQuestionData.examFk, { type: sequelize.QueryTypes.SELECT })
                            .then(next_qb_id => {
                                var replaced_cullded_qb_pk = next_qb_id[0].culled_qb_pk;
                                var qst_request_remarks = "";
                                culled_qstn_bank.create({
                                    qst_lang: 'ENGLISH',
                                    qst_sub_seq_no: '0',
                                    qst_body: newChildQuestionData.question,
                                    qst_marks: newChildQuestionData.marks,
                                    qst_expiry_dt: new Date(),
                                    qst_fk_tpc_pk: '0',
                                    qst_is_active: 'A',
                                    qst_audit_dt: new Date(),
                                    qst_no_of_altr: newChildQuestionData.numOfAlternatives,
                                    qb_assigned_to: '0',
                                    qb_status_fk: '0',
                                    qba_topic_fk: newChildQuestionData.topicId,
                                    qba_subject_fk: newChildQuestionData.subjectId,
                                    qba_course_fk: newChildQuestionData.courseId,
                                    qst_type: 'CS',
                                    qba_module_fk: newChildQuestionData.moduleId,
                                    qst_pid: newChildQuestionData.parentId,
                                    qst_audit_by: newChildQuestionData.userName,
                                    author_name: newChildQuestionData.userName,
                                    qst_neg_marks: newChildQuestionData.negativeMarks,
                                    qb_id: qb_id,
                                    copied_from_repository: 'N',
                                    exam_fk: newChildQuestionData.examFk,
                                    exampaper_fk: newChildQuestionData.exampaperFk,
                                    qb_pk: qb_pk,
                                    qst_request_remarks: "Newly added child question",
                                    reference_info: newChildQuestionData.reference != 0 ? newChildQuestionData.reference : null,
                                    calculation_info: newChildQuestionData.calculations != 0 ? newChildQuestionData.calculations : null,
                                    qst_remarks: newChildQuestionData.remark != 0 ? newChildQuestionData.remark : null,
                                    no_of_question: '0',
                                    pub_status: 'A',
                                    replace_id: replaced_cullded_qb_pk,
                                    qst_dimension: 'Dimension'
                                }).then(result => {
                                    var arr_alternatives = [];
                                    for (var i = 1; i <= newChildQuestionData.numOfAlternatives; i++) {
                                        var obj = new Object();
                                        obj.qta_qst_id = result.qb_pk;
                                        obj.qta_id = result.qb_id;
                                        obj.qta_alt_desc = newChildQuestionData.alternatives[i - 1].text;
                                        obj.qta_order = i;
                                        obj.qta_is_corr_alt = newChildQuestionData.alternatives[i - 1].isCorrect;
                                        obj.qta_is_active = 'A';
                                        obj.qta_audit_by = newChildQuestionData.userName;
                                        obj.qta_audit_dt = new Date();
                                        obj.exam_fk = newChildQuestionData.examFk;
                                        obj.exampaper_fk = newChildQuestionData.exampaperFk;
                                        arr_alternatives.push(obj);
                                    }
                                    culled_qstn_alternatives.bulkCreate(arr_alternatives).then((question) => {
                                        var qstn_arr_alternatives = [];
                                        for (var i = 1; i <= newChildQuestionData.numOfAlternatives; i++) {
                                            var obj = new Object();
                                            obj.qta_qst_id = qb_pk;
                                            obj.qta_id = qb_id;
                                            obj.qta_alt_desc = newChildQuestionData.alternatives[i - 1].text;
                                            obj.qta_order = i;
                                            obj.qta_is_corr_alt = newChildQuestionData.alternatives[i - 1].isCorrect;
                                            obj.qta_is_active = 'A';
                                            obj.qta_audit_by = newChildQuestionData.userName;
                                            obj.qta_audit_dt = new Date();
                                            qstn_arr_alternatives.push(obj);
                                        }
                                        qstn_alternatives.bulkCreate(qstn_arr_alternatives).then((result) => {

                                        });
                                        res.send({
                                            code: 0,
                                            message: "success",
                                            replace_by_qb_id: qb_id
                                        });
                                    });
                                });
                            });
                    }
                });
            });
    },


    saveCSQChild: function (req, res) {
        importMethods.checkValidUser(req, res);
        var newChildQuestionData = req.body;
        if (!newChildQuestionData.negativeMarks) {
            newChildQuestionData.negativeMarks = 0
        }
        var replace_id = newChildQuestionData.replace_id;
        sequelize.query("select nextval('qb_id_val') as qb_id, nextval('s_qstnbank_qbpk') as qb_pk", { type: sequelize.QueryTypes.SELECT })
            .then(next_qb_id => {
                var qb_id = next_qb_id[0].qb_id;
                var qb_pk = next_qb_id[0].qb_pk

                if (newChildQuestionData.parent_child_type == 'C') {
                    var userName = newChildQuestionData.userName;
                    var update = "update culled_qstn_bank set qst_request_remarks = 'Question Replaced by QB ID " + qb_id + "',qst_audit_by='" + userName + "' where qb_id = " + replace_id + " and exam_fk = " + newChildQuestionData.examFk + " and exampaper_fk=" + newChildQuestionData.exampaperFk;
                    sequelize.query(update, { type: sequelize.QueryTypes.UPDATE }).then(parentQues => { });
                }
                if (newChildQuestionData.parent_child_type == 'C') { // question added when child question removed and replaced new child question
                    var query = "select culled_qb_pk from culled_qstn_bank where qb_id = " + replace_id + " and exampaper_fk = " + newChildQuestionData.exampaperFk + " and exam_fk = " + newChildQuestionData.examFk;
                    sequelize.query(query, { type: sequelize.QueryTypes.SELECT })
                        .then(next_culled_qb_id => {
                            var replaced_cullded_qb_pk = next_culled_qb_id[0].culled_qb_pk;
                            culled_qstn_bank.create({
                                qst_lang: 'ENGLISH',
                                qst_sub_seq_no: '0',
                                qst_body: newChildQuestionData.question,
                                qst_marks: newChildQuestionData.marks,
                                qst_expiry_dt: new Date(),
                                qst_fk_tpc_pk: '0',
                                qst_is_active: 'A',
                                qst_audit_dt: new Date(),
                                qst_no_of_altr: newChildQuestionData.numOfAlternatives,
                                qb_assigned_to: '0',
                                qb_status_fk: '0',
                                qba_topic_fk: newChildQuestionData.topicId,
                                qba_subject_fk: newChildQuestionData.subjectId,
                                qba_course_fk: newChildQuestionData.courseId,
                                qst_type: 'CS',
                                qba_module_fk: newChildQuestionData.moduleId,
                                qst_pid: newChildQuestionData.parentId,
                                qst_audit_by: newChildQuestionData.userName,
                                author_name: newChildQuestionData.userName,
                                qst_neg_marks: newChildQuestionData.negativeMarks,
                                qb_id: qb_id,
                                copied_from_repository: 'N',
                                exam_fk: newChildQuestionData.examFk,
                                exampaper_fk: newChildQuestionData.exampaperFk,
                                qb_pk: qb_pk,
                                qst_request_remarks: "Replacement of QB ID " + replace_id + " Newly added child question",
                                reference_info: newChildQuestionData.reference != 0 ? newChildQuestionData.reference : null,
                                calculation_info: newChildQuestionData.calculations != 0 ? newChildQuestionData.calculations : null,
                                qst_remarks: newChildQuestionData.remark != 0 ? newChildQuestionData.remark : null,
                                no_of_question: '0',
                                pub_status: 'A',
                                replace_id: replaced_cullded_qb_pk,
                                qst_dimension: 'Dimension',

                            }).then(result => {
                                var arr_alternatives = [];
                                for (var i = 1; i <= newChildQuestionData.numOfAlternatives; i++) {
                                    var obj = new Object();
                                    obj.qta_qst_id = result.qb_pk;
                                    obj.qta_id = result.qb_id;
                                    obj.qta_alt_desc = newChildQuestionData.alternatives[i - 1].text;
                                    obj.qta_order = i;
                                    obj.qta_is_corr_alt = newChildQuestionData.alternatives[i - 1].isCorrect;
                                    obj.qta_is_active = 'A';
                                    obj.qta_audit_by = newChildQuestionData.userName;
                                    obj.qta_audit_dt = new Date();
                                    obj.exam_fk = newChildQuestionData.examFk;
                                    obj.exampaper_fk = newChildQuestionData.exampaperFk;
                                    arr_alternatives.push(obj);
                                }
                                culled_qstn_alternatives.bulkCreate(arr_alternatives).then((question) => {
                                    res.send({
                                        code: 0,
                                        message: "success",
                                        replace_by_qb_id: qb_id
                                    });
                                });
                            });
                        });
                } else {
                    sequelize.query("select culled_qb_pk from culled_qstn_bank where qb_id = " + replace_id + " and exampaper_fk = " + newChildQuestionData.exampaperFk + " and exam_fk = " + newChildQuestionData.examFk, { type: sequelize.QueryTypes.SELECT })
                        .then(next_qb_id => {
                            var replaced_cullded_qb_pk = next_qb_id[0].culled_qb_pk;
                            var qst_request_remarks = "";
                            culled_qstn_bank.create({
                                qst_lang: 'ENGLISH',
                                qst_sub_seq_no: '0',
                                qst_body: newChildQuestionData.question,
                                qst_marks: newChildQuestionData.marks,
                                qst_expiry_dt: new Date(),
                                qst_fk_tpc_pk: '0',
                                qst_is_active: 'A',
                                qst_audit_dt: new Date(),
                                qst_no_of_altr: newChildQuestionData.numOfAlternatives,
                                qb_assigned_to: '0',
                                qb_status_fk: '0',
                                qba_topic_fk: newChildQuestionData.topicId,
                                qba_subject_fk: newChildQuestionData.subjectId,
                                qba_course_fk: newChildQuestionData.courseId,
                                qst_type: 'CS',
                                qba_module_fk: newChildQuestionData.moduleId,
                                qst_pid: newChildQuestionData.parentId,
                                qst_audit_by: newChildQuestionData.userName,
                                author_name: newChildQuestionData.userName,
                                qst_neg_marks: newChildQuestionData.negativeMarks,
                                qb_id: qb_id,
                                copied_from_repository: 'N',
                                exam_fk: newChildQuestionData.examFk,
                                exampaper_fk: newChildQuestionData.exampaperFk,
                                qb_pk: qb_pk,
                                qst_request_remarks: "Newly added child question",
                                reference_info: newChildQuestionData.reference != 0 ? newChildQuestionData.reference : null,
                                calculation_info: newChildQuestionData.calculations != 0 ? newChildQuestionData.calculations : null,
                                qst_remarks: newChildQuestionData.remark != 0 ? newChildQuestionData.remark : null,
                                no_of_question: '0',
                                pub_status: 'A',
                                replace_id: replaced_cullded_qb_pk,
                                qst_dimension: 'Dimension'
                            }).then(result => {
                                var arr_alternatives = [];
                                for (var i = 1; i <= newChildQuestionData.numOfAlternatives; i++) {
                                    var obj = new Object();
                                    obj.qta_qst_id = result.qb_pk;
                                    obj.qta_id = result.qb_id;
                                    obj.qta_alt_desc = newChildQuestionData.alternatives[i - 1].text;
                                    obj.qta_order = i;
                                    obj.qta_is_corr_alt = newChildQuestionData.alternatives[i - 1].isCorrect;
                                    obj.qta_is_active = 'A';
                                    obj.qta_audit_by = newChildQuestionData.userName;
                                    obj.qta_audit_dt = new Date();
                                    obj.exam_fk = newChildQuestionData.examFk;
                                    obj.exampaper_fk = newChildQuestionData.exampaperFk;
                                    arr_alternatives.push(obj);
                                }
                                culled_qstn_alternatives.bulkCreate(arr_alternatives).then((question) => {
                                    res.send({
                                        code: 0,
                                        message: "success",
                                        replace_by_qb_id: qb_id
                                    });
                                });
                            });
                        });
                }
            });
    },
    updateCSQChildCount: function (req, res) {
        importMethods.checkValidUser(req, res);
        var parentQuestion = req.body;

        var query = "update culled_qstn_bank set no_of_question = no_of_question + 1  where qb_id =  " + parentQuestion.qb_id +
            " and exam_fk = " + parentQuestion.exam_fk + " and exampaper_fk = " + parentQuestion.exampaper_fk;


        sequelize.query(query, { type: sequelize.QueryTypes.UPDATE }).then(parentQues => {
            var check = "select case_summary_id_pk as pk from qba_case_summary_admin where exam_fk = " + parentQuestion.exam_fk + " and exampaper_fk =" + parentQuestion.exampaper_fk + " and topic_pk in (select qba_topic_fk from culled_qstn_bank where exam_fk = " + parentQuestion.exam_fk + " and exampaper_fk = " + parentQuestion.exampaper_fk + " and qb_id = " + parentQuestion.qb_id + " and qst_type = 'CS') order by case_summary_id_pk limit 1"
            sequelize.query(check, { type: sequelize.QueryTypes.UPDATE }).then(checkData => {
                var summary_query = "update qba_case_summary_admin set summary_marks = summary_marks + " + parseFloat(parentQuestion.marks) + ", child_count = child_count + 1 where exam_fk = " + parentQuestion.exam_fk + " and exampaper_fk = " + parentQuestion.exampaper_fk + " and child_count != 0 and case_summary_id_pk =" + checkData[0][0].pk + " and topic_pk in (select qba_topic_fk from culled_qstn_bank where exam_fk = " + parentQuestion.exam_fk + " and exampaper_fk = " + parentQuestion.exampaper_fk + " and qb_id = " + parentQuestion.qb_id + " and qst_type = 'CS')"
                sequelize.query(summary_query, { type: sequelize.QueryTypes.UPDATE }).then(data => {
                })
                res.send({
                    code: 0,
                    message: "success",
                    obj: parentQues
                })

            })
        });
    },


    insertNewChildQuestion: function (req, res) {
        importMethods.checkValidUser(req, res);
        var pubSFQuestion = req.body;
        let count = pubSFQuestion.length;
        if (count != 0) {
            let exam_fk = pubSFQuestion[0].exam_fk;
            let exampaper_fk = pubSFQuestion[0].exampaper_fk;
            for (var i = 0; i < count; i++) {
                if (pubSFQuestion[i].qst_request_remarks.includes('Newly added child question')) {
                    var qst_pid = pubSFQuestion[i].qst_pid;
                    var query = "update qstn_bank set qta_is_active='A' where qb_id =  " + pubSFQuestion[i].qb_id;

                    sequelize.query(query, { type: sequelize.QueryTypes.UPDATE }).then(parentQues => {
                        var query1 = "update qstn_alternatives set qta_is_active='A' where qta_id =  " + pubSFQuestion[i].qb_id;

                        sequelize.query(query1, { type: sequelize.QueryTypes.UPDATE }).then(parentQues => {
                            var query2 = "select no_of_question as c from culled_qstn_bank where qb_id =" + qst_pid + " and exam_fk = " + exam_fk + " and exampaper_fk = " + exampaper_fk;
                            sequelize.query(query2, { type: sequelize.QueryTypes.SELECT })
                                .then(no_of_question => {
                                    var no_of_question = no_of_question.c;
                                    var query3 = "update qstn_bank set no_of_question =" + no_of_question + " where qb_id = " + qst_pid;
                                    sequelize.query(query3, { type: sequelize.QueryTypes.UPDATE })
                                });
                        });
                    });
                }
            }
        }
        res.send({
            code: 0,
            message: "success"
        });
    },

    updateQstReqRemark: function (req, res) {
        importMethods.checkValidUser(req, res);
        let data = req.body;
        let qb_id = data.qb_id;
        let exam_fk = data.exam_fk;
        let exampaper_fk = data.exampaper_fk;
        let QporQB = data.QPorQB;
        let qb_pk = data.qb_pk;
        let userName = data.userName;

        var query = "update culled_qstn_bank set qst_request_remarks='Removed from " + QporQB + "',qst_audit_by='" + userName + "' where exam_fk = " + exam_fk + " and exampaper_fk = " + exampaper_fk + " and qb_pk = " + qb_pk + " and qb_id = " + qb_id;

        sequelize.query(query, { type: sequelize.QueryTypes.UPDATE }).then(parentQues => {
            res.send({
                code: 0,
                message: "Updated"
            });
        });
    },
    updateAltCorrectAns: function (req, res) {
        importMethods.checkValidUser(req, res);
        let qb_id = req.body.qb_id;
        let new_alt_id = req.body.new_alt_id;
        let exampaper_fk = req.body.exampaper_fk;
        let exam_fk = req.body.exam_fk;
        let add_by = req.body.userName;
        let add_date = new Date();
        let qb_pk = req.body.qb_pk;

        var old_qta_fk = "select qta_pk from culled_qstn_alternatives where exampaper_fk = " + exampaper_fk + " and exam_fk = " + exam_fk + " and qta_id=" + qb_id + " and qta_is_corr_alt = 'Y' and qta_qst_id = " + qb_pk + "";
        var old = "select qta_alt_desc from culled_qstn_alternatives where exampaper_fk = " + exampaper_fk + " and exam_fk = " + exam_fk + " and qta_id=" + qb_id + " and qta_is_corr_alt = 'Y' and qta_qst_id = " + qb_pk + "";

        var news = "select qta_alt_desc from culled_qstn_alternatives where qta_pk=" + new_alt_id;

        var log = "insert into culled_qstn_alternatives_log (exam_fk,exampaper_fk,qb_id,new_qta_fk,old_answer,new_answer,qta_audit_by,add_date,status,old_qta_fk) select " + exam_fk + "," + exampaper_fk + "," + qb_id + "," + new_alt_id + ",(" + old + "),(" + news + "),'" + add_by + "',now(),'Answer',(" + old_qta_fk + ")";

        sequelize.query(log).spread((results2, metadata2) => {


            var query = "update culled_qstn_alternatives set qta_is_corr_alt = 'N' where exampaper_fk = " + exampaper_fk + " and exam_fk = " + exam_fk + " and qta_id=" + qb_id;
            var query1 = "update culled_qstn_alternatives set qta_is_corr_alt = 'Y' where qta_pk=" + new_alt_id;
            var query2 = "update culled_qstn_bank set qst_audit_by = '" + add_by + "' where exampaper_fk = " + exampaper_fk + " and exam_fk = " + exam_fk + " and qb_id=" + qb_id;
            sequelize.query(query, { type: sequelize.QueryTypes.UPDATE }).then(parentQues => {

                sequelize.query(query1, { type: sequelize.QueryTypes.UPDATE }).then(parentQues => {

                    sequelize.query(query2, { type: sequelize.QueryTypes.UPDATE }).then(parentQues => {
                        res.send({
                            code: 0,
                            message: "Updated"
                        });
                    })
                });
            });
        });
    },
    updateQBAltCorrectAns: function (req, res) {
        importMethods.checkValidUser(req, res);
        let qb_id = req.body.qb_id;
        let new_alt_id = req.body.new_alt_id;

        let add_by = req.body.userName;
        let add_date = new Date();
        let qb_pk = req.body.qb_pk;

        var old_qta_fk = "select qta_pk from qstn_alternatives where qta_id=" + qb_id + " and qta_is_corr_alt = 'Y' and qta_qst_id = " + qb_pk + "";
        var old = "select qta_alt_desc from qstn_alternatives where qta_id=" + qb_id + " and qta_is_corr_alt = 'Y' and qta_qst_id = " + qb_pk + "";

        var news = "select qta_alt_desc from qstn_alternatives where qta_pk=" + new_alt_id;

        var log = "insert into culled_qstn_alternatives_log (exam_fk,exampaper_fk,qb_id,new_qta_fk,old_answer,new_answer,qta_audit_by,add_date,status,old_qta_fk) select 0,0," + qb_id + "," + new_alt_id + ",(" + old + "),(" + news + "),'" + add_by + "',now(),'Answer',(" + old_qta_fk + ")";

        sequelize.query(log).spread((results2, metadata2) => {


            var query = "update qstn_alternatives set qta_is_corr_alt = 'N' where qta_id=" + qb_id;
            var query1 = "update qstn_alternatives set qta_is_corr_alt = 'Y' where qta_pk=" + new_alt_id;

            sequelize.query(query, { type: sequelize.QueryTypes.UPDATE }).then(parentQues => {

                sequelize.query(query1, { type: sequelize.QueryTypes.UPDATE }).then(parentQues => {
                    res.send({
                        code: 0,
                        message: "Updated"
                    });
                });
            });
        });
    },
    getPubVettingStatus: function (req, res) {
        importMethods.checkValidUser(req, res);
        let qstnpaper_id = req.body.qstnpaper_id;
        var query = "SELECT vetting_status FROM vetting_details right join um_user_role_mapping on (um_user_role_mapping.user_fk = vetting_details.vetter_fk) and (um_user_role_mapping.role_fk = 2)  where qstnpaper_id = '" + qstnpaper_id + "' and vetting_status = 'Done'";

        sequelize.query(query, { type: sequelize.QueryTypes.SELECT }).then(result => {
            res.send({
                code: 0,
                obj: result
            });
        });
    },
    getExamDetails: function (req, res) {
        importMethods.checkValidUser(req, res);
        let exam_pk = req.body.exam_pk;
        var query = "select total_qts,total_marks from exam_master where exam_pk = " + exam_pk + " and is_active='Y'";
        sequelize.query(query, { type: sequelize.QueryTypes.SELECT }).then(result => {
            res.send({
                code: 0,
                obj: result
            });
        });
    },
    getEditQuestionData: function (req, res) {
        importMethods.checkValidUser(req, res);
        let exam_pk = req.body.exam_fk;
        let exampaper_pk = req.body.exampaper_fk;
        let qb_id = req.body.qb_id;
        let qb_pk = req.body.qb_pk;
        var query = "select *, qta_is_corr_alt,qta_pk,qta_alt_desc,now() as current_time from  " +
            "(select replace_id,total_weightage,log_count,no_of_question,dense_rank()over(order by  un_id) rnk,qb_pk, qba_topic_fk,qst_request_status,qst_request_remarks, qba_subject_pk, qba_course_pk, qba_module_pk, qba_course_name,subject_name,qba_subject_code,qba_course_code,module_name,topic_name,qba_topic_code,qst_marks,qst_neg_marks, qst_lang,qst_type, " +
            "qst_pid,qst_body,qst_no_of_altr,qst_remarks,calculation_info,  reference_info,qst_is_active,qst_audit_by,qst_audit_dt,culled_qstn_bank.qb_id ,culled_qstn_bank.exam_fk as culled_exam_fk ,culled_qstn_bank.exampaper_fk as culled_exampaper_fk ,culled_qb_pk,copied_from_repository " +
            "from  ( select culled_qb_pk un_id,* from culled_qstn_bank a   where (case when  qst_type  = 'CS' and qst_pid  > 0  then 1 else 2 end) =2 " +
            "union ALL " +
            "select a.culled_qb_pk un_id,b.* from culled_qstn_bank a   inner join  culled_qstn_bank b on  a.qst_lang= b.qst_lang and a.qb_id=b.qst_pid  " +
            "and a.exampaper_fk=b.exampaper_fk where  a.qst_type = 'CS' and a.qst_pid = 0   )culled_qstn_bank " +
            "inner join qba_topic_master on (qba_topic_master.qba_topic_pk=culled_qstn_bank.qba_topic_fk) " +
            "inner join qba_module_mstr on (qba_module_mstr.qba_module_pk=qba_topic_master.qba_module_fk) " +
            "inner join qba_subject_master on (qba_subject_master.qba_subject_pk=qba_module_mstr.qba_subject_fk) " +
            "inner join qba_course_master on (qba_course_master.qba_course_pk=qba_subject_master.qba_course_fk) " +
            "left join (select sum(cu.qst_marks) total_weightage,max(cu.qst_pid) qstpid from culled_qstn_bank cu where cu.exam_fk =" + exam_pk + " and cu.exampaper_fk= " + exampaper_pk + " and cu.qst_lang='ENGLISH' group by cu.qst_pid having(cu.qst_pid)> 1) tw on (culled_qstn_bank.qb_id = tw.qstpid) " +
            "left join (select old_qta_fk log_count,qb_id,exam_fk,exampaper_fk  from culled_qstn_alternatives_log where qta_log_pk in (select max(qta_log_pk) from culled_qstn_alternatives_log where exam_fk=" + exam_pk + " and exampaper_fk=" + exampaper_pk + " and status='Answer' group by qb_id) ) log on (log.qb_id=culled_qstn_bank.qb_id and log.exam_fk=" + exam_pk + " and log.exampaper_fk=" + exampaper_pk + ")" +
            "where culled_qstn_bank.exam_fk =" + exam_pk + " and culled_qstn_bank.qb_id = " + qb_id + " and culled_qstn_bank.qb_pk = " + qb_pk + " and culled_qstn_bank.exampaper_fk= " + exampaper_pk + " order by culled_qb_pk)a " +
            "left join culled_qstn_alternatives on(culled_qstn_alternatives.qta_qst_id=a.qb_pk and " +
            "culled_qstn_alternatives.exam_fk=" + exam_pk + " and   culled_qstn_alternatives.exampaper_fk=" + exampaper_pk + " and  culled_qstn_alternatives.qta_id=" + qb_id + ")  " +
            " order by rnk,culled_qb_pk,qta_order"; // comment by shilpa

        sequelize.query(query, { type: sequelize.QueryTypes.SELECT }).then(result => {
            req.body.result = result;
            req.body.count = 1;
            importMethods.parseQuestionBankData(req, res);
        });
    },

    getAllCount: function (req, res) {
        importMethods.checkValidUser(req, res);
        let exam_fk = req.body.exam_fk;
        let exampaper_fk = req.body.exampaper_fk;
        var ids = req.body.qb_pks;
        str = "";
        for (var i = 0; i < ids.length; i++) {

            if (str != "") {
                str += ','
            }
            str += ids[i]
        }
        var allcounts = [];
        let query = "select count(cb.qb_pk) as total_selected_questions from culled_qstn_bank cb where cb.exampaper_fk =" + exampaper_fk + " and cb.exam_fk = " + exam_fk + " and cb.qb_pk in (" + str + ") and (cb.qst_type = 'M' or (cb.qst_type='CS' and cb.qst_pid !='0'))  ";

        sequelize.query(query, { type: sequelize.QueryTypes.SELECT }).then(result => {

            let query1 = "select count(qb_pk) as total_parent_selected from culled_qstn_bank where exampaper_fk =" + exampaper_fk + " and exam_fk = " + exam_fk + " and qb_pk in (" + str + ") and  qst_type='CS' and qst_pid!='0' ";
            sequelize.query(query1, { type: sequelize.QueryTypes.SELECT }).then(result1 => {

                let query2 = "select sum(qst_marks) as total_selected_marks from culled_qstn_bank where exampaper_fk =" + exampaper_fk + " and exam_fk = " + exam_fk + " and qb_pk in (" + str + ") and  ((qst_type='CS' and qst_pid !='0') or (qst_type='M')) ";
                sequelize.query(query2, { type: sequelize.QueryTypes.SELECT }).then(result2 => {

                    let query3 = "select sum(qst_marks) as total_child_marks_selected from culled_qstn_bank where exampaper_fk =" + exampaper_fk + " and exam_fk = " + exam_fk + " and qb_pk in (" + str + ") and  qst_type='CS' and qst_pid !='0' ";
                    sequelize.query(query3, { type: sequelize.QueryTypes.SELECT }).then(result3 => {

                        let query4 = "select total_qts as total_qs_master,total_marks as total_marks_master,case_question as total_csq_master,case_marks as total_csq_marks_master from exam_master where exam_pk =" + exam_fk + " ";
                        sequelize.query(query4, { type: sequelize.QueryTypes.SELECT }).then(result4 => {
                            res.send({
                                code: 0,
                                message: "success",
                                total_selected_questions: result[0].total_selected_questions,
                                total_parent_selected: result1[0].total_parent_selected,
                                total_selected_marks: result2[0].total_selected_marks,
                                total_child_marks_selected: result3[0].total_child_marks_selected,
                                total_questions_master: result4[0].total_qs_master,
                                total_marks_master: result4[0].total_marks_master,
                                total_csq_master: result4[0].total_csq_master,
                                total_csq_marks_master: result4[0].total_csq_marks_master
                            })
                        });
                    });
                });
            });
        });


    },

    updateSummaryCount: function (req, res) {
        importMethods.checkValidUser(req, res);
        var questData = req.body;
        let exam_fk = questData[0].exam_fk;
        let exampaper_fk = questData[0].exampaper_fk;
        var ids = [];
        for (var i = 0; i < questData.length; i++) {
            ids.push(questData[i].qb_pk);
        }
        str = "";
        for (var i = 0; i < ids.length; i++) {

            if (str != "") {
                str += ','
            }
            str += ids[i];
        }


        // mcq   



        let query = "select count(qb_pk) as total_questions,qba_topic_fk,sum(qst_marks) as total_marks from culled_qstn_bank where exampaper_fk =" + exampaper_fk + " and exam_fk = " + exam_fk + " and qb_pk in (" + str + ")  and qst_type='M' group by qba_topic_fk order by qba_topic_fk";

        sequelize.query(query, { type: sequelize.QueryTypes.SELECT }).then(result => {

            for (var i = 0; i < result.length; i++) {

                var c = "update qba_summary_admin set summary_question = 0 , summary_marks = 0 where topic_pk = " + result[i].qba_topic_fk + " and  exampaper_fk =" + exampaper_fk + " and exam_fk = " + exam_fk;
                sequelize.query(c).then(checkData => { })
                let query1 = "update qba_summary_admin set total_question = " + result[i].total_questions + " , total_marks = " + result[i].total_marks + ", summary_question = " + result[i].total_questions + " , summary_marks = " + result[i].total_marks + " where topic_pk = " + result[i].qba_topic_fk + " and  exampaper_fk =" + exampaper_fk + " and exam_fk = " + exam_fk + " and summary_id_pk = (select min(summary_id_pk) from qba_summary_admin where topic_pk = " + result[i].qba_topic_fk + " and  exampaper_fk =" + exampaper_fk + " and exam_fk = " + exam_fk + ")";
                sequelize.query(query1, { type: sequelize.QueryTypes.UPDATE })

            }
        });

        //parent



        let query1 = "select count(qb_pk) as total_questions,qba_topic_fk,sum(qst_marks) as total_marks from culled_qstn_bank where exampaper_fk =" + exampaper_fk + " and exam_fk = " + exam_fk + " and qb_pk in (" + str + ")  and qst_type='CS' and qst_pid =0 group by qba_topic_fk order by qba_topic_fk";

        sequelize.query(query1, { type: sequelize.QueryTypes.SELECT }).then(result => {

            for (var i = 0; i < result.length; i++) {

                let query1 = "update qba_case_summary_admin set parent_count = 0,child_count=0,summary_marks=0  where topic_pk = " + result[i].qba_topic_fk + " and  exampaper_fk =" + exampaper_fk + " and exam_fk = " + exam_fk + " ";
                sequelize.query(query1, { type: sequelize.QueryTypes.UPDATE })

                let query2 = "update qba_case_summary_admin set parent_count = " + result[i].total_questions + "  where topic_pk = " + result[i].qba_topic_fk + " and  exampaper_fk =" + exampaper_fk + " and exam_fk = " + exam_fk + " and case_summary_id_pk = (select max(case_summary_id_pk) from qba_case_summary_admin where topic_pk = " + result[i].qba_topic_fk + " and  exampaper_fk =" + exampaper_fk + " and exam_fk = " + exam_fk + ")";
                sequelize.query(query2, { type: sequelize.QueryTypes.UPDATE })

            }
        });


        //child

        let query2 = "select count(qb_pk) as total_questions,qba_topic_fk,sum(qst_marks) as total_marks from culled_qstn_bank where exampaper_fk =" + exampaper_fk + " and exam_fk = " + exam_fk + " and qb_pk in (" + str + ")  and qst_type='CS' and qst_pid !=0 group by qba_topic_fk order by qba_topic_fk";

        sequelize.query(query2, { type: sequelize.QueryTypes.SELECT }).then(result => {

            for (var i = 0; i < result.length; i++) {
                let query1 = "update qba_case_summary_admin set child_count = " + result[i].total_questions + " , summary_marks = " + result[i].total_marks + " where topic_pk = " + result[i].qba_topic_fk + " and  exampaper_fk =" + exampaper_fk + " and exam_fk = " + exam_fk + " and case_summary_id_pk = (select max(case_summary_id_pk) from qba_case_summary_admin where topic_pk = " + result[i].qba_topic_fk + " and  exampaper_fk =" + exampaper_fk + " and exam_fk = " + exam_fk + ")";
                sequelize.query(query1, { type: sequelize.QueryTypes.UPDATE })

            }

        });

        res.send({
            code: 0,
            message: "success"

        })


    },

    editAdminQBInline: function (req, res) {
        importMethods.checkValidUser(req, res)
        var questionData = req.body;

        for (var i = 0; i < questionData.length; i++) {
            qstn_bank.update({
                calculation_info: questionData[i].calculation_info != '' ? questionData[i].calculation_info : null,
                no_of_question: questionData[i].no_of_question,
                qst_audit_by: questionData[i].qst_audit_by,
                qst_audit_dt: sequelize.fn('NOW'),
                qst_body: questionData[i].qst_body,
                qst_remarks: questionData[i].qst_remarks != '' ? questionData[i].qst_remarks : null,
                reference_info: questionData[i].reference_info != '' ? questionData[i].reference_info : null,
                qst_img_fk: null

            }, {
                where: { qb_pk: questionData[i].qb_pk }
            })
        }
        res.send({
            code: 0,
            message: "success"
        })
    },


    updateQBOptions: function (req, res) {
        importMethods.checkValidUser(req, res);
        var questionData = req.body;
        for (var i = 0; i < questionData.length; i++) {
            for (var j = 0; j < questionData[i].qstn_alternatives.length; j++) {
                qstn_alternatives.update(
                    {
                        qta_alt_desc: questionData[i].qstn_alternatives[j].qta_alt_desc,
                        qta_audit_by: questionData[i].qst_audit_by,
                        qta_audit_dt: questionData[i].qst_audit_dt,
                        qta_img_fk: null
                    }, {
                    where: {
                        qta_pk: questionData[i].qstn_alternatives[j].qta_pk
                    }
                })
            }
        }
        res.send({
            code: 0,
            message: "success",
            object: []
        })
    },

    createQBOptions: function (req, res) {
        importMethods.checkValidUser(req, res)
        var questionData = req.body;
        for (var i = 0; i < questionData.length; i++) {
            for (var j = 0; j < questionData[i].qstn_alternatives.length; j++) {
                qstn_alternatives.create({
                    qta_qst_id: questionData[i].qb_pk,
                    qta_id: questionData[i].qb_id,
                    qta_alt_desc: questionData[i].qstn_alternatives[j].qta_alt_desc,
                    qta_order: questionData[i].qstn_alternatives[j].qta_order,
                    qta_is_corr_alt: questionData[i].qstn_alternatives[j].qta_is_corr_alt,
                    qta_is_active: "Y",
                    qta_audit_by: questionData[i].qst_audit_by,
                    qta_audit_dt: questionData[i].qst_audit_dt
                }).then(questionCreate => {

                })
            }
        }
        res.send({
            code: 0,
            message: "success"
        })
    },

    exportQB: function (req, res) {
        importMethods.checkValidUser(req, res);
        let course = req.body.course;
        let subject = req.body.subject;
        let module_id = req.body.module;
        let language = req.body.language;
        if (module_id == 0) {
            var module_condition = "";
        }
        else {
            var module_condition = " and qb.qba_module_fk = " + module_id + " ";
        }
        let filepath = rootPath + '/public/images/products/image/';
        let filepath1 = rootPath + '/server/controllers/output/';
        let query = "with d1 as (select qb.qb_id ,qb.qst_type,qb.qst_pid, qba_course_code as course, qba_subject_code as subject, module_name as module, qba_topic_code as topic,qb.qst_marks as marks,qb.qst_neg_marks as negative_marks,qb.qst_lang as language,qb.qst_type as question_type,(CASE WHEN qb.qst_type='CS' AND qb.qst_pid > 0 THEN qb.qst_pid::varchar || '.' || lpad(qb.qb_id::varchar, 8, '0')::varchar ELSE qb.qb_id::varchar END)::numeric(16,10) as qb_id1, qb.qst_pid as parent_qb_id, qb.no_of_question as no_of_questions, qb.qst_body as question_body, qb.qst_no_of_altr as number_of_alternatives, max(case when qa.qta_order=1 then qa.qta_alt_desc end) alternative1, max(case when qa.qta_order=2 then qa.qta_alt_desc end) alternative2, max(case when qa.qta_order=3 then qa.qta_alt_desc end) alternative3, max(case when qa.qta_order=4 then qa.qta_alt_desc end) alternative4, max(case when qa.qta_order=5 then qa.qta_alt_desc end) alternative5, max(case when qa.qta_order=6 then qa.qta_alt_desc end) alternative6, max(case when qa.qta_order=7 then qa.qta_alt_desc end) alternative7, max(case when qa.qta_order=8 then qa.qta_alt_desc end) alternative8, max(case when qa.qta_order=9 then qa.qta_alt_desc end) alternative9 , max(case when qa.qta_is_corr_alt = 'Y' then qa.qta_order else 0 end)correct_alternative, qb.qst_remarks as remarks, qb.reference_info as reference, qb.calculation_info as calculation, qi.qbi_image_name as questionimage, max(case when qa.qta_order=1 then qii.qbi_image_name end) alternative1image, max(case when qa.qta_order=2 then qii.qbi_image_name end) alternative2image, max(case when qa.qta_order=3 then qii.qbi_image_name end) alternative3image, max(case when qa.qta_order=4 then qii.qbi_image_name end) alternative4image, max(case when qa.qta_order=5 then qii.qbi_image_name end) alternative5image, max(case when qa.qta_order=6 then qii.qbi_image_name end) alternative6image, max(case when qa.qta_order=7 then qii.qbi_image_name end) alternative7image, max(case when qa.qta_order=8 then qii.qbi_image_name end) alternative8image, max(case when qa.qta_order=9 then qii.qbi_image_name end) alternative9image, qb.qst_is_active as status, qb.author_name as author_name, 'M' as flag from qba.qstn_bank qb left join qba.qba_course_master on (qb.qba_course_fk=qba_course_pk) left join qba.qba_subject_master on (qb.qba_subject_fk=qba_subject_pk) left join qba.qba_module_mstr on (qb.qba_module_fk=qba_module_pk) left join qba.qba_topic_master on (qb.qba_topic_fk=qba_topic_pk) left join qba.qstn_alternatives qa on (qb.qb_pk=qa.qta_qst_id and qb.qb_id = qa.qta_id) left join qba.qbank_images qi on (qi.qbi_pk=qb.qst_img_fk) left join qba.qbank_images qii on (qii.qbi_pk=qa.qta_img_fk) where qst_is_active!='X' and qst_lang='" + language + "' and qb.qba_subject_fk = " + subject + " and qb.qba_course_fk = " + course + " " + module_condition + " group by qb.qb_id,qba_course_code,qba_subject_code,module_name,qba_topic_code,qb.qst_marks,qb.qst_neg_marks,qb.qst_lang,qb.qst_type,qb.qst_pid,qb.no_of_question,qb.qst_body,qb.qst_no_of_altr,qb.qst_remarks,qb.reference_info,qb.calculation_info,qi.qbi_image_name,qb.qst_is_active,qb.author_name,qb.qb_pk ), d2 as ( SELECT * FROM (SELECT * from d1)t ) select * from d2 order by question_type, (case when qst_type = 'CS' and qst_pid = 0 then (qb_id+qst_pid) when qst_type = 'CS' and qst_pid != 0  then qst_pid when qst_type='M' then qb_id1 end) asc,qb_id,module,topic,marks";
        sequelize.query(query, { type: sequelize.QueryTypes.SELECT })
            .then(expData => {
                if (expData.length > 0) {
                    let k = 0;
                    let xlsxExprtData = [];
                    let imgFileNames = [];
                    for (let i = 0; i < expData.length; i++) {
                        xlsxExprtData[k] = {};
                        xlsxExprtData[k]['QB_ID'] = parseInt(expData[i].qb_id);
                        xlsxExprtData[k]['Course'] = expData[i].course;
                        xlsxExprtData[k]['Subject'] = expData[i].subject;
                        xlsxExprtData[k]['Module'] = expData[i].module;
                        xlsxExprtData[k]['Topic'] = expData[i].topic;
                        if (expData[i].question_type == 'CS' && expData[i].parent_qb_id == 0) {
                            expData[i].marks = 0
                        }
                        xlsxExprtData[k]['Marks'] = parseFloat(expData[i].marks);
                        if (!expData[i].negative_marks) {
                            xlsxExprtData[k]['Negative_Marks'] = parseInt(0);
                        } else {
                            xlsxExprtData[k]['Negative_Marks'] = parseInt(expData[i].negative_marks);
                        }

                        xlsxExprtData[k]['Language'] = expData[i].language;
                        xlsxExprtData[k]['Question_Type'] = expData[i].question_type;
                        xlsxExprtData[k]['Parent_QB_ID'] = parseInt(expData[i].parent_qb_id);
                        if (expData[i].no_of_questions == null) {
                            expData[i].no_of_questions = 0
                        }
                        xlsxExprtData[k]['No_of_Questions'] = parseInt(expData[i].no_of_questions);
                        if (!expData[i]["question_body"]) {
                            xlsxExprtData[k]['Question_Body'] = expData[i].question_body;
                        } else {
                            if (expData[i]["question_body"].includes("<img")) {

                                if (expData[i]["question_body"].includes('src="/images/products/image/')) {
                                    let start = parseInt(expData[i]["question_body"].search(' src="/images/products/image/')) + parseInt(29);
                                    let end = expData[i]["question_body"].search('" style=');
                                    let filename = expData[i]["question_body"].substring(start, end).replace(/[&\/\\#,+()$~%'":*?<>{}]/g, "").trim();


                                    if (fs.existsSync(filepath + filename)) {
                                        xlsxExprtData[k]['Question_Body'] = expData[i].question_body.replace(/<img[^>]*>/g, "");
                                        imgFileNames.push(filename);
                                    }
                                    else {
                                        xlsxExprtData[k]['Question_Body'] = expData[i].question_body.replace(/<img[^>]*>/g, "");;
                                    }
                                }
                                if (expData[i]["question_body"].includes('src="static/controllers/output/')) {
                                    let start = parseInt(expData[i]["question_body"].search('output/')) + parseInt(7);
                                    let end = expData[i]["question_body"].search('>');
                                    let filename = expData[i]["question_body"].substring(start, end).replace(/[&\/\\#,+()$~%'":*?<>{}]/g, "").trim();


                                    if (fs.existsSync(filepath1 + filename)) {
                                        xlsxExprtData[k]['Question_Body'] = expData[i].question_body.replace(/<img[^>]*>/g, "");
                                        imgFileNames.push(filename);
                                    }
                                    else {
                                        xlsxExprtData[k]['Question_Body'] = expData[i].question_body.replace(/<img[^>]*>/g, "");;
                                    }
                                }
                            }
                            else {
                                xlsxExprtData[k]['Question_Body'] = expData[i].question_body;
                            }
                        }
                        if (!expData[i].number_of_alternatives) {
                            xlsxExprtData[k]['Number_of_Alternatives'] = parseInt(0);

                        } else {
                            xlsxExprtData[k]['Number_of_Alternatives'] = parseInt(expData[i].number_of_alternatives);

                        }

                        for (var j = 1; j <= 9; j++) {

                            let alternative = "alternative" + j;
                            let alternativeimage = "alternative" + j + "image";
                            if (!expData[i][alternative]) {
                                xlsxExprtData[k]['Alternative ' + j] = "";
                            } else {
                                xlsxExprtData[k]['Alternative ' + j] = expData[i][alternative].replace(/<img[^>]*>/g, "");
                            }
                        }
                        if (expData[i].correct_alternative == null) {
                            xlsxExprtData[k]['Correct Alternative'] = ''
                        }
                        else {
                            xlsxExprtData[k]['Correct Alternative'] = parseInt(expData[i].correct_alternative);
                        }
                        xlsxExprtData[k]['Remarks'] = expData[i].remarks;
                        if (expData[i].remarks == null) {
                            xlsxExprtData[k]['Remarks Image'] = '';
                        } else if (expData[i].remarks.includes('src')) {

                            if (expData[i]["remarks"].includes('src="static/controllers/output/')) {
                                let start = parseInt(expData[i]["remarks"].search('output/')) + parseInt(7);
                                let end = expData[i]["remarks"].search('>');
                                let filename = expData[i]["remarks"].substring(start, end).replace(/[&\/\\#,+()$~%'":*?<>{}]/g, "").trim();


                                if (fs.existsSync(filepath1 + filename)) {
                                    xlsxExprtData[k]['Remarks'] = expData[i].remarks.replace(/<img[^>]*>/g, "");
                                    xlsxExprtData[k]['Remarks Image'] = filename;
                                    if (filename != '') {
                                        imgFileNames.push(filename);
                                    }


                                }
                                else {
                                    xlsxExprtData[k]['Remarks Image'] = "";
                                }
                            }

                            if (expData[i]["remarks"].includes('src="/images/products/image/')) {
                                if (expData[i]["remarks"].includes('data-cke-saved-src="/images/products/image/')) {
                                    let start = parseInt(expData[i]["remarks"].search(' src="/images/products/image/')) + parseInt(29);
                                    let end = expData[i]["remarks"].search('" style=');
                                    let filename = expData[i]["remarks"].substring(start, end).replace(/[&\/\\#,+()$~%'":*?<>{}]/g, "").trim();


                                    if (fs.existsSync(filepath + filename)) {
                                        xlsxExprtData[k]['Remarks'] = expData[i].remarks.replace(/<img[^>]*>/g, "");
                                        xlsxExprtData[k]['Remarks Image'] = filename;;
                                        imgFileNames.push(filename);

                                    }
                                    else {
                                        xlsxExprtData[k]['Remarks Image'] = "";
                                    }
                                } else {
                                    let start = parseInt(expData[i]["remarks"].search('image/')) + parseInt(6);
                                    let end = expData[i]["remarks"].search('" style=');
                                    let filename = expData[i]["remarks"].substring(start, end).replace(/[&\/\\#,+()$~%'":*?<>{}]/g, "").trim();
                                    imgFileNames.push(filename);

                                    if (fs.existsSync(filepath + filename)) {
                                        xlsxExprtData[k]['Remarks'] = expData[i].remarks.replace(/<img[^>]*>/g, "");
                                        xlsxExprtData[k]['Remarks Image'] = filename;
                                        imgFileNames.push(filename);
                                    }
                                    else {
                                        xlsxExprtData[k]['Remarks Image'] = "";
                                    }
                                }
                            }
                        } else {
                            xlsxExprtData[k]['Remarks Image'] = "";
                        }



                        xlsxExprtData[k]['Reference'] = expData[i].reference;
                        if (expData[i].reference == null) {
                            xlsxExprtData[k]['Reference Image'] = '';
                        } else if (expData[i]["reference"].includes('src')) {
                            if (expData[i]["reference"].includes('src="static/controllers/output/')) {
                                let start = parseInt(expData[i]["reference"].search('output/')) + parseInt(7);
                                let end = expData[i]["reference"].search('>');
                                let filename = expData[i]["reference"].substring(start, end).replace(/[&\/\\#,+()$~%'":*?<>{}]/g, "").trim();


                                if (fs.existsSync(filepath1 + filename)) {
                                    xlsxExprtData[k]['Reference'] = expData[i].reference.replace(/<img[^>]*>/g, "");
                                    xlsxExprtData[k]['Reference Image'] = filename;
                                    if (filename != '') {
                                        imgFileNames.push(filename);
                                    }
                                }
                                else {
                                    xlsxExprtData[k]['Reference Image'] = "";
                                }
                            }
                            if (expData[i]["reference"].includes('src="/images/products/image/')) {
                                if (expData[i]["reference"].includes('data-cke-saved-src="/images/products/image/')) {
                                    let start = parseInt(expData[i]["reference"].search(' src="/images/products/image/')) + parseInt(29);
                                    let end = expData[i]["reference"].search('" style=');
                                    let filename = expData[i]["reference"].substring(start, end).replace(/[&\/\\#,+()$~%'":*?<>{}]/g, "").trim();


                                    if (fs.existsSync(filepath + filename)) {
                                        xlsxExprtData[k]['Reference'] = expData[i].reference.replace(/<img[^>]*>/g, "");
                                        xlsxExprtData[k]['Reference Image'] = filename;;
                                        imgFileNames.push(filename);

                                    }
                                    else {
                                        xlsxExprtData[k]['Reference Image'] = "";
                                    }
                                } else {
                                    let start = parseInt(expData[i]["reference"].search('image/')) + parseInt(6);
                                    let end = expData[i]["reference"].search('" style=');
                                    let filename = expData[i]["reference"].substring(start, end).replace(/[&\/\\#,+()$~%'":*?<>{}]/g, "").trim();
                                    imgFileNames.push(filename);

                                    if (fs.existsSync(filepath + filename)) {
                                        xlsxExprtData[k]['Reference'] = expData[i].reference.replace(/<img[^>]*>/g, "");
                                        xlsxExprtData[k]['Reference Image'] = filename;
                                        imgFileNames.push(filename);
                                    }
                                    else {
                                        xlsxExprtData[k]['Reference Image'] = "";
                                    }
                                }
                            }


                        } else {
                            xlsxExprtData[k]['Reference Image'] = '';
                        }
                        xlsxExprtData[k]['Calculation'] = expData[i].calculation;
                        if (expData[i].calculation == null) {
                            xlsxExprtData[k]['Calculation Image'] = '';
                        } else if (expData[i]["calculation"].includes('src')) {
                            if (expData[i]["calculation"].includes('src="static/controllers/output/')) {
                                let start = parseInt(expData[i]["calculation"].search('output/')) + parseInt(7);
                                let end = expData[i]["calculation"].search('>');
                                let filename = expData[i]["calculation"].substring(start, end).replace(/[&\/\\#,+()$~%'":*?<>{}]/g, "").trim();


                                if (fs.existsSync(filepath1 + filename)) {
                                    xlsxExprtData[k]['Calculation'] = expData[i].calculation.replace(/<img[^>]*>/g, "");
                                    xlsxExprtData[k]['Calculation Image'] = filename;
                                    if (filename != '') {
                                        imgFileNames.push(filename);
                                    }
                                }
                                else {
                                    xlsxExprtData[k]['Calculation Image'] = "";
                                }
                            }
                            if (expData[i]["calculation"].includes('src="/images/products/image/')) {
                                if (expData[i]["calculation"].includes('data-cke-saved-src="/images/products/image/')) {
                                    let start = parseInt(expData[i]["calculation"].search(' src="/images/products/image/')) + parseInt(29);
                                    let end = expData[i]["calculation"].search('" style=');
                                    let filename = expData[i]["calculation"].substring(start, end).replace(/[&\/\\#,+()$~%'":*?<>{}]/g, "").trim();


                                    if (fs.existsSync(filepath + filename)) {
                                        xlsxExprtData[k]['Calculation'] = expData[i].calculation.replace(/<img[^>]*>/g, "");
                                        xlsxExprtData[k]['Calculation Image'] = filename;;
                                        imgFileNames.push(filename);

                                    }
                                    else {
                                        xlsxExprtData[k]['Calculation Image'] = "";
                                    }
                                } else {
                                    let start = parseInt(expData[i]["calculation"].search('image/')) + parseInt(6);
                                    let end = expData[i]["calculation"].search('" style=');
                                    let filename = expData[i]["calculation"].substring(start, end).replace(/[&\/\\#,+()$~%'":*?<>{}]/g, "").trim();
                                    imgFileNames.push(filename);

                                    if (fs.existsSync(filepath + filename)) {
                                        xlsxExprtData[k]['Calculation'] = expData[i].calculation.replace(/<img[^>]*>/g, "");
                                        xlsxExprtData[k]['Calculation Image'] = filename;
                                        imgFileNames.push(filename);
                                    }
                                    else {
                                        xlsxExprtData[k]['Calculation Image'] = "";
                                    }
                                }
                            }
                        } else {
                            xlsxExprtData[k]['Calculation Image'] = '';
                        }

                        if (!expData[i].questionimage) {
                            if (expData[i]["question_body"].includes("<img")) {

                                if (expData[i]["question_body"].includes('src="/images/products/image/')) {
                                    let start = parseInt(expData[i]["question_body"].search(' src="/images/products/image/')) + parseInt(29);
                                    let end = expData[i]["question_body"].search('" style=');
                                    let filename = expData[i]["question_body"].substring(start, end).replace(/[&\/\\#,+()$~%'":*?<>{}]/g, "").trim();
                                    imgFileNames.push(filename);

                                    if (fs.existsSync(filepath + filename)) {
                                        xlsxExprtData[k]['Question Image'] = filename;

                                    }
                                    else {
                                        xlsxExprtData[k]['Question Image'] = "";
                                    }
                                }
                                if (expData[i]["question_body"].includes('src="static/controllers/output/')) {
                                    let start = parseInt(expData[i]["question_body"].search('output/')) + parseInt(7);
                                    // let end = expData[i]["question_body"].search('>');
                                    let end = expData[i]["question_body"].search('" style=');
                                    let filename = expData[i]["question_body"].substring(start, end).replace(/[&\/\\#,+()$~%'":*?<>{}]/g, "").trim();
                                    imgFileNames.push(filename);

                                    if (fs.existsSync(filepath1 + filename)) {
                                        xlsxExprtData[k]['Question Image'] = filename;

                                    }
                                    else {
                                        xlsxExprtData[k]['Question Image'] = "";
                                    }
                                }
                            }
                            else {
                                xlsxExprtData[k]['Question Image'] = "";
                            }
                        } else {
                            xlsxExprtData[k]['Question Image'] = expData[i].questionimage;
                            imgFileNames.push(expData[i].questionimage);
                        }

                        for (var j = 1; j <= 9; j++) {

                            let alternative = "alternative" + j;
                            let alternativeimage = "alternative" + j + "image";

                            if (expData[i][alternativeimage] == null && expData[i][alternative] != null) {
                                if (expData[i][alternative].includes('src')) {


                                    if (expData[i][alternative].includes('data-cke-saved-src="/images/products/image/')) {
                                        let start = parseInt(expData[i][alternative].search(' src="/images/products/image/')) + parseInt(29);
                                        let end = expData[i][alternative].search('" style=');
                                        let filename = expData[i][alternative].substring(start, end).replace(/[&\/\\#,+()$~%'":*?<>{}]/g, "").trim();


                                        if (fs.existsSync(filepath + filename)) {
                                            xlsxExprtData[k]['Alternative ' + j + " Image"] = filename;
                                            imgFileNames.push(filename);
                                        }
                                        else {
                                            xlsxExprtData[k]['Alternative ' + j + "Image"] = "";
                                        }

                                    }
                                    if (expData[i][alternative].includes('src="/images/products/image/')) {

                                        let start = parseInt(expData[i][alternative].search(' src="/images/products/image/')) + parseInt(29);
                                        let end = expData[i][alternative].search('" style=');
                                        let filename = expData[i][alternative].substring(start, end).replace(/[&\/\\#,+()$~%'":*?<>{}]/g, "").trim();

                                        if (fs.existsSync(filepath + filename)) {
                                            xlsxExprtData[k]['Alternative ' + j + " Image"] = filename;
                                            imgFileNames.push(filename);
                                        }
                                        else {
                                            xlsxExprtData[k]['Alternative ' + j + "Image"] = "";
                                        }

                                    }

                                    if (expData[i][alternative].includes('src="static/controllers/output/')) {

                                        let start = parseInt(expData[i][alternative].search('output/')) + parseInt(7);
                                        let end = expData[i][alternative].search('" style=');
                                        let filename = expData[i][alternative].substring(start, end).replace(/[&\/\\#,+()$~%'":*?<>{}]/g, "").trim();
                                        if (fs.existsSync(filepath1 + filename)) {
                                            xlsxExprtData[k]['Alternative ' + j + " Image"] = filename;
                                            imgFileNames.push(filename);
                                        }
                                        else {
                                            xlsxExprtData[k]['Alternative ' + j + " Image"] = "";
                                        }
                                    }
                                } else {
                                    xlsxExprtData[k]['Alternative ' + j + " Image"] = "";
                                }


                            } else {

                                xlsxExprtData[k]['Alternative ' + j + " Image"] = expData[i][alternativeimage];
                                imgFileNames.push(expData[i][alternativeimage]);
                            }

                        }

                        xlsxExprtData[k]['Status (Active / Inactive)'] = expData[i].status;
                        xlsxExprtData[k]['Author_Name'] = expData[i].author_name;
                        xlsxExprtData[k]['Flag'] = expData[i].flag;
                        xlsxExprtData[k]['Flag'] = 'M'
                        xlsxExprtData[k]['Flag'] = expData[i].flag;
                        k++;
                    }

                    function onlyUnique(value, index, self) {
                        return self.indexOf(value) === index;
                    }
                    var fields = [];
                    for (var m in xlsxExprtData[0]) fields.push(m);

                    var xls = json2xls(xlsxExprtData, { fields: fields });
                    var xlsfilename = "QBdata_" + (new Date).getTime() + ".xlsx";

                    if (!fs.existsSync(rootPath + '/uploads/csv_download')) {
                        fs.mkdirSync(rootPath + '/uploads/csv_download', { recursive: true }, err => { });
                    }

                    fs.writeFileSync(rootPath + '/uploads/csv_download/' + xlsfilename, xls, 'binary');

                    var csvfilepath = rootPath + '/uploads/csv_download/' + xlsfilename;
                    var getStream = function (fileName) {
                        return fs.readFileSync(fileName);
                    }

                    //archiver code start
                    var output = fs.createWriteStream(rootPath + '/uploads/csv_download/QBdata.zip');
                    var archive = archiver('zip');
                    archive.pipe(output);
                    archive.on('error', function (err) {
                        throw err;
                    });

                    var uniqueImages = imgFileNames.filter(onlyUnique);
                    archive.append(getStream(csvfilepath), { name: xlsfilename });
                    for (let k in uniqueImages) {
                        var img = rootPath + '/server/controllers/output/' + uniqueImages[k];
                        var img1 = rootPath + '/public/images/products/image/' + uniqueImages[k];
                        if (fs.existsSync(img)) {
                            archive.append(getStream(img), { name: uniqueImages[k] });
                        } else if (fs.existsSync(img1)) {
                            archive.append(getStream(img1), { name: uniqueImages[k] });
                        }

                    }
                    archive.finalize();
                    //archiver code end

                    output.on('close', function () {
                        res.send({
                            code: 0,
                            message: "success",
                            obj: "/uploads/csv_download/QBdata.zip"
                        });
                    });

                } else {
                    res.send({
                        code: 1,
                        message: "success"

                    });
                }
            });


    },
    // manual process to upload history automated function
    addExamManually: function (req, res) {
        importMethods.checkValidUser(req, res);
        var qb_id_list = req.body.qb_id
        var exam_name = req.body.exam_name
        var datepicker = req.body.datepicker
        var exampaper_query = "insert into qba_exam_paper(qstnpaper_id, exam_name, exam_qb_pk, qba_course_fk, qba_subject_fk, exam_fk, published_qb_pk, status, created_dt) " +
            "select concat(e.exam_name, '-', c.qba_course_code, '-', s.qba_subject_code, '-', e.subject_abbreviation, '-', " +
            "((select count(*) from qba_exam_paper) + 1)) as qstnpaper_id,e.exam_name as exam_name,array_agg(qba.qb_pk) as exam_qb_pk,qba.qba_course_fk as qba_course_fk, " +
            "qba.qba_subject_fk as qba_subject_fk,e.exam_pk as exam_fk,array_agg(qba.qb_pk) as published_qb_pk,'A' as status,current_timestamp as created_dt " +
            "from qstn_bank qba inner join qba_subject_master as s on(s.qba_subject_pk = qba.qba_subject_fk and s.qba_course_fk = qba.qba_course_fk " +
            "and s.qba_subject_pk = qba_subject_fk) inner join qba_course_master as c on(c.qba_course_pk = qba.qba_course_fk) " +
            "inner join exam_master as e on(qba.qba_subject_fk = e.qba_subject_fk and e.exam_name = '" + exam_name + "') where " +
            "qba.qb_id in(" + qb_id_list + ")" +
            "group by qba.qba_course_fk, qba.qba_subject_fk, s.qba_subject_code, s.qba_subject_pk, c.qba_course_pk, " +
            "c.qba_course_code, e.qba_subject_fk, e.exam_pk, e.exam_name, e.subject_abbreviation"
        sequelize.query(exampaper_query).then(object => {
            var culled_qstn_bank_query = "insert into culled_qstn_bank(qb_pk, qst_type, qst_lang, qst_pid, qst_sub_seq_no, qst_body,qst_marks, qst_neg_marks, qst_expiry_dt, " +
                "qst_no_of_altr, qst_remarks, qst_fk_tpc_pk, qst_dimension,qst_is_active, qst_audit_by, qst_audit_dt, qb_status_fk, qba_topic_fk, qba_subject_fk, " +
                "qba_course_fk, no_of_question, reference_info, calculation_info, qb_id, qba_module_fk,copied_from_repository, pub_status, publish_flag, " +
                "qb_assigned_to, exam_fk, exampaper_fk, admin_status) " +
                "select qb_pk, qst_type, qst_lang, qst_pid, qst_sub_seq_no, case when qba.qst_img_fk is not null then " +
                "concat(qst_body, '<img src=\"static/controllers/output/',qbi_image_name::text, '\">') else qst_body end,qst_marks, qst_neg_marks, qst_expiry_dt, " +
                "qst_no_of_altr, qst_remarks, qst_fk_tpc_pk, qst_dimension,qst_is_active, qst_audit_by, qst_audit_dt, qb_status_fk, qba_topic_fk, qba.qba_subject_fk, " +
                "qba.qba_course_fk, no_of_question, reference_info, calculation_info, qb_id, qba_module_fk,'Y' as copied_from_repository, 'A' as pub_status, " +
                "'A' as publish_flag, 0 as qb_assigned_to,e.exam_pk as exam_fk, p.exampaper_pk as exampaper_fk,'A' as admin_status from qstn_bank qba  " +
                "left join qbank_images on qba.qst_img_fk = qbi_pk inner join qba_subject_master as s on(s.qba_subject_pk = qba.qba_subject_fk " +
                "and s.qba_course_fk = qba.qba_course_fk and s.qba_subject_pk = qba_subject_fk) inner join qba_course_master as c " +
                "on(c.qba_course_pk = qba.qba_course_fk) inner join exam_master as e on(qba.qba_subject_fk = e.qba_subject_fk and e.exam_name = '" + exam_name + "') " +
                "inner join qba_exam_paper as p on(e.exam_name = p.exam_name)where qba.qb_id in(" + qb_id_list + ")group by qba.qba_course_fk, qba.qba_subject_fk, s.qba_subject_pk, " +
                "c.qba_course_pk, e.qba_subject_fk, e.exam_pk, e.exam_name, qba.qb_pk, p.exam_name, p.exampaper_pk,qbi_image_name, qba.qst_img_fk, qbi_pk " +
                "order by qba.qb_id"
            sequelize.query(culled_qstn_bank_query).then(object2 => {
                var culled_qstn_alternatives_query = "insert into culled_qstn_alternatives(qta_qst_id, qta_id, qta_alt_desc, qta_order, qta_is_corr_alt,qta_is_active, qta_audit_by, qta_audit_dt, qta_img_fk, " +
                    "exam_fk, exampaper_fk) " +
                    "select qta_qst_id, qta_id,qta_alt_desc, qta_order, qta_is_corr_alt,qta_is_active, qta_audit_by, qta_audit_dt, qta_img_fk,e.exam_pk as exam_fk, " +
                    "p.exampaper_pk as exampaper_fk from qstn_alternatives left join qbank_images on qstn_alternatives.qta_img_fk = qbi_pk " +
                    "inner join qstn_bank qba on(qba.qb_pk = qta_qst_id) inner join exam_master as e on(qba.qba_subject_fk = e.qba_subject_fk " +
                    "and e.exam_name = '" + exam_name + "') inner join qba_exam_paper as p on(e.exam_name = p.exam_name) where " +
                    "qba.qb_id in (" + qb_id_list + ") " +
                    "group by qta_pk, qta_qst_id, qta_id, qta_alt_desc, qta_order, qta_is_corr_alt,qta_is_active, qta_audit_by, qta_audit_dt, qta_img_fk, qba.qb_id, " +
                    "qba.qb_pk, e.exam_name,e.qba_subject_fk, qba.qba_subject_fk,p.exam_name, e.exam_pk, p.exampaper_pk,qbi_image_name, qstn_alternatives.qta_img_fk, qbi_pk " +
                    "order by qta_id"

                sequelize.query(culled_qstn_alternatives_query).then(object3 => {
                    var update_datepicker = "update qba_exam_paper set created_dt = to_timestamp('" + datepicker + "  10:53:02' , 'DD.MM.YYYY HH24:MI:SS') where exam_name='" + exam_name + "';"
                    sequelize.query(update_datepicker).then(object4 => {
                        res.send({
                            code: 0,
                            message: 'success'
                        })
                    })
                })
            })
        })
    },
    saveUserBookmarks: function (req, res) {
        importMethods.checkValidUser(req, res);
        var exampaper_fk = req.body.exampaper_fk
        var qb_id = req.body.qb_id
        var page = req.body.page
        var no_of_records = req.body.no_of_records
        var user_fk = req.body.user_fk

        users.create({
            qb_id: qb_id,
            exampaper_fk: exampaper_fk,
            page: page,
            no_of_records: no_of_records,
            user_fk: user_fk
        }).then(result => {
            res.send({
                code: 0,
                message: 'Success'
            })
        })

    },
    getUserBookmarks: function (req, res) {
        importMethods.checkValidUser(req, res);
        var exampaper_fk = req.body.exampaper_fk
        var user_fk = req.body.user_fk
        users.findAll({
            limit: 1,
            where: {
                exampaper_fk: exampaper_fk,
                user_fk: user_fk
            },
            order: [['createdAt', 'DESC']]
        }).then(result => {
            res.send({
                code: 0,
                data: result
            })

        })
    },
    updateInvalidQ: function (req, res) {
        importMethods.checkValidUser(req, res);
        var filepath = req.body.filepath; var workbook = new Excel.Workbook();
        var invalidHeader = [
            { header: "QB_ID", key: "QB_ID" },
            { header: "Course", key: "Course" },
            { header: "Subject", key: "Subject" },
            { header: "Module", key: "Module" },
            { header: "Topic", key: "Topic" },
            { header: "Marks", key: "Marks" },
            { header: "Negative_Marks", key: "Negative_Marks" },
            { header: "Language", key: "Language" },
            { header: "Question_Type", key: "Question_Type" },
            { header: "Parent_QB_ID", key: "Parent_QB_ID" },
            { header: "No_of_Questions", key: "No_of_Questions" },
            { header: "Question_Body", key: "Question_Body" },
            { header: "Number_of_Alternatives", key: "Number_of_Alternatives" },
            { header: "Alternative 1", key: "Alternative 1" },
            { header: "Alternative 2", key: "Alternative 2" },
            { header: "Alternative 3", key: "Alternative 3" },
            { header: "Alternative 4", key: "Alternative 4" },
            { header: "Alternative 5", key: "Alternative 5" },
            { header: "Alternative 6", key: "Alternative 6" },
            { header: "Alternative 7", key: "Alternative 7" },
            { header: "Alternative 8", key: "Alternative 8" },
            { header: "Alternative 9", key: "Alternative 9" },
            { header: "Correct Alternative", key: "Correct Alternative" },
            { header: "Remarks", key: "Remarks" },
            { header: "Remarks Image", key: "Remarks Image" },
            { header: "Reference", key: "Reference" },
            { header: "Reference Image", key: "Reference Image" },
            { header: "Calculation", key: "Calculation" },
            { header: "Calculation Image", key: "Calculation Image" },
            { header: "Question Image", key: "Question Image" },
            { header: "Alternative 1 Image", key: "Alternative 1 Image" },
            { header: "Alternative 2 Image", key: "Alternative 2 Image" },
            { header: "Alternative 3 Image", key: "Alternative 3 Image" },
            { header: "Alternative 4 Image", key: "Alternative 4 Image" },
            { header: "Alternative 5 Image", key: "Alternative 5 Image" },
            { header: "Alternative 6 Image", key: "Alternative 6 Image" },
            { header: "Alternative 7 Image", key: "Alternative 7 Image" },
            { header: "Alternative 8 Image", key: "Alternative 8 Image" },
            { header: "Alternative 9 Image", key: "Alternative 9 Image" },
            { header: "Status (Active / Inactive)", key: "Status (Active / Inactive)" },
            { header: "Author_Name", key: "Author_Name" },
            { header: "Flag", key: "Flag" },
            { header: "Invalid", key: "Invalid" }
        ];


        let query = "update qstn_bank set qst_is_active = 'X' where qb_pk in ( select qb.qb_pk from qba.qstn_bank qb  left join qba.qstn_bank qb1 on (qb.qb_id=qb1.qst_pid) where qb.qst_type = 'CS' and qb.qst_is_active = 'I' and qb.qst_pid=0 and 1 <= (select count(qb_pk) from qba.qstn_bank where qst_is_active = 'A' and qst_pid = qb1.qst_pid)  union select qb1.qb_pk from qba.qstn_bank qb  left join qba.qstn_bank qb1 on (qb.qb_id=qb1.qst_pid) where qb.qst_type = 'CS' and qb.qst_is_active = 'I' and qb.qst_pid=0 and 1 <= (select count(qb_pk) from qba.qstn_bank where qst_is_active = 'A' and qst_pid = qb1.qst_pid) union select qb2.qb_pk from qba.qstn_bank qb2 right join qba.qstn_bank qb3 on (qb2.qb_id=qb3.qst_pid) where qb2.qst_type = 'CS' and qb2.qst_is_active = 'A' and qb2.qst_pid = 0 and 0 = (select count(qb_pk) from qba.qstn_bank where qst_is_active = 'A' and qst_pid = qb3.qst_pid) union  select qb3.qb_pk from qba.qstn_bank qb2 right join qba.qstn_bank qb3 on (qb2.qb_id=qb3.qst_pid) where qb2.qst_type = 'CS' and qb2.qst_is_active = 'A' and qb2.qst_pid = 0 and 0 = (select count(qb_pk) from qba.qstn_bank where qst_is_active = 'A' and qst_pid = qb3.qst_pid) union select qb_pk from qba.qstn_bank where qst_pid >0 and qst_type = 'CS' and qst_pid not in (select qb_id from qba.qstn_bank where qst_type = 'CS' and qst_pid=0 and (qst_is_active = 'A' or qst_is_active = 'I')) union select qb4.qb_pk from qba.qstn_bank qb4 right join qba.qstn_bank qb5 on (qb4.qb_id=qb5.qst_pid) where qb4.qst_type = 'CS' and qb4.qst_is_active = 'A' and qb4.qst_pid = 0 and 1 = (select count(qb_pk) from qba.qstn_bank where qst_is_active = 'A' and qst_pid = qb5.qst_pid) union select qb5.qb_pk from qba.qstn_bank qb4 right join qba.qstn_bank qb5 on (qb4.qb_id=qb5.qst_pid) where qb4.qst_type = 'CS' and qb4.qst_is_active = 'A' and qb4.qst_pid = 0 and 1 = (select count(qb_pk) from qba.qstn_bank where qst_is_active = 'A' and qst_pid = qb5.qst_pid))";
        sequelize.query(query, { type: sequelize.QueryTypes.UPDATE }).then(result => {
            var rowheaderData = [];
            if (filepath == '') {
                filepath = '/uploads/csv_download/import' + (new Date).getTime() + ".xlsx";
                var worksheet = workbook.addWorksheet('InvalidData');
                for (var j = 0; j < invalidHeader.length; j++) {

                    rowheaderData[j + 1] = invalidHeader[j].header;
                }
                worksheet.addRow(rowheaderData).commit();
                let query = 'select qb.qb_id as "QB_ID",qba_course_code as "Course",qba_subject_code as "Subject",module_name as "Module",qba_topic_code as "Topic",qst_marks as "Marks",qst_neg_marks as "Negative_Marks", qst_lang as "Language",qst_type as "Question_Type",qst_pid as "Parent_QB_ID",no_of_question as "No_of_Questions",qst_body as "Question_Body",count(qta_id) as "Number_of_Alternatives",max(case when  qta_order=1 then qta_alt_desc else null end) as "Alternative 1", max(case when  qta_order=2 then qta_alt_desc else null end) as "Alternative 2" , max(case when  qta_order=3 then qta_alt_desc else null end) as "Alternative 3", max(case when  qta_order=4 then qta_alt_desc else null end) as "Alternative 4", max(case when  qta_order=5 then qta_alt_desc else null end) as "Alternative 5",max(case when  qta_order=6 then qta_alt_desc else null end) as "Alternative 6",max(case when  qta_order=7 then qta_alt_desc else null end) as "Alternative 7",max(case when  qta_order=8 then qta_alt_desc else null end) as "Alternative 8",max(case when  qta_order=9 then qta_alt_desc else null end) as "Alternative 9",max(case when  qta_is_corr_alt=\'Y\' then qta_order else null end) as "Correct Alternative",qb.qst_remarks as "Remarks", null as "Remarks Image",qb.reference_info as "Reference" , null as "Reference Image",qb.calculation_info as "Calculation", null as "Calculation Image",questionimage.qbi_image_name  as "Question Image",max(case when  qta_order=1 then alterimage.qbi_image_name else null end) as "Alternative 1 Image",max(case when  qta_order=2 then alterimage.qbi_image_name else null end) as "Alternative 2 Image" , max(case when  qta_order=3 then alterimage.qbi_image_name else null end) as "Alternative 3 Image", max(case when  qta_order=4 then alterimage.qbi_image_name else null end) as "Alternative 4 Image", max(case when  qta_order=5 then alterimage.qbi_image_name else null end) as "Alternative 5 Image",max(case when  qta_order=6 then alterimage.qbi_image_name else null end) as "Alternative 6 Image",max(case when  qta_order=7 then alterimage.qbi_image_name else null end) as "Alternative 7 Image",max(case when  qta_order=8 then alterimage.qbi_image_name else null end) as "Alternative 8 Image",max(case when  qta_order=9 then alterimage.qbi_image_name else null end) as "Alternative 9 Image",qb.qst_is_active as "Status (Active / Inactive)",qb.author_name as "Author_Name",\'A\' as Flag,case when qb.qst_pid=0 then \'Invalid Parent\' else \'Parent Missing\' end as "Invalid"  from qstn_bank qb left join qba_course_master cm on (cm.qba_course_pk=qb.qba_course_fk) left join qba_subject_master sm on (sm.qba_subject_pk=qb.qba_subject_fk) left join qba_module_mstr mm on (mm.qba_module_pk=qb.qba_module_fk) left join qba_topic_master tm on (tm.qba_topic_pk=qb.qba_topic_fk) left join qstn_alternatives qa on (qb.qb_id=qa.qta_id and qb.qb_pk = qa.qta_qst_id and qa.qta_is_active = \'Y\') left join  qbank_images as questionimage ON  (qb.qst_img_fk = questionimage.qbi_pk) left join qbank_images as alterimage  ON (qa.qta_img_fk = alterimage.qbi_pk)    where qb.qst_is_active =  \'X\'  group by 1,2,3,4,5,6,7,8,9,10,11,12,24,25,26,27,28,29,30,40,41 order by qb.qst_pid,qb.qb_id';

                sequelize.query(query, { type: sequelize.QueryTypes.SELECT }).then(result => {
                    if (result.length > 0) {
                        for (var i = 0; i < result.length; i++) {
                            var rowData = [];
                            var obj = result[i];
                            Object.keys(obj).forEach(function (k) {
                                rowData.push(obj[k]);
                            });
                            worksheet.addRow(rowData).commit();
                        }

                        if (i == result.length) {
                            workbook.xlsx.writeFile(rootPath + filepath)
                                .then(function () {
                                    let deletealtx = "delete from qstn_alternatives where qta_qst_id in (select qb_pk from qstn_bank where qst_is_active = 'X')";
                                    sequelize.query(deletealtx, { type: sequelize.QueryTypes.DELETE }).then(resultaltdelete => {
                                        let deletex = "delete from qstn_bank where qst_is_active = 'X'";
                                        sequelize.query(deletex, { type: sequelize.QueryTypes.DELETE }).then(resultdelete => {

                                            res.send({
                                                filepath: filepath,
                                                code: 1,
                                                message: "success"

                                            });
                                        });
                                    });
                                });
                        }
                    } else {
                        res.send({
                            code: 0,
                            message: "success"

                        });
                    }



                });

            } else {

                let query = 'select qb.qb_id as "QB_ID",qba_course_code as "Course",qba_subject_code as "Subject",module_name as "Module",qba_topic_code as "Topic",qst_marks as "Marks",qst_neg_marks as "Negative_Marks", qst_lang as "Language",qst_type as "Question_Type",qst_pid as "Parent_QB_ID",no_of_question as "No_of_Questions",qst_body as "Question_Body",count(qta_id) as "Number_of_Alternatives",max(case when  qta_order=1 then qta_alt_desc else null end) as "Alternative 1", max(case when  qta_order=2 then qta_alt_desc else null end) as "Alternative 2" , max(case when  qta_order=3 then qta_alt_desc else null end) as "Alternative 3", max(case when  qta_order=4 then qta_alt_desc else null end) as "Alternative 4", max(case when  qta_order=5 then qta_alt_desc else null end) as "Alternative 5",max(case when  qta_order=6 then qta_alt_desc else null end) as "Alternative 6",max(case when  qta_order=7 then qta_alt_desc else null end) as "Alternative 7",max(case when  qta_order=8 then qta_alt_desc else null end) as "Alternative 8",max(case when  qta_order=9 then qta_alt_desc else null end) as "Alternative 9",max(case when  qta_is_corr_alt=\'Y\' then qta_order else null end) as "Correct Alternative",qb.qst_remarks as "Remarks", null as "Remarks Image",qb.reference_info as "Reference" , null as "Reference Image",qb.calculation_info as "Calculation", null as "Calculation Image",questionimage.qbi_image_name  as "Question Image",max(case when  qta_order=1 then alterimage.qbi_image_name else null end) as "Alternative 1 Image",max(case when  qta_order=2 then alterimage.qbi_image_name else null end) as "Alternative 2 Image" , max(case when  qta_order=3 then alterimage.qbi_image_name else null end) as "Alternative 3 Image", max(case when  qta_order=4 then alterimage.qbi_image_name else null end) as "Alternative 4 Image", max(case when  qta_order=5 then alterimage.qbi_image_name else null end) as "Alternative 5 Image",max(case when  qta_order=6 then alterimage.qbi_image_name else null end) as "Alternative 6 Image",max(case when  qta_order=7 then alterimage.qbi_image_name else null end) as "Alternative 7 Image",max(case when  qta_order=8 then alterimage.qbi_image_name else null end) as "Alternative 8 Image",max(case when  qta_order=9 then alterimage.qbi_image_name else null end) as "Alternative 9 Image",qb.qst_is_active as "Status (Active / Inactive)",qb.author_name as "Author_Name",\'A\' as Flag,case when qb.qst_pid=0 then \'Invalid Parent\' else \'Parent Missing\' end as "Invalid"  from qstn_bank qb left join qba_course_master cm on (cm.qba_course_pk=qb.qba_course_fk) left join qba_subject_master sm on (sm.qba_subject_pk=qb.qba_subject_fk) left join qba_module_mstr mm on (mm.qba_module_pk=qb.qba_module_fk) left join qba_topic_master tm on (tm.qba_topic_pk=qb.qba_topic_fk) left join qstn_alternatives qa on (qb.qb_id=qa.qta_id and qb.qb_pk = qa.qta_qst_id and qa.qta_is_active = \'Y\') left join  qbank_images as questionimage ON  (qb.qst_img_fk = questionimage.qbi_pk) left join qbank_images as alterimage  ON (qa.qta_img_fk = alterimage.qbi_pk)    where qb.qst_is_active =  \'X\'  group by 1,2,3,4,5,6,7,8,9,10,11,12,24,25,26,27,28,29,30,40,41 order by qb.qst_pid,qb.qb_id';
                workbook.xlsx.readFile(rootPath + filepath)
                    .then(function () {

                        sequelize.query(query, { type: sequelize.QueryTypes.SELECT }).then(result => {
                            var worksheet = workbook.getWorksheet('InvalidData');
                            if (result.length > 0) {
                                for (var i = 0; i < result.length; i++) {
                                    var rowData = [];
                                    var obj = result[i];
                                    Object.keys(obj).forEach(function (k) {
                                        rowData.push(obj[k]);
                                    });
                                    worksheet.addRow(rowData).commit();
                                }

                                if (i == result.length) {
                                    workbook.xlsx.writeFile(rootPath + filepath)
                                        .then(function () {
                                            let deletealtx = "delete from qstn_alternatives where qta_qst_id in (select qb_pk from qstn_bank where qst_is_active = 'X')";
                                            sequelize.query(deletealtx, { type: sequelize.QueryTypes.DELETE }).then(resultaltdelete => {
                                                let deletex = "delete from qstn_bank where qst_is_active = 'X'";
                                                sequelize.query(deletex, { type: sequelize.QueryTypes.DELETE }).then(resultdelete => {
                                                    res.send({
                                                        filepath: filepath,
                                                        code: 1,
                                                        message: "success"

                                                    });
                                                });
                                            });
                                        });
                                }
                            } else {
                                res.send({
                                    code: 0,
                                    message: "success"

                                });
                            }
                        });
                    });
            }
        });
    },

    loadchanged_questions: function (req, res) {
        importMethods.checkValidUser(req, res);
        var moduleId = req.body.id;
        var exam_pk = req.body.examPk;
        var exampaper_pk = req.body.examPaperPk;
        var query = "WITH d1 AS ( SELECT DISTINCT * , qta_is_corr_alt,alterimage.qbi_image_name as aimage,qta_pk, qta_alt_desc, now() AS CURRENT_TIME FROM ( SELECT replace_id,qst_request_status,qst_request_remarks,qba_subject_code,qba_course_code, log_count, total_weightage, no_of_question, un_id, qb_pk, qba_topic_fk, qba_subject_pk, qba_course_pk, qba_module_pk, qba_course_name, subject_name, module_name, topic_name, qba_topic_code, qst_marks, qst_neg_marks, qst_lang, qst_type, qst_pid, qst_body, qst_no_of_altr, qst_remarks, qst_request_remarks, calculation_info, reference_info, qst_is_active, qst_audit_by, qst_audit_dt, culled_qstn_bank.qb_id, ( CASE WHEN culled_qstn_bank.qst_type='CS' AND culled_qstn_bank.qst_pid > 0 THEN culled_qstn_bank.qst_pid::varchar || '.' || lpad(culled_qstn_bank.qb_id::varchar,8,'0')::varchar ELSE culled_qstn_bank.qb_id::varchar END )::numeric(16,10) as qb_id1, culled_qstn_bank.exam_fk AS culled_exam_fk , culled_qstn_bank.exampaper_fk AS culled_exampaper_fk , culled_qb_pk, copied_from_repository FROM ( SELECT culled_qb_pk un_id, * FROM qba.culled_qstn_bank a WHERE (CASE WHEN qst_type = 'CS' AND qst_pid > 0 THEN 1 ELSE 2 END) =2 UNION ALL SELECT a.culled_qb_pk un_id, b.* FROM qba.culled_qstn_bank a INNER JOIN qba.culled_qstn_bank b ON a.qst_lang= b.qst_lang AND a.qb_id=b.qst_pid AND a.exampaper_fk=b.exampaper_fk WHERE a.qst_type = 'CS' AND a.qst_pid = 0 ) culled_qstn_bank INNER JOIN qba.qba_topic_master ON (qba_topic_master.qba_topic_pk=culled_qstn_bank.qba_topic_fk) INNER JOIN qba.qba_module_mstr ON (qba_module_mstr.qba_module_pk=qba_topic_master.qba_module_fk) INNER JOIN qba.qba_subject_master ON (qba_subject_master.qba_subject_pk=qba_module_mstr.qba_subject_fk) INNER JOIN qba.qba_course_master ON (qba_course_master.qba_course_pk=qba_subject_master.qba_course_fk) LEFT JOIN ( SELECT SUM(cu.qst_marks) total_weightage, MAX(cu.qst_pid) qstpid FROM qba.culled_qstn_bank cu WHERE cu.exam_fk =" + exam_pk + " AND cu.exampaper_fk = " + exampaper_pk + " AND cu.qst_lang='ENGLISH' and cu.qst_is_active = 'A' and (cu.qba_module_fk IN (" + moduleId + ") or cu.qba_module_fk is null) GROUP BY cu.qst_pid HAVING(cu.qst_pid)> 1 ) tw ON (culled_qstn_bank.qb_id = tw.qstpid) LEFT JOIN ( SELECT old_qta_fk log_count, qb_id, exam_fk, exampaper_fk FROM qba.culled_qstn_alternatives_log WHERE qta_log_pk IN ( SELECT MAX(qta_log_pk) FROM qba.culled_qstn_alternatives_log WHERE exam_fk=" + exam_pk + " AND exampaper_fk=" + exampaper_pk + " AND status='Answer'  GROUP BY qb_id ) ) log ON (log.qb_id=culled_qstn_bank.qb_id AND log.exam_fk=" + exam_pk + " AND log.exampaper_fk=" + exampaper_pk + ") WHERE qst_is_active = 'A' AND culled_qstn_bank.exam_fk =" + exam_pk + " AND culled_qstn_bank.exampaper_fk= " + exampaper_pk + " AND qst_lang='ENGLISH' and (culled_qstn_bank.qba_module_fk IN (" + moduleId + ") or culled_qstn_bank.qba_module_fk is null) ORDER BY module_name, topic_name, qst_marks, qb_id ) a LEFT JOIN qba.culled_qstn_alternatives ON (culled_qstn_alternatives.qta_qst_id=a.qb_pk AND culled_qstn_alternatives.exam_fk=" + exam_pk + " AND culled_qstn_alternatives.exampaper_fk=" + exampaper_pk + ") left join qbank_images alterimage on (alterimage.qbi_pk=culled_qstn_alternatives.qta_img_fk)  WHERE qst_type = 'CS'  ORDER BY module_name, qba_topic_code, qst_type DESC, qst_marks, qb_id1 ), d2 AS ( SELECT * FROM d1 ORDER BY module_name,topic_name, qst_type, qb_id ), d3 AS ( SELECT DISTINCT * , qta_is_corr_alt,alterimage.qbi_image_name as aimage,qta_pk, qta_alt_desc, now() AS CURRENT_TIME FROM ( SELECT replace_id,qst_request_status,qst_request_remarks,qba_subject_code,qba_course_code, log_count, total_weightage, no_of_question, un_id, qb_pk, qba_topic_fk, qba_subject_pk, qba_course_pk, qba_module_pk, qba_course_name, subject_name, module_name, topic_name, qba_topic_code, qst_marks, qst_neg_marks, qst_lang, qst_type, qst_pid, qst_body, qst_no_of_altr, qst_remarks, qst_request_remarks, calculation_info, reference_info, qst_is_active, qst_audit_by, qst_audit_dt, culled_qstn_bank.qb_id, ( CASE WHEN culled_qstn_bank.qst_type = 'M' THEN culled_qstn_bank.qb_id::varchar ELSE NULL END )::numeric(10,5) as qb_id1, culled_qstn_bank.exam_fk AS culled_exam_fk , culled_qstn_bank.exampaper_fk AS culled_exampaper_fk , culled_qb_pk, copied_from_repository FROM ( SELECT culled_qb_pk un_id, * FROM qba.culled_qstn_bank a WHERE (CASE WHEN qst_type = 'CS' AND qst_pid > 0 THEN 1 ELSE 2 END) =2 UNION ALL SELECT a.culled_qb_pk un_id, b.* FROM qba.culled_qstn_bank a INNER JOIN qba.culled_qstn_bank b ON a.qst_lang= b.qst_lang AND a.qb_id=b.qst_pid AND a.exampaper_fk=b.exampaper_fk WHERE a.qst_type = 'CS' AND a.qst_pid = 0 ) culled_qstn_bank INNER JOIN qba.qba_topic_master ON (qba_topic_master.qba_topic_pk=culled_qstn_bank.qba_topic_fk) INNER JOIN qba.qba_module_mstr ON (qba_module_mstr.qba_module_pk=qba_topic_master.qba_module_fk) INNER JOIN qba.qba_subject_master ON (qba_subject_master.qba_subject_pk=qba_module_mstr.qba_subject_fk) INNER JOIN qba.qba_course_master ON (qba_course_master.qba_course_pk=qba_subject_master.qba_course_fk) LEFT JOIN ( SELECT SUM(cu.qst_marks) total_weightage, MAX(cu.qst_pid) qstpid FROM qba.culled_qstn_bank cu WHERE cu.exam_fk =" + exam_pk + " AND cu.exampaper_fk= " + exampaper_pk + " AND cu.qst_lang='ENGLISH' GROUP BY cu.qst_pid HAVING(cu.qst_pid)> 1 ) tw ON (culled_qstn_bank.qb_id = tw.qstpid) LEFT JOIN ( SELECT old_qta_fk log_count, qb_id, exam_fk, exampaper_fk FROM qba.culled_qstn_alternatives_log WHERE qta_log_pk IN ( SELECT MAX(qta_log_pk) FROM qba.culled_qstn_alternatives_log WHERE exam_fk=" + exam_pk + " AND exampaper_fk=" + exampaper_pk + " AND status='Answer' GROUP BY qb_id ) ) log ON (log.qb_id=culled_qstn_bank.qb_id AND log.exam_fk=" + exam_pk + " AND log.exampaper_fk=" + exampaper_pk + ") WHERE qst_is_active = 'A'  AND culled_qstn_bank.exam_fk =" + exam_pk + " AND culled_qstn_bank.exampaper_fk= " + exampaper_pk + " AND qst_lang='ENGLISH' and (culled_qstn_bank.qba_module_fk IN (" + moduleId + ") or culled_qstn_bank.qba_module_fk is null) ORDER BY module_name, topic_name, qst_marks, qb_id ) a LEFT JOIN qba.culled_qstn_alternatives ON (culled_qstn_alternatives.qta_qst_id=a.qb_pk AND culled_qstn_alternatives.exam_fk=" + exam_pk + " AND culled_qstn_alternatives.exampaper_fk=" + exampaper_pk + ") left join qbank_images alterimage on (alterimage.qbi_pk=culled_qstn_alternatives.qta_img_fk)  WHERE qst_type = 'M' ORDER BY module_name, qba_topic_code, qst_type DESC, qst_marks ) , d4 AS (SELECT case when qst_type = 'CS' then dense_rank() over(ORDER BY qst_type, module_name,qba_topic_code,qb_id1, qb_pk) else dense_rank() over(ORDER BY qst_type, module_name,qba_topic_code,qb_id1, qst_marks,qb_pk) end as dr, * FROM ( SELECT * FROM d2 where qb_id in (select qb_id from culled_qstn_bank where (qst_body  like '%<ins%') or (qst_body  like '%<del%') or (qst_remarks like '%<ins%') or (qst_remarks like '%<del%') or (reference_info like '%<ins%') or (reference_info like '%<del%') or (calculation_info like '%<ins%') or (calculation_info like '%<del%') and qst_is_active = 'A' AND exam_fk =" + exam_pk + " AND exampaper_fk= " + exampaper_pk + " AND qst_lang='ENGLISH' and (qba_module_fk IN (" + moduleId + ") or culled_qstn_bank.qba_module_fk is null)) or qb_id in (select qta_id from culled_qstn_alternatives where (qta_alt_desc like '%<ins%' or qta_alt_desc like '%<del%') AND  exam_fk=" + exam_pk + " AND  exampaper_fk=" + exampaper_pk + ")  UNION ALL SELECT * FROM d3 where qb_id in (select qb_id from culled_qstn_bank where (qst_body  like '%<ins%') or (qst_body  like '%<del%') or (qst_remarks like '%<ins%') or (qst_remarks like '%<del%') or (reference_info like '%<ins%') or (reference_info like '%<del%') or (calculation_info like '%<ins%') or (calculation_info like '%<del%') and qst_is_active = 'A' AND exam_fk =" + exam_pk + " AND exampaper_fk= " + exampaper_pk + " AND qst_lang='ENGLISH' and (qba_module_fk IN (" + moduleId + ") or culled_qstn_bank.qba_module_fk is null)) or qb_id in (select qta_id from culled_qstn_alternatives where (qta_alt_desc like '%<ins%' or qta_alt_desc like '%<del%')  AND  exam_fk=" + exam_pk + " AND  exampaper_fk=" + exampaper_pk + " ) )t ) SELECT qst_type, qb_id, qst_pid, module_name, qba_topic_code,qst_marks, * FROM d4 ORDER BY dr,qta_order";
        var moduleArray = moduleId
        var querydata = "SELECT count(*) AS count FROM qba.culled_qstn_bank AS culled_qstn_bank WHERE culled_qstn_bank.qba_module_fk IN (" + moduleArray + ") AND culled_qstn_bank.exam_fk = '" + exam_pk + "' AND culled_qstn_bank.exampaper_fk = '" + exampaper_pk + "' AND culled_qstn_bank.qst_is_active = 'A' AND (culled_qstn_bank.qst_type = 'M' OR (culled_qstn_bank.qst_type = 'CS' AND culled_qstn_bank.qst_pid != '0')) AND culled_qstn_bank.qst_lang = 'ENGLISH';"

        sequelize.query(querydata, { type: sequelize.QueryTypes.SELECT })
            .then(c => {


                sequelize.query(query, { type: sequelize.QueryTypes.SELECT })
                    .then(searchResult => {

                        req.body.result = searchResult;
                        req.body.count = c;
                        importMethods.parseQuestionBankData(req, res);
                    });
            });

    },
    updateTrack_Questions: function (req, res) {
        importMethods.checkValidUser(req, res);
        var data = req.body.data;
        var length = data.length;

        for (var i = 0; i < length; i++) {
            let qb_pk = data[i].qb_pk;
            let qst_body = data[i].qst_body;
            let exam_fk = data[i].exam_fk;
            let exampaper_fk = data[i].exampaper_fk;
            let qst_lang = data[i].qst_lang;
            let qb_id = data[i].qb_id;
            let qstn_alternatives_length = data[i].qstn_alternatives.length;
            let qst_remarks = (data[i].qst_remarks == null) ? "" : data[i].qst_remarks
            let calculation_info = (data[i].calculation_info == null) ? "" : data[i].calculation_info
            let reference_info = (data[i].reference_info == null) ? "" : data[i].reference_info
            let alternatives = data[i].qstn_alternatives;
            if (qst_body.includes('data-cke-saved-src="/images/products/image/')) {
                var n = qst_body.indexOf("data-cke-saved");
                var m = qst_body.indexOf(" src=")
                var res2 = qst_body.slice(0, n);
                var res1 = qst_body.slice(m, qst_body.length)
                var temp = res2 + "" + res1
                qst_body = temp
            }
            if (qst_body.includes('data-cke-saved-src="static/controllers/output/')) {
                var n = qst_body.indexOf("data-cke-saved");
                var m = qst_body.indexOf(" src=")
                var res2 = qst_body.slice(0, n);
                var res1 = qst_body.slice(m, qst_body.length)
                var temp = res2 + "" + res1
                qst_body = temp
            }
            culled_qstn_bank.update({
                qst_body: qst_body,
                qst_remarks: qst_remarks != '' ? qst_remarks : null,
                reference_info: reference_info != '' ? reference_info : null,
                calculation_info: calculation_info != '' ? calculation_info : null
            }, {
                where: {
                    qb_pk: qb_pk,
                    exam_fk: exam_fk,
                    exampaper_fk: exampaper_fk,
                    qst_lang: qst_lang
                }

            })
                .then(result => {

                    if (qstn_alternatives_length > 0) {
                        for (let j = 0; j < qstn_alternatives_length; j++) {
                            let qta_pk = alternatives[j].qta_pk;
                            let qta_alt_desc = alternatives[j].qta_alt_desc;
                            if (qta_alt_desc.includes('data-cke-saved-src="/images/products/image/')) {
                                var n = qta_alt_desc.indexOf("data-cke-saved");
                                var m = qta_alt_desc.indexOf(" src=")
                                var res2 = qta_alt_desc.slice(0, n);
                                var res1 = qta_alt_desc.slice(m, qta_alt_desc.length)
                                var temp = res2 + "" + res1
                                qta_alt_desc = temp
                            }
                            if (qta_alt_desc.includes('data-cke-saved-src="static/controllers/output/')) {
                                var n = qta_alt_desc.indexOf("data-cke-saved");
                                var m = qta_alt_desc.indexOf(" src=")
                                var res2 = qta_alt_desc.slice(0, n);
                                var res1 = qta_alt_desc.slice(m, qta_alt_desc.length)
                                var temp = res2 + "" + res1
                                qta_alt_desc = temp
                            }
                            culled_qstn_alternatives.update({
                                qta_alt_desc: qta_alt_desc,

                            }, {
                                where: {
                                    qta_pk: qta_pk
                                }
                            })
                        }
                    }
                });
        }
        if (i == length) {
            res.send({
                code: 0,
                message: "success"

            });
        }


    }


};

module.exports = importMethods;

