(function () {
    'use strict';
    function examPaperVetterPreviewController($scope, $stateParams, $filter, $window, userService, repositoryService, $http, $q, $timeout, $sce) {
        var topicParams = repositoryService.getVetterQuestionsParameters();
        $scope.examName = topicParams.exam_name;
        $scope.currentQstnPaperId = topicParams.qstnpaper_id;
        $scope.examPaperPk = topicParams.exampaper_pk;
        $scope.examPk = topicParams.exam_id;
        $scope.username = JSON.parse(sessionStorage.getItem('username'));  // Dipika HSS//

        $scope.loginUser = userService.getUserData();
        $scope.pageList = [];
        $scope.countQst = 0;
        $scope.currentPageRecords = 0;
        $scope.currentPageId = 0;
        $scope.NoQstnList = repositoryService.getShowQuestionsPerPageList();
        $scope.selectNoQstn = $scope.NoQstnList[0];
        $scope.showQstn = $scope.selectNoQstn.no_Qstn;
        $scope.showPages = function () {
            var noOfPage = 0;
            if ($scope.countQst != 0) {
                $scope.pageList = [];
                if (isNaN($scope.selectNoQstn.no_Qstn) && 'ALL' == $scope.selectNoQstn.no_Qstn.toUpperCase()) {
                    $scope.showQstn = $scope.countQst;
                    noOfPage = 1;
                } else {
                    $scope.showQstn = $scope.selectNoQstn.no_Qstn;
                    noOfPage = ($scope.countQst / $scope.showQstn);
                }
                for (var i = 0; i < noOfPage; i++) {
                    $scope.pageList.push(
                        {
                            id: (i + 1)
                        })
                }
            }
        };
        $scope.populateQuestions = function (topic) {
            $scope.selectedTopic = topic;
            $scope.method = "default";
            var parameters = {
                id: topic.qba_module_fk,
                examPk: $scope.examPk, examPaperPk: $scope.examPaperPk,
                off: 0, lim: $scope.selectNoQstn.no_Qstn
            };
            var deferred = $q.defer();
            var transform = function (data) {
                return $.param(data);
            };

            $http.post('/api/load_vetter_questions', parameters, {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
                transformRequest: transform,
                timeout: 0
            }).then(function (response) {
                $scope.repoQuestions = response.data.data;
                $scope.countQst = response.data.count[0].count;
                $scope.currentPageRecords = response.data.data.length;
                $scope.showOffset = 0;
                $scope.currentPageId = 1;
                $scope.showPages();
                $scope.getStartedInitialization();
                deferred.resolve(response);
            }).catch(function (error) {
                deferred.reject(error);
            });

        };

        //Author: Dhiraj Edit Question For Admin 
        $scope.editQuestionForVetter = function (questionData) {
            repositoryService.seteditAdminQuestion(questionData);
            $state.go('vetterEditQuestion');
        }

        $scope.renderAsHtml = function (val) {
            return $sce.trustAsHtml(val);
        };

        //Pagination function 
        $scope.reloadPage = function () {
            $scope.showPages();
            $scope.reloadData(1);
            $scope.getStartedInitialization();
        }
        //Pagination function 
        $scope.reloadData = function (rowNum) {
            $scope.repoQuestions;
            $scope.currentPageId = rowNum;
            var page = rowNum;
            var offset;
            var limit;

            if (isNaN($scope.selectNoQstn.no_Qstn) && 'ALL' == $scope.selectNoQstn.no_Qstn.toUpperCase()) {
                offset = 0;
                limit = 'ALL';
                $scope.showOffset = 0;
            } else {
                $scope.showOffset = ((page - 1) * $scope.showQstn);
                offset = ((page - 1) * $scope.showQstn) + 1;//start for raw query
                limit = $scope.showQstn * page;//end
            }

            var parameters = {
                id: topicParams.qba_module_fk,
                examPk: $scope.examPk, examPaperPk: $scope.examPaperPk,
                off: offset, lim: limit
            };
            var deferred = $q.defer();
            var transform = function (data) {
                return $.param(data);
            };
            $http.post('/api/load_vetter_questions', parameters, {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
                transformRequest: transform,
                timeout: 0
            }).then(function (response) {
                $scope.repoQuestions = response.data.data;
                $scope.countQst = response.data.count[0].count;
                $scope.currentPageRecords = response.data.data.length;
                $scope.currentPageId = rowNum;
                $scope.showPages();
                //$scope.getListofVetterRequestbyUser();  
                deferred.resolve(response);
            }).catch(function (error) {
                deferred.reject(error);
            });
        }

        /* $scope.get_summary_details = function(){ 
             var parameters = {    
                 userId: $scope.loginUser.id,
                 examId: topicParams.exam_id,   
                 moduleId: topicParams.qba_module_fk      
             };              
             var transform = function (data) {    
                 return $.param(data);
             };         
             $http.post('/api/load_summary_details',parameters, {
                 headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
                 transformRequest: transform,
                 timeout: 0
             }).then(function (response) { 
                 $scope.summary_details = response.data.data;    
             });     
         }*/

        $scope.getTotalRecords = function () {
            if ($scope.repoQuestions == null || $scope.repoQuestions.length == 0)
                return 0;
            else {
                var questionCount = 0;
                for (var i = 0; i < $scope.repoQuestions.length; i++) {
                    if ($scope.repoQuestions[i].qst_type == "CS" && $scope.repoQuestions[i].qst_pid == 0) {
                        //Do Nothing
                    } else {
                        questionCount++;
                    }
                }
                return questionCount;
            }
        };

        $scope.getStartedInitialization = function () {

            var noOfPage = 0;
            var remainder = 0;

            if (isNaN($scope.selectNoQstn.no_Qstn) && 'ALL' == $scope.selectNoQstn.no_Qstn.toUpperCase()) {
                noOfPage = 1;
            } else {
                $scope.showQstn = $scope.selectNoQstn.no_Qstn;
                noOfPage = parseInt($scope.countQst / $scope.showQstn);
                remainder = $scope.countQst % $scope.showQstn
            }

            if (remainder > 0)
                noOfPage = noOfPage + 1;

            var options = {
                currentPage: 1,
                totalPages: noOfPage,
                onPageClicked: function (e, originalEvent, type, page) {
                    $scope.reloadData(page);
                },
                onPageChanged: function (e, oldPage, newPage) {
                    if (e.target.id == "pagination2") {
                        $('#pagination1').bootstrapPaginator("show", newPage);
                    } else {
                        $('#pagination2').bootstrapPaginator("show", newPage);
                    }
                }
            };
            $('#pagination1').bootstrapPaginator(options);
            $('#pagination2').bootstrapPaginator(options);
        };

        //Runs On Page Init
        $scope.populateQuestions(topicParams);

        //$scope.get_summary_details();    

    }

    angular
        .module('qbAuthoringToolApp')
        .controller('examPaperVetterPreviewController', examPaperVetterPreviewController);
    examPaperVetterPreviewController.$inject = ['$scope', '$stateParams', '$filter', '$window', 'userService', 'repositoryService', '$http', '$q', '$timeout', '$sce'];
})();    