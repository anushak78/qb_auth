
(function () {
    'use strict';

    function userService() {
        var userData = { name: '', pass: '', role: '', id: '' };
        return {
            name: 'userService',
            setUserData: function (uname, upass, code, id) {
                userData.name = uname;
                userData.pass = upass;
                userData.role = code;
                userData.id = id;
            },
            getUserData: function () {

                return userData;
            }
        };

        var vm = this;
        vm.token = undefined;
        vm.user = undefined;
        vm.loginDetails = undefined;

        var cachedToken = localStorage.getItem('token');
        var cachedUser = localStorage.getItem('user');
        var cachedLogin = localStorage.getItem('loginDetails');


        if (cachedToken) {
            vm.token = cachedToken;
            vm.user = JSON.parse(cachedUser);
            vm.loginDetails = JSON.parse(cachedLogin);
        }

    }

    angular
        .module('qbAuthoringToolApp')
        .factory('userService', userService);

    userService.$inject = [];

})();



