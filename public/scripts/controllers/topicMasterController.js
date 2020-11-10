(function () {
  'use strict';

  function topicMasterController($scope, userService, repositoryService, examService, $state, $q, $http) {

    $scope.selectedCourse = [];
    $scope.selectedSubject = [];
    $scope.selectedModule = [];
    $scope.topicName = [];
    $scope.topicCode = [];
    $scope.error_msg = [];
    $scope.updateTopicError_msg = [];
    $scope.loginUser = userService.getUserData();
    $scope.username = JSON.parse(sessionStorage.getItem('username'));  // Dipika HSS//
    $scope.role = JSON.parse(window.localStorage.getItem("role"));

    $scope.resetTopic = function () {
      $scope.selectedCourse = [];
      $scope.selectedSubject = [];
      $scope.selectedModule = [];
      $scope.topicName = [];
      $scope.topicCode = "";
      $scope.error_msg = [];
      $scope.updateTopicError_msg = [];
      $scope.topicList = "";
    };

    $scope.resetFields = function () {
      $scope.selectedCourse = [];
      $scope.selectedSubject = [];
      $scope.selectedModule = [];
      $scope.topicName = [];
      $scope.topicCode = "";
      $scope.error_msg = [];
      $scope.updateTopicError_msg = [];
    };

    $scope.loadSubject = function () {
      $http.post('/api/get_subject_list')
        .then(function (response) {
          $scope.subjectList = response.data.obj;
        });
    };

    $scope.getSubjectList = function () {
      if ($scope.selectedCourse == null) {
        $scope.subjectList = [];
        $scope.moduleList = [{ module_name: 'ALL' }];
        $scope.selectedModule = $scope.moduleList[0];
        return;
      }
      var courseId = $scope.selectedCourse.qba_course_pk;
      var parameters = { id: courseId };
      var deferred = $q.defer();
      var transform = function (data) {
        return $.param(data);
      };
      $http.post('/api/load_qbrepo_subjects', parameters, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
        transformRequest: transform,
        timeout: 0
      }).then(function (response) {
        $scope.subjectList = response.data.obj;
        deferred.resolve(response);
      }).catch(function (error) {
        deferred.reject(error);
      });
    };

    $scope.getModuleList = function () {
      if ($scope.selectedSubject == null) {
        return;
      }
      var subjectId = $scope.selectedSubject == null ? 0 : $scope.selectedSubject.qba_subject_pk;
      var parameters = { id: subjectId };
      var deferred = $q.defer();
      var transform = function (data) {
        return $.param(data);
      };
      $http.post('/api/load_modules', parameters, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
        transformRequest: transform,
        timeout: 0
      }).then(function (response) {
        $scope.moduleList = response.data.obj;

        //  $scope.selectedModule = $scope.moduleList[0];
        deferred.resolve(response);
      }).catch(function (error) {
        deferred.reject(error);
      });
    };

    $scope.loadTopic = function () {
      $http.post('/api/get_topic_list')
        .then(function (response) {

          $scope.topicList = response.data.obj;
        })
    };

    $scope.saveTopic = function () {
      var moduleId = 0;
      $scope.error_msg = [];
      //var params = {topicName:$scope.topicName, topicCode:$scope.topicCode, moduleId:$scope.selectedModule.qba_module_pk,audit_by:$scope.loginUser.name,qba_course_fk:$scope.selectedSubject.qba_course_fk,qba_subject_pk:$scope.selectedSubject.qba_subject_pk};
      if ($scope.selectedModule != null) {
        moduleId = $scope.selectedModule.qba_module_pk;
      }
      if ($scope.selectedCourse == undefined || $scope.selectedCourse == null || $scope.selectedCourse == '') {
        $scope.error_msg.push("please select course name");
      }
      if ($scope.selectedSubject == undefined || $scope.selectedSubject == null || $scope.selectedSubject == '') {
        $scope.error_msg.push("please select subject name");
      }
      if ($scope.selectedModule == undefined || $scope.selectedModule == null || $scope.selectedModule == '') {
        $scope.error_msg.push("please select module");
      }
      if ($scope.topicCode == undefined || $scope.topicCode == null || $scope.topicCode == '') {
        $scope.error_msg.push("please enter unit code");
      }
      if ($scope.topicName == undefined || $scope.topicName == null || $scope.topicName == '') {
        $scope.error_msg.push("please enter unit name");
      }
      if ($scope.error_msg.length != 0 || $scope.error_msg == null) {
        document.getElementById("savebtn").removeAttribute("data-dismiss");
      }
      else {
        $scope.error_msg = "";
        var params = { topicName: $scope.topicName, topicCode: $scope.topicCode, moduleId: $scope.selectedModule.qba_module_pk, audit_by: $scope.username, qba_course_fk: $scope.selectedSubject.qba_course_fk, qba_subject_pk: $scope.selectedSubject.qba_subject_pk };
        document.getElementById('savebtn').setAttribute("data-dismiss", "modal");
        $http.post('/api/save_topic', params).then(function (response) {
          if (response.data.message == 'success') {
            $('.cd-popup').addClass('is-visible');
            $scope.successMsg = "Success:Topic Added Successfully.";
            $scope.resetTopic();
          }
          else {
            $('.cd-popup').addClass('is-visible');
            $scope.successMsg = "Topic Already Exists";
            $scope.resetTopic();
          }
        });
      }
    };


    $scope.editTopic = function (topic) {

      $scope.topicName = topic.topic_name;
      $scope.topicCode = parseInt(topic.qba_topic_code);
      $scope.topicId = topic.qba_topic_pk;
      $scope.selectedCourse = topic;
      $scope.selectedSubject = topic;
      $scope.selectedModule = {
        qba_module_pk: topic.qba_module_pk,
        module_name: topic.module_name
      };
      $scope.getModuleList();
      $scope.getSubjectList();
    };

    $scope.updateTopic = function () {
      $scope.error_msg = [];
      if ($scope.selectedCourse == undefined || $scope.selectedCourse == null || $scope.selectedCourse == '') {
        $scope.error_msg.push("please select course name");
      }
      if ($scope.selectedSubject == undefined || $scope.selectedSubject == null || $scope.selectedSubject == '') {
        $scope.error_msg.push("please select subject name");
      }
      if ($scope.selectedModule == undefined || $scope.selectedModule == null || $scope.selectedModule == '') {
        $scope.error_msg.push("please select module");
      }
      if ($scope.topicCode == undefined || $scope.topicCode == null || $scope.topicCode == '') {
        $scope.error_msg.push("please enter unit code");
      }
      if ($scope.topicName == undefined || $scope.topicName == null || $scope.topicName == '') {
        $scope.error_msg.push("please enter unit name");
      }
      if ($scope.error_msg.length != 0 || $scope.error_msg == null) {
        document.getElementById("updatebtn").removeAttribute("data-dismiss");
      }
      else {
        $scope.error_msg = "";
        var params = {
          topicName: $scope.topicName,
          topicCode: $scope.topicCode,
          topicId: $scope.topicId,
          courseId: $scope.courseId,
          subjectId: $scope.subjectId,
          moduleId: $scope.selectedModule.qba_module_pk,
          updated_by: $scope.username
        };
        document.getElementById('updatebtn').setAttribute("data-dismiss", "modal");

        $http.post('/api/update_topic', params)
          .then(function (response) {
            if (response.data.message == "success") {
              /*  alert('SUCCESS:Topic updated Successfully'); 
                $scope.resetTopic(); 
                $scope.loadTopic(); 
                $http.post('/api/save_topic',params).then(function(response){
                  if(response.data.message =='success'){*/
              $('.cd-popup').addClass('is-visible');
              $scope.successMsg = "Success:Topic Updated Successfully.";
              $scope.resetTopic();
              $scope.searchTopic();
            }
            else {
              $('.cd-popup').addClass('is-visible');
              $scope.successMsg = "Topic Already Exists.";
              $scope.resetTopic();
            }
            // }); 

          });
      }
    };

    $scope.deleteTopic = function (topic) {
      $scope.topicName = topic.topic_name;
      $scope.topicCode = topic.qba_topic_code;
      $scope.topicId = topic.qba_topic_pk;
    };


    $scope.removeTopic = function () {
      var params = { topicName: $scope.topicName, topicCode: $scope.topicCode, topicId: $scope.topicId };
      $http.post('/api/remove_topic', params)
        .then(function (response) {
          if (response.data.message == "success") {
            $('.cd-popup').addClass('is-visible');
            $scope.successMsg = "SUCCESS:Topic Removed Successfully";
            $scope.resetTopic();
            $scope.searchTopic();
          }
        });
    };

    $scope.searchTopic = function () {
      var params = {
        topicName: $scope.topicName, topicCode: $scope.topicCode,
        subjectId: $scope.selectedSubject.qba_subject_pk,
        courseId: $scope.selectedCourse.qba_course_pk,
        subjectId: $scope.selectedSubject.qba_subject_pk,
        moduleId: $scope.selectedModule.qba_module_pk
      };

      $http.post('/api/search_topic', params)
        .then(function (response) {
          if (response.data.obj.length == 0) {
            $('.cd-popup').addClass('is-visible');
            $scope.successMsg = "No Records Found";
            $scope.resetTopic();
          }
          else {
            $scope.topicList = response.data.obj
          }
        });
    };

    $scope.closeFunction = function () {
      $('.cd-popup').removeClass('is-visible');
    }

    angular.element(document).ready(function () {
      $scope.loadSubject();

      var deferred = $q.defer();
      $http.post('/api/load_qbrepo_courses', {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' }
      }).then(function (response) {
        $scope.courseList = response.data.obj;
        $scope.selectedCourse = "";
        deferred.resolve(response);
      }).catch(function (error) {
        deferred.reject(error);
      });

    });
  }

  angular
    .module('qbAuthoringToolApp')
    .controller('topicMasterController', topicMasterController);

  topicMasterController.$inject = ['$scope', 'userService', 'repositoryService', 'examService', '$state', '$q', '$http'];

})();