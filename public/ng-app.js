var app = angular.module('myApp', []);
app.controller('ListController', function ($scope, $http) {
    /* $scope.appDetails = [
     {
     'fname':'Muhammed',
     'lname':'Shanid',
     'email':'shanid@shanid.com'
     },
     {
     'fname':'John',
     'lname':'Abraham',
     'email':'john@john.com'
     },
     {
     'fname':'Roy',
     'lname':'Mathew',
     'email':'roy@roy.com'
     }];*/
    $scope.appDetails = [];

    $scope.addNew = function (appDetail) {
        $scope.appDetails.push({
            'icon': "",
            'desc': "",
            'location': "",
            'package': ""
        });
    };

    $scope.uploadFile = function () {
        var formData = new FormData();
        //var ogAppLength = parseInt($scope.ogAppDetails.length);

        for (var x = 0; x < $scope.appDetails.length; x++) {
            var fileSelector = x;
            formData.append('file' + x, $('#file' + fileSelector)[0].files[0]);
            formData.append('desc', $scope.appDetails[x]['desc']);
            formData.append('location', $scope.appDetails[x]['location']);
            formData.append('package', $scope.appDetails[x]['package']);
        }
        formData.append('count', $scope.appDetails.length);

        $.ajax({
            url: window.location.origin + '/api/upload-files',
            type: 'POST',
            data: formData,
            processData: false,  // tell jQuery not to process the data
            contentType: false,  // tell jQuery not to set contentType
            success: function (data) {
                if (data['code'] == 1) {
                    alert("app submitted");
                    $scope.getRecords();
                } else {
                    alert("something went wrong");
                    $scope.getRecords();
                }
            }
        });
    };


    /*    $scope.go = function () {

     var fd = new FormData();
     fd.append('file', $scope.appDetails);
     $http.post("/api/set-app-list-details", {appDetails: fd}, {
     transformRequest: angular.identity,
     headers: {'Content-Type': undefined}
     }
     )
     .then(function (response) {
     });
     }*/


    $scope.remove = function () {
        var newDataList = [];
        $scope.selectedAll = false;
        angular.forEach($scope.appDetails, function (selected) {
            if (!selected.selected) {
                newDataList.push(selected);
            }
        });
        $scope.appDetails = newDataList;
    };

    $scope.checkAll = function () {
        if (!$scope.selectedAll) {
            $scope.selectedAll = true;
        } else {
            $scope.selectedAll = false;
        }
        angular.forEach($scope.appDetails, function (appDetail) {
            appDetail.selected = $scope.selectedAll;
        });
    };

    $scope.encodeImageFileAsURL = function (element) {
        var file = element.files[0];
        var reader = new FileReader();
        reader.onloadend = function () {
        }
        reader.readAsDataURL(file);
    }


});

app.directive('fileModel', ['$parse', function ($parse) {
    return {
        restrict: 'A',
        link: function (scope, element, attrs) {
            var model = $parse(attrs.fileModel);
            var modelSetter = model.assign;

            element.bind('change', function () {
                scope.$apply(function () {
                    modelSetter(scope, element[0].files[0]);
                });
            });
        }
    };
}]);

