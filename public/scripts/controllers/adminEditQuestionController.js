(function () {
    'use strict';
    function adminEditQuestionController($scope, $state, $stateParams, $filter, $window, userService, repositoryService, $http, $q, $timeout) {

        $scope.selectedCourse = {};
        $scope.selectedSubject = {};
        $scope.selectedTopic = {};
        $scope.editquestion = {};
        $scope.error_msg = [];
        $scope.editquestion.alternatives = [];
        /* GET THE EDIT DATA FROM DATABASE TO SET TO THE FRONTEND FIELDS */
        $scope.adminEditQuestion = repositoryService.geteditAdminQuestion();
        $scope.editquestion.marks = parseFloat($scope.adminEditQuestion.qst_marks);
        $scope.editquestion.negativeMarks = parseFloat($scope.adminEditQuestion.qst_neg_marks);
        $scope.editquestion.remark = $scope.adminEditQuestion.qst_remarks;
        $scope.editquestion.calculations = $scope.adminEditQuestion.calculation_info;
        $scope.editquestion.reference = $scope.adminEditQuestion.reference_info;
        $scope.selectedOption;
        $scope.ckEditAlternatives = [];
        $scope.editorStates = {};
        /* GET THE EDIT DATA FROM DATABASE TO SET TO THE FRONTEND FIELDS */

        $scope.loginUser = userService.getUserData();
        $scope.username = JSON.parse(sessionStorage.getItem('username'));  // Dipika HSS//
        $scope.setRightAlternative = function () {
            for (var i = 0; i < $scope.adminEditQuestion.qstn_alternatives.length; i++) {
                if ($scope.adminEditQuestion.qstn_alternatives[i].qta_is_corr_alt == "Y") {
                    $scope.selectedOption = i;
                }
            }
        };
        $scope.changeSelectedOption = function (value) {
            $scope.selectedOption = value;
        };

        //Setting the Options as per the question alternatives received from repo
        $scope.setInitOption = function () {
            var editorId = 1;
            var arr_newEditorIds = [];
            var count = $scope.adminEditQuestion.qstn_alternatives.length;
            for (var i = 0; i < count; i++) {
                var newEditorId = editorId + 1 + i;
                arr_newEditorIds.push('editor' + newEditorId);
                $scope.ckEditAlternatives.push({ editorId: newEditorId, text: '', isCorrect: 'N' });
            }
            $scope.setRightAlternative();
        };
        $scope.setInitOption();
        $scope.editQuestion = function () {
            $scope.error_msg = [];
            $scope.editquestion.question = CKEDITOR.instances["editor1"].getData().replace(/&#160;/g, '');
            var str = CKEDITOR.instances["editor1"].document.getBody().getText().trim();
            if ($scope.editquestion.question == null || $scope.editquestion.question == '' || str == '') {
                $scope.error_msg.push("Question cannot be blank");
            }
            if ($scope.adminEditQuestion.qst_type == 'CS' && $scope.adminEditQuestion.qst_pid != '0') {
                if (($scope.editquestion.marks != 0.5 && $scope.editquestion.marks != 1 && $scope.editquestion.marks != 2) || $scope.editquestion.marks == undefined || $scope.editquestion.marks == null || isNaN($scope.editquestion.marks) == true) {
                    $scope.error_msg.push("Please enter marks as 0.5, 1 or 2");
                }
            }

            if (typeof $scope.editquestion.negativeMarks == "undefined") {
                $scope.error_msg.push("Please enter negative marks as multiple of 0.5")
            }

            $scope.editquestion.remark = CKEDITOR.instances["editorRemarks"].getData().replace(/&#160;/g, '');
            $scope.editquestion.calculations = CKEDITOR.instances["editorCalculations"].getData().replace(/&#160;/g, '');
            $scope.editquestion.reference = CKEDITOR.instances["editorReference"].getData().replace(/&#160;/g, '');
            $scope.editquestion.numOfAlternatives = $scope.ckEditAlternatives.length;
            var correctAns = $scope.selectedOption;
            var atleastOneCorrectAns = 0;
            var noBlankValues = 0;
            for (var i = 1; i <= $scope.editquestion.numOfAlternatives; i++) {
                var editorId = "editor" + (i + 1);
                var option = new Object();
                option.text = CKEDITOR.instances[editorId].getData().replace(/&#160;/g, '');
                option.text = option.text.replace(/&nbsp;/g, " ").trim();
                var opInd = i - 1;
                option.isCorrect = correctAns == opInd ? 'Y' : 'N';
                if (option.isCorrect == 'Y') {
                    atleastOneCorrectAns = 1;
                }
                if (option.text == "") {
                    noBlankValues = 1;
                }

                $scope.editquestion.alternatives.push(option);
            }

            if ($scope.adminEditQuestion.qst_type == 'CS' && $scope.adminEditQuestion.qst_pid != '0') {
                if (atleastOneCorrectAns == 0) {
                    alert("At least one correct option required");
                    $scope.editquestion.alternatives = [];
                    return false;
                }
            }

            if (noBlankValues == 1) {
                $scope.error_msg.push("alternatives cannot be blank");
            }
            $scope.editquestion.selectedCourse = $scope.selectedCourse;
            $scope.editquestion.selectedSubject = $scope.selectedSubject;
            $scope.editquestion.selectedTopic = $scope.selectedTopic;
            $scope.editquestion.selectedOption = $scope.selectedOption;
            $scope.editquestion.selectedModule = $scope.selectedModule;
            $scope.editquestion.userName = $scope.username;
            $scope.editquestion.qb_pk = $scope.adminEditQuestion.qb_pk;
            $scope.editquestion.qb_id = $scope.adminEditQuestion.qb_id;
            if ($scope.adminEditQuestion.exampaper_fk != undefined) {
                $scope.editquestion.exampaper_fk = $scope.adminEditQuestion.exampaper_fk
                $scope.editquestion.exam_fk = $scope.adminEditQuestion.exam_fk
            }
            else {
                $scope.editquestion.exampaper_fk = ''
            }
            if ($scope.error_msg.length > 0) {
                $("html, body").animate({ scrollTop: 0 }, "fast");
            }
            else {
                $http.post('/api/edit_mcq', $scope.editquestion)
                    .then(function (response) {
                        //$scope.clearQuestionData();
                        if ($scope.adminEditQuestion.exampaper_fk == undefined) {
                            var topic = repositoryService.getPopulatedQuestions();
                            var topic = repositoryService.getPopulatedQuestions();
                            var topic = repositoryService.getPopulatedQuestions();
                            var topic = repositoryService.getPopulatedQuestions();
                            var topic = repositoryService.getPopulatedQuestions();
                            var topic = repositoryService.getPopulatedQuestions();
                            var topic = repositoryService.getPopulatedQuestions();
                            var topic = repositoryService.getPopulatedQuestions();
                            var topic = repositoryService.getPopulatedQuestions();
                            repositoryService.setPopulatedQuestions(topic);
                            //   $( "#openConfirmationId" ).trigger( "click" ); 
                            swal("QBID " + $scope.adminEditQuestion.qb_id + " is saved successfully")
                            $state.go('qp_repository');
                        }
                        else {
                            swal("QBID " + $scope.adminEditQuestion.qb_id + " is saved successfully")
                            $state.go('examPaperAdmin');
                        }
                    });
            }
        };

        $scope.afterEditSave = function () {
            /* $timeout( function(){  
                 $( "#back" ).trigger( "click" );         
             },1000);*/
            if ($scope.adminEditQuestion.exampaper_fk == undefined) {
                $state.go("qp_repository")
            }
            else {
                $state.go("examPaperAdmin")
            }
        };

        $scope.loadEditor = function (id, focus) {

            if (id == "editor1") {
                var editor = CKEDITOR.replace(id, {
                    height: "80",
                    filebrowserBrowseUrl: '../ckeditor/ckeditor4.5/plugins/filemanager/browser/default/browser.html?Connector=/browser/browse',
                    filebrowserImageUploadUrl: '/uploader/upload?Type=Image',
                    customConfig: "../ckeditor-addMcq-conf.js"
                });
            } else if (id == "editorRemarks" || id == "editorReference" || id == "editorCalculations") {
                var editor = CKEDITOR.replace(id, {
                    height: "80",
                    filebrowserBrowseUrl: '../ckeditor/ckeditor4.5/plugins/filemanager/browser/default/browser.html?Connector=/browser/browse',
                    filebrowserImageUploadUrl: '/uploader/upload?Type=Image',
                    customConfig: "../" + $scope.ckEditorConfigFile
                });
            }
            else {
                var editor = CKEDITOR.inline(id, {
                    height: "400",
                    filebrowserBrowseUrl: '../ckeditor/ckeditor4.5/plugins/filemanager/browser/default/browser.html?Connector=/browser/browse',
                    filebrowserImageUploadUrl: '/uploader/upload?Type=Image',
                    removePlugins: 'floatingspace,maximize,resize,specialchar',
                    customConfig: "../ckeditor-addMcq-conf.js",
                    sharedSpaces: {
                        top: 'top',
                        bottom: 'bottom'
                    }
                });
            }

            $scope.editorStates[id] = new EditorState(editor);
        };


        // $scope.addOrRemoveOptions = function() {
        //     var count = 0;
        //     if($scope.numOfOptions.value > $scope.newQuestion.alternatives.length) {
        //         count = $scope.numOfOptions.value - $scope.newQuestion.alternatives.length;
        //         $scope.addOptions(count,$scope.newQuestion.alternatives.length);
        //     } else {
        //         count = $scope.newQuestion.alternatives.length - $scope.numOfOptions.value;
        //         $scope.removeOptions($scope.numOfOptions.value,count);
        //     }
        // };

        // $scope.addOptions = function(count,numOfAlt) {
        //     var editorId = $scope.newQuestion.alternatives[numOfAlt - 1].editorId;
        //     var arr_newEditorIds = [];
        //     for(var i = 0; i < count ; i++) {
        //         var newEditorId = editorId + 1 + i;
        //         arr_newEditorIds.push('editor'+newEditorId);
        //         $scope.newQuestion.alternatives.push({editorId:newEditorId,text:'',isCorrect:'N'});
        //     }
        //     $timeout( function(){  
        //         for(var j = 0; j < arr_newEditorIds.length;j++)
        //             $scope.loadEditor(arr_newEditorIds[j], true);
        //     },50);
        // };

        // $scope.removeOptions = function(start,count) {
        //     $scope.newQuestion.alternatives.splice(start,count);
        // };

        function EditorState(editor) {
            this.editor = editor;
            this.checkedUsers = {};
        }

        /* End Dynamic Multiple Options  */

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
                if (isOnload == 'Y') {
                    var subject = $scope.adminEditQuestion.qba_subject_master.subject_name//repositoryService.getSelectedSubject();
                    // $scope.selectedSubject = subject.subject_name;
                    for (var i = 0; i < $scope.subjectList.length; i++) {
                        if (subject == $scope.subjectList[i].subject_name) {
                            subject = $scope.subjectList[i].qba_subject_pk
                            break;
                        }
                    }
                    $scope.selectedSubject = subject
                    $scope.getModuleList('Y');
                }
                deferred.resolve(response);
            }).catch(function (error) {
                deferred.reject(error);
            });
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
                    //var module = repositoryService.getSelectedModule();
                    var module = $scope.adminEditQuestion.qba_module_mstr.module_name;
                    for (var i = 0; i < $scope.moduleList.length; i++) {
                        if ($scope.moduleList[i].module_name == module) {
                            $scope.selectedModule = $scope.moduleList[i].qba_module_pk
                            $scope.getTopicList('Y')
                        }
                    }
                    /*if(module != null && module.module_name == 'ALL'){
                        var topic = repositoryService.getSelectedTopic();
                        if(topic != null && topic.qba_module_fk != null)
                            $scope.selectedModule = topic.qba_module_fk;
                    } else { 
                        $scope.selectedModule = module.qba_module_pk;
                    } */
                }
                deferred.resolve(response);
            }).catch(function (error) {
                deferred.reject(error);
            });
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
                    // var topic = repositoryService.getSelectedTopic();
                    var topic = $scope.adminEditQuestion.qba_topic_master.qba_topic_code;
                    for (var i = 0; i < $scope.topicList.length; i++) {
                        if ($scope.topicList[i].qba_topic_code == topic) {
                            $scope.selectedTopic = $scope.topicList[i].qba_topic_pk
                        }
                    }
                    //$scope.selectedTopic = topic.qba_topic_pk;
                }
                deferred.resolve(response);
            }).catch(function (error) {
                deferred.reject(error);
            });
        };

        $scope.removeAlternatives = function (id) {
            $scope.removalAlternativeIndex = id;
            if ($scope.ckEditAlternatives.length == 2) {
                $scope.messageBox = "Options Can not be less than 2";
                $("#openMessageBox").trigger("click");
            } else {
                var indexToRemove = id - 2;
                $scope.ckEditAlternatives.splice(indexToRemove, 1);
            }
            if ($scope.selectedOption == indexToRemove) {
                $scope.selectedOption = "nans";
            }

        }

        $scope.addAlternatives = function () {
            if ($scope.ckEditAlternatives.length == 9) {
                $scope.messageBox = "Options Can not be more than 9";
                $("#openMessageBox").trigger("click");
            } else {
                var lastIndex = $scope.ckEditAlternatives.length - 1;
                var lastEditorId = $scope.ckEditAlternatives[lastIndex].editorId;
                var newEditorId = lastEditorId + 1;
                $scope.ckEditAlternatives.push({ editorId: newEditorId, text: '', isCorrect: 'N' });
                $timeout(function () {
                    $scope.loadEditor('editor' + newEditorId, true);
                }, 50);
            }
        };


        angular.element(document).ready(function () {
            var deferred = $q.defer();

            $http.post('/api/load_qbrepo_courses', {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' }
            }).then(function (response) {
                $scope.courseList = response.data.obj;
                var course = $scope.adminEditQuestion.qba_course_master.qba_course_name
                for (var i = 0; i < $scope.courseList.length; i++) {
                    if (course == $scope.courseList[i].qba_course_name) {
                        course = $scope.courseList[i].qba_course_pk
                        break;
                    }
                }
                $scope.selectedCourse = course
                $scope.getSubjectList('Y');
                deferred.resolve(response);
            }).catch(function (error) {
                deferred.reject(error);
            });

            $scope.loadEditor('editor1', true);
            $scope.loadEditor('editorRemarks', true);
            $scope.loadEditor('editorReference', true);
            $scope.loadEditor('editorCalculations', true);
            CKEDITOR.instances["editor1"].setData($scope.adminEditQuestion.qst_body);
            CKEDITOR.instances["editorRemarks"].setData($scope.editquestion.remark);
            CKEDITOR.instances["editorReference"].setData($scope.editquestion.reference);
            CKEDITOR.instances["editorCalculations"].setData($scope.editquestion.calculations);
            $timeout(function () {
                for (var i = 0; i < $scope.ckEditAlternatives.length; i++) {
                    var editorId = 'editor' + $scope.ckEditAlternatives[i].editorId;
                    $scope.loadEditor(editorId, true);
                    CKEDITOR.instances[editorId]
                        .setData($scope.adminEditQuestion.qstn_alternatives[i].qta_alt_desc);
                }
            }, 50);

        });
    }

    angular
        .module('qbAuthoringToolApp')
        .controller('adminEditQuestionController', adminEditQuestionController);
    adminEditQuestionController.$inject = ['$scope', '$state', '$stateParams', '$filter', '$window', 'userService', 'repositoryService', '$http', '$q', '$timeout'];
})();  