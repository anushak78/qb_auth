(function () {
  'use strict';

  function courseMasterController($scope, userService, repositoryService, examService, $state, $q, $http) {

    $scope.courseName = [];
    $scope.courseCode = [];
    $scope.error_msg = [];
    $scope.updateCourseError_msg = [];
    $scope.loginUser = userService.getUserData();
    $scope.username = JSON.parse(sessionStorage.getItem('username'));  // Dipika HSS//
    $scope.role = JSON.parse(window.localStorage.getItem("role"));

    $scope.resetCourse = function () {
      $scope.courseName = "";
      $scope.courseList = "";
      $scope.courseCode = "";
      $scope.responseMessage = "";
      $scope.updateCourseError_msg = [];
      $scope.error_msg = [];
    }
    $scope.resetFields = function () {
      $scope.courseName = "";
      $scope.courseCode = "";
      $scope.responseMessage = "";
      $scope.updateCourseError_msg = [];
      $scope.error_msg = [];
    }

    $scope.saveCourse = function () {
      $scope.error_msg = [];
      var params = { courseName: $scope.courseName, courseCode: $scope.courseCode, audit_by: $scope.username };
      if ($scope.courseCode == undefined || $scope.courseCode == null || $scope.courseCode == '') {
        $scope.error_msg.push("please enter course code");
      }
      if ($scope.courseName == undefined || $scope.courseName == null || $scope.courseName == '') {
        $scope.error_msg.push("please enter course name");
      }
      if ($scope.error_msg.length != 0 || $scope.error_msg == null) {
        document.getElementById("savebtn").removeAttribute("data-dismiss");
      }
      else {
        $scope.error_msg = "";
        document.getElementById('savebtn').setAttribute("data-dismiss", "modal");
        $http.post('/api/save_course', params).then(function (response) {
          if (response.data.message == "success") {
            $('.cd-popup').addClass('is-visible');
            $scope.successMsg = "SUCCESS:Course Name Saved Successfully.";
            $scope.resetCourse();
          }
          else {
            $('.cd-popup').addClass('is-visible');
            $scope.successMsg = "Course already exists";
            $scope.resetCourse();
          }
        });
      }
    };

    $scope.loadCourse = function () {
      $http.post('/api/get_course_list')
        .then(function (response) {
          $scope.courseList = response.data.obj;
        })
    };

    $scope.editCourse = function (course) {
      $scope.courseName = course.qba_course_name;
      $scope.courseCode = course.qba_course_code;
      $scope.courseId = course.qba_course_pk;
    };

    $scope.updateCourse = function () {
      $scope.error_msg = [];
      var params = { courseName: $scope.courseName, courseId: $scope.courseId, courseCode: $scope.courseCode, updated_by: $scope.username };
      if ($scope.courseCode == undefined || $scope.courseCode == null || $scope.courseCode == '') {
        $scope.error_msg.push("please enter course code");
      }
      if ($scope.courseName == undefined || $scope.courseName == null || $scope.courseName == '') {
        $scope.error_msg.push("please enter course name");
      }
      if ($scope.error_msg.length != 0 || $scope.error_msg == null) {
        document.getElementById("updateBtn").removeAttribute("data-dismiss");
      }
      else {
        $scope.error_msg = "";
        document.getElementById('updateBtn').setAttribute("data-dismiss", "modal");
        $http.post('/api/update_course', params)
          .then(function (response) {
            if (response.data.message == "success") {
              $('.cd-popup').addClass('is-visible');
              $scope.successMsg = "Success:Course updated successfully.";
              $('#updateCourse').hide();
              $('.modal-backdrop').remove();
              $('body').removeClass('modal-open');
              $scope.resetCourse();
              $scope.searchCourse();
            }
            else {
              $('.cd-popup').addClass('is-visible');
              $scope.successMsg = "Course already exists";
              $scope.resetCourse();
              $scope.searchCourse();
            }
          });
      }
    };


    $scope.deleteCourse = function (course) {
      $scope.courseName = course.qba_course_name;
      $scope.courseId = course.qba_course_pk;
    };


    $scope.removeCourse = function () {
      var params = { courseName: $scope.courseName, courseId: $scope.courseId };
      $http.post('/api/remove_course', params)
        .then(function (response) {
          if (response.data.message == "Course exists") {
            swal("You can not delete course as course is already culled!");
            $scope.resetCourse();
            $scope.searchCourse();
          } else {
            $('.cd-popup').addClass('is-visible');
            $scope.successMsg = "Success:Course Removed Successfully.";
            $scope.resetCourse();
            $scope.searchCourse();
          }
        });
    };


    $scope.searchCourse = function () {
      var params = { courseName: $scope.courseName, courseCode: $scope.courseCode }
      $http.post('/api/search_course', params)
        .then(function (response) {
          if (response.data.obj.length == 0) {
            $('.cd-popup').addClass('is-visible');
            $scope.successMsg = "No records Found";
            $scope.resetCourse();
          }
          else {
            $scope.courseList = response.data.obj
          }
        });
    };

    $scope.closeFunction = function () {
      $('.cd-popup').removeClass('is-visible');
    }
  }



  angular
    .module('qbAuthoringToolApp')
    .controller('courseMasterController', courseMasterController);

  courseMasterController.$inject = ['$scope', 'userService', 'repositoryService', 'examService', '$state', '$q', '$http'];

})();