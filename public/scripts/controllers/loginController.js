(function () {
  'use strict';



  function loginController($scope, $state, $http, userService, $window) {

    //  	$scope.users = [
    // 	{id:10 , name:"Admin", password:"Admin"},
    // 	{id:18 , name:"Vetter1", password:"Vetter1"},
    // 	{id:15 , name:"Vetter2", password:"Vetter2"},
    // 	{id:21 , name:"Publisher", password:"Publisher"}
    // ];

    var config = {
      headers: {
        'auth-token': userService.token
      }
    }

    localStorage.clear();
    $scope.validateLogin = function () {

      /*var name = $scope.uname;
      var id = 10;	
      userService.setUserData(name, id);
      if(name == 'Admin') {
        $state.go('qp_repository');
      } else if(name == 'Publisher') {
        $state.go('examPaperPublisher');
      } else {
        $state.go('examPaperVetter');
      }*/

      var uname = $scope.uname;
      var password = $scope.upassword
      var flag = "false";

      if ((uname == undefined || uname == "") && (password == undefined || password == "")) {
        alert("Please enter  Username and Password.")
        flag = "false";
      }
      else if (uname == undefined || uname == "") {
        alert("Please enter  Username.")
        flag = "false";
      }
      else if (password == undefined || password == "") {
        alert("Please enter  Password.")
        flag = "false";
      }
      else {
        flag = "true";
      }


      if (flag == "true") {
        $scope.loginCredentials = { name: uname, pass: password };

        $http.post('/api/login', $scope.loginCredentials)
          .then(function successCallback(object) {
            var response = object.data;
            var test = response.token;
            userService.token = response.token;


            userService.token = object.data.token;
            userService.user = object.data.data.id;
            userService.username = object.data.data.name;
            userService.role = object.data.data.role;

            userService.loginDetails = response.data.lastTime;
            sessionStorage.setItem("username", JSON.stringify(userService.username));
            localStorage.setItem('token', userService.token);

            $http.defaults.headers.common['auth-token'] = window.localStorage.token
            // localStorage.setItem('user', JSON.stringify(userService.user)); 
            // localStorage.setItem('username', JSON.stringify(userService.username));
            // localStorage.setItem('role', JSON.stringify(userService.role));
            window.localStorage.setItem('user', JSON.stringify(userService.user));
            window.localStorage.setItem('username', JSON.stringify(userService.username));
            window.localStorage.setItem('role', JSON.stringify(userService.role));


            //localStorage.setItem('loginDetails', JSON.stringify(userService.loginDetails)); 



            var response = object.data;
            userService.setUserData(uname, password, response.data.role, response.data.id);
            //alert(uname+"-"+password+"-"+response.code+"-"+response.data.id);
            if (response.data.role == 'SUADM') {

              //$state.go('qp_repository');
              $state.go('SuperAdminDashboard');
            }
            else if (response.data.role == 'ADM') {
              //$state.go('qp_repository');
              $state.go('adminDashboard');
            }
            else if (response.data.role == 'QBADM') {
              //$state.go('qp_repository');
              $state.go('QBAdminDashboard');
            }
            else if (response.data.role == 'VET' || response.data.role == 'PUB')
              $state.go('vetterPublisherHomePage');
            else
              alert(response.message);

          }, function errorCallback(object) {
            alert("Invalid User ! ");
          });
      }
    };

    $scope.resetFields = function () {
      $scope.req_username = "";
      $scope.req_username = "";
      $scope.req_confirmpassword = "";
    }

    $scope.resetPassword = function () {
      $scope.responseMessage = [];
      if ($scope.req_username == undefined || $scope.req_username == null || $scope.req_username == '') {
        $scope.errorMessage = true;
        $scope.responseMessage.push("Please enter Username.");
      } if ($scope.req_password == undefined || $scope.req_password == null || $scope.req_password == '') {
        $scope.errorMessage = true;
        $scope.responseMessage.push("Please enter password.");
      }
      if ($scope.req_password != $scope.req_confirmpassword) {
        $scope.errorMessage = true;
        $scope.responseMessage.push("Password and confirm password not match");
      }
      if ($scope.responseMessage.length != 0 || $scope.responseMessage == null) {
        document.getElementById("savebtn").removeAttribute("data-dismiss");
      }
      else {
        document.getElementById('savebtn').setAttribute("data-dismiss", "modal");
        var userInput = {
          user_id: $scope.req_username,
          user_password: $scope.req_password
        }
        $http.post('/api/retrive_forgot_password', userInput).then(function (response) {
          if (response.data.message == 'Usernotfound') {
            swal('User not found');
          } else {
            $scope.resetFields();
            swal('Password updated sucessfully.');
          }
        });

      }
    }

    $(document).keypress(function (e) {
      if (e.which == 13) {
        $scope.validateLogin();
      }
    });

  }

  angular
    .module('qbAuthoringToolApp')
    .controller('loginController', loginController);

  loginController.$inject = ['$scope', '$state', '$http', 'userService'];

})();



/*var users = [
				{id:10 , name:"Admin", password:"Admin"},
				{id:18 , name:"Vetter1", password:"Vetter1"},
				{id:15 , name:"Vetter2", password:"Vetter2"},
				{id:21 , name:"Publisher", password:"Publisher"},
			];

/*function validateLogin(){
	var userName = $('#uname').val();
	var userPass = $('#upassword').val();

	for(var i = 0; i < users.length; i++) {
    var data= users[i];

    	if(data.name==userName && data.password==userPass) {
       		var a = document.getElementById("route");
       		if(userName == 'Admin')
			a.setAttribute("href", "pages/culling.html");
		else
			a.setAttribute("href", "pages/questionpaper-preview.html?username="+data.name+"&userid="+data.id);

    		return true;
    	}

	}
	alert('User name or Password is incorrect.');

	return false;
}

function validateLogin(){
	var userName = $('#uname').val();
	var userPass = $('#upassword').val();
	var userExist = false;
//localStorage.clear();


	for(var i = 0; i < users.length; i++) {
		var data= users[i];
    	if(data.name==userName && data.password==userPass) {
       		//var a = document.getElementById("route");
       		if(userName == 'Admin')
				location.href= 'pages/questionpaper-repository.html';
			else if(userName == 'Publisher')
				location.href="pages/examination-papername-publisher.html?username="+data.name+"&userid="+data.id;
			else
				location.href="pages/examination-papername-vetter.html?username="+data.name+"&userid="+data.id;

			userExist = true;

		}



	}

	if(!userExist)
	{
		alert('User name or Password is incorrect.');
	}


	//return false;
}

$(document).keypress(function(e) {
    if(e.which == 13) {
        validateLogin();
    }
  });*/





