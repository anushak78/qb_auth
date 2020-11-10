(function () {
    'use strict';

    function addCSQParentAdminController($scope, $state, $filter, $window, userService, repositoryService, $sce, $http, $q) {

        $scope.newParentQuestion = repositoryService.getParentQuestion();
        //{qbId:0,courseId:0,subjectId:0,topicId:0,question:'',userName:''};
        $scope.selected_module_name = "";
        $scope.childQuestionList = repositoryService.getChildQuestionList();

        $scope.selectedCourse = {};
        $scope.selectedSubject = {};
        $scope.selectedTopic = {};

        $scope.username = JSON.parse(sessionStorage.getItem('username'));  // Dipika HSS//
        $scope.role = JSON.parse(window.localStorage.getItem("role"));
        $scope.loginUser = userService.getUserData();

        $scope.noOfChildQues = 1;
        $scope.error_msg = [];
        $scope.editCaseParent = {};
        $scope.newCaseQuestion = repositoryService.geteditAdminQuestion();
        $scope.adminCaseEditFlag = repositoryService.getadminCaseEditFlag();

        $scope.renderAsHtml = function (val) {
            return $sce.trustAsHtml(val);
        };

        $scope.Coursename = window.localStorage.getItem("cname");
        $scope.Course_code = window.localStorage.getItem("course_code_vetter");
        $scope.subject_name = window.localStorage.getItem("sname");
        $scope.subject_id = window.localStorage.getItem("sid");
        $scope.course_id = window.localStorage.getItem("course_fk");

        var req = {
            subject_id: $scope.subject_id
        };
        $http.post('/api/get_subject_name', req).then(function (response) {
            $scope.subjectcode = response.data.obj[0].qba_subject_code;

        });

        $scope.moduleid = window.localStorage.getItem("module_fk_for_mcq");
        var reqdata = {
            moduleId: $scope.moduleid
        };
        $http.post('/api/get_module_name', reqdata).then(function (response) {
            $scope.moduleIds = response.data.obj;
        });


        // $scope.getModuleList = function(isOnLoad) {
        //     var subjectId = $scope.selectedSubject == null? 0: $scope.selectedSubject;
        //     var parameters = {id:subjectId};
        //     var deferred = $q.defer();
        //     var transform = function (data) {
        //             return $.param(data);
        //         };
        //     $http.post('/api/load_modules',parameters, {
        //         headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
        //         transformRequest: transform,
        //         timeout: 0
        //     }).then(function (response) {
        //         $scope.moduleList = response.data.obj;
        //         deferred.resolve(response);
        //     }).catch(function (error) {
        //         deferred.reject(error);
        //     });  

        //     if(isOnLoad == 'Y') {
        //         var module = repositoryService.getSelectedModule();
        //         if(module != null && module.module_name == 'ALL'){
        //             var topic = repositoryService.getSelectedTopic();
        //             if(topic != null && topic.qba_module_fk != null)
        //                 $scope.selectedModule = topic.qba_module_fk;
        //         } else { 
        //             $scope.selectedModule = module.qba_module_pk;
        //         }
        //     }
        // };

        // angular.element(document).ready(function () {

        //     var deferred = $q.defer();


        //     $http.post('/api/load_modules_admin', {
        //         headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' }
        //     }).then(function (response) {
        //         $scope.courseList = response.data.obj;
        //         var course = repositoryService.getSelectedCourse();
        //         $scope.selectedCourse = course.qba_course_pk;
        //         //$scope.getSubjectList('Y');
        //       //  $scope.getModuleList('Y');
        //         $scope.getTopicList('Y');
        //         deferred.resolve(response);
        //     }).catch(function (error) {
        //         deferred.reject(error);
        //     });




        // });


        $scope.saveCSQParent = function () {
            $scope.newParentQuestion.qbId == 0
            $scope.error_msg = [];
            var validateQuestionBody = CKEDITOR.instances["editor1"].getData();
            var str = CKEDITOR.instances["editor1"].document.getBody().getText().trim()



            if (validateQuestionBody == null || validateQuestionBody == '' || validateQuestionBody == undefined || str == '') {
                $scope.error_msg.push("Please enter passage.");
            }
            if ($scope.childQuestionList.length < 2) {
                $scope.error_msg.push("Please enter 2 or more child questions")
            }



            $scope.course_id = window.localStorage.getItem("course_fk");
            $scope.subject_id = window.localStorage.getItem("sid");
            $scope.topic_id = window.localStorage.getItem("selected_topic_id");
            $scope.module_id = window.localStorage.getItem("selected_module_id");
            if ($scope.module_id == null || $scope.module_id == undefined || $scope.module_id == '') {
                $scope.error_msg.push("Please enter module")
            }
            if ($scope.topic_id == null || $scope.topic_id == undefined || $scope.topic_id == '') {
                $scope.error_msg.push("Please enter topic")
            }



            $scope.exampaper_fk = window.localStorage.getItem("e_pk");
            $scope.exam_fk = window.localStorage.getItem("eid");


            $scope.newParentQuestion.courseId = $scope.course_id;
            $scope.newParentQuestion.subjectId = $scope.subject_id;
            $scope.newParentQuestion.moduleId = $scope.module_id;
            $scope.newParentQuestion.topicId = $scope.topic_id;
            $scope.newParentQuestion.exampaper_fk = $scope.exampaper_fk;
            $scope.newParentQuestion.exam_fk = $scope.exam_fk;
            $scope.newParentQuestion.question = CKEDITOR.instances["editor1"].getData();
            var replacedby = window.localStorage.getItem("mqb_id");
            var childqstpid_parent = window.localStorage.getItem("childqstpid");
            $scope.newParentQuestion.qbId = childqstpid_parent;
            $scope.newParentQuestion.remark = null;
            //$scope.newParentQuestion.old_qb_id = replacedby;
            $scope.newParentQuestion.userName = $scope.username;
            //    var str = CKEDITOR.instances["editor1"].document.getBody().getText().trim()
            //    $scope.newParentQuestion.userName = $scope.loginUser.name; 
            var parameters = $scope.newParentQuestion;
            parameters["no_of_questions"] = $scope.childQuestionList.length
            var deferred = $q.defer();
            var transform = function (data) {
                return $.param(data);
            };

            if ($scope.error_msg.length == 0) {
                $http.post('/api/save_csq_parent_in_admin', parameters).then(function (response) {
                    var savedParentQuestion = response.data.obj;

                    var childqstpid = window.localStorage.getItem("childqstpid");
                    $scope.newParentQuestion.qb_pk = savedParentQuestion.qb_pk;
                    //  $scope.newParentQuestion.qbId = savedParentQuestion.qb_id;
                    $scope.newParentQuestion.qbId = childqstpid;
                    return $http.post('/api/add_child_question', $scope.newParentQuestion).then(function (res) {
                        // $scope.updateChildCount();
                        var mark = 0
                        for (var i = 0; i < $scope.childQuestionList.length; i++) {
                            mark += parseFloat($scope.childQuestionList[i].marks)
                        }
                        var params = {
                            exam_fk: $scope.newParentQuestion.exam_fk,
                            exampaper_fk: $scope.newParentQuestion.exampaper_fk,
                            qba_topic_master: { qba_topic_pk: $scope.newParentQuestion.topicId },
                            qst_marks: mark,
                            no_of_question: $scope.childQuestionList.length
                        }
                        $http.post('/api/replace_update_case_summary', params).then(function (response) { })
                        swal("New Question with QBID " + response.data.qb_id + " has been added");
                        $state.go('examPaperAdmin');
                        window.localStorage.removeItem("selected_module_id")
                        repositoryService.deleteChildQuestionList()
                        repositoryService.deleteParentQuestion()

                    });
                });
            }
            else {
                return false
            }
        };








        $scope.updateChildCount = function () {

            var data = $scope.newParentQuestion;
            $http.post('/api/update_child_count_Admin', data)
                .then(function (response) {

                });
        };


        $scope.getTopicList = function (isOnLoad) {

            var moduleId = $scope.selectedModule == null ? 0 : $scope.selectedModule;
            var parameters = { id: moduleId };
            window.localStorage.setItem("selected_module_id", moduleId);
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
                    //  var topic = repositoryService.getSelectedTopic();
                    var topic = window.localStorage.getItem("topic_code")
                    for (var i = 0; i < $scope.topicList.length; i++) {
                        if ($scope.topicList[i].qba_topic_code == topic) {
                            $scope.selectedTopic = $scope.topicList[i].qba_topic_pk
                        }
                    }
                }
                deferred.resolve(response);
            }).catch(function (error) {
                deferred.reject(error);
            });
        };

        $scope.getTopicname = function (isOnLoad) {

            var topicId = $scope.selectedTopic == null ? 0 : $scope.selectedTopic;
            window.localStorage.setItem("selected_topic_id", topicId);
        };


        $scope.setParentQuestionData = function () {
            $scope.newParentQuestion.courseId = $scope.course_id;
            $scope.newParentQuestion.subjectId = $scope.subject_id;
            $scope.module_id = window.localStorage.getItem("selected_module_id");
            $scope.newParentQuestion.moduleId = $scope.module_id;
            // window.localStorage.setItem("moduleID",$scope.newParentQuestion.moduleId);
            $scope.topicId = window.localStorage.getItem("selected_topic_id");
            $scope.newParentQuestion.topicId = $scope.topicId;

            //  window.localStorage.setItem("topicunit",$scope.newParentQuestion.topicId);
            $scope.newParentQuestion.question = CKEDITOR.instances["editor1"].getData();
            var str = CKEDITOR.instances["editor1"].document.getBody().getText().trim()
            $scope.newParentQuestion.userName = $scope.username;
            // if($scope.loginUser.role == 'VET' || $scope.loginUser.role == 'PUB' ){
            //     var parentShortfallRecord = repositoryService.getAddShortFallQuestion();  
            //     $scope.newParentQuestion.qb_pk = parentShortfallRecord.qb_pk; 
            //     $scope.newParentQuestion.qbId = parentShortfallRecord.qb_id;
            //     $scope.newParentQuestion.exam_fk = parentShortfallRecord.exam_fk;
            //     $scope.newParentQuestion.exampaper_fk = parentShortfallRecord.exampaper_fk;
            // }     
        };

        $scope.saveCSQParent1 = function () {
            if ($scope.loginUser.role == 'VET' || $scope.loginUser.role == 'PUB') {
                $scope.saveCSQParentShortfall();
            }
            $scope.error_msg = [];
            var validateQuestionBody = CKEDITOR.instances["editor1"].getData();
            var str = CKEDITOR.instances["editor1"].document.getBody().getText().trim()



            if ($scope.selectedModule == null || $scope.selectedModule == '' || $scope.selectedModule == undefined) {
                $scope.error_msg.push("Please select module.");

            }
            if ($scope.selectedTopic == null || $scope.selectedTopic == '' || $scope.selectedTopic == undefined) {
                $scope.error_msg.push("Please select topic.");

            }

            if (validateQuestionBody == null || validateQuestionBody == '' || validateQuestionBody == undefined || str == '') {
                $scope.error_msg.push("Please enter passage.");
            }

            $scope.setParentQuestionData();
            var parameters = $scope.newParentQuestion;
            var deferred = $q.defer();
            var transform = function (data) {
                return $.param(data);
            };

            if ($scope.error_msg.length > 0) {
                $("html, body").animate({ scrollTop: 0 }, "fast");
            }
            else {
                alert("save_csq_parent");
                $http.post('/api/save_csq_parent', parameters, {
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
                    transformRequest: transform,
                    timeout: 0
                }).then(function (response) {
                    var savedParentQuestion = response.data.obj;
                    $scope.newParentQuestion.qb_pk = savedParentQuestion.qb_pk;
                    $scope.newParentQuestion.qbId = savedParentQuestion.qb_id;

                    //alert('Data Saved Successfully.');
                    deferred.resolve(response);
                }).catch(function (error) {
                    deferred.reject(error);
                });
                $('#showModal').click();
            }
            // }
            /*  else{
                 if($scope.loginUser.role == 'ADM'){
             	
                     $scope.error_msg=[];
                     $scope.newCaseQuestion.qst_body = CKEDITOR.instances["editor1"].getData();
                     var str = CKEDITOR.instances["editor1"].document.getBody().getText().trim();
     
                     if($scope.newCaseQuestion.qst_body == null || $scope.newCaseQuestion.qst_body == '' || 
                         $scope.newCaseQuestion.qst_body == undefined || str == '') {
                         $scope.error_msg.push("Passage Cannot be blank");
                     }else{
                     alert("update_case_parent");
                         var params = $scope.newCaseQuestion;
                         $http.post('/api/update_case_parent',params).then(function(response){
                         });
                         //swal('Data saved Successfully');
                         $state.go('qp_repository');
                          $('.modal-backdrop').remove();
                          $('body').removeClass('modal-open');
                      }
                 }
             } */
        };

        $scope.saveCSQParentShortfall = function () {
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
            $scope.newParentQuestion.topicId = parentShortfallRecord.qba_topic_fk;
            $scope.newParentQuestion.module_fk = $scope.selectedModule == null ? 0 : $scope.selectedModule;

            if ($scope.error_msg.length > 0) {
                $("html, body").animate({ scrollTop: 0 }, "fast");
            } else {
                $http.post('/api/save_csq_parent_shortfall', $scope.newParentQuestion)
                    .then(function (response) {
                        $('#showModal').click();
                    });

            }

        };


        //     $scope.moduleID = window.localStorage.getItem("selected_module_id");
        //     var reqdata = {
        //         moduleID : $scope.moduleID
        //         };
        //     $http.post('/api/get_module_name_casechild',reqdata).then(function(response){
        //     $scope.module_name = response.data.obj[0].module_name; 
        //     window.localStorage.setItem("module_name",$scope.module_name)

        //             });


        //             $scope.topicunit = window.localStorage.getItem("selected_topic_id");
        //     var reqdatas = {
        //         topicunit : $scope.topicunit
        //         };
        //     $http.post('/api/get_topic_name_casechild',reqdatas).then(function(response){
        //     $scope.topic_name = response.data.obj[0].topic_name; 
        //     $scope.topic_code = response.data.obj[0].qba_topic_code; 
        //    window.localStorage.setItem("topic_name",$scope.topic_name);
        //    window.localStorage.setItem("topic_code",$scope.topic_code);

        //             });

        $scope.prepareAddChildQuestionData = function () {

            $scope.setParentQuestionData();
            $scope.newParentQuestion.question = CKEDITOR.instances["editor1"].getData();
            var str = CKEDITOR.instances["editor1"].document.getBody().getText().trim()
            if ($scope.newParentQuestion.question == '' || str == '') {
                alert('Passage can not be blank.');
                return;
            }
            if ($scope.selectedModule == '' || $scope.selectedModule == undefined || $scope.selectedModule == null) {
                alert('Please select a module.');
                return;
            }
            if ($scope.selectedTopic == '' || $scope.selectedTopic == undefined || $scope.selectedTopic == null) {
                alert('Please select a module.');
                return;
            }
            window.localStorage.setItem("csq_passage_data", $scope.newParentQuestion.question)
            repositoryService.setParentQuestion($scope.newParentQuestion);
            // window.localStorage.setItem("selected_topic_id",$scope.newParentQuestion.topicId);
            window.localStorage.setItem("selected_course_id", $scope.newParentQuestion.courseId);
            window.localStorage.setItem("selected_subject_id", $scope.newParentQuestion.subjectId);
            var selected_module_id = window.localStorage.getItem("selected_module_id");
            var selected_topic_id = window.localStorage.getItem("selected_topic_id");

            $state.go('addcsq_child_admin');
        };

        //window.localStorage.setItem("selected_module_id",$scope.newParentQuestion.moduleId);



        $scope.course_id = window.localStorage.getItem("selected_subject_id");

        var req = {
            subject_id: $scope.subject_id
        };
        $http.post('/api/get_subject_name', req).then(function (response) {
            $scope.subjectcode = response.data.obj[0].qba_subject_code;
        });

        $scope.moduleid = window.localStorage.getItem("selected_module_id");
        var reqdata = {
            moduleId: $scope.moduleid
        };
        $http.post('/api/get_module_name', reqdata).then(function (response) {
            $scope.moduleIds = response.data.obj[0].qba_subject_code;

        });




        $scope.clearData = function () {
            var blankQuestion = {};
            var blankChildList = [];
            repositoryService.setParentQuestion(blankQuestion);
            repositoryService.setChildQuestionList(blankChildList);
        };
        $scope.goBack = function () {
            if ($scope.childQuestionList.length > 0) {
                alert("Please save the case before redirection")
            }
            else {
                $scope.clearData()
                $state.go('examPaperAdmin')
            }
        }

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
                if (isOnLoad == 'Y') {
                    var mod = window.localStorage.getItem("selected_module_id");
                    //  var module = repositoryService.getSelectedModule();
                    /*  if(module != null && module.module_name == 'ALL'){
                          var topic = repositoryService.getSelectedTopic();
                          if(topic != null && topic.qba_module_fk != null)
                              $scope.selectedModule = topic.qba_module_fk;
                      } else { 
                          $scope.selectedModule = module.qba_module_pk;
                      }
                  */
                    for (var i = 0; i < $scope.moduleIds.length; i++) {
                        if ($scope.moduleIds[i].qba_module_pk == mod) {
                            $scope.selectedModule = $scope.moduleIds[i].qba_module_pk
                        }
                    }
                }
                $scope.getTopicList('Y');
                deferred.resolve(response);
            }).catch(function (error) {
                deferred.reject(error);
            });
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
                //  $scope.getTopicList('Y');
                deferred.resolve(response);
            }).catch(function (error) {
                deferred.reject(error);
            });

            $scope.moduleid = window.localStorage.getItem("module_fk_for_mcq");
            var reqdata = {
                moduleId: $scope.moduleid
            };
            $http.post('/api/get_module_name', reqdata).then(function (response) {
                $scope.moduleIds = response.data.obj;
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
        .controller('addCSQParentAdminController', addCSQParentAdminController);

    addCSQParentAdminController.$inject = ['$scope', '$state', '$filter', '$window', 'userService', 'repositoryService',
        '$sce', '$http', '$q'];

})();