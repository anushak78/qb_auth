(function () {
    'use strict';

    function addCSQChildController($scope, $state, $filter, $window, userService, repositoryService, $http, $sce, $q, $timeout) {

        $scope.parentQuestion = repositoryService.getParentQuestion();

        //editorId:1 is reserved for Question Body Text

        $scope.newChildQuestion = {
            parentId: 0, courseId: 0, subjectId: 0, moduleId: 0, topicId: 0, question: '', marks: 0, negativeMarks: 0,
            numOfAlternatives: 4, type: 'CS', remark: '', calculations: '', reference: '', userName: '',
            alternatives: [{ editorId: 2, text: '', isCorrect: 'N' }, { editorId: 3, text: '', isCorrect: 'N' },
            { editorId: 4, text: '', isCorrect: 'N' }, { editorId: 5, text: '', isCorrect: 'N' }]
        };

        $scope.selectedModule = window.localStorage.getItem("module_name")
        $scope.selectedSubject = repositoryService.getSelectedSubject();
        $scope.selectedModule1 = repositoryService.getSelectedModule();
        $scope.selectedTopic = repositoryService.getSelectedTopic();


        $scope.username = JSON.parse(sessionStorage.getItem('username'));  // Dipika HSS//
        $scope.role = JSON.parse(window.localStorage.getItem("role"));
        $scope.loginUser = userService.getUserData();

        $scope.editorStates = {};

        $scope.qba_course_code = window.localStorage.getItem("qba_course_code");
        $scope.qba_course_name = window.localStorage.getItem("qba_course_name");
        $scope.qba_module_name = window.localStorage.getItem("qba_module_name");




        $scope.marks = 1;
        $scope.negativeMarks = 0;
        $scope.numOfOptionsList = [{ value: 2 }, { value: 3 }, { value: 4 }, { value: 5 }, { value: 6 },
        { value: 7 }, { value: 8 }, { value: 9 }];
        $scope.numOfOptions = $scope.numOfOptionsList[2];

        $scope.renderAsHtml = function (val) {
            return $sce.trustAsHtml(val);
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

            $scope.m_id = window.localStorage.getItem("qba_module_pk");
            // $scope.s_id = window.localStorage.getItem("s_id_qstn");
            // $scope.t_id = window.localStorage.getItem("t_id_qstn");
            $scope.c_id = window.localStorage.getItem("qba_course_pk");
            $scope.newChildQuestion.topicId = $scope.selectedTopic.qba_topic_pk;
            //   $scope.newChildQuestion.moduleId = $scope.selectedModule.qba_module_pk;
            $scope.newChildQuestion.moduleId = $scope.m_id;
            $scope.newChildQuestion.subjectId = $scope.selectedSubject.qba_subject_pk;
            //$scope.newChildQuestion.courseId = $scope.selectedCourse.qba_course_pk;

            $scope.newChildQuestion.courseId = $scope.c_id;
            // $scope.newChildQuestion.subjectId =  $scope.s_id;
            // $scope.newChildQuestion.topicId = $scope.m_id;
            $scope.newChildQuestion.marks = $scope.marks;
            $scope.newChildQuestion.negativeMarks = $scope.negativeMarks;
            $scope.newChildQuestion.question = CKEDITOR.instances["editor1"].getData().replace(/&#160;/g, '');
            var str = CKEDITOR.instances["editor1"].document.getBody().getText().trim();

            //ckeditor implement
            $scope.newChildQuestion.calculations = CKEDITOR.instances["caleditor"].getData().replace(/&#160;/g, '');
            $scope.newChildQuestion.remark = CKEDITOR.instances["remarkeditor"].getData().replace(/&#160;/g, '');
            $scope.newChildQuestion.reference = CKEDITOR.instances["refeditor"].getData().replace(/&#160;/g, '');

            if ($scope.newChildQuestion.question == null || $scope.newChildQuestion.question == '' ||
                $scope.newChildQuestion.question == undefined || str == '') {
                alert('Please Enter Question');
                return;
            }
            if (($scope.newChildQuestion.marks != 0.5 && $scope.newChildQuestion.marks != 1 && $scope.newChildQuestion.marks != 2) || $scope.newChildQuestion.marks == undefined || $scope.newChildQuestion.marks == null || isNaN($scope.newChildQuestion.marks) == true) {
                alert("Please enter marks as 0.5, 1 or 2");
                return;
            }

            $scope.newChildQuestion.numOfAlternatives = $scope.numOfOptions.value;
            var correctAns = $scope.selectedOption;

            var j = 0;
            var str;
            for (var i = 0; i < $scope.newChildQuestion.alternatives.length; i++) {
                var editorId = "editor" + $scope.newChildQuestion.alternatives[i].editorId;
                $scope.newChildQuestion.alternatives[i].text = CKEDITOR.instances[editorId].getData().replace(/&#160;/g, '');
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
            //   $scope.newChildQuestion.remark = $scope.remark;
            //   $scope.newChildQuestion.calculations = $scope.calculations;
            //   $scope.newChildQuestion.reference = $scope.reference;
            $scope.newChildQuestion.userName = $scope.username;
            if ($scope.loginUser.role == 'VET' || $scope.loginUser.role == 'PUB')

                $scope.saveCSQChildShortfall();
            else if ($scope.parentQuestion.qbId == 0) {
                $scope.saveParentAndChild();
            }
            else

                $scope.saveChild();

        };

        $scope.saveParentAndChild = function () {
            $scope.parentQuestion.userName = $scope.username
            var parameters = $scope.parentQuestion;
            var deferred = $q.defer();
            var transform = function (data) {
                return $.param(data);
            };
            document.getElementById('board').style.visibility = 'visible'
            $http.post('/api/save_csq_parent', parameters, {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
                transformRequest: transform,
                timeout: 0
            }).then(function (response) {
                var savedParentQuestion = response.data.obj;
                $scope.parentQuestion.qb_pk = savedParentQuestion.qb_pk;
                $scope.parentQuestion.qbId = savedParentQuestion.qb_id;
                repositoryService.setParentQuestion($scope.parentQuestion);
                document.getElementById('board').style.visibility = 'hidden'
                $scope.saveChild();
                deferred.resolve(response);
            }).catch(function (error) {
                deferred.reject(error);
            });
        };

        $scope.saveChild = function () {

            $scope.newChildQuestion.parentId = $scope.parentQuestion.qbId;
            document.getElementById('board').style.visibility = 'visible'
            $http.post('/api/save_mcq', $scope.newChildQuestion)
                .then(function (response) {
                    if (response.data.message == "success") {
                        $scope.updateChildCount();
                        repositoryService.addChildQuestion($scope.newChildQuestion);
                        document.getElementById('board').style.visibility = 'hidden'
                        alert('Data Saved Successfully.');
                        $state.go('addcsq_parent');
                    }
                    else {
                        alert("Question already exists")
                    }
                });
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
            //$scope.newChildQuestion.module_fk = $scope.selectedModule == null? 0: $scope.selectedModule;


            repositoryService.addChildQuestion($scope.newChildQuestion);
            $http.post('/api/save_csq_child_shortfall', $scope.newChildQuestion)
                .then(function (response) {
                    $scope.updateChildCountShortfall();
                    alert('Data Saved Successfully.');
                    $state.go('addcsq_parent');
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

            if (id == "editor1" || id == "caleditor" || id == "refeditor" || id == "remarkeditor") {
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
            $scope.loadEditor('caleditor', true);
            $scope.loadEditor('refeditor', true);
            $scope.loadEditor('remarkeditor', true);
            document.getElementById('board').style.visibility = 'hidden'

            $timeout(function () {
                for (var i = 0; i < $scope.newChildQuestion.alternatives.length; i++) {
                    var editorId = 'editor' + $scope.newChildQuestion.alternatives[i].editorId;
                    $scope.loadEditor(editorId, true);
                }
            }, 50);
        })

    }

    angular
        .module('qbAuthoringToolApp')
        .controller('addCSQChildController', addCSQChildController);

    addCSQChildController.$inject = ['$scope', '$state', '$filter', '$window', 'userService', 'repositoryService', '$http', '$sce', '$q', '$timeout'];

})();