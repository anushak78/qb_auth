(function () {
    'use strict';

    function addMCQController($scope, $filter, $window, userService, repositoryService, $http, $q, $timeout, $state) {


        $scope.newQuestion = {
            parentId: 0, courseId: 0, subjectId: 0, moduleId: 0, topicId: 0, question: '', marks: 0, negativeMarks: 0,
            numOfAlternatives: 4, type: 'M', remark: '', calculations: '', reference: '', userName: '',
            alternatives: [{ editorId: 2, text: '', isCorrect: 'N' }, { editorId: 3, text: '', isCorrect: 'N' },
            { editorId: 4, text: '', isCorrect: 'N' }, { editorId: 5, text: '', isCorrect: 'N' }]
        };

        $scope.selectedCourse = {};
        $scope.selectedSubject = {};
        $scope.selectedTopic = {};
        $scope.editorStates = {};

        $scope.username = JSON.parse(localStorage.getItem('username'));  // Dipika HSS//
        $scope.loginUser = userService.getUserData();
        $scope.error_msg = [];
        $scope.marks = 0.5;
        $scope.negativeMarks = 0;
        $scope.numOfOptionsList = [{ value: 2 }, { value: 3 }, { value: 4 }, { value: 5 }, { value: 6 },
        { value: 7 }, { value: 8 }, { value: 9 }];
        $scope.numOfOptions = $scope.numOfOptionsList[2];

        var shortfallRecords = repositoryService.getAddShortFallQuestion()
        var course = repositoryService.getSelectedCourse();
        var subject = repositoryService.getSelectedSubject();
        var module = repositoryService.getSelectedModule();
        var topic = repositoryService.getSelectedTopic();

        if (topic == null) {
            topic = {};
        } if (course == null) {
            course = {};
        } if (subject == null) {
            subject = {};
        } if (module == null) {
            module = {};
        }

        var loginRole = userService.getUserData();

        $scope.role = JSON.parse(window.localStorage.getItem("role"));

        var prePopulateAddQstnData = function () {
            $scope.selectedCourse = course.qba_course_pk;
            $scope.selectedSubject = subject.qba_subject_pk;
            $scope.selectedModule = module.qba_module_pk;
            $scope.selectedTopic = topic.qba_topic_pk;
            $scope.marks = parseInt(shortfallRecords.qst_marks);
            $scope.negativeMarks = parseInt(shortfallRecords.qst_neg_marks);
        }
        prePopulateAddQstnData();

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

        $scope.course = JSON.parse(window.localStorage.getItem("course"));
        $scope.subject = window.localStorage.getItem("subject");
        $scope.module = window.localStorage.getItem("module");
        $scope.topic = window.localStorage.getItem("topic");
        $scope.markss = window.localStorage.getItem("marks");
        $scope.negavtivemarks = window.localStorage.getItem("negavtivemarks");


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
                    if (topic != null && topic.qba_topic_pk != null) {
                        $scope.selectedTopic = topic.qba_topic_pk;
                    }

                }
                deferred.resolve(response);
            }).catch(function (error) {
                deferred.reject(error);
            });
        };

        $scope.addOrRemoveOptions = function () {
            var count = 0;
            if ($scope.numOfOptions.value > $scope.newQuestion.alternatives.length) {
                count = $scope.numOfOptions.value - $scope.newQuestion.alternatives.length;
                $scope.addOptions(count, $scope.newQuestion.alternatives.length);
            } else {
                count = $scope.newQuestion.alternatives.length - $scope.numOfOptions.value;
                $scope.removeOptions($scope.numOfOptions.value, count);
            }
        };

        $scope.addOptions = function (count, numOfAlt) {
            var editorId = $scope.newQuestion.alternatives[numOfAlt - 1].editorId;
            var arr_newEditorIds = [];
            for (var i = 0; i < count; i++) {
                var newEditorId = editorId + 1 + i;
                arr_newEditorIds.push('editor' + newEditorId);
                $scope.newQuestion.alternatives.push({ editorId: newEditorId, text: '', isCorrect: 'N' });
            }
            $timeout(function () {
                for (var j = 0; j < arr_newEditorIds.length; j++)
                    $scope.loadEditor(arr_newEditorIds[j], true);
            }, 50);
        };

        $scope.removeOptions = function (start, count) {
            $scope.newQuestion.alternatives.splice(start, count);
        };

        /*Author : Sanjana
        Function to insert short fall quuestion details */
        $scope.saveShortfallRecords = function () {

            var validateQuestionBody = CKEDITOR.instances["editor1"].getData();
            var str = CKEDITOR.instances["editor1"].document.getBody().getText().trim();

            if (validateQuestionBody == null || validateQuestionBody == '' || str == '') {
                $scope.error_msg.push("Please enter question.");
            }

            $scope.newQuestion.qId = parseInt(shortfallRecords.qb_id);
            $scope.newQuestion.qb_pk = parseInt(shortfallRecords.qb_pk);
            $scope.newQuestion.question = CKEDITOR.instances["editor1"].getData();
            $scope.newQuestion.numOfAlternatives = $scope.numOfOptions.value;
            var correctAns = $scope.selectedOption;

            var j = 0;
            var str;
            for (var i = 0; i < $scope.newQuestion.alternatives.length; i++) {
                var editorId = "editor" + $scope.newQuestion.alternatives[i].editorId;
                $scope.newQuestion.alternatives[i].text = CKEDITOR.instances[editorId].getData();
                str = CKEDITOR.instances[editorId].getData();
                str = str.replace(/&nbsp;/g, " ").trim();

                if ($scope.newQuestion.alternatives[i].text == null || $scope.newQuestion.alternatives[i].text == '' ||
                    str == "") {
                    if (j == 0)
                        $scope.error_msg.push("Please enter all options.");
                    j++;
                }
                $scope.newQuestion.alternatives[i].isCorrect = correctAns == i ? 'Y' : 'N';
            }
            if (correctAns == undefined || correctAns == null) {
                $scope.error_msg.push("Please select correct alternative.");
            }
            $scope.newQuestion.remark = CKEDITOR.instances["editorRemarks"].getData();
            $scope.newQuestion.calculations = CKEDITOR.instances["editorCalculations"].getData();
            $scope.newQuestion.reference = CKEDITOR.instances["editorReference"].getData();
            $scope.newQuestion.userName = $scope.username;

            $scope.newQuestion.exam_fk = shortfallRecords.exam_fk;
            $scope.newQuestion.exampaper_fk = shortfallRecords.exampaper_fk;
            $scope.newQuestion.topicId = shortfallRecords.qba_topic_fk;
            $scope.newQuestion.module_fk = $scope.selectedModule == null ? 0 : $scope.selectedModule;



            var module_fk = $scope.selectedModule == null ? 0 : $scope.selectedModule;
            //var parameters = {id:moduleId};
            if ($scope.error_msg.length > 0) {
                $("html, body").animate({ scrollTop: 0 }, "fast");
                //alert("Please fill all mandatory details");
            }
            else {
                $http.post('/api/save_shortfall_records', $scope.newQuestion)
                    .then(function (response) {
                        alert('SUCCESS: Question is Saved')
                        $state.go('vetterReviewQuestion');

                        //alert('Data Saved Successfully.');
                        $scope.clearQuestionData();
                        $('#showModal').click();
                        $('.modal-backdrop').remove();
                        $('body').removeClass('modal-open');
                    });
            }
        }

        $scope.saveQuestion = function () {

            var type = window.localStorage.getItem("type");



            //$('#addQues').parsley();
            $scope.error_msg = [];
            if (loginRole.role == 'VET' || loginRole.role == 'PUB') {

                $scope.saveShortfallRecords();


            } else {

                //return false;
                var validateQuestionBody = CKEDITOR.instances["editor1"].getData();
                var str = CKEDITOR.instances["editor1"].document.getBody().getText().trim();
                if ($scope.selectedCourse == null || $scope.selectedCourse == '') {
                    $scope.error_msg.push("Please select course.");

                }
                if ($scope.selectedSubject == null || $scope.selectedSubject == '') {
                    $scope.error_msg.push("Please select subject.");

                }
                if ($scope.selectedModule == null || $scope.selectedModule == '') {
                    $scope.error_msg.push("Please select module.");

                }
                if ($scope.selectedTopic == null || $scope.selectedTopic == '') {
                    $scope.error_msg.push("Please select topic.");

                }
                if (($scope.marks != 0.5 && $scope.marks != 1 && $scope.marks != 2) || $scope.marks == undefined || $scope.marks == null || isNaN($scope.marks) == true) {
                    $scope.error_msg.push("Please enter marks as 0.5, 1 or 2");
                }
                if (validateQuestionBody == null || validateQuestionBody == '' || str == '') {
                    $scope.error_msg.push("Please enter question.");
                }
                if (typeof $scope.negativeMarks == "undefined") {
                    $scope.error_msg.push("Please enter negative marks as multiple of 0.5")
                }
                $scope.newQuestion.qId = $scope.qbId;
                $scope.newQuestion.topicId = $scope.selectedTopic;
                $scope.newQuestion.moduleId = $scope.selectedModule;
                $scope.newQuestion.subjectId = $scope.selectedSubject;
                $scope.newQuestion.courseId = $scope.selectedCourse;
                $scope.newQuestion.marks = $scope.marks;
                $scope.newQuestion.negativeMarks = $scope.negativeMarks;
                $scope.newQuestion.question = CKEDITOR.instances["editor1"].getData().replace(/&#160;/g, '');

                $scope.newQuestion.numOfAlternatives = $scope.numOfOptions.value;
                var correctAns = $scope.selectedOption;

                var j = 0;
                var str;
                for (var i = 0; i < $scope.newQuestion.alternatives.length; i++) {
                    var editorId = "editor" + $scope.newQuestion.alternatives[i].editorId;
                    $scope.newQuestion.alternatives[i].text = CKEDITOR.instances[editorId].getData().replace(/&#160;/g, '');
                    str = CKEDITOR.instances[editorId].getData();
                    str = str.replace(/&nbsp;/g, " ").trim();

                    if (str == null || str == '') {

                        if (j == 0)
                            $scope.error_msg.push("Please enter all options.");
                        j++;

                    }


                    $scope.newQuestion.alternatives[i].isCorrect = correctAns == i ? 'Y' : 'N';
                }
                for (var i = 0; i < $scope.newQuestion.alternatives.length; i++) {
                    var temp = false
                    if ($scope.newQuestion.alternatives[i].text) {
                        for (var j = i + 1; j < $scope.newQuestion.alternatives.length; j++) {
                            var str1 = $scope.newQuestion.alternatives[i].text.toLowerCase().replace(/&#160;/g, '')
                            var str2 = $scope.newQuestion.alternatives[j].text.toLowerCase().replace(/&#160;/g, '')
                            if (str1.split(' ').join('') == str2.split(' ').join('')) {
                                $scope.error_msg.push("Options cannot repeat more than once.");
                                temp = true
                                break;
                            }
                            else {
                                continue
                            }
                        }
                    }
                    if (temp == true) {
                        break
                    }
                }
                //alert(correctAns);
                if (correctAns == undefined || correctAns == null) {

                    $scope.error_msg.push("Please select correct alternative.");

                }
                // alert($scope.error_msg);
                $scope.newQuestion.remark = CKEDITOR.instances["editorRemarks"].getData().replace(/&#160;/g, '');
                $scope.newQuestion.calculations = CKEDITOR.instances["editorCalculations"].getData().replace(/&#160;/g, '');
                $scope.newQuestion.reference = CKEDITOR.instances["editorReference"].getData().replace(/&#160;/g, '');
                $scope.newQuestion.userName = $scope.username;

                if ($scope.error_msg.length > 0) {
                    $("html, body").animate({ scrollTop: 0 }, "fast");
                    //alert("Please fill all mandatory details");
                }
                else {
                    var r = confirm("Are you sure you want to save this question?");
                    if (r == true) {
                        document.getElementById('board').style.visibility = 'visible'
                        $http.post('/api/save_mcq', $scope.newQuestion)
                            .then(function (response) {
                                if (response.data.message == "success") {
                                    //alert('Data Saved Successfully.');
                                    $scope.clearQuestionData();
                                    //$('#showModal').click();
                                    document.getElementById('board').style.visibility = 'hidden'
                                    swal("QBID " + response.data.obj.qb_id + " saved successfully")
                                    $state.go("qp_repository")
                                }
                                else {
                                    swal(response.data.message)
                                }
                            });
                    }
                    else {
                        return;
                    }

                }
            }

        };

        $scope.clearQuestionData = function () {
            //alert("sucess!!");
            $scope.marks = 0.5;
            $scope.negativeMarks = 0;
            //$scope.numOfOptions = 4;
            $scope.selectedOption = '';

            CKEDITOR.instances["editor1"].setData('');

            for (var i = 0; i < $scope.newQuestion.alternatives.length; i++) {
                var editorId = "editor" + $scope.newQuestion.alternatives[i].editorId;
                CKEDITOR.instances[editorId].setData('');
            }
            $scope.remark = '';
            $scope.calculations = '';
            $scope.reference = '';
        };

        function EditorState(editor) {
            this.editor = editor;
            this.checkedUsers = {};
        }

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

        $scope.checkUser = function () {
            if (loginRole.role == 'VET' || loginRole.role == 'PUB') {

                $state.go('vetterReviewQuestion');
                $('.modal-backdrop').remove();
                $('body').removeClass('modal-open');
            }
            else {
                $state.go('qp_repository');
                $('.modal-backdrop').remove();
                $('body').removeClass('modal-open');
            }
        }

        angular.element(document).ready(function () {
            var deferred = $q.defer();
            $scope.negativeMarks = 0
            document.getElementById('board').style.visibility = 'hidden'

            $http.post('/api/load_qbrepo_courses', {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' }
            }).then(function (response) {
                $scope.courseList = response.data.obj;
                var course = repositoryService.getSelectedCourse();
                if (course != null && course.qba_course_pk != null) {
                    $scope.selectedCourse = course.qba_course_pk;
                }

                $scope.getSubjectList('Y');
                $scope.getModuleList('Y');
                $scope.getTopicList('Y');
                deferred.resolve(response);
            }).catch(function (error) {
                deferred.reject(error);
            });

            $scope.loadEditor('editor1', true);
            $scope.loadEditor('editorRemarks', true);
            $scope.loadEditor('editorReference', true);
            $scope.loadEditor('editorCalculations', true);

            $timeout(function () {
                for (var i = 0; i < $scope.newQuestion.alternatives.length; i++) {
                    var editorId = 'editor' + $scope.newQuestion.alternatives[i].editorId;
                    $scope.loadEditor(editorId, true);
                }
            }, 50);

        });

    }

    angular
        .module('qbAuthoringToolApp')
        .controller('addMCQController', addMCQController);

    addMCQController.$inject = ['$scope', '$filter', '$window', 'userService', 'repositoryService', '$http', '$q', '$timeout', '$state'];

})();