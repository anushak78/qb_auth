
(function () {
   'use strict';

   function repositoryService() {
      var selectedCourse = {};
      var selectedSubject = {};
      var selectedModule = {};
      var selectedTopic = {};
      var selectedCaseTopic = {};
      var parentQuestion = {};
      var childQuesstionList = [];
      var bookmark_pid = '';
      var cullingQuestionIdList = [];
      var editAdminQuestion = {};
      var populatedQuestions = {};
      var vetterQuestions = {};
      var ExamModuleId = {};
      var questionIdMap = {};
      var vetterEditedPageId = false;
      var examId = "";
      var moduleId = [];
      var FinalExamPaperId = []; //created by milan
      var replacedIdData = { req_qbpk_id: '', req_id_marks: '', req_id_qstype: '' }; //created by milan
      var isAdmin_approved = false; //created by milan
      var totalMks = "";
      var totalCnt = "";
      var selectedExamname = "";
      var selectedQuestionPaperId = "";
      var shortFallQstn = "";
      var shortFallRecords = {};
      var caseShortFallRecords = [];
      var addShortfallQuestion = {};
      var caseQuestionIdMap = {};
      var exampaper_fk;
      var maxChildPerCase;
      var adminCaseEditFlag = false;
      var showQuestionsPerPageList = [{ no_Qstn: 5 }, { no_Qstn: 10 }, { no_Qstn: 15 }, { no_Qstn: 20 }, { no_Qstn: 'ALL' }];

      var case_summary;

      return {
         name: 'repositoryService',
         setSelectedCourse: function (courseName) {
            selectedCourse = courseName;
         },
         getSelectedCourse: function () {
            return selectedCourse;
         },
         setSelectedSubject: function (subjectName) {
            selectedSubject = subjectName;
         },
         getSelectedSubject: function () {
            return selectedSubject;
         },
         setSelectedModule: function (moduleName) {
            selectedModule = moduleName;
         },
         getSelectedModule: function () {
            return selectedModule;
         },
         setSelectedTopic: function (topicName) {
            selectedTopic = topicName;
         },
         setSelectedCaseTopic: function (topicName) {
            selectedCaseTopic = topicName;
         },
         getSelectedTopic: function () {
            return selectedTopic;
         },
         setParentQuestion: function (question) {
            parentQuestion = question;
         },
         getParentQuestion: function () {
            return parentQuestion;
         },
         deleteParentQuestion: function () {
            parentQuestion = {}
         },
         addChildQuestion: function (childQuestion) {
            childQuesstionList.push(childQuestion);
         },
         setChildQuestionList: function (quesList) {
            childQuesstionList = quesList;
         },
         setBookMark: function (b_pid) {
            bookmark_pid = b_pid
         },
         getBookMark: function () {
            return bookmark_pid;
         },
         getChildQuestionList: function () {
            return childQuesstionList;
         },
         deleteChildQuestionList: function () {
            childQuesstionList = []
         },
         setCullingQuestionIdList: function (quesIdList) {
            cullingQuestionIdList = quesIdList;
         },
         getCullingQuestionIdList: function () {
            return cullingQuestionIdList;
         },
         seteditAdminQuestion: function (setQuestObj) {
            editAdminQuestion = setQuestObj;
         },
         geteditAdminQuestion: function () {
            return editAdminQuestion;
         },
         setPopulatedQuestions: function (popQuestions) {
            populatedQuestions = popQuestions;
         },
         getPopulatedQuestions: function () {
            return populatedQuestions;
         },
         setQuestionIdMap: function (qidMap) {
            questionIdMap = qidMap;
         },
         setCaseQuestionIdMap: function (qidMap) {
            caseQuestionIdMap = qidMap;
         },
         getQuestionIdMap: function () {
            return questionIdMap;
         }, getCaseQuestionIdMap: function () {
            return caseQuestionIdMap;
         },
         setVetterQuestionsParameters: function (params) {
            vetterQuestions = params;
         },
         getVetterQuestionsParameters: function () {
            return vetterQuestions;
         },
         setVetterEditedPageId: function (pageId) {
            vetterEditedPageId = pageId;
         },
         getVetterEditedPageId: function () {
            return vetterEditedPageId;
         },
         setExamId: function (eid) {
            examId = eid;
         },
         getsetExamId: function () {
            return examId;
         },
         setModuleId: function (mod_id) {
            moduleId = mod_id;
         },
         setExamModuleId: function (parameters) {
            ExamModuleId = parameters;
         },
         getExamModuleId: function () {
            return ExamModuleId;
         },
         setFinalExamPaperId: function (finalId) {
            FinalExamPaperId = finalId;
         },
         getFinalExamPaperId: function () {
            return FinalExamPaperId;
         },
         setExampaper_fk: function (paperfk) {
            exampaper_fk = paperfk;
         },
         getExampaper_fk: function () {
            return exampaper_fk;
         },
         setDetailsOfReplaceId: function (id, marks, qstype) {
            replacedIdData.req_qbpk_id = id;
            replacedIdData.req_id_marks = marks;
            replacedIdData.req_id_qstype = qstype;
            //replacedIdData.isAdmin_approved = isApprove;
         },
         getDetailsOfReplaceId: function () {
            return replacedIdData;
         },
         setIsAdminApprovedReq: function (isApprove) {
            isAdmin_approved = isApprove;
         },
         getIsAdminApprovedReq: function () {
            return isAdmin_approved;
         },
         setTotalMarks: function (totalMarks) {
            totalMks = totalMarks
         },
         getTotalMarks: function () {
            return totalMks;
         },
         setTotalCount: function (totalCount) {
            totalCnt = totalCount;
         },
         getTotalCount: function () {
            return totalCnt;
         },
         setSelectedExamname: function (examName) {
            selectedExamname = examName;
         },
         getSelectedExamname: function () {
            return selectedExamname;
         },
         setSelectedQuestionPaperId: function (qpaperId) {
            selectedQuestionPaperId = qpaperId;
         },
         getSelectedQuestionPaperId: function () {
            return selectedQuestionPaperId;
         },
         setShortFallQuestion: function (qstn) {
            shortFallQstn = qstn;
         },
         getShortFallQuestion: function () {
            return shortFallQstn;
         },
         setShortFallRecords: function (records) {
            shortFallRecords = records;
         },
         getShortFallRecords: function () {
            return shortFallRecords;
         },
         setAddShortFallQuestion: function (details) {
            addShortfallQuestion = details;
         },
         getAddShortFallQuestion: function () {
            return addShortfallQuestion;
         },
         setCaseShortFallRecords: function (shortFallList) {
            caseShortFallRecords = shortFallList;
         },
         getCaseShortFallRecords: function () {
            return caseShortFallRecords;
         },
         setMaxChildPerCase: function (childCount) {
            maxChildPerCase = childCount;
         },
         getMaxChildPerCase: function () {
            return maxChildPerCase;
         },
         getShowQuestionsPerPageList: function () {
            return showQuestionsPerPageList;
         },
         setCaseSummary: function (case_summary_data) {
            case_summary = case_summary_data;
         },
         getCaseSummary: function () {
            return case_summary;
         },
         setadminCaseEditFlag: function (editFlag) {
            adminCaseEditFlag = editFlag;
         },
         getadminCaseEditFlag: function () {
            return adminCaseEditFlag;
         }
      }
   }

   angular
      .module('qbAuthoringToolApp')
      .factory('repositoryService', repositoryService);

   repositoryService.$inject = [];

})();



