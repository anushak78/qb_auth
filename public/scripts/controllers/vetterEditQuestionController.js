(function () {
    'use strict';
    function vetterEditQuestionController($scope, $stateParams, $filter, $window, userService, repositoryService, $http, $q, $timeout, $state) {
        $scope.selectedCourse = {};
        $scope.selectedSubject = {};
        $scope.selectedTopic = {};
        $scope.editquestion = {};
        $scope.editquestion.alternatives = [];
        $scope.error_msg = [];
        /* GET THE EDIT DATA FROM DATABASE TO SET TO THE FRONTEND FIELDS */
        // var topicParams = repositoryService.getExamModuleId();
        var topicParams = {
            exampaper_pk: window.localStorage.getItem('exampaper_pk'),
            exam_id: window.localStorage.getItem('exam_id'),
        };
        var req = {
            qb_id: window.localStorage.getItem('editqbid'),
            exampaper_fk: window.localStorage.getItem('exampaper_pk'),
            exam_fk: window.localStorage.getItem('exam_id'),
            qb_pk: window.localStorage.getItem('editqbpk')
        };
        repositoryService.setBookMark(window.localStorage.getItem('editqbid'))
        $scope.getquestiondata = function () {
            $http.post('/api/getEditQuestionData', req)
                .then(function (response) {
                    $scope.adminEditQuestion = response.data.data[0];
                    $scope.courseName = $scope.adminEditQuestion.qba_course_master.qba_course_name;
                    if ($scope.adminEditQuestion.qst_type == 'CS' && $scope.adminEditQuestion.qst_pid == '0') {
                        $scope.casePassage = true;
                    }
                    else {
                        $scope.casePassage = false;
                    }
                    $scope.subjectName = $scope.adminEditQuestion.qba_subject_master.subject_name;
                    $scope.editquestion.marks = parseFloat($scope.adminEditQuestion.qst_marks);
                    $scope.editquestion.negativeMarks = parseFloat($scope.adminEditQuestion.qst_neg_marks);
                    if (isNaN($scope.editquestion.negativeMarks)) {
                        $scope.editquestion.negativeMarks = 0
                    }
                    $scope.editquestion.remark = $scope.adminEditQuestion.qst_remarks;
                    $scope.editquestion.calculations = $scope.adminEditQuestion.calculation_info;
                    $scope.editquestion.reference = $scope.adminEditQuestion.reference_info;
                    $scope.setInitOption();
                    $scope.getModuleList($scope.adminEditQuestion.qba_subject_master.qba_subject_fk, $scope.adminEditQuestion.qba_module_mstr);
                    $scope.loadEditor('editorRemarks', true);
                    $scope.loadEditor('editorReference', true);
                    $scope.loadEditor('editorCalculations', true);

                    CKEDITOR.instances["editorRemarks"].setData($scope.editquestion.remark);
                    CKEDITOR.instances["editorReference"].setData($scope.editquestion.reference);
                    CKEDITOR.instances["editorCalculations"].setData($scope.editquestion.calculations);
                    $http.post('/api/load_qbrepo_courses', {
                        headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' }
                    }).then(function (response) {
                        $scope.courseList = response.data.obj;
                        //var course = repositoryService.getSelectedCourse();
                        $scope.selectedCourse = $scope.adminEditQuestion.qba_course_master.qba_course_pk;



                        $scope.getSubjectList('Y');

                        $scope.getTopicList('Y');
                        //$scope.selectedCourse = $scope.adminEditQuestion.qba_course_master.qba_course_pk;   

                        deferred.resolve(response);
                    }).catch(function (error) {
                        deferred.reject(error);
                    });
                    $timeout(function () {
                        for (var i = 0; i < $scope.ckEditAlternatives.length; i++) {
                            var editorId = 'editor' + $scope.ckEditAlternatives[i].editorId;
                            $scope.loadEditor(editorId, true);
                            CKEDITOR.instances[editorId]
                                .setData($scope.adminEditQuestion.qstn_alternatives[i].qta_alt_desc);
                        }
                    }, 50);

                    $scope.loadEditor('editor1', true);
                    CKEDITOR.instances["editor1"].setData($scope.adminEditQuestion.qst_body);
                });
        };


        //$scope.adminEditQuestion = repositoryService.geteditAdminQuestion();   


        $scope.selectedOption;
        $scope.ckEditAlternatives = [];
        $scope.editorStates = {};
        var editorId = null;
        /* GET THE EDIT DATA FROM DATABASE TO SET TO THE FRONTEND FIELDS */

        //$scope.loginUser = userService.getUserData(); 
        var id = JSON.parse(window.localStorage.getItem('user')); // added by shilpa
        var role = JSON.parse(window.localStorage.getItem('role')); // added by shilpa
        var name = JSON.parse(window.localStorage.getItem('username')); // added by shilpa
        $scope.loginUser = {
            id: id,
            name: name,
            role: role
        };
        $scope.username = JSON.parse(sessionStorage.getItem('username'));  // Dipika HSS//

        // $scope.editPageNumber = repositoryService.getVetterEditedPageId(); 
        $scope.editPageNumber = localStorage.getItem("currentPageId");

        //Users created for ckeditor track changes
        var users = [{ name: $scope.username, id: $scope.loginUser.id }];
        //Depending of the user type load the confing file
        if ($scope.loginUser.role == "VET") {
            $scope.ckEditorConfigFile = 'ckeditor-vetter-conf.js';
        } else if ($scope.loginUser.role == "PUB") {
            $scope.ckEditorConfigFile = 'ckeditor-conf.js';
        }


        $scope.setRightAlternative = function () {
            for (var i = 0; i < $scope.adminEditQuestion.qstn_alternatives.length; i++) {
                if ($scope.adminEditQuestion.qstn_alternatives[i].qta_is_corr_alt == "Y") {
                    $scope.selectedOption = i;
                }
            }
        };

        function selectUser(id, inUI) {
            /*if (inUI) {
                return $select.val(id).change();
            }*/
            var i;
            for (i = 0; i < users.length; ++i) {
                if (users[i].id == id) {
                    break;
                }
            }
            var user = users[i];
            var state = $scope.editorStates[editorId];
            if (user && state) {
                state.userId = id;
                var lite = state.editor.plugins.lite;
                lite && lite.findPlugin(state.editor).setUserInfo(user);
            }
        }
        $scope.changeSelectedOption = function (value) {
            $scope.selectedOption = value;
        };

        $.each($scope.editorStates, function (i, state) {
            // example of listening to an LITE plugin event. The events are dispatched through the editor
            state.editor.on(LITE.Events.SHOW_HIDE, function (event) {
                var show = event.data.show;
                //$sidebar.find("#show-status").text(show ? "Shown" : "Hidden").toggleClass("on", show);

            });

            // called each time a new instance of an LITE tracker is created
            state.editor.on(LITE.Events.INIT, function (event) {
                var lite = event.data.lite;
                lite.toggleShow(true);
                //lite.acceptAll(false);
                //lite.commands = [/*LITE.Commands.TOGGLE_TRACKING, */LITE.Commands.TOGGLE_SHOW/*, LITE.Commands.ACCEPT_ALL, LITE.Commands.REJECT_ALL, LITE.Commands.ACCEPT_ONE, LITE.Commands.REJECT_ONE */];
            });
        });

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

        $scope.editQuestion = function () {
            $scope.error_msg = [];
            $scope.editquestion.question = CKEDITOR.instances["editor1"].getData().replace(/&#160;/g, '');
            var str = CKEDITOR.instances["editor1"].document.getBody().getText().trim();
            if ($scope.editquestion.question == null || $scope.editquestion.question == '' || str == '') {
                $scope.error_msg.push("Question cannot be blank");
            }
            if (($scope.adminEditQuestion.qst_type == 'CS' && $scope.adminEditQuestion.qst_pid != '0') || $scope.adminEditQuestion.qst_type == 'M') {
                if (($scope.editquestion.marks != 0.5 && $scope.editquestion.marks != 1 && $scope.editquestion.marks != 2) || $scope.editquestion.marks == undefined || $scope.editquestion.marks == null || isNaN($scope.editquestion.marks) == true) {
                    $scope.error_msg.push("Please enter marks as 0.5, 1 or 2");
                }
            }

            $scope.editquestion.remark = CKEDITOR.instances["editorRemarks"].getData().replace(/&#160;/g, '');
            $scope.editquestion.calculations = CKEDITOR.instances["editorCalculations"].getData().replace(/&#160;/g, '');
            $scope.editquestion.reference = CKEDITOR.instances["editorReference"].getData().replace(/&#160;/g, '');
            $scope.editquestion.questionTextSave = $scope.cleanTextNow($scope.editquestion.question);
            $scope.editquestion.numOfAlternatives = $scope.ckEditAlternatives.length;
            $scope.editquestion.user_id = $scope.loginUser.id;

            var correctAns = $scope.selectedOption;
            var noBlankValues = 0;
            for (var i = 1; i <= $scope.editquestion.numOfAlternatives; i++) {
                var editorId = "editor" + (i + 1);
                var option = new Object();
                option.text = CKEDITOR.instances[editorId].getData().replace(/&#160;/g, '');
                option.text = option.text.replace(/&nbsp;/g, " ").trim();
                var opInd = i - 1;
                option.isCorrect = correctAns == opInd ? 'Y' : 'N';

                if (option.text == "") {
                    noBlankValues = 1;
                }
                $scope.editquestion.alternatives.push(option);
            }
            if (noBlankValues == 1 && $scope.adminEditQuestion.qst_type != 'CS') {
                $scope.error_msg.push("alternatives cannot be blank");
            }
            // $scope.editquestion.selectedCourse = $scope.selectedCourse;
            // $scope.editquestion.selectedSubject = $scope.selectedSubject;  
            $scope.editquestion.selectedCourse = $scope.adminEditQuestion.qba_course_master.qba_course_fk;
            $scope.editquestion.selectedSubject = $scope.adminEditQuestion.qba_subject_master.qba_subject_fk;
            $scope.editquestion.selectedTopic = $scope.selectedTopic;
            $scope.editquestion.selectedOption = $scope.selectedOption;
            $scope.editquestion.selectedModule = $scope.selectedModule;
            $scope.editquestion.userName = $scope.username;
            $scope.editquestion.qb_pk = $scope.adminEditQuestion.qb_pk;
            $scope.editquestion.qb_id = $scope.adminEditQuestion.qb_id;
            //$scope.editquestion.culled_qb_pk = $scope.adminEditQuestion.culled_qb_pk;     
            $scope.editquestion.exam_id = topicParams.exam_id;//repositoryService.getsetExamId(); 
            $scope.editquestion.exampaper_fk = topicParams.exampaper_pk;//$scope.adminEditQuestion.exampaper_fk;
            /*$scope.editquestion.edt_exam_paper_id = $("#edt-exam_paper_id").text();         
            $scope.editquestion.edt_exam_name = $("#edt-exam_name").text();*/
            $scope.editquestion.edt_exam_paper_id = localStorage.getItem("qstnpaper_id");
            $scope.editquestion.edt_exam_name = localStorage.getItem("exam_name");
            $scope.editquestion.oldModuleName = $scope.adminEditQuestion.qba_module_mstr.module_name;
            $scope.editquestion.oldModulePk = $scope.adminEditQuestion.qba_module_mstr.qba_module_pk;
            $scope.editquestion.oldUnitName = $scope.adminEditQuestion.qba_topic_master.topic_name;
            $scope.editquestion.oldUnitPk = $scope.adminEditQuestion.qba_topic_master.qba_topic_pk;
            $scope.editquestion.oldMarks = $scope.adminEditQuestion.qst_marks;
            $scope.editquestion.oldNegMarks = $scope.adminEditQuestion.qst_neg_marks;
            $scope.editquestion.qst_type = $scope.adminEditQuestion.qst_type
            $scope.editquestion.qst_pid = $scope.adminEditQuestion.qst_pid
            $scope.editquestion.newModuleName = $.grep($scope.moduleList, function (module) {
                return module.qba_module_pk == $scope.selectedModule;
            })[0].module_name;
            $scope.editquestion.newUnitName = $.grep($scope.topicList, function (topic) {
                return topic.qba_topic_pk == $scope.selectedTopic;
            })[0].topic_name;

            // return false;   
            // return false;          
            /* Hardcode Values */
            // $scope.editquestion.exam_id = 1;
            // $scope.editquestion.exampaper_fk = 1105;       
            if ($scope.error_msg.length > 0) {
                $("html, body").animate({ scrollTop: 0 }, "fast");
            }
            else {
                var result = confirm("Are you sure you want to save the changes?")
                if (result == true) {
                    $http.post('/api/edit_vetter_questions', $scope.editquestion)
                        .then(function (response) {
                            var topic = repositoryService.getPopulatedQuestions();
                            repositoryService.setPopulatedQuestions(topic);
                            repositoryService.setVetterEditedPageId($scope.editPageNumber);
                            //alert('Are you sure you want to save the changes?');
                            // $( "#openConfirmationId" ).trigger( "click" );
                            swal("QBID " + $scope.adminEditQuestion.qb_id + " saved successfully")
                            $state.go('vetterReviewQuestion');
                        });
                }
                else {
                    return false;
                }
            }
        };
        //$scope.editQuestion();

        $scope.afterEditSave = function () {
            $timeout(function () {
                $state.go('vetterReviewQuestion');
            }, 1000);
        };


        function onEditorSelected(id, oldId) {
            var state = $scope.editorStates[oldId];
            state = $scope.editorStates[id];
            if (!state) {
                return;
            }
            editorId = id;
            selectUser(state.userId || users[0].id, true);
            //setCheckedUsers(state.checkedUsers);
            state.editor.focus();
        }

        $scope.loadEditor = function (id, focus) {
            if (id == "editor1") {
                var editor = CKEDITOR.replace(id, {
                    height: "80",
                    filebrowserBrowseUrl: '../ckeditor/ckeditor4.5/plugins/filemanager/browser/default/browser.html?Connector=/browser/browse',
                    filebrowserImageUploadUrl: '/uploader/upload?Type=Image',
                    customConfig: "../" + $scope.ckEditorConfigFile
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
                    customConfig: "../" + $scope.ckEditorConfigFile,
                    sharedSpaces: {
                        top: 'top',
                        bottom: 'bottom'
                    }
                });
            }

            function onConfigLoaded(e) {
                var conf = e.editor.config;
                var lt = conf.lite = conf.lite || {};
                if (location.href.indexOf("debug") > 0) {
                    lt.includeType = "debug";
                }
            }

            editor.on('configLoaded', onConfigLoaded);
            if ($scope.loginUser.role == 'VET' || $scope.loginUser.role == 'PUB') {
                editor.on('key', function (event) {
                    if (event.data.keyCode == 46) {
                        event.cancel();
                    }
                })
            }

            if (focus) {
                editor.on(LITE.Events.INIT, function (event) {
                    onEditorSelected(id);
                });

                editor.on("loaded", function (e) {
                    onEditorSelected(id);
                });
            }

            $scope.editorStates[id] = new EditorState(editor)
        };

        $scope.cleanTextNow = function (text, editorId) {
            /* Logic For Clean Text */
            var editorId = editorId;
            var textToSave = text;
            var rules = {
                elements: {
                    del: function (element) {
                        if (element.hasClass("ice-del")) {
                            element.remove();
                        }
                    }
                }
            };
            var filter = new CKEDITOR.htmlParser.filter(rules);
            var fragment = CKEDITOR.htmlParser.fragment.fromHtml(textToSave);
            var writer = new CKEDITOR.htmlParser.basicWriter();
            filter.applyTo(fragment);
            fragment.writeHtml(writer);
            var cleanText = writer.getHtml();
            return cleanText;
            /* End Logic For Clean Text */
        };

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
                deferred.resolve(response);
            }).catch(function (error) {
                deferred.reject(error);
            });

            if (isOnload == 'Y') {
                //var subject = repositoryService.getSelectedSubject();
                $scope.selectedSubject = $scope.adminEditQuestion.qba_subject_master.qba_subject_pk;
                // $scope.selectedSubject = subject.qba_subject_pk;
            }
        };

        $scope.getModuleList = function (sid, module_obj) {
            //var subjectId = $scope.selectedSubject == null? 0: $scope.selectedSubject;
            var subjectId = sid;
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

            //  if(isOnLoad == 'Y') {
            //var module = repositoryService.getSelectedModule();
            var module = module_obj;
            if (module != null && module.module_name == 'ALL') {
                //var topic = repositoryService.getSelectedTopic();
                if (topic != null && topic.qba_module_fk != null)
                    // $scope.selectedModule = topic.qba_module_fk;
                    $scope.selectedModule = $scope.adminEditQuestion.qba_module_mstr.qba_module_pk;
            } else {
                // $scope.selectedModule = module.qba_module_pk;
                //$scope.selectedModule = $scope.adminEditQuestion.qba_module_mstr.qba_module_pk;
                $scope.selectedModule = module_obj.qba_module_fk;

            }
            // }
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
                    // $scope.selectedTopic = topic.qba_topic_pk;
                    $scope.selectedTopic = $scope.adminEditQuestion.qba_topic_fk;
                }
                deferred.resolve(response);
            }).catch(function (error) {
                deferred.reject(error);
            });
        };

        $scope.removeAlternatives = function (id) {
            if ($scope.ckEditAlternatives.length == 2) {
                $scope.messageBox = "Options Can not be less than 2";
                $("#openMessageBox").trigger("click");
            } else {
                var indexToRemove = id - 2;
                $scope.ckEditAlternatives.splice(indexToRemove, 1);
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
            $scope.getquestiondata();
        });
    }

    angular
        .module('qbAuthoringToolApp')
        .controller('vetterEditQuestionController', vetterEditQuestionController);
    vetterEditQuestionController.$inject = ['$scope', '$stateParams', '$filter', '$window', 'userService', 'repositoryService', '$http', '$q', '$timeout', '$state'];

})();    