(function () {
  'use strict';

  function userMasterController($scope, userService, repositoryService, examService, $state, $q, $http, $sce) {

    $scope.loginUser = userService.getUserData();
    $scope.username = JSON.parse(sessionStorage.getItem('username'));  // Dipika HSS//
    $scope.role = JSON.parse(window.localStorage.getItem("role"));

    $scope.loadRoleMaster = function () {
      $http.get('/api/load_user_role_master').then(function (response) {
        if (response.data.message == 'success') {
          $scope.userRoleList = response.data.obj;
        }
      })
    };
    $scope.loadRoleMaster();

    $scope.resetFields = function () {
      $scope.userName = "";
      $scope.userPassword = "";
      $scope.firstName = "";
      $scope.middleName = "";
      $scope.lastName = "";
      $scope.userAddress = "",
        $scope.userEmailaddress = "",
        $scope.userMobileno = "",
        $scope.selectedUserrole = {};
      $scope.responseMessage = [];
      $scope.confirmuserPassword = "";
    }



    $scope.loadUsers = function () {
      var searchUser = {
        userName: $scope.userName,
        userPassword: $scope.userPassword,
        firstName: $scope.firstName,
        middleName: $scope.middleName,
        lastName: $scope.lastName,
        userAddress: $scope.userAddress,
        userEmailaddress: $scope.userEmailaddress,
        userMobileno: $scope.userMobileno,
        selectedUserrole: $scope.selectedUserrole
      }
      $http.post('/api/load_user_from_user_master', searchUser).then(function (response) {
        if (response.data.message == 'success') {
          $scope.userList = response.data.obj;
        }
      });
    }


    //$scope.loadUsers();

    $scope.addUser = function () {
      $scope.errorMessage = false
      $scope.responseMessage = [];
      var mobileValidation = phonenumber($scope.userMobileno);
      if ($scope.userName == undefined || $scope.userName == null || $scope.userName == '') {
        $scope.errorMessage = true;
        $scope.responseMessage.push("please enter username.");
      }
      if ($scope.userPassword == undefined || $scope.userPassword == null || $scope.userPassword == '') {
        $scope.errorMessage = true;
        $scope.responseMessage.push("please enter password.");
      }
      if ($scope.confirmuserPassword == undefined || $scope.confirmuserPassword == null || $scope.confirmuserPassword == '') {
        $scope.errorMessage = true;
        $scope.responseMessage.push("please enter confirm password.");
      }
      if ($scope.userPassword != $scope.confirmuserPassword) {
        $scope.errorMessage = true;
        $scope.responseMessage.push("password and confirm password not match.");
      }
      if ($scope.selectedUserrole == undefined || $scope.selectedUserrole == null || $scope.selectedUserrole == '') {
        $scope.errorMessage = true;
        $scope.responseMessage.push("please select user role.");
      }
      if ($scope.selectedUserrole != undefined) {
        if (Object.keys($scope.selectedUserrole).length == 0) {
          $scope.errorMessage = true;
          $scope.responseMessage.push("please select user role.");
        }
      }
      if ($scope.firstName == undefined || $scope.firstName == null || $scope.firstName == '') {
        $scope.errorMessage = true;
        $scope.responseMessage.push("please enter first name.");
      }
      if ($scope.lastName == undefined || $scope.lastName == null || $scope.lastName == '') {
        $scope.errorMessage = true;
        $scope.responseMessage.push("please enter last name.");
      }
      if ($scope.userAddress == undefined || $scope.userAddress == null || $scope.userAddress == '') {
        $scope.errorMessage = true;
        $scope.responseMessage.push("please enter address.");
      }
      if ($scope.userEmailaddress == undefined || $scope.userEmailaddress == null || $scope.userEmailaddress == '') {
        $scope.errorMessage = true;
        // $scope.responseMessage.push("Please enter email address");
      }
      if (parseInt($scope.userMobileno) == 0 || $scope.userMobileno.charAt(0) == '0' || $scope.userMobileno == undefined || $scope.userMobileno == null || $scope.userMobileno == '' || (mobileValidation != null && mobileValidation != true)) {
        $scope.errorMessage = true;
        if (parseInt($scope.userMobileno) == 0) {
          $scope.responseMessage.push("mobile number cannot be zero")
        }
        else if ($scope.userMobileno.charAt(0) == '0') {
          $scope.responseMessage.push("mobile number should be valid")
        }
        else {
          $scope.responseMessage.push(mobileValidation);
        }
      }
      if ($scope.responseMessage.length != 0 || $scope.responseMessage == null || $scope.errorMessage == true) {
        document.getElementById("savebtn").removeAttribute("data-dismiss");
      }
      else {
        $scope.responseMessage = "";
        document.getElementById('savebtn').setAttribute("data-dismiss", "modal");
        var createUser = {
          userName: $scope.userName.toLowerCase(),
          userPassword: $scope.userPassword,
          firstName: $scope.firstName,
          middleName: $scope.middleName,
          lastName: $scope.lastName,
          userAddress: $scope.userAddress,
          userEmailaddress: $scope.userEmailaddress,
          userMobileno: $scope.userMobileno,
          selectedUserrole: $scope.selectedUserrole,
          audit_by: $scope.username
        }

        $http.post('/api/add_user_for_user_master', createUser).then(function (response) {
          if (response.data.message == "success") {
            $scope.resetFields();
            swal("User added successfully!");
          } else if (response.data.message == "User name already exists!") {
            $scope.resetFields();
            swal("User name already exists!");
          }
        });

      }
    };


    var selected_user_pk;
    $scope.selectedUser = function (data) {
      $scope.userName = data.user_id;
      $scope.userPassword = data.user_password;
      $scope.confirmuserPassword = data.user_password;
      $scope.firstName = data.first_name;
      $scope.middleName = data.middle_name;
      $scope.lastName = data.last_name;
      $scope.userAddress = data.address;
      $scope.userEmailaddress = data.email_id;
      $scope.userMobileno = data.mobile_no;
      $scope.selectedUserrole = data;
      selected_user_pk = data.user_pk;
    };

    $scope.updateUser = function () {
      $scope.errorMessage = false
      $scope.responseMessage = [];
      $("body").css("padding-right", "0");
      var mobileValidation = phonenumber($scope.userMobileno);
      if ($scope.userName == undefined || $scope.userName == null || $scope.userName == '') {
        $scope.errorMessage = true;
        $scope.responseMessage.push("please enter username.");
      }
      if ($scope.userPassword == undefined || $scope.userPassword == null || $scope.userPassword == '') {
        $scope.errorMessage = true;
        $scope.responseMessage.push("please enter password.");
      }
      if ($scope.confirmuserPassword == undefined || $scope.confirmuserPassword == null || $scope.confirmuserPassword == '') {
        $scope.errorMessage = true;
        $scope.responseMessage.push("please enter confirm password.");
      }
      if ($scope.userPassword != $scope.confirmuserPassword) {
        $scope.errorMessage = true;
        $scope.responseMessage.push("password and Confirm Password does not match.");
      }
      if (Object.keys($scope.selectedUserrole).length == 0) {
        $scope.errorMessage = true;
        $scope.responseMessage.push("please select user role.");
      }
      if ($scope.firstName == undefined || $scope.firstName == null || $scope.firstName == '') {
        $scope.errorMessage = true;
        $scope.responseMessage.push("please enter first name.");
      }
      if ($scope.lastName == undefined || $scope.lastName == null || $scope.lastName == '') {
        $scope.errorMessage = true;
        $scope.responseMessage.push("please enter last name.");
      }
      if ($scope.userAddress == undefined || $scope.userAddress == null || $scope.userAddress == '') {
        $scope.errorMessage = true;
        $scope.responseMessage.push("please enter address.");
      }
      if ($scope.userEmailaddress == undefined || $scope.userEmailaddress == null || $scope.userEmailaddress == '') {
        $scope.errorMessage = true;
        //$scope.responseMessage.push("Please enter email address");
      }
      if ((mobileValidation != null && mobileValidation != true)) {
        $scope.errorMessage = true;
        $scope.responseMessage.push(mobileValidation);
      }
      if ($scope.responseMessage.length != 0 || $scope.responseMessage == null || $scope.errorMessage == true) {
        document.getElementById("updateBtn").removeAttribute("data-dismiss");
      }
      else {
        $scope.responseMessage = "";
        document.getElementById('updateBtn').setAttribute("data-dismiss", "modal");
        var updateUser = {
          userName: $scope.userName.toLowerCase(),
          userPassword: $scope.userPassword,
          firstName: $scope.firstName,
          middleName: $scope.middleName,
          lastName: $scope.lastName,
          userAddress: $scope.userAddress,
          userEmailaddress: $scope.userEmailaddress,
          userMobileno: $scope.userMobileno,
          selectedUserrole: $scope.selectedUserrole,
          user_pk: selected_user_pk,
          updated_by: $scope.username
        }
        $http.post('/api/update_user_for_user_master', updateUser).then(function (response) {
          if (response.data.message == "success") {
            swal("Selected user updated successfully!");
            $scope.resetFields();
            $scope.loadUsers();
          }
        });
      }
    };

    $scope.deleteUser = function (data) {
      $("body").css("padding-right", "0");
      var deleteUser = {
        user_pk: selected_user_pk,// data.user_pk,
        user_status: "I"
      }
      $http.post('/api/delete_user_for_user_master', deleteUser).then(function (response) {
        if (response.data.code == 0) {
          swal("Selected user deleted!");
          $scope.resetFields();
          $scope.loadUsers();
          angular.element(document.getElementById('updateUserMaster').style.display = 'none');
        }
        else {
          swal("Selected user is active in an exam. You cannot delete the selected user!");
          return
        }
      });
    }


    function phonenumber(inputtxt) {
      var errMsg;
      var phoneno = /^\d{10}$/;
      if (inputtxt == null || inputtxt == '') {
        errMsg = "Please enter mobile number";
        return errMsg;
      }
      else if (inputtxt.match(phoneno) && inputtxt.length == 10) {
        return true;
      }
      else {
        errMsg = "Not a valid Phone Number,must be ten digits";
        return errMsg;
        return false;
      }
    }

  }


  angular
    .module('qbAuthoringToolApp')
    .controller('userMasterController', userMasterController);

  userMasterController.$inject = ['$scope', 'userService', 'repositoryService', 'examService', '$state', '$q', '$http', '$sce'];

})();