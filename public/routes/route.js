(function () {
    'use strict';

    function RoutingDemo($stateProvider, $urlRouterProvider) {
        $urlRouterProvider.otherwise("login");
        $stateProvider.state('login', {
            url: '/login',
            templateUrl: '/views/loginPage.html',
            controller: 'loginController'
        }).state('culling', {
            url: '/culling',
            templateUrl: '/views/culling.html',
            controller: 'cullingController',
            resolve: {
                validation: function ($http, $state) {
                    checkValidation($http, $state)
                }
            }
        }).state('qp_repository', {
            url: '/repository',
            templateUrl: '/views/questionpaper-repository.html',
            controller: 'qpRepoController',
            resolve: {
                validation: function ($http, $state) {
                    checkValidation($http, $state)
                }
            } 
        }).state('qp_preview', {
            url: '/preview_admin',
            templateUrl: '/views/questionpaper-preview.html',
            controller: 'qpPreviewController',
            resolve: {
                validation: function ($http, $state) {
                    checkValidation($http, $state)
                }
            }
        }).state('qp_preview_common', {
            url: '/preview_common',
            templateUrl: '/views/questionpaper-preview_common.html',
        }).state('addmcq', {
            url: '/add_mcq',
            templateUrl: '/views/add_mcq.html',
            controller: 'addMCQController',
            resolve: {
                validation: function ($http, $state) {
                    checkValidation($http, $state)
                }
            }
        }).state('add_mcq_admin', {
            url: '/add_mcq_admin',
            templateUrl: '/views/add_mcq_admin.html',
            controller: 'addMCQAdminController',
            resolve: {
                validation: function ($http, $state) {
                    checkValidation($http, $state)
                }
            }
        }).state('adminEditQuestion', {
            url: '/admin_edit_question',
            templateUrl: '/views/admin-edit-question.html',
            controller: 'adminEditQuestionController',
            resolve: {
                validation: function ($http, $state) {
                    checkValidation($http, $state)
                }
            }
        }).state('vetterEditQuestion', {
            url: '/vetter_edit_question',
            templateUrl: '/views/vetter-edit-question.html',
            controller: 'vetterEditQuestionController',
            resolve: {
                validation: function ($http, $state) {
                    checkValidation($http, $state)
                }
            }
        }).state('add_mcq_vetter', {
            url: '/add_mcq_vetter',
            templateUrl: '/views/add_mcq_vetter.html',
            controller: 'vetterMCQController',
            resolve: {
                validation: function ($http, $state) {
                    checkValidation($http, $state)
                }
            }
            //  controller:   'vetterReviewQuestionController'
        }).state('add_csq_vetter', {
            url: '/add_csq_vetter',
            templateUrl: '/views/add_csq_vetter.html',
            controller: 'vetterCSQController'
        }).state('add_shortfall_csq_parent', {
            url: '/add_shortfall_csq_parent',
            templateUrl: '/views/add_shortfall_csq_parent.html',
            controller: 'ShortFallCSQParentController',
            resolve: {
                validation: function ($http, $state) {
                    checkValidation($http, $state)
                }
            }
        }).state('add_shortfall_csq_child', {
            url: '/add_shortfall_csq_child',
            templateUrl: '/views/add_shortfall_csq_child.html',
            controller: 'ShortFallCSQChildController',
            resolve: {
                validation: function ($http, $state) {
                    checkValidation($http, $state)
                }
            }
        }).state('add_shortfall_mcq', {
            url: '/add_shortfall_mcq',
            templateUrl: '/views/add_shortfall_mcq.html',
            controller: 'vetterMCQController',
            resolve: {
                validation: function ($http, $state) {
                    checkValidation($http, $state)
                }
            }
        }).state('add_csq_admin', {
            url: '/add_csq_admin',
            templateUrl: '/views/add_csq_parent_admin.html',
            controller: 'addCSQParentAdminController',
            resolve: {
                validation: function ($http, $state) {
                    checkValidation($http, $state)
                }
            }
        }).state('addcsq_child_vetter', {
            url: '/addcsq_child_vetter',
            templateUrl: '/views/addcsq_child_vetter.html',
            controller: 'addCSQChildVetterController',
            resolve: {
                validation: function ($http, $state) {
                    checkValidation($http, $state)
                }
            }
        }).state('vetterReviewQuestion', {
            url: '/vetter_review_question',
            templateUrl: '/views/examination-papername-vetter.html',
            controller: 'vetterReviewQuestionController',
            resolve: {
                validation: function ($http, $state) {
                    checkValidation($http, $state)
                }
            }
        }).state('PrintPage', {
            url: '/PrintPage',
            templateUrl: '/views/print.html',
            controller: 'VetterPrintController',
            resolve: {
                validation: function ($http, $state) {
                    checkValidation($http, $state)
                }
            }
        }).state('PrintPagePublisher', {
            url: '/PrintPagePublisher',
            templateUrl: '/views/publisher-print.html',
            controller: 'VetterPrintController',
            resolve: {
                validation: function ($http, $state) {
                    checkValidation($http, $state)
                }
            }
        }).state('PrintPageAdmin', {
            url: '/PrintPageAdmin',
            templateUrl: '/views/admin_print.html',
            controller: 'PrintController',
            resolve: {
                validation: function ($http, $state) {
                    checkValidation($http, $state)
                }
            }
        }).state('addcsq_parent', {
            url: '/add_csq_parent',
            templateUrl: '/views/add_csq_parent.html',
            controller: 'addCSQParentController',
            resolve: {
                validation: function ($http, $state) {
                    checkValidation($http, $state)
                }
            }
        }).state('addcsq_child', {
            url: '/add_csq_child',
            templateUrl: '/views/add_csq_child.html',
            controller: 'addCSQChildController',
            resolve: {
                validation: function ($http, $state) {
                    checkValidation($http, $state)
                }
            }
        }).state('addcsq_child_admin', {
            url: '/addcsq_child_admin',
            templateUrl: '/views/add_csq_child_admin.html',
            controller: 'addCSQChildAdminController',
            resolve: {
                validation: function ($http, $state) {
                    checkValidation($http, $state)
                }
            }
        }).state('editQuestion', {
            url: '/edit_question',
            templateUrl: '/views/ckeditor.html',
        }).state('examPaperAdmin', {
            url: '/exam_paper_admin',
            templateUrl: '/views/examination-papername-admin.html',
            controller: 'examPaperAdminController',
            resolve: {
                validation: function ($http, $state) {
                    checkValidation($http, $state)
                }
            }
        }).state('examPaperVetter', {
            url: '/exam_paper_vetter',
            templateUrl: '/views/examination-papername-vetter.html',

        }).state('examPaperVetterPreview', {
            url: '/exam_paper_vetter_preview',
            templateUrl: '/views/questionpaper-preview_common.html',
            controller: 'examPaperVetterPreviewController',
            resolve: {
                validation: function ($http, $state) {
                    checkValidation($http, $state)
                }
            }

        }).state('examPaperPublisher', {
            url: '/exam_paper_publisher',
            templateUrl: '/views/examination-papername-publisher.html',

        }).state('vetterPublisherHomePage', {
            url: '/vetterPublisher_home_page',
            templateUrl: '/views/vetterPublisher-home-page.html',
            controller: 'vetterPublisherHomePageController',
            resolve: {
                validation: function ($http, $state) {
                    checkValidation($http, $state)
                }
            }
        }).state('changePassword', {
            url: '/change_password',
            templateUrl: '/views/change-password.html',
            controller: 'changePasswordController',
            resolve: {
                validation: function ($http, $state) {
                    checkValidation($http, $state)
                }
            }
        }).state('SuperAdminDashboard', {
            url: '/SuperAdminDashboard',
            templateUrl: '/views/super-admin-dashboard.html',
            controller: 'SuperAdminController',
            resolve: {
                validation: function ($http, $state) {
                    checkValidation($http, $state)
                }
            }

        }).state('QBAdminDashboard', {
            url: '/QBAdminDashboard',
            templateUrl: '/views/Qb-Admin.html',
            controller: 'QBAdminController',
            resolve: {
                validation: function ($http, $state) {
                    checkValidation($http, $state)
                }
            }

        }).state('adminDashboard', {
            url: '/admin_dashboard',
            templateUrl: '/views/admin-dashboard.html',
            controller: 'adminDashboardController',
            resolve: {
                validation: function ($http, $state) {
                    checkValidation($http, $state)
                }
            }

        }).state('examMaster', {
            url: '/exam_master',
            templateUrl: '/views/exam-master.html',
            controller: 'examMasterController',
            resolve: {
                validation: function ($http, $state) {
                    checkValidation($http, $state)
                }
            }
        }).state('examPaperAdminPreview', {
            url: '/exam_paper_admin_preview',
            templateUrl: '/views/questionpaper-admin-preview.html',
            controller: 'examPaperVetterPreviewController',
            resolve: {
                validation: function ($http, $state) {
                    checkValidation($http, $state)
                }
            }
        }).state('courseMaster', {
            url: '/course_master',
            templateUrl: '/views/course-master.html',
            controller: 'courseMasterController',
            resolve: {
                validation: function ($http, $state) {
                    checkValidation($http, $state)
                }
            }
        }).state('userMaster', {
            url: '/user_master',
            templateUrl: '/views/user-master.html',
            controller: 'userMasterController',
            resolve: {
                validation: function ($http, $state) {
                    checkValidation($http, $state)
                }
            }
        }).state('subjectMaster', {
            url: '/subject_master',
            templateUrl: '/views/subject-master.html',
            controller: 'subjectMasterController',
            resolve: {
                validation: function ($http, $state) {
                    checkValidation($http, $state)
                }
            }
        }).state('topicMaster', {
            url: '/topic_master',
            templateUrl: '/views/topic-master.html',
            controller: 'topicMasterController',
            resolve: {
                validation: function ($http, $state) {
                    checkValidation($http, $state)
                }
            }
        }).state('moduleMaster', {
            url: '/module_master',
            templateUrl: '/views/module-master.html',
            controller: 'moduleMasterController',
            resolve: {
                validation: function ($http, $state) {
                    checkValidation($http, $state)
                }
            }
        }).state('publishedExams', {
            url: '/published_exams',
            templateUrl: '/views/published-exams.html',
            controller: 'publishedExamController',
            resolve: {
                validation: function ($http, $state) {
                    checkValidation($http, $state)
                }
            }
        }).state('trackAllQuestions', {
            url: '/trackAllQuestions',
            templateUrl: '/views/track-questions.html',
            controller: 'TrackChangesController',
            resolve: {
                validation: function ($http, $state) {
                    checkValidation($http, $state)
                }
            }
        });
    }

    function checkValidation($http, $state) {
        $http.post('/api/checkCredentials', {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' }
          }).then(function (response) {
            if (response.data.code == 401) {
              $state.go('login')
              return
            }
        })
        if (sessionStorage.getItem('username') == null) {
            $state.go('login')
            return
        }
    }

    angular
        .module('qbAuthoringToolApp', ['ui.router'])
        .config(RoutingDemo)
        .directive("repeatEnd", function () {
            return {
                restrict: "A",
                link: function (scope, element, attrs) {
                    if (scope.$last) {
                        scope.$eval(attrs.repeatEnd);
                    }
                }
            };
        })
        .directive('contenteditable', [function () {
            return {
                require: '?ngModel',
                scope: {

                },
                link: function (scope, element, attrs, ctrl) {
                    // view -> model (when div gets blur update the view value of the model)
                    element.bind('blur', function () {
                        scope.$apply(function () {
                            ctrl.$setViewValue(element.html());
                        });
                    });

                    // model -> view
                    ctrl.$render = function () {
                        element.html(ctrl.$viewValue);
                    };

                    // load init value from DOM
                    ctrl.$render();

                    // remove the attached events to element when destroying the scope
                    scope.$on('$destroy', function () {
                        element.unbind('blur');
                        element.unbind('paste');
                        element.unbind('focus');
                    });
                }
            };

        }])

        .directive('myDropdownMultiselect', function () {
            return {
                restrict: 'E',
                scope: {
                    name: '=',
                    options: '='
                },
                controller: function ($scope) {
                    $scope.checkAll = function () {
                        angular.forEach($scope.options, function (col) {
                            col.checked = true;
                        });
                    };
                    $scope.removeAll = function () {
                        angular.forEach($scope.options, function (col) {
                            col.checked = false;
                        });
                    };
                },
                templateUrl: '/views/myDropdownMultiselect.html'
            }
        });

    RoutingDemo.$inject = ['$stateProvider', '$urlRouterProvider'];

})();
