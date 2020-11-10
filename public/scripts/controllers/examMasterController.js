(function () {
  'use strict';

  function examMasterController($scope, userService, repositoryService, examService, $state, $q, $http) {

    $scope.courseList = [];
    $scope.subjectList = [];
    $scope.moduleList = [{ module_name: 'ALL' }];
    $scope.languageList = [{ lang_name: 'ENGLISH' }];
    $scope.loginUser = userService.getUserData();
    $scope.username = JSON.parse(sessionStorage.getItem('username'));  // Dipika HSS//
    $scope.role = JSON.parse(window.localStorage.getItem("role"));

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

    $scope.getSubjectList();

    $scope.getModuleList = function () {
      if ($scope.selectedSubject == null) {
        $scope.moduleList = [{ module_name: 'ALL' }];
        $scope.selectedModule = $scope.moduleList[0];
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
        var selectAllModules = { module_name: 'ALL' };
        $scope.moduleList.unshift(selectAllModules);
        $scope.selectedModule = $scope.moduleList[0];
        deferred.resolve(response);
      }).catch(function (error) {
        deferred.reject(error);
      });
    };
    $scope.getModuleList();

    $scope.resetFields = function () {
      $scope.examName = "";
      $scope.selectedCourse = {};
      $scope.selectedSubject = {};
      $scope.subjectList = [];
      $scope.totalQstn = "";
      $scope.totalMarks = "";
      $scope.subject_abbreviation = "";
      $scope.case_question = "";
      $scope.case_marks = "";
      $scope.responseMessage = [];
    }


    $scope.addExam = function () {
      $scope.responseMessage = [];
      if ($scope.examName == undefined || $scope.examName == null || $scope.examName == '') {
        $scope.errorMessage = true;
        $scope.responseMessage.push("please enter exam period.");
      }
      if ($scope.selectedCourse != undefined) {
        if (Object.keys($scope.selectedCourse).length == 0) {
          $scope.errorMessage = true;
          $scope.responseMessage.push("please select course.");
        }
      }
      if ($scope.selectedCourse == undefined || $scope.selectedCourse == null || $scope.selectedCourse == '') {
        $scope.errorMessage = true;
        $scope.responseMessage.push("please select course.");
      }
      if ($scope.selectedSubject == undefined || $scope.selectedSubject == '' || $scope.selectedSubject == null || Object.keys($scope.selectedSubject).length == 0) {
        $scope.errorMessage = true;
        $scope.responseMessage.push("please select subject.");
      }
      /* if($scope.selectedCourse != undefined){
         if(Object.keys($scope.selectedSubject).length == 0){
           $scope.errorMessage = true;             
           $scope.responseMessage.push("please select subject");
         }
       }*/
      if ($scope.subject_abbreviation == undefined || $scope.subject_abbreviation == null || $scope.subject_abbreviation == '') {
        $scope.errorMessage = true;
        $scope.responseMessage.push("please enter subject abbreviation.");
      }
      if ($scope.totalQstn == 0 || $scope.totalQstn == null || $scope.totalQstn == undefined || $scope.totalQstn == '') {
        $scope.errorMessage = true;
        $scope.responseMessage.push("please enter total questions.");
      }
      if ($scope.totalMarks == 0 || $scope.totalMarks == null || $scope.totalMarks == undefined || $scope.totalMarks == '') {
        $scope.errorMessage = true;
        $scope.responseMessage.push("please enter total marks.");
      }
      if ($scope.totalMarks < $scope.case_marks) {
        $scope.errorMessage = true;
        $scope.responseMessage.push("case marks should not be more than total marks")
      }
      if ($scope.case_question > $scope.totalQstn) {
        $scope.errorMessage = true;
        $scope.responseMessage.push("case questions should not be more than total questions")
      }
      if ($scope.responseMessage.length != 0) {
        document.getElementById("savebtn").removeAttribute("data-dismiss");
        return false
      }
      else {
        $scope.responseMessage = "";
        document.getElementById('savebtn').setAttribute("data-dismiss", "modal");
        var createExam = {
          examName: $scope.examName,
          selectedCourse_fk: $scope.selectedCourse.qba_course_pk,
          selectedSubject_fk: $scope.selectedSubject.qba_subject_pk,
          totalQstn: $scope.totalQstn,
          totalMarks: $scope.totalMarks,
          subject_abbreviation: $scope.subject_abbreviation,
          case_question: $scope.case_question,
          case_marks: $scope.case_marks,
          audit_by: $scope.username,
          is_active: 'Y'
        }
        $http.post('/api/add_exam_for_exam_master', createExam).then(function (response) {
          if (response.data.message == "success") {
            $scope.resetFields();
            swal("exam added successfully!");
          } else if (response.data.message == "Exam name already exists!") {
            $scope.resetFields();
            swal("exam name already exists!");
          }
        });
      }
    };


    $scope.loadExamMaster = function () {
      var searchRequest = {
        exam_name: $scope.examName,
        course_selected: $scope.selectedCourse,
        subject_selected: $scope.selectedSubject,
        total_qstn: $scope.totalQstn,
        total_marks: $scope.totalMarks
      };
      $http.post('/api/load_exam_master_for_admin', searchRequest).then(function (response) {
        if (response.data.message == "success") {
          $scope.loadExamMasterList = response.data.obj;
        }
        if (response.data.obj.length == 0) {
          swal("No records found")
        }
      });

    }
    //  $scope.loadExamMaster();

    $scope.searchBtn = function () {
      $scope.loadExamMaster();
    }

    $scope.getCoursename = function () {
      if ($scope.selectedExam == null) {
        $scope.selectedCourse = "";
        $scope.selectedSubject = "";
        $scope.dataCaseList = "";
        $scope.dataList = "";
        return;
      }
      var courseId = $scope.selectedExam.qba_course_fk;
      var subId = $scope.selectedExam.qba_subject_fk;
      var deferred = $q.defer();
      var parameters = { id: courseId };
      $http.post('/api/load_courses', parameters).then(function (response) {
        var errcode = response.data.code;
        // alert("errcode"+errcode);
        if (errcode == 500) {
          $state.go('login');
        }

      }).catch(function (error) {
        deferred.reject(error);
      });
    }
    var selected_exam_pk;
    $scope.selectedExam = function (data) {
      $scope.examName = data.exam_name;
      $scope.totalQstn = data.total_qts;
      $scope.totalMarks = data.total_marks;
      $scope.case_marks = data.case_marks;
      $scope.case_question = data.case_question;
      $scope.selectedCourse = data;
      selected_exam_pk = data.exam_pk;
      $scope.selectedSubject = data;
      $scope.getSubjectList();
    };

    $scope.updateExam = function () {
      $scope.responseMessage = [];
      if ($scope.examName == undefined || $scope.examName == null || $scope.examName == '') {
        $scope.errorMessage = true;
        $scope.responseMessage.push("please enter exam period.");
      }
      if ($scope.selectedCourse != null) {
        if (Object.keys($scope.selectedCourse).length == 0) {
          $scope.errorMessage = true;
          $scope.responseMessage.push("please select course.");
        }
      }
      else {
        $scope.errorMessage = true;
        $scope.responseMessage.push("please select course.");
      }
      if ($scope.totalQstn == 0 || $scope.totalQstn == null || $scope.totalQstn == undefined || $scope.totalQstn == '') {
        $scope.errorMessage = true;
        $scope.responseMessage.push("please enter total question.");
      }
      if ($scope.totalMarks == 0 || $scope.totalMarks == null || $scope.totalMarks == undefined || $scope.totalMarks == '') {
        $scope.errorMessage = true;
        $scope.responseMessage.push("please enter total marks.");
      }
      if ($scope.totalMarks < $scope.case_marks) {
        $scope.errorMessage = true;
        $scope.responseMessage.push("case marks should not be more than total marks")
      }
      if ($scope.case_question > $scope.totalQstn) {
        $scope.errorMessage = true;
        $scope.responseMessage.push("case question should not be more than total question")
      }
      if ($scope.selectedSubject != null) {
        if (Object.keys($scope.selectedSubject).length == 0) {
          $scope.errorMessage = true;
          $scope.responseMessage.push("please select subject");
        }
      } else {
        $scope.errorMessage = true;
        $scope.responseMessage.push("please select subject");
      }
      if ($scope.responseMessage.length != 0 || $scope.responseMessage == null) {
        document.getElementById("updatbtn").removeAttribute("data-dismiss");
      } else {
        $scope.responseMessage = "";
        document.getElementById('updatbtn').setAttribute("data-dismiss", "modal");
        var updateExam = {
          examName: $scope.examName,
          selectedCourse_fk: $scope.selectedCourse.qba_course_pk,
          selectedSubject_fk: $scope.selectedSubject.qba_subject_pk,
          totalQstn: $scope.totalQstn,
          totalMarks: $scope.totalMarks,
          case_marks: $scope.case_marks,
          case_question: $scope.case_question,
          exam_pk: selected_exam_pk,
          updated_by: $scope.username
        }
        $http.post('/api/update_exam_for_examMaster', updateExam).then(function (response) {
          if (response.data.message == "success") {
            swal("selected exam updated successfully!");
            $scope.resetFields();
            $scope.loadExamMaster();
          }
        });
      }
    };

    $scope.deleteExam = function (data) {
      $("body").css("padding-right", "0");
      var deleteExam = {
        exam_pk: selected_exam_pk,// data.exam_pk,
        is_active: "N"
      }
      $http.post('/api/delete_exam_for_examMaster', deleteExam).then(function (response) {
        if (response.data.message == "Exam exists") {
          swal("You can not delete exam as exam is already culled!");
          $scope.resetFields();
          $scope.loadExamMaster();
          angular.element(document.getElementById('updateExamMaster').style.display = 'none');
        } else {
          swal("Selected exam deleted!");
          $scope.resetFields();
          $scope.loadExamMaster();
          angular.element(document.getElementById('updateExamMaster').style.display = 'none');
        }
      });
    }


    angular.element(document).ready(function () {
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
    .controller('examMasterController', examMasterController);

  examMasterController.$inject = ['$scope', 'userService', 'repositoryService', 'examService', '$state', '$q', '$http'];

})();