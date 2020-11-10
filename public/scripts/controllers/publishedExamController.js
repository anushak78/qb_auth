(function () {
  'use strict';

  function publishedExamController($scope, userService, repositoryService, examService, $state, $q, $http, $window) {

    $scope.loginUser = userService.getUserData();
    $scope.username = JSON.parse(sessionStorage.getItem('username'));  // Dipika HSS//
    $scope.datepicker = ''
    $scope.loadPublishedExamPaper = function () {
      $http.post('/api/published_exam_paper').then(function (response) {
        if (response.data.message == "success") {
          $scope.loadExamPaperList = response.data.obj;
        }
      });
    }
    $scope.role = JSON.parse(window.localStorage.getItem("role"));

    $scope.showExamPaper = function (id, examName, qstnpaperId, sujectedId, coursename, subjectname, examId, exampaper_pk, module_ids, examstatus, qba_course_fk) {
      window.localStorage.setItem("fepid", id);
      window.localStorage.setItem("en", examName);
      window.localStorage.setItem("qid", qstnpaperId);
      window.localStorage.setItem("eid", examId);
      window.localStorage.setItem("e_pk", exampaper_pk);
      window.localStorage.setItem("mids", module_ids);
      window.localStorage.setItem("sid", sujectedId);
      window.localStorage.setItem("cname", coursename);
      window.localStorage.setItem("sname", subjectname);
      window.localStorage.setItem("es", "A");
      window.localStorage.setItem("course_fk", qba_course_fk);

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
    $scope.uploadExamManually = function () {
      if ($scope.exam_name.exam_name == undefined || $scope.qb_id == '') {
        swal("Enter the input values")
        return false
      }
      var object = {
        exam_name: $scope.exam_name.exam_name,
        qb_id: $scope.qb_id,
        datepicker: $scope.datepicker
      }
      $http.post('/api/add_exam_manually', object).then(response => {
        if (response.data.code == 0) {
          swal("Exam history uploaded successfully")
          $scope.reload()
          $('#examUploadDialog').modal('hide');
          $scope.loadPublishedExamPaper()
        }
      })
    }

    $scope.loadExamNames = function () {
      $http.get('/api/load_exam_master_table').then(function (response) {
        console.log(response);
        $scope.examList = response.data.obj[0];
      })
    }

    $scope.reload = function () {
      $scope.exam_name = []
      $scope.qb_id = ''
      $scope.datepicker = ''
    }

    $scope.callJquery = function () {
      $('#datepicker').datepicker({
        dateFormat: 'dd-mm-yyyy'
      })
    }

    angular.element(document).ready(function () {
      $scope.loadPublishedExamPaper();
      $scope.loadExamNames()
      $(window).load(function () {
        $('#datepicker').datepicker({
          dateFormat: 'dd-mm-yyyy'
        })
      })
    });
  }


  angular
    .module('qbAuthoringToolApp')
    .controller('publishedExamController', publishedExamController);

  publishedExamController.$inject = ['$scope', 'userService', 'repositoryService', 'examService', '$state', '$q', '$http', '$window'];

})();