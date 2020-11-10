(function () {
    'use strict';
  
  
  
    function logOutController($scope, $state, $http, userService, $window) {
        $scope.logout = function () {
            userService.token = null;
            userService.user = null;
            userService.username = null;
            userService.role = null;
            userService.loginDetails = null;
            sessionStorage.removeItem("username");
            localStorage.removeItem('token');
            $http.defaults.headers.common['auth-token'] = null
            window.localStorage.removeItem('user');
            window.localStorage.removeItem('username');
            window.localStorage.removeItem('role');
            $http.post('/api/logout',{
                headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' }
            }).then(function (response) {
            })
            $state.go('login')
        }

    }
    angular
    .module('qbAuthoringToolApp')
    .controller('logOutController', logOutController);

    logOutController.$inject = ['$scope', '$state', '$http', 'userService'];

})();  