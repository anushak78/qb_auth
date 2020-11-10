(function () {
  'use strict';

  function moduleMasterController($scope, userService, repositoryService, examService, $state, $q, $http) {

    $scope.selectedSubject = [];
    $scope.moduleName = [];
    $scope.error_msg = [];
    $scope.updateModuleError_msg = [];
    $scope.loginUser = userService.getUserData();
    $scope.username = JSON.parse(sessionStorage.getItem('username'));  // Dipika HSS//
    $scope.role = JSON.parse(window.localStorage.getItem("role"));

    $scope.resetModule = function () {
      $scope.error_msg = [];
      $scope.updateModuleError_msg = [];
      $scope.selectedSubject = [];
      $scope.moduleName = "";
      $scope.subjectList = "";
      $scope.moudleList = "";
      $scope.loadSubject();
    };
    $scope.resetFields = function () {
      $scope.error_msg = [];
      $scope.updateModuleError_msg = [];
      $scope.selectedSubject = [];
      $scope.moduleName = "";
    };

    $scope.loadSubject = function () {
      $http.post('/api/get_subject_list')
        .then(function (response) {
          $scope.subjectList = response.data.obj;
        });
    };

    $scope.getModules = function () {
      $http.post('/api/get_module_list')
        .then(function (response) {
          $scope.moudleList = response.data.obj;
        });
    };

    $scope.saveModule = function () {
      $scope.error_msg = [];
      if ($scope.selectedSubject == undefined || $scope.selectedSubject == null || $scope.selectedSubject == '') {
        $scope.error_msg.push("please select subject name");
      }
      if ($scope.moduleName == undefined || $scope.moduleName == null || $scope.moduleName == '') {
        $scope.error_msg.push("please enter module name");
      }
      if ($scope.error_msg.length != 0 || $scope.error_msg == null) {
        document.getElementById("savebtn").removeAttribute("data-dismiss");
      }
      else {
        $scope.error_msg = "";
        var params = {
          moduleName: $scope.moduleName,
          subjectId: $scope.selectedSubject.qba_subject_pk,
          audit_by: $scope.username
        };
        document.getElementById('savebtn').setAttribute("data-dismiss", "modal");
        $http.post('/api/save_module', params).then(function (response) {
          if (response.data.message == 'success') {
            $('.cd-popup').addClass('is-visible');
            $scope.successMsg = "Success : Module Added Successfully.";
            $scope.error_msg = [];
            $scope.updateModuleError_msg = [];
            $scope.moduleName = "";
            $scope.subjectList = "";
            $scope.moudleList = "";
          }
          else {
            $('.cd-popup').addClass('is-visible');
            $scope.successMsg = "Subject Cannot have Same Module.";
            $scope.error_msg = [];
            $scope.updateModuleError_msg = [];
            $scope.moduleName = "";
            $scope.subjectList = "";
            $scope.moudleList = "";
          }

          $scope.loadSubject();
        });
      }
    };





    $scope.editModule = function (module) {
      $scope.moduleName = module.module_name;
      $scope.moduleId = module.qba_module_pk;
      $scope.selectedSubject = module;
    };


    $scope.updateModule = function () {
      $scope.error_msg = [];
      if ($scope.selectedSubject == undefined || $scope.selectedSubject == null || $scope.selectedSubject == '') {
        $scope.error_msg.push("please select subject name");
      }
      if ($scope.moduleName == undefined || $scope.moduleName == null || $scope.moduleName == '') {
        $scope.error_msg.push("please enter module name");
      }
      if ($scope.error_msg.length != 0 || $scope.error_msg == null) {
        document.getElementById("updatebtn").removeAttribute("data-dismiss");
      }
      else {
        var params = { moduleName: $scope.moduleName, moduleId: $scope.moduleId, subjectId: $scope.selectedSubject, updated_by: $scope.username };
        $scope.error_msg = "";
        document.getElementById('updatebtn').setAttribute("data-dismiss", "modal");
        $http.post('/api/update_module', params)
          .then(function (response) {
            if (response.data.message == "success") {
              $('.cd-popup').addClass('is-visible');
              $scope.successMsg = "Success : Module updated Successfully.";
              $scope.resetModule();
              $scope.searchModule();
            }
            $scope.loadSubject();
          });
      }
    };

    $scope.deleteModule = function (module) {
      $scope.moduleName = module.module_name;
      $scope.moduleId = module.qba_module_pk;
    };




    $scope.removeModule = function () {
      var params = { moduleName: $scope.moduleName, moduleId: $scope.moduleId };
      $http.post('/api/remove_module', params)
        .then(function (response) {
          if (response.data.message == "success") {
            $('.cd-popup').addClass('is-visible');
            $scope.successMsg = "Success : Module Removed Successfully.";
            $scope.resetModule();
            $scope.searchModule();
          }
          // $scope.loadSubject();
        });
    };


    $scope.searchModule = function () {



      var qba_subject_pk;
      if ($scope.selectedSubject != null) {
        qba_subject_pk = $scope.selectedSubject.qba_subject_pk;
      }

      var params = { moduleName: $scope.moduleName, subjectId: qba_subject_pk }
      $http.post('/api/search_module', params)
        .then(function (response) {
          if (response.data.obj.length == 0) {
            $('.cd-popup').addClass('is-visible');
            $scope.successMsg = "No Records Found";
            $scope.resetModule();
          }
          else {
            $scope.moudleList = response.data.obj
          }
        });
      // $scope.loadSubject();
    };

    $scope.closeFunction = function () {
      $('.cd-popup').removeClass('is-visible');
    }

    angular.element(document).ready(function () {
      $scope.loadSubject();
    });


  }

  angular
    .module('qbAuthoringToolApp')
    .controller('moduleMasterController', moduleMasterController);

  moduleMasterController.$inject = ['$scope', 'userService', 'repositoryService', 'examService', '$state', '$q', '$http'];

})();