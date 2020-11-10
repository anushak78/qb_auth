(function () {
    'use strict';

    function addCSQParentController($scope, $state, $filter, $window, userService, repositoryService, $sce, $http, $q) {

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

        $scope.role = JSON.parse(window.localStorage.getItem("role"));
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
                    if (topic)
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
            $scope.newParentQuestion.question = CKEDITOR.instances["editor1"].getData();
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


        $scope.addquestion_ccode = window.localStorage.getItem("addquestion_ccode");
        $scope.addquestion_cname = window.localStorage.getItem("addquestion_cname");
        $scope.addquestion_cfk = window.localStorage.getItem("addquestion_cfk");
        $scope.addquestion_scode = window.localStorage.getItem("addquestion_scode");
        $scope.addquestion_sname = window.localStorage.getItem("addquestion_sname");
        $scope.addquestion_sfk = window.localStorage.getItem("addquestion_sfk");
        $scope.addquestion_mname = window.localStorage.getItem("addquestion_mname");
        $scope.addquestion_mfk = window.localStorage.getItem("addquestion_mfk");
        $scope.addquestion_tcode = window.localStorage.getItem("addquestion_tcode");
        $scope.addquestion_tname = window.localStorage.getItem("addquestion_tname");
        $scope.addquestion_tfk = window.localStorage.getItem("addquestion_tfk");

        $scope.saveCSQParent = function () {
            if ($scope.loginUser.role == 'VET' || $scope.loginUser.role == 'PUB') {
                $scope.saveCSQParentShortfall();
            } //else if($scope.newParentQuestion.qbId == 0) { 
            else {

                $scope.error_msg = [];
                var validateQuestionBody = CKEDITOR.instances["editor1"].getData();
                var str = CKEDITOR.instances["editor1"].getData().replace(/&#160;/g, '')

                if ($scope.selectedCourse == null || $scope.selectedCourse == '' || $scope.selectedCourse == undefined) {
                    $scope.error_msg.push("Please select course.");

                }
                if ($scope.selectedSubject == null || $scope.selectedSubject == '' || $scope.selectedSubject == undefined) {
                    $scope.error_msg.push("Please select subject.");

                }
                if ($scope.selectedModule == null || $scope.selectedModule == '' || $scope.selectedModule == undefined) {
                    $scope.error_msg.push("Please select module.");

                }
                if ($scope.selectedTopic == null || $scope.selectedTopic == '' || $scope.selectedTopic == undefined || isNaN($scope.selectedTopic)) {
                    $scope.error_msg.push("Please select topic.");

                }

                if (validateQuestionBody == null || validateQuestionBody == '' || validateQuestionBody == undefined || str == '') {
                    $scope.error_msg.push("Please enter passage.");
                }
                if ($scope.adminCaseEditFlag) {
                    $scope.newParentQuestion = $scope.newCaseQuestion
                    $scope.newParentQuestion.qst_body = validateQuestionBody
                    var params = $scope.newParentQuestion;
                    $http.post('/api/update_case_parent', params).then(function (response) {
                    });
                    swal("QBID " + $scope.newCaseQuestion.qb_id + " saved Successfully");
                    $state.go('qp_repository');
                }
                if ($scope.childQuestionList.length < 2) {
                    $scope.error_msg.push("Please enter 2 or more child questions.");
                }

                $scope.setParentQuestionData();
                var parameters = $scope.newParentQuestion;
                var deferred = $q.defer();
                var transform = function (data) {
                    return $.param(data);
                };
            }
            if ($scope.error_msg.length > 0) {
                $("html, body").animate({ scrollTop: 0 }, "fast");
            }
            else {
                /* $http.post('/api/save_csq_parent',parameters, {
                     headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
                     transformRequest: transform,
                     timeout: 0
                 }).then(function (response) {
                     var savedParentQuestion = response.data.obj;
                     $scope.newParentQuestion.qb_pk = savedParentQuestion.qb_pk;
                     $scope.newParentQuestion.qbId = savedParentQuestion.qb_id;
                     alert('Data Saved Successfully.');
                     deferred.resolve(response);
                 }).catch(function (error) {
                     deferred.reject(error);
                 });*/
                alert("QBID " + repositoryService.getParentQuestion().qbId + " Saved Successfully.");
                $scope.clearData()
                //$('#showModal').click();
                $state.go('qp_repository');
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
        $scope.goBack = function () {
            if ($scope.childQuestionList.length > 0) {
                alert("Please save the Case before redirection")
            }
            else {
                $state.go('qp_repository')
            }
        }

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
            $scope.newParentQuestion.module_fk = $scope.addquestion_mfk;

            if ($scope.error_msg.length > 0) {
                $("html, body").animate({ scrollTop: 0 }, "fast");
            } else {
                $http.post('/api/save_csq_parent_shortfall', $scope.newParentQuestion)
                    .then(function (response) {
                        alert(" Data Saved Successfully.")
                        $state.go('vetterReviewQuestion');
                        //  $('#showModal').click();
                    });

            }

        };


        $scope.savereplacementalldata = function () {

            $scope.newParentQuestion.qbId == 0
            $scope.error_msg = [];
            var validateQuestionBody = CKEDITOR.instances["editor1"].getData();
            var str = CKEDITOR.instances["editor1"].document.getBody().getText().trim()



            if (validateQuestionBody == null || validateQuestionBody == '' || validateQuestionBody == undefined || str == '') {
                $scope.error_msg.push("Please enter passage.");
            }

            // $scope.setParentQuestionData();

            $scope.course_id = window.localStorage.getItem("course_id_vetter_csq");
            $scope.subject_id = window.localStorage.getItem("subject_id_vetter_csq");
            $scope.topic_id = window.localStorage.getItem("topic_id_vetter_csq");
            $scope.exampaper_fk = window.localStorage.getItem("exampaper_pk");
            $scope.exam_fk = window.localStorage.getItem("exam_id");


            $scope.newParentQuestion.courseId = $scope.course_id;
            $scope.newParentQuestion.subjectId = $scope.subject_id;
            $scope.newParentQuestion.moduleId = $scope.module_id;
            $scope.newParentQuestion.topicId = $scope.topic_id;
            $scope.newParentQuestion.exampaper_fk = $scope.exampaper_fk;
            $scope.newParentQuestion.exam_fk = $scope.exam_fk;
            $scope.newParentQuestion.question = CKEDITOR.instances["editor1"].getData();
            var replacedby = window.localStorage.getItem("mqb_id");

            $scope.newParentQuestion.remark = "Replacement of QB ID  " + replacedby;
            $scope.newParentQuestion.old_qb_id = replacedby;
            $scope.newParentQuestion.userName = $scope.username;
            //    var str = CKEDITOR.instances["editor1"].document.getBody().getText().trim()
            //    $scope.newParentQuestion.userName = $scope.loginUser.name; 
            var parameters = $scope.newParentQuestion;
            var deferred = $q.defer();
            var transform = function (data) {
                return $.param(data);
            };




            // $http.post('/api/save_csq_parent_in_vetter',parameters, {
            //     headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
            //     transformRequest: transform,
            //     timeout: 0
            // }).then(function (response) {
            //     var savedParentQuestion = response.data.obj;
            //     $scope.newParentQuestion.qb_pk = savedParentQuestion.qb_pk;
            //     $scope.newParentQuestion.qbId = savedParentQuestion.qb_id;
            //     //alert('Data Saved Successfully.');
            //     deferred.resolve(response);
            // }).catch(function (error) {
            //     deferred.reject(error);
            // }); 

            $http.post('/api/save_csq_parent_in_vetter', parameters).then(function (response) {
                var savedParentQuestion = response.data.obj;

                $scope.newParentQuestion.qb_pk = savedParentQuestion.qb_pk;
                $scope.newParentQuestion.qbId = savedParentQuestion.qb_id;

                return $http.post('/api/add_child_question_vetter', savedParentQuestion).then(function (response) {
                    var qb_id = window.localStorage.getItem("mqb_id");
                    var reqQbPk = window.localStorage.getItem("mqb_pk");
                    var updateCulledTable = {
                        exam_fk: $scope.exam_fk,
                        exampaper_fk: $scope.exampaper_fk,
                        qb_pk: reqQbPk,
                        qb_id: replacedby,
                        //qst_request_status:
                        //qst_request_status:'Approved',
                        qst_request_remarks: "Question Replaced by QB ID " + $scope.newParentQuestion.qbId,
                        qst_request_status: 'null',
                        // qb_id : qb_id,
                    };
                    alert("New Question has been added");
                    $state.go('vetterReviewQuestion');
                    //return $http.post('/api/update_culled_table_for_replaced_qstremarks_vetter',updateCulledTable).then(function(response){
                    // //                 // if(response.data.message == "success"){
                    // //                 //     $scope.populateQuestions(topicParams);
                    // //                 //     swal("New Question has been added!");
                    // //                 //     return $http.post('/api/save_replace_qstn_history',replaceQstDetails).then(function(response){
                    // //                 //         if(response.data.message == "success"){  
                    // //                 //             $scope.loadReplacedQuestionHistory();
                    // //                 //             $scope.getListofVetterRequestbyUser(); 
                    // //                 //             $scope.culledQstnRequestApprovedStatus();
                    // //                 //         //alert("New Question has been added!");
                    // //                 //     }
                    // //                 // });
                    // //     

                    //   });
                });

            });


        };


        // $scope.prepareAddChildQuestionData = function(){

        //     repositoryService.setSelectedCourse(course);
        //     repositoryService.setSelectedSubject(subject);
        //     repositoryService.setSelectedModule(module);
        //     repositoryService.setSelectedTopic(topic);

        //     $scope.setParentQuestionData();
        //     $scope.newParentQuestion.question = CKEDITOR.instances["editor1"].getData();
        //     var str = CKEDITOR.instances["editor1"].document.getBody().getText().trim()
        //     if($scope.newParentQuestion.question == '' || str == ''){
        //         alert('Passage can not be blank.');
        //         return;
        //     }
        //     repositoryService.setParentQuestion($scope.newParentQuestion);
        //     window.localStorage.setItem("c_id_qstn",$scope.newParentQuestion.courseId);
        //     window.localStorage.setItem("m_id_qstn",$scope.newParentQuestion.moduleId);
        //     window.localStorage.setItem("s_id_qstn",$scope.newParentQuestion.subjectId);
        //     window.localStorage.setItem("t_id_qstn",$scope.newParentQuestion.topicId);
        //     $state.go('addcsq_child');
        // };

        $scope.prepareAddChildQuestionData = function () {
            $scope.error_msg = []
            var validateQuestionBody = CKEDITOR.instances["editor1"].getData();
            if ($scope.selectedCourse == null || $scope.selectedCourse == '' || $scope.selectedCourse == undefined) {
                $scope.error_msg.push("Please select course.");
                return

            }
            if ($scope.selectedSubject == null || $scope.selectedSubject == '' || $scope.selectedSubject == undefined) {
                $scope.error_msg.push("Please select subject.");
                return

            }
            if ($scope.selectedModule == null || $scope.selectedModule == '' || $scope.selectedModule == undefined) {
                $scope.error_msg.push("Please select module.");
                return

            }
            if ($scope.selectedTopic == null || $scope.selectedTopic == '' || $scope.selectedTopic == undefined || isNaN($scope.selectedTopic)) {
                $scope.error_msg.push("Please select topic.");
                return

            }

            if (validateQuestionBody == null || validateQuestionBody == '' || validateQuestionBody == undefined || str == '') {
                $scope.error_msg.push("Please enter passage.");
            }

            var course = ($filter('filter')($scope.courseList, { qba_course_pk: $scope.selectedCourse })[0]);
            var subject = ($filter('filter')($scope.subjectList, { qba_subject_pk: $scope.selectedSubject })[0]);
            var module = ($filter('filter')($scope.moduleList, { qba_module_pk: $scope.selectedModule })[0]);
            var topic = ($filter('filter')($scope.topicList, { qba_topic_pk: $scope.selectedTopic })[0]);
            window.localStorage.setItem("qba_course_code", course.qba_course_code);
            window.localStorage.setItem("qba_course_name", course.qba_course_name);
            window.localStorage.setItem("qba_module_name", module.module_name);
            window.localStorage.setItem("qba_course_pk", course.qba_course_pk);
            window.localStorage.setItem("qba_module_pk", module.qba_module_pk);
            repositoryService.setSelectedCourse(course);
            repositoryService.setSelectedSubject(subject);
            repositoryService.setSelectedModule(module);
            repositoryService.setSelectedTopic(topic);

            $scope.setParentQuestionData();
            $scope.newParentQuestion.question = CKEDITOR.instances["editor1"].getData().replace(/&#160;/g, '');
            var str = CKEDITOR.instances["editor1"].getData().replace(/&#160;/g, '')
            if ($scope.newParentQuestion.question == '' || str == '') {
                alert('Passage can not be blank.');
                return;
            }

            repositoryService.setParentQuestion($scope.newParentQuestion);
            $state.go('addcsq_child');
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
        .controller('addCSQParentController', addCSQParentController);

    addCSQParentController.$inject = ['$scope', '$state', '$filter', '$window', 'userService', 'repositoryService',
        '$sce', '$http', '$q'];

})();