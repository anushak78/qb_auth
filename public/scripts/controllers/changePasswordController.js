(function () {
  'use strict';

  function changePasswordController($scope, $state, $filter, $window, userService, repositoryService, $http, $q, $timeout) {

    $scope.loginUser = userService.getUserData();
    $scope.username = JSON.parse(sessionStorage.getItem('username'));  // Dipika HSS//
    $scope.user = {};
    $scope.changePassword = function () {
      $scope.responseMessage = ''
      $scope.user.userPk = $scope.loginUser.id;
      if ($scope.user.oldPassword == undefined || $scope.user.newPassword == undefined || $scope.user.confirmPassword == undefined || $scope.user.oldPassword == null || $scope.user.oldPassword == '' || $scope.user.newPassword == null || $scope.user.newPassword == '' || $scope.user.confirmPassword == null || $scope.user.confirmPassword == '') {
        $scope.errorMessage = true;
        $scope.responseMessage = "Please enter all mandatory fields";
      } else {
        var fgObj = {
          "oldPassword": $scope.user.oldPassword,
          "userPk": $scope.user.userPk,
          "newPassword": $scope.user.newPassword,
          "confirmPassword": $scope.user.confirmPassword
        };
        $http.post('api/changePassword', fgObj).then(function (response) {
          if (response.data.code == 0) {
            $scope.successMessage = true;
            $scope.errorMessage = false;
            $scope.responseMessage = response.data.message;
            setTimeout(function () { $state.go('login'); }, 2000);
          } else {
            $scope.successMessage = false;
            $scope.errorMessage = true;
            $scope.responseMessage = response.data.message;
          }
        }).catch(function (error) {
          deferred.reject(error);
        });
      }

    }


    angular.element(document).ready(function () {
      //alert('change Password');
    });
  }

  angular
    .module('qbAuthoringToolApp')
    .controller('changePasswordController', changePasswordController);

  changePasswordController.$inject = ['$scope', '$state', '$filter', '$window', 'userService', 'repositoryService', '$http', '$q', '$timeout'];

})();