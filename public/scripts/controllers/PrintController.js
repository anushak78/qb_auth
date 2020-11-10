(function () {
    'use strict';


    function PrintController($scope, $filter, $window, userService, repositoryService, $q, $http, examService, $state, $sce, $timeout) {

        window.localStorage.setItem("childqstpid", "0");
        $scope.repoQuestions = [];
        $scope.courseList = [];
        $scope.subjectList = [];
        $scope.topicList = [];
        $scope.method = "default";
        $scope.searchquerylist = {};
        $scope.searchquery = "";
        $scope.countquery = "";
        //$scope.validation = {};
        $scope.moduleError = "";
        $scope.vError = "";
        $scope.validationPass = false;
        $scope.moduleList;

        $scope.pageList = [];
        $scope.countQst = 0;
        //$scope.NoQstnList = repositoryService.getShowQuestionsPerPageList(); // comment by shilpa
        $scope.NoQstnList = [{ no_Qstn: 5 }, { no_Qstn: 10 }, { no_Qstn: 15 }, { no_Qstn: 20 }, { no_Qstn: 'ALL' }]; // added by shilpa
        $scope.selectNoQstn = $scope.NoQstnList[0];
        $scope.selectedModule = {};
        $scope.selectedCourse = {};
        $scope.selectedSubject = {};
        $scope.selectedTopic = {};
        $scope.languageList = [{ lang_name: 'ENGLISH' }];
        $scope.selectedLanguage = $scope.languageList[0];
        $scope.loginUser = userService.getUserData();
        $scope.username = JSON.parse(sessionStorage.getItem('username'));  // Dipika HSS//

        $scope.vetterRoleCode = 'VET';
        $scope.publisherRoleCode = 'PUB';

        $scope.userList = [];
        $scope.examMaster = examService.getExamMasterData();
        $scope.vettingInfo = {};
        $scope.selectedUser = {};

        $scope.existingVetterList = [];
        $scope.topicName = repositoryService.getSelectedTopic();
        $scope.exam_period = window.localStorage.getItem('exam_name');
        /*$scope.userList = [];
        var examMaster = examService.getExamMasterData();
        $scope.vettingInfo = {};
        $scope.selectedUser = {};
        
        $scope.existingVetterList = [];
        $scope.topicName = repositoryService.getSelectedTopic();*/ // comment by shilpa
        // $scope.subject_id = examService.getSubjectId(); // required when load from admin-dashboard page // comment by shilpa
        // $scope.subject_id =localStorage.getItem('sid');
        //line addded by sandip padekar
        //var exampaper_fk =  window.localStorage.getItem('e_pk');

        var loginRole = userService.getUserData();

        var toPubQuest = [];
        var toPubSFQuest = [];

        //var exampaper_fk = repositoryService.getExampaper_fk();// comment by shilpa
        var exampaper_fk = window.localStorage.getItem('e_pk');

        $scope.enableAssignButtons = false;
        $scope.enablePublishingButton = true;
        $scope.publishQuestValue = 'NO';
        $scope.pubquestvalue = {}; // added by shilpa
        $scope.dataset = {
            name: '--select--',
            schema: [{
                qba_module_pk: '',
                module_name: '',
                is_active: '',
                audit_by: '',
                audit_dt: '',
                // type: 'int',
                checked: false
                // joinCol: false
            }
                //, {
                //  id: 6,
                //   name: "sellerId",
                //   type: 'int',
                //  checked: false
                // joinCol: false
                //}
            ]
        };


        //var topicParams = repositoryService.getVetterQuestionsParameters();
        /* var courseName = examService.getCourseName();
         var subjectName = examService.getSubjectName();
         $scope.examStatus = examService.getExamStatus();*/ // comment by shilpa
        //code commented by sandip
        //  var courseName = localStorage.getItem('cname');
        // var subjectName = localStorage.getItem('sname');
        // $scope.examStatus = localStorage.getItem('es');
        //code start sandip padekar
        var courseName = window.localStorage.getItem('cname');
        var subjectName = window.localStorage.getItem('sname');
        $scope.examStatus = window.localStorage.getItem('es');

        //code end sandip padekar

        // var qstnPprId = repositoryService.getSelectedQuestionPaperId(); // comment by shilpa
        // var qstnPprId = localStorage.getItem('qid');   //sandip padekar    
        var qstnPprId = window.localStorage.getItem('qid');   //comment by dipika
        var exam_name = window.localStorage.getItem('exam_name');
        $scope.examMaster = {
            exam_name: ''
        };
        $scope.examMaster.qba_subject_master = {
            subject_name: ''
        };

        if (courseName != null && subjectName != null) {
            $scope.examMaster.exam_name = courseName;
            $scope.examMaster.qba_subject_master.subject_name = subjectName;
        } else {
            $scope.examMaster = examMaster;
        }
        /*  $scope.test = function(id,examName,qstnpaperId,sujectedId,coursename,subjectname,examId,exampaper_pk,module_ids,examstatus){
             $scope.currentQstnPaperId = qstnpaperId;
  
          }*/
        $scope.ckEditorFlag = false;
        $scope.isNormalInteger = function (str) {
            return /^[+]?([0-9]+(?:[\.][0-9]*)?|\.[0-9]+)(?:[eE][+-]?[0-9]+)?$/.test(str);
        };


        $scope.loadPrintData = function () {

            var exam_fkId = window.localStorage.getItem("eid");
            var exampaper_fk = window.localStorage.getItem("e_pk");
            var lang_name = window.localStorage.getItem("language");
            var es = window.localStorage.getItem("es");
            var parameters = {
                exam_fk: exam_fkId,
                examPaper: exampaper_fk,
                language: lang_name,
                es: es
            };
            $http.post('/api/load_admin_questions_for_print', parameters).then(function (response) {

                $scope.showfinalPrintpaper = response.data.data;

                //  $window.open('#!/PrintPageAdmin','_blank')
                // $state.go('PrintPageAdmin');
                // $window.open('#!/PrintPageAdmin','_blank')
                // $window.open('#!/PrintPage','_top')


            });
        };
        $scope.loadPrintData();
		
		$scope.getCharacter = function(index) {
			return String.fromCharCode(97+index)
		}




        $scope.getPubVettingStatus = function () {
            let qstnpaper_id = window.localStorage.getItem('qid');
            var req = {
                qstnpaper_id: qstnpaper_id
            };

            $http.post('/api/getPub_Vetting_Status', req).then(function (response) {
                $scope.pubvettingstatus = response.data.obj;
                // $scope.CKEdit();
            });
        };

        $scope.getPubVettingStatus();


        $scope.onPrint = function () {
            $timeout(function () {

                if (!$scope.ckEditorFlag) {

                    $scope.ckEditorFlag = true;
                    $(".editable").attr('contenteditable', 'false');
                    $scope.watchRepoQuestionChange();
                    /*if($scope.pubvettingstatus.length>0){
                          $(".editable").attr('contenteditable','false');
                      $scope.watchRepoQuestionChange();  
                    }
                    else{
                          $(".editable").attr('contenteditable','false');
                    }*/

                }

            }, 500);


        };


        $scope.finalprint = function () {
            //alert('dd');
            $window.print();
        };

        $scope.watchRepoQuestionChange = function () {
            // alert('dddee');
            // Watch for our DOM element's children to change
            var watch = $scope.$watch(function () {
                return $scope.showfinalPrintpaper[0].current_time;
            }, function () {
                // Once change is detected, use $evalAsync to wait for
                // directives to finish
                $scope.$evalAsync(function () {

                    // return $scope.CKEdit()
                    // .then($scope.print());   

                    $scope.CKEdit();


                });
            });
        };
        $scope.print = function () {
            //alert('dd');
            //window.print();
        };
        $scope.editorStates = {};
        function EditorState(editor) {
            this.editor = editor;
            this.checkedUsers = {};
        };

        $scope.selectUser = function () {

            var arr_ele = document.getElementsByClassName("editable");
            for (var i = 0; i < arr_ele.length; i++) {

                var state = $scope.editorStates[i];
                if (state) {

                    var lite = state.editor.plugins.lite;

                    lite && lite.findPlugin(state.editor).setUserInfo({ id: $scope.loginUser.id, name: $scope.loginUser.name });
                }
            }
        };
        $scope.renderAsHtml = function (val) {
            return $sce.trustAsHtml(val);
        };
        $scope.CKEdit = function () {

            CKEDITOR.disableAutoInline = true;

            //var arr_ele = document.getElementsByClassName("editable");
            var arr_ele = $(".editable");
            for (var i = 0; i < arr_ele.length; i++) {
                var a = arr_ele[i].getElementsByTagName('ins')
				var b = arr_ele[i].getElementsByTagName('del')
				if(a.length > 0 || b.length > 0) {
                    var editor = CKEDITOR.inline(arr_ele[i], {
                        //filebrowserBrowseUrl: '../ckeditor/ckeditor4.5/plugins/filemanager/browser/default/browser.html?Connector=/browser/browse',
                        // filebrowserImageUploadUrl: '/uploader/upload?Type=Image',
                        customConfig: "../ckeditor-conf.js",
                        on: {
                            instanceReady: function (evt) {
                                document.getElementById('board').style.visibility = 'hidden';
                            }
                        }
                    });
                }


                /* editor.on(LITE.Events.INIT, function(event) {
                     $scope.selectUser();
                 });
 
                 $scope.editorStates[i] = new EditorState(editor);*/
            }
            if (i == arr_ele.length || i == 0) {
                document.getElementById('board').style.visibility = 'hidden';
            }


        };

        angular.element(window).bind('load', function () {

            // $timeout($scope.CKEdit(), 1).then(window.print());
            //window.print();

        });




    }



    angular
        .module('qbAuthoringToolApp')
        .controller('PrintController', PrintController);


    PrintController.$inject = ['$scope', '$filter', '$window', 'userService',
        'repositoryService', '$q', '$http', 'examService', '$state', '$sce', '$timeout'];

})();

