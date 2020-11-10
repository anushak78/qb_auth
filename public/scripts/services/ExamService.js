
(function () {
  'use strict';

  function examService() {
    var examMasterData = {};
    var selectedExam = {};
    var subjectId;
    var courseName;
    var subject_name;
    var exam_status;
    return {
      name: 'examService',
      setExamMasterData: function (examMaster) {
        examMasterData = examMaster;
      },
      getExamMasterData: function () {
        return examMasterData;
      },
      setSelectedExam: function (exam) {
        selectedExam = exam;
      },
      getSelectedExam: function () {
        return selectedExam;
      },
      setSubjectId: function (subid) {
        subjectId = subid;
      },
      getSubjectId: function () {
        return subjectId;
      },
      setCourseName: function (course) {
        courseName = course;
      },
      getCourseName: function () {
        return courseName;
      },
      setSubjectName: function (subname) {
        subject_name = subname;
      },
      getSubjectName: function () {
        return subject_name;
      },
      setExamStatus: function (status) {
        exam_status = status;
      },
      getExamStatus: function () {
        return exam_status;
      }
    };
  }

  angular
    .module('qbAuthoringToolApp')
    .factory('examService', examService);

  examService.$inject = [];

})();



