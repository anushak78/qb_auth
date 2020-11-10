(function () {
    'use strict';

    function vetterCSQController($scope, $state, $filter, $window, userService, repositoryService, $sce, $http, $q) {

        $scope.newParentQuestion = repositoryService.getParentQuestion();
        //{qbId:0,courseId:0,subjectId:0,topicId:0,question:'',userName:''};

        $scope.childQuestionList = repositoryService.getChildQuestionList();

        $scope.selectedCourse = {};
        $scope.selectedSubject = {};
        $scope.selectedTopic = {};

        $scope.username = JSON.parse(sessionStorage.getItem('username'));  // Dipika HSS//
        $scope.loginUser = userService.getUserData();

        $scope.noOfChildQues = 1;
        $scope.error_msg = [];
        $scope.editCaseParent = {};
        $scope.newCaseQuestion = repositoryService.geteditAdminQuestion();
        $scope.adminCaseEditFlag = repositoryService.getadminCaseEditFlag();

        $scope.renderAsHtml = function (val) {
            return $sce.trustAsHtml(val);
        };


        $scope.course_code = window.localStorage.getItem("course_code_vetter_csq");
        $scope.course_id = window.localStorage.getItem("course_id_vetter_csq");
        $scope.course_name = window.localStorage.getItem("course_name_vetter_csq");
        $scope.module_name = window.localStorage.getItem("module_name_vetter_csq");
        $scope.module_id = window.localStorage.getItem("module_id_vetter_csq");
        $scope.subject_name = window.localStorage.getItem("subject_name_vetter_csq");
        $scope.subject_id = window.localStorage.getItem("subject_id_vetter_csq");
        $scope.subject_code = window.localStorage.getItem("subject_code_vetter_csq");
        $scope.topic_name = window.localStorage.getItem("topic_name_vetter_csq");
        $scope.topic_code = window.localStorage.getItem("topic_code_vetter_csq");
        $scope.topic_id = window.localStorage.getItem("topic_id_vetter_csq");



        $scope.getSubjectList = function (isOnload) {
            var courseId = $scope.selectedCourse == null ? 0 : $scope.selectedCourse;
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

            if (isOnload == 'Y') {
                var subject = repositoryService.getSelectedSubject();
                $scope.selectedSubject = subject.qba_subject_pk;
            }
        };

        $scope.getModuleList = function (isOnLoad) {
            var subjectId = $scope.selectedSubject == null ? 0 : $scope.selectedSubject;
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
                deferred.resolve(response);
            }).catch(function (error) {
                deferred.reject(error);
            });

            if (isOnLoad == 'Y') {
                var module = repositoryService.getSelectedModule();
                if (module != null && module.module_name == 'ALL') {
                    var topic = repositoryService.getSelectedTopic();
                    if (topic != null && topic.qba_module_fk != null)
                        $scope.selectedModule = topic.qba_module_fk;
                } else {
                    $scope.selectedModule = module.qba_module_pk;
                }
            }
        };

        $scope.getTopicList = function (isOnLoad) {
            var moduleId = $scope.selectedModule == null ? 0 : $scope.selectedModule;
            var parameters = { id: moduleId };
            var deferred = $q.defer();
            var transform = function (data) {
                return $.param(data);
            };
            $http.post('/api/load_topics', parameters, {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
                transformRequest: transform,
                timeout: 0
            }).then(function (response) {
                $scope.topicList = response.data.obj;
                if (isOnLoad == 'Y') {
                    var topic = repositoryService.getSelectedTopic();
                    $scope.selectedTopic = topic.qba_topic_pk;
                }
                deferred.resolve(response);
            }).catch(function (error) {
                deferred.reject(error);
            });
        };

        $scope.setParentQuestionData = function () {
            $scope.newParentQuestion.courseId = $scope.selectedCourse;
            $scope.newParentQuestion.subjectId = $scope.selectedSubject;
            $scope.newParentQuestion.moduleId = $scope.selectedModule;
            $scope.newParentQuestion.topicId = $scope.selectedTopic;
            $scope.newParentQuestion.question = CKEDITOR.instances["editor"].getData();
            var str = CKEDITOR.instances["editor1"].document.getBody().getText().trim()
            $scope.newParentQuestion.userName = $scope.username;
            if ($scope.loginUser.role == 'VET' || $scope.loginUser.role == 'PUB') {
                var parentShortfallRecord = repositoryService.getAddShortFallQuestion();
                $scope.newParentQuestion.qb_pk = parentShortfallRecord.qb_pk;
                $scope.newParentQuestion.qbId = parentShortfallRecord.qb_id;
                $scope.newParentQuestion.exam_fk = parentShortfallRecord.exam_fk;
                $scope.newParentQuestion.exampaper_fk = parentShortfallRecord.exampaper_fk;
            }
        };

        $scope.savereplacementalldata = function () {

            $scope.newParentQuestion.qbId == 0

            $scope.error_msg = [];
            var validateQuestionBody = CKEDITOR.instances["editor1"].getData();
            var str = CKEDITOR.instances["editor1"].document.getBody().getText().trim()



            if (validateQuestionBody == null || validateQuestionBody == '' || validateQuestionBody == undefined || str == '') {
                alert("Please enter passage.");
                return
            }
            if ($scope.childQuestionList.length < 2) {
                alert("Please enter alteast 2 child questions");
                return
            }

            // $scope.setParentQuestionData();

            $scope.course_id = window.localStorage.getItem("course_id_vetter_csq");
            $scope.subject_id = window.localStorage.getItem("subject_id_vetter_csq");
            $scope.topic_id = window.localStorage.getItem("topic_id_vetter_csq");
            $scope.exampaper_fk = window.localStorage.getItem("exampaper_pk");
            $scope.exam_fk = window.localStorage.getItem("exam_id");

            var childqstpid_parent = window.localStorage.getItem("childqstpid");
            $scope.newParentQuestion.courseId = $scope.course_id;
            $scope.newParentQuestion.subjectId = $scope.subject_id;
            $scope.newParentQuestion.moduleId = $scope.module_id;
            $scope.newParentQuestion.topicId = $scope.topic_id;
            $scope.newParentQuestion.exampaper_fk = $scope.exampaper_fk;
            $scope.newParentQuestion.exam_fk = $scope.exam_fk;
            $scope.newParentQuestion.question = CKEDITOR.instances["editor1"].getData();
            var replacedby = window.localStorage.getItem("mqb_id");
            var old_qst_pid = window.localStorage.getItem("mqb_pk");
            $scope.newParentQuestion.qbId = childqstpid_parent;
            $scope.newParentQuestion.remark = "Replacement of QB ID  " + replacedby;
            $scope.newParentQuestion.old_qb_id = replacedby;
            $scope.newParentQuestion.old_qst_pid = old_qst_pid;
            // $scope.username = window.localStorage.getItem("username");
            $scope.newParentQuestion.userName = $scope.username;
            var actiontype = window.localStorage.getItem('actiontype');
            $scope.newParentQuestion.actiontype = actiontype;
            //    var str = CKEDITOR.instances["editor1"].document.getBody().getText().trim()
            //    $scope.newParentQuestion.userName = $scope.loginUser.name; 
            var parameters = $scope.newParentQuestion;
            var deferred = $q.defer();
            var transform = function (data) {
                return $.param(data);
            };

            $http.post('/api/save_csq_parent_in_vetter', parameters).then(function (response) {
                var savedParentQuestion = response.data.obj;

                var childqstpid = window.localStorage.getItem("childqstpid");
                $scope.newParentQuestion.qb_pk = savedParentQuestion.qb_pk;
                //  $scope.newParentQuestion.qbId = savedParentQuestion.qb_id;
                $scope.newParentQuestion.qbId = childqstpid;
                var marks = 0
                for (var i = 0; i < $scope.childQuestionList.length; i++) {
                    marks += $scope.childQuestionList[i].marks
                }
                var data = {
                    exampaper_fk: $scope.exampaper_fk,
                    exam_fk: $scope.exam_fk,
                    qba_topic_master: { qba_topic_pk: $scope.topic_id },
                    no_of_question: $scope.childQuestionList.length,
                    qst_marks: marks
                }
                $http.post('/api/replace_update_case_summary', data).then(function (res) {
                    return $http.post('/api/add_child_question_vetter', $scope.newParentQuestion).then(function (res) {
                        swal("Replace QBID" + response.data.qb_id + " Updated!");
                        $scope.clearData()
                        $state.go('vetterReviewQuestion');

                    });
                });

            });


        };

        $scope.updateChildCount = function () {

            var data = $scope.newParentQuestion;
            $http.post('/api/update_child_count_Admin', data)
                .then(function (response) {

                });
        };


        $scope.saveCSQvetterrecord = function () {


            $scope.error_msg = [];
            var parentShortfallRecord = repositoryService.getAddShortFallQuestion();

            var validateQuestionBody = CKEDITOR.instances["editor1"].getData();
            var str = CKEDITOR.instances["editor1"].document.getBody().getText().trim();

            if (validateQuestionBody == null || validateQuestionBody == '' || validateQuestionBody == undefined || str == '') {
                $scope.error_msg.push("Please enter question text.");
            }

            $scope.newParentQuestion.question = CKEDITOR.instances["editor1"].getData();
            $scope.newParentQuestion.userName = $scope.username;
            $scope.newParentQuestion.qb_pk = parentShortfallRecord.qb_pk;
            $scope.newParentQuestion.exam_fk = parentShortfallRecord.exam_fk;
            $scope.newParentQuestion.exampaper_fk = parentShortfallRecord.exampaper_fk;
            $scope.newParentQuestion.module_fk = $scope.selectedModule == null ? 0 : $scope.selectedModule;

            $scope.newParentQuestion.courseId = $scope.selectedCourse;
            $scope.newParentQuestion.subjectId = $scope.selectedSubject;
            $scope.newParentQuestion.moduleId = $scope.selectedModule;
            $scope.newParentQuestion.topicId = $scope.selectedTopic;
            $scope.newParentQuestion.question = CKEDITOR.instances["editor1"].getData();
            var str = CKEDITOR.instances["editor1"].document.getBody().getText().trim()
            $scope.newParentQuestion.userName = $scope.username;


            if ($scope.error_msg.length > 0) {
                $("html, body").animate({ scrollTop: 0 }, "fast");
            } else {
                $http.post('/api/save_csq_vetter_record', $scope.newParentQuestion)
                    /* .then(function (response) {
                     alert('SUCCESS: Data Saved Successfully')
                            $state.go('vetterReviewQuestion');
                            $scope.clearQuestionData();
                        $('#showModal').click();
                        $('.modal-backdrop').remove();
                            $('body').removeClass('modal-open');
                    }); */
                    .then(function (response) {
                        $('#showModal').click();
                    });

            }

        };
        $scope.goBack = function () {
            if ($scope.childQuestionList.length > 0) {
                alert("Please save case before redirection")
            }
            else
                $state.go('vetterReviewQuestion')
        }

        $scope.prepareAddChildQuestionData = function () {

            // repositoryService.setSelectedCourse(course);
            // repositoryService.setSelectedSubject(subject);
            // repositoryService.setSelectedModule(module);
            // repositoryService.setSelectedTopic(topic);


            var parentShortfallRecord = repositoryService.getAddShortFallQuestion();

            $scope.newParentQuestion.qbId = parentShortfallRecord.qb_id;
            $scope.newParentQuestion.question = CKEDITOR.instances["editor1"].getData();
            window.localStorage.setItem("csq_passage_data", $scope.newParentQuestion.question)
            var str = CKEDITOR.instances["editor1"].document.getBody().getText().trim()
            if ($scope.newParentQuestion.question == '' || str == '') {
                alert('Passage can not be blank.');
                return;
            }

            repositoryService.setParentQuestion($scope.newParentQuestion);
            $state.go('addcsq_child_vetter');
        };

        $scope.clearData = function () {
            var blankQuestion = {};
            var blankChildList = [];
            repositoryService.setParentQuestion(blankQuestion);
            repositoryService.setChildQuestionList(blankChildList);
        };

        angular.element(document).ready(function () {
            var deferred = $q.defer();

            $http.post('/api/load_qbrepo_courses', {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' }
            }).then(function (response) {
                $scope.courseList = response.data.obj;
                var course = repositoryService.getSelectedCourse();
                $scope.selectedCourse = course.qba_course_pk;
                $scope.getSubjectList('Y');
                $scope.getModuleList('Y');
                $scope.getTopicList('Y');
                deferred.resolve(response);
            }).catch(function (error) {
                deferred.reject(error);
            });
        });

        if ($scope.adminCaseEditFlag == true) {
            CKEDITOR.instances["editor1"].setData($scope.newCaseQuestion.qst_body);
        } else {
            CKEDITOR.instances["editor1"].setData($scope.newParentQuestion.question);
        }

    }

    angular
        .module('qbAuthoringToolApp')
        .controller('vetterCSQController', vetterCSQController);

    vetterCSQController.$inject = ['$scope', '$state', '$filter', '$window', 'userService', 'repositoryService',
        '$sce', '$http', '$q'];

})();