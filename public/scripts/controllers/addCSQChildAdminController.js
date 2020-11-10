(function () {
    'use strict';

    function addCSQChildAdminController($scope, $state, $filter, $window, userService, repositoryService, $http, $sce, $q, $timeout) {

        $scope.parentQuestion = repositoryService.getParentQuestion();
        $scope.selected_module_name = "";
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
        $scope.role = JSON.parse(window.localStorage.getItem("role"));
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

        $scope.Coursename = window.localStorage.getItem("cname");
        $scope.courser_code = window.localStorage.getItem("course_code_vetter");

        $scope.topic_name = window.localStorage.getItem("topic_name");
        $scope.topic_code = window.localStorage.getItem("topic_code");
        $scope.subject_name = window.localStorage.getItem("sname");
        $scope.subject_code = window.localStorage.getItem("subject_code_vetter");
        $scope.module_name = window.localStorage.getItem("module_name");


        $scope.prepareAddChildQuestionData = function () {
            alert("gggggggggg");

            $scope.setParentQuestionData();
            $scope.newParentQuestion.question = CKEDITOR.instances["editor1"].getData();
            var str = CKEDITOR.instances["editor1"].document.getBody().getText().trim()
            if ($scope.newParentQuestion.question == '' || str == '') {
                alert('Passage can not be blank.');
                return;
            }

            repositoryService.setParentQuestion($scope.newParentQuestion);
            $state.go('addcsq_child_admin');
        };

        $scope.setParentQuestionData = function () {
            $scope.newParentQuestion.courseId = $scope.course_id;
            $scope.newParentQuestion.subjectId = $scope.subject_id;
            $scope.newParentQuestion.moduleId = $scope.selectedModule;
            var moduleID = window.localStorage.setItem("moduleID", $scope.newParentQuestion.moduleId);

            $scope.newParentQuestion.topicId = $scope.selectedTopic;
            var topicunit = window.localStorage.setItem("topicunit", $scope.newParentQuestion.topicId);
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


        $scope.moduleID = window.localStorage.getItem("selected_module_id");
        var reqdata = {
            moduleID: $scope.moduleID
        };
        $http.post('/api/get_module_name_casechild', reqdata).then(function (response) {
            $scope.module_name = response.data.obj[0].module_name;
            window.localStorage.setItem("module_name", $scope.module_name)

        });


        $scope.topicunit = window.localStorage.getItem("selected_topic_id");
        var reqdatas = {
            topicunit: $scope.topicunit
        };
        $http.post('/api/get_topic_name_casechild', reqdatas).then(function (response) {
            $scope.topic_name = response.data.obj[0].topic_name;
            $scope.topic_code = response.data.obj[0].qba_topic_code;
            window.localStorage.setItem("topic_name", $scope.topic_name);
            window.localStorage.setItem("topic_code", $scope.topic_code);

        });

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

            $scope.subjectId = window.localStorage.getItem("sid");
            $scope.courseId = window.localStorage.getItem("course_fk");
            $scope.topicId = window.localStorage.getItem("selected_topic_id");
            $scope.moduleId = window.localStorage.getItem("selected_module_id");

            $scope.newChildQuestion.topicId = $scope.topicId;
            $scope.newChildQuestion.moduleId = $scope.moduleId;
            $scope.newChildQuestion.subjectId = $scope.subjectId;
            $scope.newChildQuestion.courseId = $scope.courseId;
            $scope.newChildQuestion.marks = $scope.marks;
            $scope.newChildQuestion.negativeMarks = $scope.negativeMarks;
            $scope.newChildQuestion.question = CKEDITOR.instances["editor1"].getData();
            var str = CKEDITOR.instances["editor1"].document.getBody().getText().trim();

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
            //    $scope.newChildQuestion.remark = $scope.remark;
            $scope.newChildQuestion.remark = CKEDITOR.instances["editorremarks"].getData()
            //    $scope.newChildQuestion.calculations = $scope.calculations;
            $scope.newChildQuestion.calculations = CKEDITOR.instances["editorcalculation"].getData()
            //    $scope.newChildQuestion.reference = $scope.reference;
            $scope.newChildQuestion.reference = CKEDITOR.instances["editorreference"].getData()
            $scope.newChildQuestion.userName = $scope.username;
            $scope.parentQuestion.qbId = 0;
            var ckparent = window.localStorage.getItem("childqstpid");
            if ($scope.loginUser.role == 'VET' || $scope.loginUser.role == 'PUB') {

                $scope.saveCSQChildShortfall();

            }
            else if ($scope.parentQuestion.qbId == 0 && ckparent == 0) {

                $scope.saveParentAndChild();
            }
            else {

                $scope.saveChild();
            }

        };

        $scope.saveParentAndChild = function () {

            $scope.parentQuestion.courseId = $scope.courseId;
            var parameters = $scope.parentQuestion;
            var deferred = $q.defer();
            var transform = function (data) {
                return $.param(data);
            };
            $http.post('/api/save_csq_parent', parameters, {
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
                $http.post('/api/save_mcq_admin', $scope.newChildQuestion)
                    .then(function (response) {
                        // $scope.module_name = window.localStorage.getItem("module_name");
                        // $scope.topic_name = window.localStorage.getItem("topic_name");
                        $scope.updateChildCount();
                        alert('Data Saved Successfully.');
                        $state.go('add_csq_admin');
                    });
            }
            else {
                return false
            }
        };


        $scope.savereplacementalldata = function () {
            alert("cccccccccccc");
            // $http.post('/api/add_parent_question',data).then(function(response){
            // var childdata = response.data.obj;
            //     return $http.post('/api/add_child_question',childdata).then(function(response){
            //     // $window.location.reload();
            //  });


            // //$window.location.reload();

            // });

        };



















        // $scope.saveCSQChild = function() {


        //     $scope.subjectId = window.localStorage.getItem("sid");
        //     $scope.courseId = window.localStorage.getItem("course_fk");
        //     $scope.topicId = window.localStorage.getItem("topicunit");
        //     $scope.moduleId = window.localStorage.getItem("moduleID");

        //     $scope.newChildQuestion.topicId = $scope.topicId;
        //     $scope.newChildQuestion.moduleId = $scope.moduleId;
        //     $scope.newChildQuestion.subjectId = $scope.subjectId;
        //     $scope.newChildQuestion.courseId = $scope.courseId;
        //     $scope.newChildQuestion.marks = $scope.marks;
        //     $scope.newChildQuestion.negativeMarks = $scope.negativeMarks;
        //     $scope.newChildQuestion.question = CKEDITOR.instances["editor1"].getData();
        //     var str = CKEDITOR.instances["editor1"].document.getBody().getText().trim();

        //     if($scope.newChildQuestion.question == null || $scope.newChildQuestion.question == '' || 
        //         $scope.newChildQuestion.question == undefined || str == '') {
        //         alert('Please Enter Question');
        //         return;
        //     }

        //     $scope.newChildQuestion.numOfAlternatives = $scope.numOfOptions.value;
        //     var correctAns = $scope.selectedOption;

        //     var j=0;
        //     var str;
        //     for(var i = 0; i < $scope.newChildQuestion.alternatives.length; i++){
        //         var editorId = "editor" + $scope.newChildQuestion.alternatives[i].editorId;
        //         $scope.newChildQuestion.alternatives[i].text = CKEDITOR.instances[editorId].getData();
        //         str = CKEDITOR.instances[editorId].getData();
        //             str = str.replace(/&nbsp;/g," ").trim();

        //            if( str == null ||  str == '') {

        //                 if(j==0)
        //                    alert("Please enter all options.");
        //                         j++;
        //                     return;
        //             }

        //         $scope.newChildQuestion.alternatives[i].isCorrect = correctAns == i ? 'Y' : 'N';
        //     }
        //     if(correctAns == undefined || correctAns == null)
        //                 {
        //                     alert("Please select correct alternative.");
        //                     return;
        //                 }
        //     $scope.newChildQuestion.remark = $scope.remark;
        //     $scope.newChildQuestion.calculations = $scope.calculations;
        //     $scope.newChildQuestion.reference = $scope.reference;
        //     $scope.newChildQuestion.userName = $scope.loginUser.name;
        //     $scope.parentQuestion.qbId == 0;
        //     // var parameters = $scope.parentQuestion;
        //     // $http.post('/api/save_csq_parent_admin', parameters)
        //     // .then(function (response) {

        //     // });
        //         $scope.saveParentAndChild();

        // };



        // $scope.saveparentchilddata = function (){


        //     $scope.subjectId = window.localStorage.getItem("sid");
        //     $scope.courseId = window.localStorage.getItem("course_fk");
        //     $scope.topicId = window.localStorage.getItem("topicunit");
        //     $scope.moduleId = window.localStorage.getItem("moduleID");

        //     $scope.newChildQuestion.topicId = $scope.topicId;
        //     $scope.newChildQuestion.moduleId = $scope.moduleId;
        //     $scope.newChildQuestion.subjectId = $scope.subjectId;
        //     $scope.newChildQuestion.courseId = $scope.courseId;
        //     $scope.newChildQuestion.marks = $scope.marks;
        //     $scope.newChildQuestion.negativeMarks = $scope.negativeMarks;
        //     $scope.newChildQuestion.question = CKEDITOR.instances["editor1"].getData();
        //     var str = CKEDITOR.instances["editor1"].document.getBody().getText().trim();

        //     if($scope.newChildQuestion.question == null || $scope.newChildQuestion.question == '' || 
        //         $scope.newChildQuestion.question == undefined || str == '') {
        //         alert('Please Enter Question');
        //         return;
        //     }
        //     $scope.newChildQuestion.numOfAlternatives = $scope.numOfOptions.value;
        //     var correctAns = $scope.selectedOption;

        //     var j=0;
        //     var str;
        //     for(var i = 0; i < $scope.newChildQuestion.alternatives.length; i++){
        //         var editorId = "editor" + $scope.newChildQuestion.alternatives[i].editorId;
        //         $scope.newChildQuestion.alternatives[i].text = CKEDITOR.instances[editorId].getData();
        //         str = CKEDITOR.instances[editorId].getData();
        //             str = str.replace(/&nbsp;/g," ").trim();

        //            if( str == null ||  str == '') {

        //                 if(j==0)
        //                    alert("Please enter all options.");
        //                         j++;
        //                     return;
        //             }

        //         $scope.newChildQuestion.alternatives[i].isCorrect = correctAns == i ? 'Y' : 'N';
        //     }

        //     if(correctAns == undefined || correctAns == null)
        //     {
        //         alert("Please select correct alternative.");
        //         return;
        //     }
        //         $scope.newChildQuestion.remark = $scope.remark;
        //         $scope.newChildQuestion.calculations = $scope.calculations;
        //         $scope.newChildQuestion.reference = $scope.reference;
        //         $scope.newChildQuestion.userName = $scope.loginUser.name;
        //         $scope.parentQuestion.qbId == 0;
        //     //     $http.post('/api/save_csq_parent', parameters)
        //     // .then(function (response) {
        //     //     var savedParentQuestion = response.data.obj;
        //     //         $scope.parentQuestion.qb_pk = savedParentQuestion.qb_pk;
        //     //         $scope.parentQuestion.qbId = savedParentQuestion.qb_id;
        //     //         repositoryService.setParentQuestion($scope.parentQuestion);
        //     //     $scope.saveChild();

        //     // });


        //     $http.post('/api/save_csq_parent_admin',$scope.parentQuestion).then(function(response){
        //         var savedParentQuestion = response.data.obj;
        //             $scope.parentQuestion.qb_pk = savedParentQuestion.qb_pk;
        //             $scope.parentQuestion.qbId = savedParentQuestion.qb_id;
        //             repositoryService.setParentQuestion($scope.parentQuestion);
        //         $scope.saveChild();
        // 		// $http.post('/api/remove_alt_to_publish',toPubQuest).then(function(response){



        // 		// 	//	swal('Exam Published.');



        // 		// });
        // 	});

        // }

        // $scope.saveParentAndChild = function() {  

        //     var parameters = $scope.parentQuestion;
        //     //var deferred = $q.defer();
        //     // var transform = function (data) {
        //     //         return $.param(data);
        //     //     };

        //     // $http.post('/api/save_csq_parent',parameters, {
        //     //    // headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
        //     //    // transformRequest: transform,
        //     //    // timeout: 0
        //     // }).then(function (response) {
        //     //     var savedParentQuestion = response.data.obj;
        //     //     $scope.parentQuestion.qb_pk = savedParentQuestion.qb_pk;
        //     //     $scope.parentQuestion.qbId = savedParentQuestion.qb_id;
        //     //     repositoryService.setParentQuestion($scope.parentQuestion);

        //     //     $scope.saveChild();
        //     //     deferred.resolve(response);
        //     // }).catch(function (error) {
        //     //     deferred.reject(error);
        //     // });

        //     $http.post('/api/save_csq_parent', parameters)
        //     .then(function (response) {
        //         var savedParentQuestion = response.data.obj;
        //             $scope.parentQuestion.qb_pk = savedParentQuestion.qb_pk;
        //             $scope.parentQuestion.qbId = savedParentQuestion.qb_id;
        //             repositoryService.setParentQuestion($scope.parentQuestion);
        //         $scope.saveChild();

        //     });
        // };



        // $scope.saveChild = function() {

        //     $scope.newChildQuestion.parentId = $scope.parentQuestion.qbId;
        //     repositoryService.addChildQuestion($scope.newChildQuestion);
        //     $http.post('/api/save_mcq', $scope.newChildQuestion)
        //     .then(function (response) {
        //         $scope.updateChildCount();
        //         alert('Data Saved Successfully.');
        //         $state.go('add_csq_admin');
        //     });
        // };

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

            if (id == "editor1" || id == "editorremarks" || id == "editorcalculation" || id == "editorreference") {
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
            $scope.loadEditor('editorremarks', true);
            $scope.loadEditor('editorcalculation', true);
            $scope.loadEditor('editorreference', true);

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
        .controller('addCSQChildAdminController', addCSQChildAdminController);

    addCSQChildAdminController.$inject = ['$scope', '$state', '$filter', '$window', 'userService', 'repositoryService', '$http', '$sce', '$q', '$timeout'];

})();