(function () {

    module.exports = function (app) {
        console.log("inside routes");
        process.env.SECRET = "CROWN";
        var UserServer = require("../controllers/qb_server.js");
        var CullingServer = require("../controllers/culling_server.js");
        var ExamServer = require("../controllers/exam_server.js");



        var checkValidUser = function (req, res, next) {
            var sess = req.session.userCredentials;
            if (sess == undefined) {
                res.send({
                    code: 401,
                    data: {}
                });
            }
            next()
        };
        app.post('/api/import', UserServer.importDocument);
        app.post('/api/importPaperAdmin', UserServer.importPaperAdminDoc);
        app.post('/api/add_exam_manually', UserServer.addExamManually);
        app.post('/api/save_user_bookmarks', UserServer.saveUserBookmarks);
        app.post('/api/get_user_bookmarks', UserServer.getUserBookmarks);
        app.post('/api/export', UserServer.exportDocument);
        app.post('/api/exportInNseFormat', UserServer.exportDocumentInNseitFormat);

        app.post('/api/save_mcq', UserServer.saveMCQ);
        app.post('/api/save_child_sf', UserServer.saveChildShortFall);
        app.post('/api/save_mcq_admin', UserServer.saveMCQAdmin);
        app.post('/api/edit_mcq', UserServer.editMcq);
        app.post('/api/edit_vetter_questions', UserServer.editVetterQuestions);
        app.post('/api/edit_vetter_questions_inline', UserServer.editVetterQuestionsInline);
        app.post('/api/edit_vetter_options', UserServer.editVetterOptions); app.post('/api/del_vetter_options', UserServer.delVetterOptions);
        app.post('/api/del_vetteroptions', UserServer.deleteVetterOptions);
        app.post('/api/edit_selected_options', UserServer.editandsaveVetterOptions);

        app.post('/api/edit_and_save_options', UserServer.updateoptions);
        app.post('/api/load_courses', UserServer.loadCourses);
        app.post('/api/load_alldata', UserServer.loadalldata);  //comment added by dipika

        app.post('/api/load_subjects', UserServer.loadSubjects);
        app.post('/api/load_modules', UserServer.loadModules);
        app.post('/api/load_topics', UserServer.loadTopics);
        app.post('/api/load_questions', UserServer.loadQuestions);
        app.post('/api/load_vetter_questions', UserServer.loadVetterQuestions);
        app.post('/api/load_query_for_print', UserServer.loadVetterQuestionsForPrint);
        app.post('/api/login', UserServer.validateUser);
        app.post('/api/searchQb', UserServer.searchQb);
        app.post('/api/save_csq_parent', UserServer.saveCSQParent);
        app.post('/api/save_csq_parent_admin', UserServer.saveCSQParentAdmin);
        app.post('/api/save_csq_data_vetter', UserServer.saveCSQParentVetter);
        app.post('/api/save_csq_parent_in_vetter', UserServer.saveCSQVetter);
        app.post('/api/save_csq_parent_in_admin', UserServer.saveCSQAdmin);
        /*app.post('/api/save_comments', UserServer.saveComments);*/

        app.post('/api/update_child_count', UserServer.updateChildCount);
        app.post('/api/update_child_count_sf', UserServer.updateChildCountCaseShortfall);
        app.post('/api/update_child_count_Admin', UserServer.updateChildCountInAdmin);
        app.post('/api/load_topics_table', CullingServer.createTopicTable);
        app.post('/api/get_total_question_count', UserServer.getTotalQuestionCount);
        app.post('/api/TopicwiseQstnId', CullingServer.getTopicwiseQstnIdMap);
        app.post('/api/TopicwiseCaseQstnId', CullingServer.getTopicwiseCaseQstnIdMap);
        app.post('/api/Case_Question_Culling', CullingServer.CaseQuestionCulling);
        app.post('/api/get_user_list', ExamServer.getUserList);
        app.post('/api/assign_vetter_publisher', ExamServer.assignVetterOrPublisher);
        app.post('/api/load_case_parent_marks_map', UserServer.loadCaseParentMarksMap);
        app.post('/api/load_questions_for_preview', UserServer.loadQuestionsforPreview);
        app.post('/api/load_exam_master', CullingServer.getExamMasterData);
        app.post('/api/get_vetter_details', UserServer.getVetterDetails);
        app.post('/api/removing_vetting_log_details', UserServer.removeVettingLogDetails);
        app.post('/api/update_vetting_log_details', UserServer.updateVettingLogDetails);
        app.post('/api/get_change_log_details', UserServer.getChangeLogDetails);
        app.post('/api/cull_load_template_details', CullingServer.cullLoadTemplateDetails);
        app.post('/api/cull_save_temp_details', CullingServer.cullSaveTempDetails);
        app.post('/api/cull_save_temp', CullingServer.cullSaveTemp);
        app.post('/api/get_template_name', CullingServer.getTemplateName);
        app.post('/api/load_flag', CullingServer.getFlag)
        app.post('/api/cull_save_case_temp_details', CullingServer.cullSaveCaseTempDetails);
        app.post('/api/cull_load_case_template_details', CullingServer.cullLoadCaseTemplateDetails);
        /*nikhil code start's here*/
        app.post('/api/load_exam_list', ExamServer.loadExamList);
        app.post('/api/load_pk_question', UserServer.loadPkQuestion);
        app.post('/api/load_summary_details', UserServer.loadSummaryDetails);
        app.post('/api/save_mcq_shortfall_records', UserServer.saveMCQShortfall);
        app.post('/api/copy_culled_questions', UserServer.copyQuestionsInCulledTable);
        //update summary on replace
        app.post('/api/replace_update_case_summary', UserServer.updateReplaceCaseSummary)
        app.post('/api/replace_update_mcq_summary', UserServer.updateReplaceMCQSummary)
        /*nikhil code end's here*/
        app.post('/api/insert_parent_child_question_InAdmin', UserServer.insertparentandchildInAdmin);
        /*milan code start*/
        app.post('/api/vetter_req_for_replace_question', UserServer.vetterReqForReplaceQuestion);
        app.post('/api/get_list_of_vetterRequest', UserServer.getListofVetterRequest);
        app.post('/api/get_list_of_vetter_requestby_user', UserServer.getListofVetterRequestbyUser);
        app.post('/api/approval_of_vetter_request', UserServer.approvalofVetterRequest);
        app.post('/api/activation_of_questionstatus', UserServer.activationofQuestionStatus);
        app.post('/api/inactivate_question_status', UserServer.inActivateQuestionStatus);
        app.post('/api/load_final_exampaper', UserServer.loadFinalExamPaper);
        app.get('/api/load_all_question', UserServer.loadAllQuestion);
        app.post('/api/load_inactive_questions', UserServer.loadInactiveQuestions);
        app.post('/api/load_inactive_questions_modulewise', UserServer.loadInactiveQuestionsModuleWise);
        app.post('/api/load_inactive_questions_subjectwise', UserServer.loadInactiveQuestionsSubjectWise);
        app.post('/api/load_inactive_questions_admin', UserServer.loadInactiveQuestionsAdmin);
        app.post('/api/load_case_inactive_question_admin', UserServer.loadCaseInAdmin)
        app.post('/api/save_replace_qstn_history', UserServer.saveReplaceQstnHistory);
        app.post('/api/update_replace_qstn_history', UserServer.updateReplaceQstnHistory);
        app.get('/api/load_replace_question_history', UserServer.loadReplaceQuestionHistory);
        app.post('/api/update_quest_to_publish', UserServer.updateQuestToPublish);
        app.post('/api/remove_alt_to_publish', UserServer.removeAltToPublish);
        app.post('/api/update_alt_to_publish', UserServer.updateAltToPublish);
        app.post('/api/insert_quest_to_publish', UserServer.insertQuestToPublish);
        app.post('/api/insert_alt_to_publish', UserServer.insertAltToPublish);
        app.post('/api/insertExamPaperQB_PK', UserServer.insertExamPaperQbpk);
        app.post('/api/update_alter', UserServer.updateAlter);
        app.post('/api/logout', UserServer.logOut);
        app.post('/api/saveFiles', UserServer.saveFiles);

        /*mpanchal code end*/
        app.post('/api/get_pending_vetter_moduleIds', UserServer.getPendingVetterModuleIds);
        app.post('/api/get_vetting_status', UserServer.getVettingStatus);
        app.post('/api/get_pending_publisher_moduleIds', UserServer.getPendingPublisherModuleIds);
        app.post('/api/update_pub_status', UserServer.updatePubStatus);
        app.post('/api/update_admin_status', UserServer.updateAdminStatus);

        //added by shilpa
        app.post('/api/updateQBody', UserServer.updateQBody);
        app.post('/api/update_replace_qstn_history_with_activated_question', UserServer.updateReplaceQstnHistoryWithActivatedQuestion);
        app.get('/api/load_unique_activated_question_list', UserServer.loadUniqueActivatedQuestionList);

        app.post('/api/add_exam_paper', UserServer.addExamPaper);
        app.get('/api/load_exam_paper_list', UserServer.loadExamPaperList);
        app.post('/api/get_subject_name', UserServer.loadsubjectadminList);
        app.post('/api/get_module_name', UserServer.loadmoduleadminList);
        app.post('/api/get_module_name_casechild', UserServer.loadmodulenamedminList);
        app.post('/api/get_topic_name_casechild', UserServer.loadtopicnamedminList);
        app.post('/api/add_question_to_display', UserServer.AddQuestionInAdmin);
        app.post('/api/add_child_question', UserServer.AddchildQuestionInAdmin);
        app.post('/api/add_child_question_vetter', UserServer.AddchildQuestionInvetter);
        app.post('/api/add_parent_question', UserServer.AddparentQuestionInAdmin);
        app.post('/api/save_summary_for_admin', UserServer.saveSummaryForAdmin)
        app.post('/api/load_summary_for_admin', UserServer.loadSummaryForAdmin);
        app.post('/api/get_fall_shrt_qstn_for_module', UserServer.getShortFallQstnForModule)

        app.get('/api/load_exam_master_table', UserServer.loadExamMasterTable);

        app.post('/api/savealldata', UserServer.saveallchangesdata);         //added by dipika
        //app.post('/api/load_exam_master', UserServer.loadExamMasterTable); 
        /*api's for repository page */

        app.post('/api/saveremarkdata', UserServer.saveremarkdatas);
        app.post('/api/checkCredentials', UserServer.checkCredentials);
        app.post('/api/saverefdata', UserServer.saverefdata);
        app.post('/api/savecaldata', UserServer.savecaldata);

        app.post('/api/load_qbrepo_courses', UserServer.loadQbRepoCourses);
        app.post('/api/get_modulename', UserServer.loadmodulename);
        app.post('/api/get_modulename_admin', UserServer.loadmodulenameadmin);
        app.post('/api/load_qbrepo_subjects', UserServer.loadQbRepoSubjects);
        //app.post('/api/load_modules_admin',UserServer.loadmodulelistadmin);
        app.post('/api/get_count', UserServer.loadallcount);
        app.post('/api/save_topicwise_shortfall_questions', UserServer.saveTopicwiseShortfallDetails);
        app.post('/api/save_topicwise_shortfall_case_questions', UserServer.saveTopicwiseCaseShortfallDetails);
        app.post('/api/save_shortfall_records', UserServer.saveShortfallRecords);
        app.post('/api/save_vetter_mcq_records', UserServer.savevettermcqRecords);
        app.post('/api/save_csq_vetter_record', UserServer.savevettercsqRecords);
        app.post('/api/save_csq_child_vetter', UserServer.savevettercsqchildRecords);

        app.post('/api/save_csq_parent_shortfall', UserServer.saveCSQParentShortfall);
        app.post('/api/save_csq_child_shortfall', UserServer.saveCSQChildShortfall);
        app.post('/api/update_child_count_shortfall', UserServer.updateChildCountShortfall);

        app.post('/api/update_culled_table_for_replaced_qstremarks_for_vetter', UserServer.updatereplacementforvetter);

        app.post('/api/update_culled_table_for_replaced_qstremarks_vetter', UserServer.updateReplacedQstRemarksVetter);

        app.post('/api/load_appeared_exam_info', UserServer.loadAppearedExamInfo);
        app.post('/api/load_case_question_culling_report', UserServer.loadCaseQuestionCullingReport);
        app.post('/api/load_admin_questions', UserServer.loadAdminQuestions);
        app.post('/api/load_admin_questions_for_print', UserServer.loadAdminQuestionsForPrint);
        app.post('/api/get_languages', UserServer.loadLanguages);
        app.post('/api/add_empty_qstforreplaced_or_deletedquestion', UserServer.addEmptyQstForReplacedOrDeletedQuestion);
        app.post('/api/update_culled_table_for_replaced_qstremarks', UserServer.updateCulledTableForReplacedQstRemarks);
        app.post('/api/update_culled_table_for_replaced_qststatus', UserServer.updateCulledTableForReplacedQstStatus);
        app.post('/api/check_vetter_request_present', UserServer.checkVetterRequestPresent);
        app.post('/api/update_vetter_req_for_replace_remove_question', UserServer.updatevetterReqForReplaceRemoveQuestion);
        app.post('/api/changePassword', UserServer.changePassword);
        app.post('/api/save_course', checkValidUser, UserServer.saveCourse);
        app.post('/api/get_course_list', checkValidUser, UserServer.getCourseList);
        app.post('/api/update_course', checkValidUser, UserServer.updateCourse);
        app.post('/api/remove_course', checkValidUser, UserServer.removeCourse);
        app.post('/api/search_course', checkValidUser, UserServer.searchCourse);
        app.post('/api/add_exam_for_exam_master', checkValidUser, UserServer.addExamforExamMaster);
        app.post('/api/load_exam_master_for_admin', checkValidUser, UserServer.loadExamMasterForAdmin);
        app.post('/api/update_exam_for_examMaster', checkValidUser, UserServer.updateExamforExamMaster);
        app.post('/api/delete_exam_for_examMaster', checkValidUser, UserServer.deleteExamforExamMaster);
        app.post('/api/checkvetter_publisher_request_status_culledqstnbank', UserServer.checkVetterPublisherRequestStatusCulledQstnbank);
        app.post('/api/checkvetter_publisher_request_status_vettinglog', UserServer.checkVetterPublisherRequestStatusVettingLog);
        app.post('/api/inactivate_vetting_log_status', UserServer.inActivateVettingLogStatus);
        app.get('/api/load_user_role_master', UserServer.loadUserRoleMaster);
        app.post('/api/add_user_for_user_master', UserServer.addUserForUserMaster);
        app.post('/api/get_subject_list', UserServer.getSubjectList);
        app.post('/api/save_subject', UserServer.saveSubject);
        app.post('/api/update_subject', UserServer.updateSubject);
        app.post('/api/remove_subject', UserServer.removeSubject);
        app.post('/api/search_subject', UserServer.searchSubject);
        app.post('/api/load_user_from_user_master', UserServer.loadUserFromUserMaster);
        app.post('/api/update_user_for_user_master', UserServer.updateUserForUserMaster);
        app.post('/api/delete_user_for_user_master', UserServer.deleteUserForUserMaster);
        app.post('/api/get_module_list', UserServer.getModuleList);
        app.post('/api/get_topic_list', UserServer.getTopicList);
        app.post('/api/save_topic', UserServer.saveTopic);
        app.post('/api/update_topic', UserServer.updateTopic);
        app.post('/api/remove_topic', UserServer.removeTopic);
        app.post('/api/search_topic', UserServer.searchTopic);
        app.post('/api/save_module', UserServer.saveModule);
        app.post('/api/update_module', UserServer.updateModule);
        app.post('/api/remove_module', UserServer.removeModule);
        app.post('/api/search_module', UserServer.searchModule);
        app.post('/api/is_addquestion_left', UserServer.is_addquestion_left);
        app.post('/api/export_parent_questions_in_sify_format', UserServer.exoportParentQuestionsInSifyFormat);
        app.post('/api/export_childQuestions_in_sify_format', UserServer.exoportChildQuestionsInSifyFormat);
        app.post('/api/published_exam_paper', UserServer.loadPublishedExamPaper);
        app.post('/api/published_exam_paper_in_culling', UserServer.loadPublishedExamPaperCulling);
        app.post('/api/getModules_for_vetter', UserServer.loadModulesForVetter);
        app.post('/api/check_for_enable_publishing', UserServer.checkForEnablePublishing);
        app.post('/api/insert_case_summary', UserServer.insertCaseSummary);
        app.post('/api/load_case_summary_for_admin', UserServer.loadCaseSummaryForAdmin);
        app.post('/api/load_case_summary_for_vetter', UserServer.loadCaseSummaryForVetter);
        app.post('/api/load_pk_question_for_changeLog', UserServer.loadPkQuestionForChangeLog);
        app.post('/api/assign_publisher_without_vetting', ExamServer.assignPublisherWithoutVetting);
        app.post('/api/retrive_forgot_password', UserServer.retriveforgotPassword);
        app.post('/api/update_case_parent', UserServer.updateCaseParent);

        // added by shilpa
        app.post('/api/get_case_passage_child_details', UserServer.loadCasePassageChild);
        app.post('/api/save_csq_child', UserServer.saveCSQChild);
        app.post('/api/save_csq_child_admin', UserServer.saveCSQChildAdmin);
        app.post('/api/update_CSQ_child_count', UserServer.updateCSQChildCount);
        app.post('/api/insertNewChildQuestion', UserServer.insertNewChildQuestion);
        app.post('/api/update_Qst_Req_Remark', UserServer.updateQstReqRemark);
        app.post('/api/update_qb_active', UserServer.updateQbActive);
        app.post('/api/update_alt_correct_ans', UserServer.updateAltCorrectAns);
        app.post('/api/getPub_Vetting_Status', UserServer.getPubVettingStatus);
        app.post('/api/get_exam_details', UserServer.getExamDetails);
        app.post('/api/getAlternativesLog', UserServer.getAlternativesLog);
        app.post('/api/get_case_passage_details', UserServer.getCasePassageDetails);
        app.post('/api/save_qstn_bank_csq_child', UserServer.saveQstnBankCsqChild);
        app.post('/api/updateqstn_bank_csq_child_count', UserServer.updateQstnBankCsqChildCount);
        app.post('/api/getEditQuestionData', UserServer.getEditQuestionData);
        app.post('/api/updateQstPid', UserServer.updateQstPid);
        app.post('/api/getAllCount', UserServer.getAllCount);
        app.post('/api/updateSummaryCount', UserServer.updateSummaryCount);
        app.post('/api/get_module_details', CullingServer.get_module_details);
        app.post('/api/get_mcq_totalquestion', UserServer.get_mcq_totalquestion);
        app.post('/api/get_module_wise_data', UserServer.get_modulewisedataadmin);

        app.post('/api/update_qb_inline', UserServer.editAdminQBInline);
        app.post('/api/update_qb_alternatives', UserServer.updateQBOptions);
        app.post('/api/create_qb_alternatives', UserServer.createQBOptions);
        app.post('/api/exportQB', UserServer.exportQB);

        app.post('/api/updateInvalidQ', UserServer.updateInvalidQ);
        app.post('/api/update_QB_alt_correct_ans', UserServer.updateQBAltCorrectAns);
        app.post('/api/loadchanged_questions', UserServer.loadchanged_questions);
        app.post('/api/updateTrack_Questions', UserServer.updateTrack_Questions);
    }

})();
