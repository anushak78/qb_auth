(function () {
  'use strict';

  function adminDashboardController($scope, userService, repositoryService, examService, $state, $q, $http, $window) {

    $scope.username = JSON.parse(sessionStorage.getItem('username'));  // Dipika HSS//
    $scope.loginUser = userService.getUserData();
    $scope.loadExamPaperList = function () {
      $http.get('/api/load_exam_paper_list').then(function (response) {
        if (response.data.message == "success") {
          $scope.loadExamPaperList = response.data.obj;
        }
      });
    }

    $scope.loadExamPaperList();

    $scope.showExamPaper = function (id, examName, qstnpaperId, sujectedId, coursename, subjectname, examId, exampaper_pk, module_ids, examstatus, course_fk) {

      window.localStorage.setItem("fepid", id);
      window.localStorage.setItem("en", examName);
      window.localStorage.setItem("qid", qstnpaperId);
      window.localStorage.setItem("eid", examId);
      window.localStorage.setItem("e_pk", exampaper_pk);
      window.localStorage.setItem("mids", module_ids);
      window.localStorage.setItem("sid", sujectedId);
      window.localStorage.setItem("cname", coursename);
      window.localStorage.setItem("sname", subjectname);
      window.localStorage.setItem("es", "N");
      window.localStorage.setItem("course_fk", course_fk);

      repositoryService.setFinalExamPaperId(id);
      repositoryService.setSelectedExamname(examName);
      repositoryService.setSelectedQuestionPaperId(qstnpaperId);
      repositoryService.setExamId(examId);
      repositoryService.setExampaper_fk(exampaper_pk);
      repositoryService.setExamModuleId(module_ids);
      examService.setSubjectId(sujectedId);
      examService.setCourseName(coursename);
      examService.setSubjectName(subjectname);

      if (examstatus != null) {

        examService.setExamStatus(examstatus.trim());
        window.localStorage.setItem("es", examstatus.trim());
      }
      else {

        examService.setExamStatus('N');
        window.localStorage.setItem("es", 'N');
      }

      $state.go('examPaperAdmin');

    }



  }


  angular
    .module('qbAuthoringToolApp')
    .controller('adminDashboardController', adminDashboardController);

  adminDashboardController.$inject = ['$scope', 'userService', 'repositoryService', 'examService', '$state', '$q', '$http'];

})();