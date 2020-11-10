(function () {
    'use strict';
    function vetterPublisherHomePageController($scope, $stateParams, $filter, $window, userService, repositoryService, $http, $q, $timeout, $state) {



        $scope.vetterDetails;
        $scope.getVetterDetails = function () {
            $scope.loginUser = userService.getUserData();
            var id = JSON.parse(window.localStorage.getItem('user')); // added by shilpa
            $scope.username = JSON.parse(sessionStorage.getItem('username'));  // Dipika HSS//
            var params = { vetter_fk: id };
            $http.post('/api/get_vetter_details', params)
                .then(function successCallback(response) {
                    $scope.vetterDetails = response.data.obj;
                }).catch(function (error) {
                    deferred.reject(error);
                });
        };
        $scope.getVetterDetails();


        $scope.formatDate = function (date) {
            var dateOut = new Date(date);
            return dateOut;
        };

        $scope.gotoModule = function (details) {
            var setDetails = {
                qba_module_fk: details.module_ids,
                exam_id: details.exam_fk,
                exam_name: details.exam_name,
                qstnpaper_id: details.qstnpaper_id,//qstnpaper_id added by milan
                exampaper_pk: details.exampaper_fk
            }
            //added by shilpa
            window.localStorage.setItem("qba_module_fk", details.module_ids);
            window.localStorage.setItem("exam_id", details.exam_fk);
            window.localStorage.setItem("exam_name", details.exam_name);
            window.localStorage.setItem("qstnpaper_id", details.qstnpaper_id);
            window.localStorage.setItem("exampaper_pk", details.exampaper_fk);
            // end by shilpa
            repositoryService.setExamModuleId(setDetails);
            $state.go('vetterReviewQuestion');
        };

        $scope.printPage = function () {
            var contents = $("#printTable").html();
            var frame1 = $('<iframe />');
            frame1[0].name = "frame1";
            frame1.css({ "position": "absolute", "top": "-1000000px" });
            $("body").append(frame1);
            var frameDoc = frame1[0].contentWindow ? frame1[0].contentWindow : frame1[0].contentDocument.document ? frame1[0].contentDocument.document : frame1[0].contentDocument;
            frameDoc.document.open();
            //Create a new HTML document.
            frameDoc.document.write('<html><head><title>DIV Contents</title>');
            frameDoc.document.write('</head><body>');
            //Append the external CSS file.
            frameDoc.document.write('<link href="css/bootstrap.min.css" rel="stylesheet" type="text/css" />');
            frameDoc.document.write('<link href="css/style.css" rel="stylesheet" type="text/css" />');
            frameDoc.document.write('<link href="https://maxcdn.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css" rel="stylesheet" >');

            //Append the DIV contents.
            frameDoc.document.write(contents);
            frameDoc.document.write('</body></html>');
            frameDoc.document.close();
            setTimeout(function () {
                window.frames["frame1"].focus();
                window.frames["frame1"].print();
                frame1.remove();
            }, 500);

        }







    }
    angular.module('qbAuthoringToolApp').controller('vetterPublisherHomePageController', vetterPublisherHomePageController)
        .filter('wordsFilter', function () {

            return function (input, exam) {
                var output = [];

                if (typeof (input) === 'undefined' || input.length == 0) {
                    output.push("No vetting");
                    return output;
                }

                if (exam != null) {
                    angular.forEach(input, function (item) {
                        if (item.exam_name.toLowerCase().indexOf(exam) != -1 || item.exam_name.toUpperCase().indexOf(exam) != -1 || item.exam_name.indexOf(exam) != -1 || item.qstnpaper_id.indexOf(exam) != -1 || item.module_names.indexOf(exam) != -1) {
                            output.push(item);
                        }

                    });
                    if (output.length == 0) {
                        output.push("NO RECORD FOUND");
                        return output;

                    } else {
                        return output;
                    }

                }

                else {
                    return output = input;
                }
            }
        });


    vetterPublisherHomePageController.$inject = ['$scope', '$stateParams', '$filter', '$window', 'userService', 'repositoryService', '$http', '$q', '$timeout', '$state'];
})();  