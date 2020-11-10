(function () {
  'use strict';

  function subjectMasterController($scope, userService, repositoryService, examService, $state, $q, $http) {

    $scope.selectedCourse = [];
    $scope.subjectName = [];
    $scope.subjectCode = [];
    $scope.error_msg = [];
    $scope.updateSubjectError_msg = [];
    $scope.loginUser = userService.getUserData();
    $scope.username = JSON.parse(sessionStorage.getItem('username'));  // Dipika HSS/
    $scope.role = JSON.parse(window.localStorage.getItem("role"));

    $scope.resetSubject = function () {
      $scope.selectedCourse = "";
      $scope.subjectName = "";
      $scope.subjectCode = "";
      $scope.subjectList = "";
      $scope.error_msg = [];
      $scope.updateSubjectError_msg = [];
    };
    $scope.resetFields = function () {
      $scope.selectedCourse = "";
      $scope.subjectName = "";
      $scope.subjectCode = "";
      $scope.error_msg = [];
      $scope.updateSubjectError_msg = [];
    };

    $scope.loadCourse = function () {
      $http.post('/api/get_course_list')
        .then(function (response) {
          $scope.courseList = response.data.obj;
        })
    };

    $scope.loadSubject = function () {
      $http.post('/api/get_subject_list')
        .then(function (response) {
          $scope.subjectList = response.data.obj;
        })
    };

    $scope.saveSubject = function () {
      $scope.error_msg = [];

      if ($scope.selectedCourse == undefined || $scope.selectedCourse == null || $scope.selectedCourse == '') {
        $scope.error_msg.push("please select course name");
      }
      if ($scope.subjectCode == undefined || $scope.subjectCode == null || $scope.subjectCode == '') {
        $scope.error_msg.push("please enter subject code");
      }
      if ($scope.subjectName == undefined || $scope.subjectName == null || $scope.subjectName == '') {
        $scope.error_msg.push("please enter subject name");
      }
      if ($scope.error_msg.length != 0 || $scope.error_msg == null) {
        document.getElementById("savebtn").removeAttribute("data-dismiss");
      }
      else {
        $scope.error_msg = "";
        var params = {
          subjectName: $scope.subjectName,
          subjectCode: $scope.subjectCode,
          course_pk: $scope.selectedCourse.qba_course_pk,
          audit_by: $scope.username
        };
        document.getElementById('savebtn').setAttribute("data-dismiss", "modal");
        $http.post('/api/save_subject', params).then(function (response) {
          if (response.data.message == 'success') {
            $('.cd-popup').addClass('is-visible');
            $scope.successMsg = "Success:Subject Added Successfully.";
            $scope.resetSubject();
          }
          else {
            $('.cd-popup').addClass('is-visible');
            $scope.successMsg = "Subject already exists";
            $scope.resetSubject();
          }
        });
      }
    };

    $scope.editSubject = function (subject) {
      $scope.subjectName = subject.subject_name;
      $scope.subjectId = subject.qba_subject_pk;
      $scope.subjectCode = subject.qba_subject_code;
      $scope.selectedCourse = subject;
    };

    $scope.updateSubject = function () {
      $scope.error_msg = [];
      if ($scope.selectedCourse == undefined || $scope.selectedCourse == null || $scope.selectedCourse == '') {
        $scope.error_msg.push("please select course name");
      }
      if ($scope.subjectCode == undefined || $scope.subjectCode == null || $scope.subjectCode == '') {
        $scope.error_msg.push("please enter subject code");
      }
      if ($scope.subjectName == undefined || $scope.subjectName == null || $scope.subjectName == '') {
        $scope.error_msg.push("please enter subject name");
      }
      if ($scope.error_msg.length != 0 || $scope.error_msg == null) {
        document.getElementById("updateBtn").removeAttribute("data-dismiss");
      }
      else {
        $scope.error_msg = "";
        document.getElementById('updateBtn').setAttribute("data-dismiss", "modal");
        var params = {
          subjectName: $scope.subjectName,
          subjectCode: $scope.subjectCode,
          subjectId: $scope.subjectId,
          course: $scope.selectedCourse,
          updated_by: $scope.username
        };
        $http.post('/api/update_subject', params)
          .then(function (response) {
            if (response.data.message == "success") {
              $('.cd-popup').addClass('is-visible');
              $scope.successMsg = "Success:Subject updated Successfully.";
              $('#updateSubject').hide();
              $('.modal-backdrop').remove();
              $('body').removeClass('modal-open');
              $scope.resetSubject();
              $scope.searchSubject();
            }
            else {
              $('.cd-popup').addClass('is-visible');
              $scope.successMsg = "Subject already exists";
            }
          });
      }
    };


    $scope.deleteSubject = function (subject) {
      $scope.subjectName = subject.subject_name;
      $scope.subjectId = subject.qba_subject_pk;
      $scope.subjectCode = subject.qba_subject_code;
    };




    $scope.removeSubject = function () {
      var params = { subjectName: $scope.subjectName, subjectCode: $scope.subjectCode, subjectId: $scope.subjectId };
      $http.post('/api/remove_subject', params)
        .then(function (response) {
          if (response.data.message == "Subject exists") {
            swal("You can not delete subject as subject is already culled!");
            $scope.resetSubject();
            $scope.searchSubject();
          } else {
            $('.cd-popup').addClass('is-visible');
            $scope.successMsg = "Success:Subject removed Successfully.";
            $scope.resetSubject();
            $scope.searchSubject();
          }
        });
    };


    $scope.searchSubject = function () {
      var params = {
        subjectName: $scope.subjectName,
        subjectCode: $scope.subjectCode,
        courseId: $scope.selectedCourse.qba_course_pk
      }
      $http.post('/api/search_subject', params)
        .then(function (response) {
          if (response.data.obj.length == 0) {
            $('.cd-popup').addClass('is-visible');
            $scope.successMsg = "No Records Found";
            $scope.resetSubject();
          }
          else {
            $scope.subjectList = response.data.obj
          }
        });
    };



    $scope.closeFunction = function () {
      $('.cd-popup').removeClass('is-visible');
    }

    angular.element(document).ready(function () {
      $scope.loadCourse();
    });

  }



  angular
    .module('qbAuthoringToolApp')
    .controller('subjectMasterController', subjectMasterController);

  subjectMasterController.$inject = ['$scope', 'userService', 'repositoryService', 'examService', '$state', '$q', '$http'];

})();