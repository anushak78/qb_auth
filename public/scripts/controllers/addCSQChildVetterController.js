(function () {
    'use strict';

    function addCSQChildVetterController($scope, $state, $filter, $window, userService, repositoryService, $http, $sce, $q, $timeout) {

        $scope.parentQuestion = repositoryService.getParentQuestion();

        //editorId:1 is reserved for Question Body Text

        $scope.newChildQuestion = {
            parentId: 0, courseId: 0, subjectId: 0, moduleId: 0, topicId: 0, question: '', marks: 0, negativeMarks: 0,
            numOfAlternatives: 4, type: 'CS', remark: '', calculations: '', reference: '', userName: '',
            alternatives: [{ editorId: 2, text: '', isCorrect: 'N' }, { editorId: 3, text: '', isCorrect: 'N' },
            { editorId: 4, text: '', isCorrect: 'N' }, { editorId: 5, text: '', isCorrect: 'N' }]
        };

        $scope.selectedCourse = repositoryService.getSelectedCourse();
        $scope.selectedSubject = repositoryService.getSelectedSubject();
        $scope.selectedModule = repositoryService.getSelectedModule();
        $scope.selectedTopic = repositoryService.getSelectedTopic();

        $scope.username = JSON.parse(sessionStorage.getItem('username'));  // Dipika HSS//
        $scope.loginUser = userService.getUserData();

        $scope.editorStates = {};

        $scope.marks = 1;
        $scope.negativeMarks = 0;
        $scope.numOfOptionsList = [{ value: 2 }, { value: 3 }, { value: 4 }, { value: 5 }, { value: 6 },
        { value: 7 }, { value: 8 }, { value: 9 }];
        $scope.numOfOptions = $scope.numOfOptionsList[2];

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
        $scope.passage_data = window.localStorage.getItem("csq_passage_data");


        $scope.prepareAddChildQuestionData = function () {

            var course = ($filter('filter')($scope.courseList, { qba_course_pk: $scope.selectedCourse })[0]);
            var subject = ($filter('filter')($scope.subjectList, { qba_subject_pk: $scope.selectedSubject })[0]);
            var module = ($filter('filter')($scope.moduleList, { qba_module_pk: $scope.selectedModule })[0]);
            var topic = ($filter('filter')($scope.topicList, { qba_topic_pk: $scope.selectedTopic })[0]);

            repositoryService.setSelectedCourse(course);
            repositoryService.setSelectedSubject(subject);
            repositoryService.setSelectedModule(module);
            repositoryService.setSelectedTopic(topic);


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



        $scope.addOrRemoveOptions = function () {
            var count = 0;
            if ($scope.numOfOptions.value > $scope.newChildQuestion.alternatives.length) {
                count = $scope.numOfOptions.value - $scope.newChildQuestion.alternatives.length;
                $scope.addOptions(count, $scope.newChildQuestion.alternatives.length);
            } else {
                count = $scope.newChildQuestion.alternatives.length - $scope.numOfOptions.value;
                $scope.removeOptions($scope.numOfOptions.value, count);
            }
        };

        $scope.addOptions = function (count, numOfAlt) {
            var editorId = $scope.newChildQuestion.alternatives[numOfAlt - 1].editorId;
            var arr_newEditorIds = [];
            for (var i = 0; i < count; i++) {
                var newEditorId = editorId + 1 + i;
                arr_newEditorIds.push('editor' + newEditorId);
                $scope.newChildQuestion.alternatives.push({ editorId: newEditorId, text: '', isCorrect: 'N' });
            }
            $timeout(function () {
                for (var j = 0; j < arr_newEditorIds.length; j++)
                    $scope.loadEditor(arr_newEditorIds[j], true);
            }, 50);
        };

        $scope.removeOptions = function (start, count) {
            $scope.newChildQuestion.alternatives.splice(start, count);
        };

        $scope.saveCSQChild = function () {

            $scope.subjectId = window.localStorage.getItem("subject_id_vetter_csq");
            $scope.courseId = window.localStorage.getItem("course_id_vetter_csq");
            $scope.topicId = window.localStorage.getItem("topic_id_vetter_csq");
            $scope.moduleId = window.localStorage.getItem("module_id_vetter_csq");


            $scope.newChildQuestion.topicId = $scope.topicId;
            $scope.newChildQuestion.moduleId = $scope.moduleId;
            $scope.newChildQuestion.subjectId = $scope.subjectId;
            $scope.newChildQuestion.courseId = $scope.courseId;
            $scope.newChildQuestion.marks = $scope.marks;
            $scope.newChildQuestion.negativeMarks = $scope.negativeMarks;
            $scope.newChildQuestion.question = CKEDITOR.instances["editor1"].getData();
            var str = CKEDITOR.instances["editor1"].document.getBody().getText().trim();

            if (($scope.newChildQuestion.marks != 0.5 && $scope.newChildQuestion.marks != 1 && $scope.newChildQuestion.marks != 2) || $scope.newChildQuestion.marks == undefined || $scope.newChildQuestion.marks == null || isNaN($scope.newChildQuestion.marks) == true) {
                alert("Please enter marks as 0.5, 1 or 2");
                return
            }
            if ($scope.newChildQuestion.question == null || $scope.newChildQuestion.question == '' ||
                $scope.newChildQuestion.question == undefined || str == '') {
                alert('Please Enter Question');
                return;
            }

            $scope.newChildQuestion.numOfAlternatives = $scope.numOfOptions.value;
            var correctAns = $scope.selectedOption;

            var j = 0;
            var str;
            for (var i = 0; i < $scope.newChildQuestion.alternatives.length; i++) {
                var editorId = "editor" + $scope.newChildQuestion.alternatives[i].editorId;
                $scope.newChildQuestion.alternatives[i].text = CKEDITOR.instances[editorId].getData();
                str = CKEDITOR.instances[editorId].getData();
                str = str.replace(/&nbsp;/g, " ").trim();

                if (str == null || str == '') {

                    if (j == 0)
                        alert("Please enter all options.");
                    j++;
                    return;
                }

                $scope.newChildQuestion.alternatives[i].isCorrect = correctAns == i ? 'Y' : 'N';
            }
            if (correctAns == undefined || correctAns == null) {
                alert("Please select correct alternative.");
                return;
            }
            //$scope.newChildQuestion.remark = $scope.remark;
            //$scope.newChildQuestion.calculations = $scope.calculations;
            //$scope.newChildQuestion.reference = $scope.reference;
            $scope.newChildQuestion.remark = CKEDITOR.instances["editorrem"].getData()
            $scope.newChildQuestion.reference = CKEDITOR.instances["editorref"].getData()
            $scope.newChildQuestion.calculations = CKEDITOR.instances["editorcal"].getData()
            //  $scope.username = window.localStorage.getItem("username");
            $scope.newChildQuestion.userName = $scope.username;
            $scope.parentQuestion.qbId = 0;
            // var  parentQuestion = $scope.parentQuestion;
            // $scope.newChildQuestion.parent_body = $scope.parentQuestion.question;
            // $scope.saveParentAndChild();

            // var parameters = $scope.newChildQuestion;

            var ckparent = window.localStorage.getItem("childqstpid");
            // if($scope.loginUser.role == 'VET' || $scope.loginUser.role == 'PUB' )
            // 	{

            //     $scope.saveCSQChildShortfall();

            //     }
            // else 
            if ($scope.parentQuestion.qbId == 0 && ckparent == 0) {
                $scope.saveParentAndChild();
            }
            else {
                $scope.saveChild();
            }


            // $http.post('/api/save_csq_data_vetter', parameters)
            // .then(function (response) {

            //     var savedParentQuestion = response.data.obj;
            //     $scope.parentQuestion.qb_pk = savedParentQuestion.qb_pk;
            //     $scope.parentQuestion.qbId = savedParentQuestion.qb_id;
            //     repositoryService.setParentQuestion($scope.parentQuestion);
            //     $scope.saveChild();

            //     });


            //


        };

        $scope.saveParentAndChild = function () {

            var parameters = $scope.parentQuestion;


            $scope.newChildQuestion.parent_body = $scope.parentQuestion.question;

            var parameters = $scope.newChildQuestion;
            var deferred = $q.defer();
            var transform = function (data) {
                return $.param(data);
            };
            $http.post('/api/save_csq_data_vetter', parameters, {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
                transformRequest: transform,
                timeout: 0
            }).then(function (response) {
                var savedParentQuestion = response.data.obj;
                $scope.parentQuestion.qb_pk = savedParentQuestion.qb_pk;
                $scope.parentQuestion.qbId = savedParentQuestion.qb_id;
                window.localStorage.setItem("childqstpid", savedParentQuestion.qb_id);
                repositoryService.setParentQuestion($scope.parentQuestion);

                $scope.saveChild();
                deferred.resolve(response);
            }).catch(function (error) {
                deferred.reject(error);
            });
        };

        $scope.saveChild = function () {
            var qb_id = window.localStorage.getItem("childqstpid");
            //$scope.newChildQuestion.parentId = $scope.parentQuestion.qbId;
            $scope.newChildQuestion.parentId = qb_id;
            repositoryService.addChildQuestion($scope.newChildQuestion);
            var result = confirm("Are you sure you want to save child question?")
            if (result == true) {
                $http.post('/api/save_mcq', $scope.newChildQuestion)
                    .then(function (response) {
                        $scope.updateChildCount();
                        alert('Data Saved Successfully.');
                        $state.go('add_csq_vetter');
                    });
            }
            else {
                return false
            }
        };

        $scope.updateChildCount = function () {
            $http.post('/api/update_child_count', $scope.parentQuestion)
                .then(function (response) {

                });
        };

        $scope.saveCSQChildShortfall = function () {
            $scope.newChildQuestion.parentId = $scope.parentQuestion.qbId;
            $scope.newChildQuestion.examFk = $scope.parentQuestion.exam_fk;
            $scope.newChildQuestion.exampaperFk = $scope.parentQuestion.exampaper_fk;

            repositoryService.addChildQuestion($scope.newChildQuestion);
            $http.post('/api/save_csq_child_vetter', $scope.newChildQuestion)
                .then(function (response) {
                    $scope.updateChildCountShortfall();
                    alert('Data Saved Successfully.');
                    $state.go('add_csq_vetter');
                });
        };

        $scope.updateChildCountShortfall = function () {
            $http.post('/api/update_child_count_shortfall', $scope.parentQuestion)
                .then(function (response) {

                });
        };

        $scope.gotoParent = function () {





            $state.go('addcsq_parent');



            // $('#confirmationId').modal({backdrop: 'static', keyboard: false}) 

            // $('#confirmationId').hide();
            //$('.modal-backdrop').removeClass("modal-backdrop"); 


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
            }
            else if (id == "editorrem" || id == "editorref" || id == "editorcal") {
                var editor = CKEDITOR.replace(id, {
                    height: "80",
                    filebrowserBrowseUrl: '../ckeditor/ckeditor4.5/plugins/filemanager/browser/default/browser.html?Connector=/browser/browse',
                    filebrowserImageUploadUrl: '/uploader/upload?Type=Image',
                    customConfig: "../ckeditor-addMcq-conf.js"
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

        angular.element(document).ready(function () {
            /*$scope.selectedCourse = repositoryService.getSelectedCourse();
            $scope.selectedSubject = repositoryService.getSelectedSubject();
            $scope.selectedTopic = repositoryService.getSelectedTopic();     */

            $scope.loadEditor('editor1', true);
            $scope.loadEditor('editorrem', true);
            $scope.loadEditor('editorref', true);
            $scope.loadEditor('editorcal', true);

            $timeout(function () {
                for (var i = 0; i < $scope.newChildQuestion.alternatives.length; i++) {
                    var editorId = 'editor' + $scope.newChildQuestion.alternatives[i].editorId;
                    $scope.loadEditor(editorId, true);
                }
            }, 50);

        });

    }

    angular
        .module('qbAuthoringToolApp')
        .controller('addCSQChildVetterController', addCSQChildVetterController);

    addCSQChildVetterController.$inject = ['$scope', '$state', '$filter', '$window', 'userService', 'repositoryService', '$http', '$sce', '$q', '$timeout'];

})();