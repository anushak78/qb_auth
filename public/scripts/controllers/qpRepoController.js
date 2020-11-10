

(function () {
  'use strict';

  function qpRepoController($scope, $state, $stateParams, $filter, $window, userService, repositoryService, $q, $http, $sce, $timeout) {
    $scope.repoQuestions = [];

    $scope.courseList = [];
    $scope.subjectList = [];
    $scope.moduleList = [{ module_name: 'ALL' }];
    $scope.languageList = [{ lang_name: 'ENGLISH' }];
    $scope.topicList = [];
    $scope.method = "default";
    $scope.searchquerylist = {};
    $scope.searchquery = "";
    $scope.countquery = "";
    $scope.uploadResultMsg = "";
    $scope.adminEditQuestion = {};
    $scope.adminCaseEditFlag = false;
    $scope.pageList = [];
    $scope.countQst = 0;
    $scope.NoQstnList = [{ no_Qstn: 5 }, { no_Qstn: 10 }, { no_Qstn: 15 }, { no_Qstn: 20 }];

    $scope.selectNoQstn = $scope.NoQstnList[0];//by default 5 records pagination
    $scope.selectedCourse = {};
    $scope.selectedSubject = {};
    $scope.selectedModule = $scope.moduleList[0];
    $scope.selectedLanguage = $scope.languageList[0];
    $scope.selectedTopic = {};
    $scope.showQstn = $scope.selectNoQstn.no_Qstn;
    $scope.loginUser = userService.getUserData();

    $scope.username = JSON.parse(sessionStorage.getItem('username'));  // Dipika HSS//
    $scope.role = JSON.parse(window.localStorage.getItem("role"));

    repositoryService.getPopulatedQuestions();
    var populatedQuestion = repositoryService.getPopulatedQuestions();
    $scope.renderAsHtml = function (val) {
      return $sce.trustAsHtml(val);
    };

    $scope.export = function () {
      let req = {
        course: $scope.selectedCourse.qba_course_pk,
        subject: $scope.selectedSubject.qba_subject_pk,
        module: $scope.selectedModule.qba_module_pk,
        language: $scope.selectedLanguage.lang_name
      };
      if ($scope.selectedCourse.qba_course_pk == undefined) {
        swal('Select course');
        return false;
      }
      else if ($scope.selectedSubject.qba_subject_pk == undefined) {
        swal('Select subject');
        return false;
      }
      $http.post('/api/exportQB', req)
        .then(function (response) {
          if (response.data.code == 1) {
            swal('Questions not available');
          } else {
            window.open(response.data.obj);
          }

        });

    };

    $scope.getStartedInitialization = function () {
      var noOfPage = 0;
      var remainder = 0;
      $scope.showQstn = $scope.selectNoQstn.no_Qstn;

      noOfPage = parseInt($scope.countQst / $scope.showQstn);

      remainder = $scope.countQst % $scope.showQstn

      if (remainder > 0)
        noOfPage = noOfPage + 1;

      if (noOfPage == 0)
        noOfPage = 1;

      var options = {
        currentPage: 1,
        totalPages: noOfPage,
        //numberOfPages:5,
        onPageClicked: function (e, originalEvent, type, page) {
          $scope.reloadData(page);
        },
        onPageChanged: function (e, oldPage, newPage) {
          if (e.target.id == "pagination2") {
            $('#pagination1').bootstrapPaginator("show", newPage);
          } else {
            $('#pagination2').bootstrapPaginator("show", newPage);
          }
        }
      };
      $('#pagination1').bootstrapPaginator(options);
      $('#pagination2').bootstrapPaginator(options);
    };

    $scope.showPagination = function () {
      $('.pagination').addClass('showPagination');
    }

    $scope.hidePagination = function () {
      $('.pagination').addClass('hidePagination');
    }

    $scope.resetQuestionData = function () {
      //   $scope.repoQuestions = [];
      $scope.topicList = [];
      $scope.selectedTopic = null;
      $scope.countQst = 0;
      $scope.pageList = [];
      $scope.moduleNameList = [];
      $scope.getStartedInitialization();
      $scope.hidePagination();

    };


    //added by shilpa
    $scope.editorStates = {};

    $scope.ckEditorFlag = false;

    $scope.destroyCKEditor = function () {

      var state;
      Object.keys($scope.editorStates).forEach(function (key) {
        state = $scope.editorStates[key];
        if (state) {
          state.editor.destroy();
        }
      });
      $scope.editorStates = {};
    };

    function EditorState(editor) {
      this.editor = editor;
      this.checkedUsers = {};
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
    $scope.marks = 1;
    $scope.negativeMarks = 0;
    $scope.numOfOptionsList = [{ value: 2 }, { value: 3 }, { value: 4 }, { value: 5 }, { value: 6 },
    { value: 7 }, { value: 8 }, { value: 9 }];
    $scope.numOfOptions = $scope.numOfOptionsList[2];
    $scope.newChildQuestion = {
      parentId: 0, courseId: 0, subjectId: 0, moduleId: 0, topicId: 0, question: '', marks: 0, negativeMarks: 0,
      numOfAlternatives: 4, type: 'CS', remark: '', calculations: '', reference: '', userName: '',
      alternatives: [{ editorId: 2, text: '', isCorrect: 'N' }, { editorId: 3, text: '', isCorrect: 'N' },
      { editorId: 4, text: '', isCorrect: 'N' }, { editorId: 5, text: '', isCorrect: 'N' }]
    };

    $scope.requestForAddChildQuestion = function (data, type) {

      if (type == 'P') {
        var Req = {
          qb_pk: data.qb_pk,
          qb_id: data.qb_id

        };
      }

      $http.post('/api/get_case_passage_details', Req)
        .then(function (response) {
          $scope.casePassage = response.data.data;
          $scope.parent_child_type = type;
          $scope.replace_id = data.qb_id;
        });
      //  if(!CKEDITOR.instances.editor1)
      //          {         
      if (CKEDITOR.instances.editor1 && CKEDITOR.instances.editorRemarks && CKEDITOR.instances.editorCalculations && CKEDITOR.instances.editorReference) {
        CKEDITOR.instances.editor1.setData("")
        CKEDITOR.instances.editorRemarks.setData("")
        CKEDITOR.instances.editorReference.setData("")
        CKEDITOR.instances.editorCalculations.setData("")
      }
      else {
        $scope.loadEditor('editor1', true);
        // }
        $scope.loadEditor('editorRemarks', true);
        $scope.loadEditor('editorReference', true);
        $scope.loadEditor('editorCalculations', true);
      }
      for (var i = 0; i < $scope.newChildQuestion.alternatives.length; i++) {
        var editorId = 'editor' + $scope.newChildQuestion.alternatives[i].editorId;
        if (!CKEDITOR.instances[editorId]) {
          $scope.loadEditor(editorId, true);
        }
        else {
          $scope.newChildQuestion.alternatives[i].isCorrect = "N"
          $scope.selectedOption = ''
          CKEDITOR.instances[editorId].setData("")
        }
      }


      /*  $timeout( function(){  
            for(var i = 0;i<$scope.newChildQuestion.alternatives.length;i++) {
                var editorId = 'editor'+$scope.newChildQuestion.alternatives[i].editorId; 
                if(!CKEDITOR.instances.editorId)
                { 
                $scope.loadEditor(editorId,true);
              }
            }    
        },50);*/

    };

    $scope.saveCSQChild = function () {
      $scope.newChildQuestion.parent_child_type = $scope.parent_child_type;
      $scope.newChildQuestion.replace_id = $scope.replace_id;

      $scope.newChildQuestion.parentId = $scope.casePassage[0].qb_id;
      $scope.newChildQuestion.topicId = $scope.casePassage[0].qba_topic_fk;
      $scope.newChildQuestion.moduleId = $scope.casePassage[0].qba_module_mstr.qba_module_fk;
      $scope.newChildQuestion.subjectId = $scope.casePassage[0].qba_subject_master.qba_subject_fk;
      $scope.newChildQuestion.courseId = $scope.casePassage[0].qba_course_master.qba_course_fk;
      $scope.newChildQuestion.marks = $scope.marks;
      $scope.newChildQuestion.negativeMarks = $scope.negativeMarks;
      $scope.newChildQuestion.question = CKEDITOR.instances["editor1"].getData().replace(/&#160;/g, '');
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
      $scope.newChildQuestion.remark = CKEDITOR.instances["editorRemarks"].getData().replace(/&#160;/g, '');
      $scope.newChildQuestion.calculations = CKEDITOR.instances["editorCalculations"].getData().replace(/&#160;/g, '');
      $scope.newChildQuestion.reference = CKEDITOR.instances["editorReference"].getData().replace(/&#160;/g, '');
      $scope.newChildQuestion.userName = $scope.username;

      var parentId = {
        qb_id: $scope.casePassage[0].qb_id
      };
      var req = $scope.newChildQuestion;
      var alertdialog = confirm("Are you sure you want to save the child question?")
      if (alertdialog) {
        return $http.post('/api/save_qstn_bank_csq_child', req)
          .then(function (response) {
            $http.post('/api/updateqstn_bank_csq_child_count', parentId)
              .then(function (res) {
                alert("QBID " + response.data.qb_id + " Saved Successfully.");
                $('#closechildmodal').click();
                $scope.reloadPage();

              });
          });
      }

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

    $scope.resetCourseModuleLanguage = function () {


      $('#qpCourseList').val('');
      $('#qpSubjectList').val('');

      $scope.moduleList = [{ module_name: 'ALL' }];
      $scope.selectedModule = $scope.moduleList[0];

      $scope.loadLanguages();


    };

    $scope.getSubjectList = function (isOnLoad) {
      $scope.resetQuestionData();
      if ($scope.selectedCourse == null) {
        $scope.subjectList = [];
        $scope.moduleList = [{ module_name: 'ALL' }];
        $scope.selectedModule = $scope.moduleList[0];
        return;
      }
      var courseId = $scope.selectedCourse.qba_course_pk;
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
        // alert(JSON.stringify($scope.subjectList));
        deferred.resolve(response);
      }).catch(function (error) {
        deferred.reject(error);
      });
      if (isOnLoad == 'Y') {
        var subject = repositoryService.getSelectedSubject()
        $scope.selectedSubject = subject
      }
    };

    $scope.getModuleList = function () {
      $scope.resetQuestionData();
      if ($scope.selectedSubject == null) {
        $scope.moduleList = [{ module_name: 'ALL' }];
        $scope.selectedModule = $scope.moduleList[0];
        return;
      }
      var subjectId = $scope.selectedSubject == null ? 0 : $scope.selectedSubject.qba_subject_pk;
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
        var selectAllModules = { module_name: 'ALL', qba_module_pk: "0" };
        $scope.moduleList.unshift(selectAllModules);
        $scope.selectedModule = $scope.moduleList[0];
        $scope.getTopicList();
        deferred.resolve(response);
      }).catch(function (error) {
        deferred.reject(error);
      });
    };

    $scope.getTopicList = function () {
      $scope.resetQuestionData();
      var moduleId = 0;
      var lang_name = '';
      if ($scope.selectedModule != null && $scope.selectedModule.module_name == 'ALL') {
        var arr_module_pk = [];
        for (var i = 1; i < $scope.moduleList.length; i++) {
          arr_module_pk.push($scope.moduleList[i].qba_module_pk);
        }
        moduleId = arr_module_pk;
      } else if ($scope.selectedModule != null) {
        moduleId = $scope.selectedModule.qba_module_pk;
      }

      if ($scope.selectedLanguage != null) {
        lang_name = $scope.selectedLanguage.lang_name;
      }

      var parameters = { id: moduleId, language: lang_name };
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
        var moduleName = [];
        response.data.obj.forEach(function (data) {
          moduleName.push(data.module_name);
        });
        // $scope.moduleNameList = $.unique(moduleName);
        $scope.moduleNameList = {
          modules: $.unique(moduleName),
          module_count: []
        };

        $.unique(moduleName).forEach(function (data) {
          var modulen = data;
          var sum = 0;

          response.data.obj.forEach(function (data1) {
            if (data == data1.module_name) {
              sum = (parseInt(sum) + parseInt(data1.qcount));
            }
          });
          $scope.moduleNameList.module_count.push(sum);
        });
        deferred.resolve(response);
      }).catch(function (error) {
        deferred.reject(error);
      });
    };


    $scope.populateQuestions = function (topic) {
      $scope.selectedTopic = topic;
      var lang_name = '';
      repositoryService.setPopulatedQuestions(topic);


      $scope.method = "default";

      if ($scope.selectedLanguage != null) {
        lang_name = $scope.selectedLanguage.lang_name;
      }

      var parameters = { language: lang_name, id: topic.qba_topic_pk, off: 0, lim: $scope.selectNoQstn.no_Qstn };
      var deferred = $q.defer();
      var transform = function (data) {
        return $.param(data);
      };
      $http.post('/api/load_questions', parameters, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
        transformRequest: transform,
        timeout: 0
      }).then(function (response) {

        $scope.repoQuestions = response.data.data;
        $scope.countQst = response.data.count;
        $scope.showOffset = 0;
        $scope.showPages();
        $scope.getStartedInitialization();
        deferred.resolve(response);
        var qst_pid = '0';
        $scope.no_of_question = 0;
        $scope.index_of_question = [];
        for (var i = 0; i <= $scope.repoQuestions.length; i++) {
          if ($scope.repoQuestions[i].qst_type == 'CS' && $scope.repoQuestions[i].qst_pid != '0') {
            if ($scope.repoQuestions[i].qst_pid == qst_pid) {
              $scope.no_of_question++;
              $scope.repoQuestions[i].index_of_question = $scope.no_of_question;
            } else {
              $scope.no_of_question = 0;
              $scope.no_of_question++;
              $scope.repoQuestions[i].index_of_question = $scope.no_of_question;
              qst_pid = $scope.repoQuestions[i].qst_pid;
            }
          }
        }
      }).catch(function (error) {
        deferred.reject(error);
      });
      $scope.showPagination();

    };

    /* Author: Dhiraj, once admin edits then it shows the same selected screen */
    if (!$.isEmptyObject(repositoryService.geteditAdminQuestion())) {
      $scope.populateQuestions(populatedQuestion);
      window.scrollTo(0, 0);
    }


    $scope.countTopicListQuestions = function () {
      if ($scope.topicList == null || $scope.topicList.length == 0) {
        if ($scope.countQst == null) {
          return 0;
        }
        else {
          return $scope.countQst
        }
      }
      else {
        var questionCount = 0;
        for (var i = 0; i < $scope.topicList.length; i++) {
          questionCount = questionCount + parseInt($scope.topicList[i].qcount);
        }

        return questionCount;

      }
    }

    $scope.prepareCSQDetails = function () {
      $scope.setExamDetails();
      var parentQuestion = { qbId: 0, question: '' };
      repositoryService.setParentQuestion(parentQuestion);
      repositoryService.setChildQuestionList([]);
    }

    $scope.setExamDetails = function () {

      repositoryService.setSelectedCourse($scope.selectedCourse);
      repositoryService.setSelectedSubject($scope.selectedSubject);
      repositoryService.setSelectedModule($scope.selectedModule);
      repositoryService.setSelectedTopic($scope.selectedTopic);
    }

    var count = 1;

    $scope.searchCriteria =
      [{ id: count, condition: '', valuePrefix: '', value: '', addRemove: 'add' }];

    $scope.addRow = function (rowId) {
      $scope.searchCriteria.push({ id: ++count, condition: '', valuePrefix: '', value: '', addRemove: 'remove' });
    };

    $scope.removeRow = function (rowId) {

      for (var i = 0; i < $scope.searchCriteria.length; i++) {
        if ($scope.searchCriteria[i].id == rowId) {
          $scope.searchCriteria.splice(i, 1);
          break;
        }
      }

    };


    $scope.submitCriteria = function () {

      var validCriteria = $scope.validateCriteria();
      //$scope.selectNoQstn=$scope.NoQstnList[0];
      //  alert("valid ="+validCriteria);
      if (validCriteria == "false") {
        alert("Insufficient search criteria." + "\n" + "Please select criteria for search!!");
      }
      else {
        document.getElementById('searchbtn').setAttribute("data-dismiss", "modal");
        $scope.method = "search";

        /* var query="select qb_pk,qba_course_name,subject_name,topic_name,qst_marks,"+
                  "  qst_neg_marks,qst_lang,qst_type,qst_pid,qst_body,qst_no_of_altr,"+
                     "  qta_alt_desc,qta_is_corr_alt,qst_remarks,calculation_info,reference_info,"+
                     "  qst_is_active from  qstn_bank"+
                     "  inner join qba_topic_master on (qba_topic_master.qba_topic_pk=qstn_bank.qba_topic_fk)"+
                     "  inner join qba_subject_master on (qba_subject_master.qba_subject_pk=qba_topic_master.qba_subject_fk)"+
                     "  inner join qba_course_master on (qba_course_master.qba_course_pk=qba_subject_master.qba_course_fk)"+
                     "  inner join qstn_alternatives on(qstn_alternatives.qta_qst_id=qstn_bank.qb_pk)";*/
        var cntQuery = "select count(*) qcount from  qstn_bank" +
          " inner join qba_topic_master on (qba_topic_master.qba_topic_pk=qstn_bank.qba_topic_fk)" +
          " inner join qba_module_mstr on (qba_module_mstr.qba_module_pk=qba_topic_master.qba_module_fk)" +
          " inner join qba_subject_master on (qba_subject_master.qba_subject_pk=qba_module_mstr.qba_subject_fk)" +
          " inner join qba_course_master on (qba_course_master.qba_course_pk=qba_subject_master.qba_course_fk)";

        var query = "select *, qta_is_corr_alt,qta_alt_desc,alterimage.qbi_image_name as aimage from " +
          " (select dense_rank()over(order by  un_id) rnk,qb_pk," +
          " qba_course_name,qba_course_code,subject_name,qba_subject_code,module_name,topic_name,qba_topic_code,qst_marks,qst_neg_marks," +
          " qst_lang,qst_type,qst_pid," +
          //qst_body
          " case when qst_img_fk is not null then" +
          " concat(qst_body, '<img src=\"static/controllers/output/',qbi_image_name::text, '\">') else qst_body end as qst_body " +
          ",qst_no_of_altr,qst_remarks,calculation_info," +
          "  reference_info,qst_is_active,qst_audit_by,qst_audit_dt,questionimage.qbi_image_name as qimage,qb_id from  (" +
          " select qb_pk un_id,* from qstn_bank a  " +
          " where (case when  qst_type  = 'CS' and qst_pid  > 0  then 1 else 2 end) =2" +
          " union ALL" +
          " select a.qb_pk un_id,b.* from qstn_bank a  " +
          " inner join  qstn_bank b on  a.qst_lang= b.qst_lang and a.qb_id=b.qst_pid  " +
          " where  a.qst_type = 'CS' and a.qst_pid = 0  " +
          " )qstn_bank" +
          " inner join qba_topic_master on (qba_topic_master.qba_topic_pk=qstn_bank.qba_topic_fk)" +
          " inner join qba_module_mstr on (qba_module_mstr.qba_module_pk=qba_topic_master.qba_module_fk)" +
          " inner join qba_subject_master on (qba_subject_master.qba_subject_pk=qba_module_mstr.qba_subject_fk)" +
          " inner join qba_course_master on (qba_course_master.qba_course_pk=qba_subject_master.qba_course_fk)" +
          " LEFT OUTER JOIN qbank_images as questionimage ON  (qstn_bank.qst_img_fk = questionimage.qbi_pk)";

        if ($scope.searchCriteria.length > 0) {
          for (var i = 0; i < $scope.searchCriteria.length; i++) {

            var operator = getOperator($scope.searchCriteria[i].valuePrefix);
            var operation = getOperation($scope.searchCriteria[i].valuePrefix, $scope.searchCriteria[i].value);


            if (i == 0) {
              query += " where ";
              cntQuery += " where ";
            }
            else {
              query += " and ";
              cntQuery += " and ";
            }

            var column = "LOWER(" + hashmap[$scope.searchCriteria[i].condition] + ")";

            if ($scope.searchCriteria[i].condition == "Marks" || $scope.searchCriteria[i].condition == "Question Id")
              column = hashmap[$scope.searchCriteria[i].condition];


            query += column + " " + operator + " " + operation;
            /* if($scope.searchCriteria[i].condition=="Question Id"){
              query +="or qst_pid "+operator+" "+operation;
             }*/
            cntQuery += column + " " + operator + " " + operation;
            //  query += "and "\\"qb_pk"\\"="\\"questionBankQbPk"\\"";

          }
          query += "order by qb_pk";

          $scope.searchquery = query;
          $scope.countquery = cntQuery;


          $scope.searchquerylist = { searchQry: $scope.searchquery, limit: $scope.selectNoQstn.no_Qstn, offset: 0, countQry: $scope.countquery };
          // alert( "final query is: "+query);
          $http.post('/api/searchQb', $scope.searchquerylist)
            .then(function successCallback(object) {
              var response = object.data;
              //userService.setUserData(uname, password,response.role);
              //  alert(response.data[0].qb_id);
              if (response.code == 0) {
                $scope.repoQuestions = response.data;

                $scope.countQst = response.count;
                $scope.showPages();
                $scope.getStartedInitialization();
                $scope.resetValue()
                // $state.go('qp_repository');
              }
              else {
                alert(response.message);
                $scope.resetValue()
                //$scope.resetQuestionData();
              }

            }, function errorCallback(object) {
              alert("No Records found");
              $scope.resetQuestionData();
              $scope.resetValue()
            });
        }
      }


    };
    $scope.resetValue = function () {
      // alert($scope.searchCriteria.length);

      for (var i = 0; i < $scope.searchCriteria.length; i++) {
        if (i == 0) {
          //alert("clearing "+$scope.searchCriteria[i].id+" row");
          $scope.searchCriteria = [{ id: 1, condition: '', valuePrefix: '', value: '', addRemove: 'add' }];

        }
        else {
          //alert("removing "+$scope.searchCriteria[i].id+" row");
          $scope.removeRow($scope.searchCriteria[i].id);
        }

      }

    };
    $scope.reloadPage = function () {

      if ($scope.method == "default" && ($scope.selectedCourse == null ||
        $scope.selectedSubject == null || $scope.selectedTopic == null)) {
        return;
      }

      // alert("into Reload page "+JSON.stringify($scope.selectNoQstn));
      $scope.showQstn = $scope.selectNoQstn.no_Qstn;
      //var showQstn=$scope.selectNoQstn.no_Qstn;
      $scope.showPages();
      $scope.reloadData(1);
      $scope.getStartedInitialization();

    }
    $scope.validateCriteria = function () {
      var flag = "false";
      if ($scope.searchCriteria.length > 0) {
        // alert("length="+$scope.searchCriteria.length );
        for (var i = 0; i < $scope.searchCriteria.length; i++) {
          if ($scope.searchCriteria[i].condition == ""
            || $scope.searchCriteria[i].valuePrefix == ""
            || $scope.searchCriteria[i].value == "") {

            flag = "false";
            break;
          }
          else {
            flag = "true";
            continue;

          }

        }
      }
      else {
        flag = "false";
      }

      return flag;
    };

    $scope.preImportFile = function () {
      if ($('#file')[0].files[0] === undefined) {
        alert('Please select file to upload');
      }
      else {
        swal({
          title: "Are you sure",
          text: "you want to upload the QB?",
          buttons: true,
          dangerMode: true,
        })
          .then((willDelete) => {
            if (willDelete) {
              $scope.importFile()
            }
          });
      }
    }


    $scope.importFile = function () {
      var formData = new FormData();

      if ($('#file')[0].files[0] === undefined) {
        alert('Please select file to upload');
        //changes made over here
      } else if ($('#file')[0].files[0].name.split(".")[$('#file')[0].files[0].name.split(".").length - 1] == 'zip') {

        formData.append('uploadFileType', $('#file').val());
        formData.append('userName', $scope.username);

        angular.forEach($('#file')[0].files, function (v, k) {                        //fd.append('file', files[k]);

          formData.append('file', $('#file')[0].files[k]);
        });

        // formData.append('file', $('#file')[0].files[0]);

        // $("#loader").show();
        //changes done here. here
        $timeout(function () {
          $.ajax({
            url: window.location.origin + '/api/saveFiles',
            type: 'POST',
            data: formData,
            processData: false,  // tell jQuery not to process the data
            contentType: false,  // tell jQuery not to set contentType
            success: function (data) {
              if (data.code == 3) {
                swal("Zip file does not contain xlsx file.")
                return 0;
              }
            }
          })
        })

        $timeout(function () {
          $.ajax({
            url: window.location.origin + '/api/import',
            type: 'POST',

            data: formData,
            processData: false,  // tell jQuery not to process the data
            contentType: false,  // tell jQuery not to set contentType
            success: function (data) {

              console.log(data)
              if (data['code'] == 0) {

                var req = {
                  sr_no: 1,
                  filepath: data['obj']
                };

                $http.post('/api/updateInvalidQ', req)
                  .then(function (response) {

                    if (data['validcount'] > 0) {
                      $http.post('/api/updateQstPid', req)
                        .then(function (response) {
                          window.open(data['obj']);
                          swal('Data Uploaded Successfully.');
                        });

                    } else {
                      window.open(data['obj']);
                      swal('All data are invalid');
                    }
                  });

              }
              else if (data['code'] == 1) {

                var req = {
                  sr_no: 1,
                  filepath: ""
                };
                $http.post('/api/updateInvalidQ', req)
                  .then(function (response) {
                    if (response.data['code'] == 1) {
                      window.open(response.data['filepath']);
                      if (data['validcount'] > 0) {
                        swal('Data Uploaded Successfully.');

                      }
                    } else {
                      swal('Data Uploaded Successfully.');

                    }

                    $http.post('/api/updateQstPid', req)
                      .then(function (response) {


                      });
                  });
              }
              else if (data['code'] == 2) {
                swal('Invalid data format , columns not matched');
              }
              else if (data['code'] == 3) {
                swal('Zip folder does not contain an excel file.');
              }
              else {

                var errorMsg = "";

                if (data['error'] == "error") {
                  errorMsg += "Question upload failed for following ID's as questions for these QBID's already exist, Kindly upload file with unique QBID's :" + "\n" + "\n" + data['error'] + "\n" + "\n";
                }

                if (data['courseError'] == "courseError") {
                  errorMsg += "Question upload failed for following course as course doesn't exists:" + "\n" + "\n" + removeDuplicates(data['courseError']) + "\n" + "\n";
                }
                if (data['courseDeactive'] == "courseDeactive") {
                  errorMsg += "Question upload failed for following course as course is inactive:" + "\n" + "\n" + removeDuplicates(data['courseDeactive']) + "\n" + "\n";
                }

                if (data['subjectError'] == "subjectError") {
                  errorMsg += "Question upload failed for following subject as subject doesn't exists:" + "\n" + "\n" + removeDuplicates(data['subjectError']) + "\n" + "\n";
                }
                if (data['topicError'] == "topicError") {
                  errorMsg += "Question upload failed for following topic as topic doesn't exists:" + "\n" + "\n" + removeDuplicates(data['topicError']) + "\n" + "\n";
                }

                if (data['subjectDeactive'] == "subjectDeactive") {
                  errorMsg += "Question upload failed for following subject as subject is inactive:" + "\n" + "\n" + removeDuplicates(data['subjectDeactive']) + "\n" + "\n";
                }
                if (data['topicDeactive'] == "topicDeactive") {
                  errorMsg += "Question upload failed for following topic as topic is inactive:" + "\n" + "\n" + removeDuplicates(data['topicDeactive']) + "\n" + "\n";
                }
                if (data['languageError'] == "languageError") {
                  errorMsg += "Question upload failed for following lanuage as language does not exists:" + "\n" + "\n" + removeDuplicates(data['languageError']) + "\n" + "\n";
                }
                if (data['moduleError'] == "moduleError") {
                  errorMsg += "Question upload failed for following module as module does not exists:" + "\n" + "\n" + removeDuplicates(data['moduleError']) + "\n" + "\n";
                }
                if (data['marksError'] == "marksError") {
                  errorMsg += "Question upload failed for following marks as marks does not exists:" + "\n" + "\n" + removeDuplicates(data['marksError']) + "\n" + "\n";
                }
                if (data['moduleDeactive'] == "moduleDeactive") {
                  errorMsg += "Question upload failed for following module as module is inactive:" + "\n" + "\n" + removeDuplicates(data['moduleDeactive']) + "\n" + "\n";
                }
                if (data['languageDeactive'] == "languageDeactive") {
                  errorMsg += "Question upload failed for following language as language is inactive:" + "\n" + "\n" + removeDuplicates(data['languageDeactive']) + "\n" + "\n";
                }

                swal(errorMsg);
              }

              $("#close-modal").click();


              // $scope.resetCourseModuleLanguage();


              $scope.resetQuestionData();
            }
          });
        }, 800);
      } else {
        alert('Please select file of .zip format');
      }
      $('#file').val('');

    };
    $scope.reloadData = function (rowNum) {
      $scope.repoQuestions = [];
      var page = rowNum;
      $scope.showOffset = ((page - 1) * $scope.showQstn);
      var offset = ((page - 1) * $scope.showQstn);
      var limit = $scope.showQstn;

      if ($scope.method == "default") {

        var topic = [];
        var lang_name = '';
        // alert("into reload");
        topic = $scope.selectedTopic;
        if ($scope.selectedLanguage != null) {
          lang_name = $scope.selectedLanguage.lang_name;
        }


        offset = ((page - 1) * $scope.showQstn) + 1;//start
        limit = $scope.showQstn * page;//end

        var parameters = { language: lang_name, id: topic.qba_topic_pk, off: offset, lim: limit };
        //alert("paras ="+JSON.stringify(parameters))
        var deferred = $q.defer();
        var transform = function (data) {
          return $.param(data);
        };
        $http.post('/api/load_questions', parameters, {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
          transformRequest: transform,
          timeout: 0
        }).then(function (response) {
          $scope.repoQuestions = response.data.data;
          $scope.no_of_question = 0;
          $scope.index_of_question = [];
          var qst_pid = '0'
          for (var i = 0; i < $scope.repoQuestions.length; i++) {
            if ($scope.repoQuestions[i].qst_type == 'CS' && $scope.repoQuestions[i].qst_pid != '0') {
              if ($scope.repoQuestions[i].qst_pid == qst_pid) {
                $scope.no_of_question++;
                $scope.repoQuestions[i].index_of_question = $scope.no_of_question;
              } else {
                $scope.no_of_question = 0;
                $scope.no_of_question++;
                $scope.repoQuestions[i].index_of_question = $scope.no_of_question;
                qst_pid = $scope.repoQuestions[i].qst_pid;
              }
            }
          }
          deferred.resolve(response);
        }).catch(function (error) {
          deferred.reject(error);
        });

      }
      else if ($scope.method == "search") {

        offset = ((page - 1) * $scope.showQstn) + 1;//start
        limit = $scope.showQstn * page;//end

        $scope.searchquerylist = { searchQry: $scope.searchquery, limit: limit, offset: offset, countQry: $scope.countquery };
        // alert( "final query is: "+query);
        $http.post('/api/searchQb', $scope.searchquerylist)
          .then(function successCallback(object) {
            var response = object.data;

            if (response.code == 0) {
              $scope.repoQuestions = response.data;

              $scope.countQst = response.count;
              $scope.showPages();

            }
            else {
              alert(response.message);
              $scope.resetQuestionData();
            }

          }, function errorCallback(object) {
            alert("No Records found");
            $scope.resetQuestionData();
          });

      }

    }
    $scope.showPages = function () {
      var noOfPage = 0;
      // alert("numbr of questn="+$scope.countQst);
      if ($scope.countQst != 0) {
        $scope.pageList = [];
        $scope.showQstn = $scope.selectNoQstn.no_Qstn;

        noOfPage = ($scope.countQst / $scope.showQstn);

        //alert("numbr of Pages="+noOfPage);
        for (var i = 0; i < noOfPage; i++) {
          $scope.pageList.push(
            {
              id: (i + 1)
            }
          )
        }
        //alert("page list= "+JSON.stringify($scope.pageList));

      }
    }
    $scope.remarkTabClicked = function (id) {
      var remarkId = 'remark' + id;
      var referenceId = 'reference' + id;
      var calculationId = 'calculation' + id;

      $('#' + remarkId).toggle();
      $('#' + referenceId).hide();
      $('#' + calculationId).hide();

      /* var remarkLiId = 'remarkLi' + id;
       if($('#'+remarkLiId).hasClass('active')){
         $('#'+remarkLiId).removeClass('active');
       } else {
         $('#'+remarkLiId).addClass('active');
       }*/
    }

    $scope.referenceTabClicked = function (id) {
      var remarkId = 'remark' + id;
      var referenceId = 'reference' + id;
      var calculationId = 'calculation' + id;

      $('#' + remarkId).hide();
      $('#' + referenceId).toggle();
      $('#' + calculationId).hide();
    }

    $scope.calculationTabClicked = function (id) {
      var remarkId = 'remark' + id;
      var referenceId = 'reference' + id;
      var calculationId = 'calculation' + id;

      $('#' + remarkId).hide();
      $('#' + referenceId).hide();
      $('#' + calculationId).toggle();
    }

    $scope.historyTabClicked = function (q_id) {
      var parameters = { questionId: q_id };
      var deferred = $q.defer();
      var transform = function (data) {
        return $.param(data);
      };
      $http.post('/api/load_appeared_exam_info', parameters, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
        transformRequest: transform,
        timeout: 0
      }).then(function (response) {
        console.log(response)
        $scope.questionHistoryList = response.data.obj;
        deferred.resolve(response);
      }).catch(function (error) {
        deferred.reject(error);
      });
    };

    //Author: Dhiraj Edit Question For Admin 
    $scope.editQuestionForAdmin = function (questionData) {
      repositoryService.seteditAdminQuestion(questionData);
      $scope.setExamDetails();
      $state.go('adminEditQuestion');
    }

    $scope.editCaseForAdmin = function (caseData) {
      $scope.adminCaseEditFlag = true;
      repositoryService.setadminCaseEditFlag($scope.adminCaseEditFlag);
      repositoryService.seteditAdminQuestion(caseData);
      $scope.setExamDetails();
      $state.go('addcsq_parent');
    }

    //Author: Sanjana load languages
    $scope.loadLanguages = function () {
      $http.post('/api/get_languages')
        .then(function (response) {
          $scope.languageList = response.data.obj;
          $scope.selectedLanguage = $scope.languageList[0];
        })
    };

    function removeDuplicates(arr) {
      let unique_array = []
      for (let i = 0; i < arr.length; i++) {
        if (unique_array.indexOf(arr[i]) == -1) {
          unique_array.push(arr[i])
        }
      }
      return unique_array
    }

    angular.element(document).ready(function () {
      $scope.loadLanguages();
      var deferred = $q.defer();


      $http.post('/api/load_qbrepo_courses', {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' }
      }).then(function (response) {
        $scope.courseList = response.data.obj;
        //  alert(JSON.stringify($scope.courseList));                  
        var course = repositoryService.getSelectedCourse()
        $scope.selectedCourse = course

        $scope.getSubjectList('Y')
        $scope.getModuleList()
        deferred.resolve(response);
      }).catch(function (error) {
        deferred.reject(error);
      });

    });

    $scope.editorStates = {};

    $scope.ckEditorFlag = false;

    $scope.destroyCKEditor = function () {

      var state;
      Object.keys($scope.editorStates).forEach(function (key) {
        state = $scope.editorStates[key];
        if (state) {
          state.editor.destroy();
        }
      });
      $scope.editorStates = {};
    };
    $scope.watchRepoQuestionChange = function () {

      // Watch for our DOM element's children to change
      var watch = $scope.$watch(function () {
        if ($scope.repoQuestions[0])
          return $scope.repoQuestions[0].current_time;
      }, function () {
        // Once change is detected, use $evalAsync to wait for
        // directives to finish
        $scope.$evalAsync(function () {
          //
          $scope.CKEdit();

        });
      });
    };

    $scope.CKEdit = function () {
      //alert("jjjj");
      CKEDITOR.disableAutoInline = true;
      var arr_ele = document.getElementsByClassName("editable");
      for (var i = 0; i < arr_ele.length; i++) {
        var editor = CKEDITOR.inline(arr_ele[i], {
          filebrowserBrowseUrl: '../ckeditor/ckeditor4.5/plugins/filemanager/browser/default/browser.html?Connector=/browser/browse',
          filebrowserImageUploadUrl: '/uploader/upload?Type=Image',
          //customConfig: "../ckeditor-conf.js"
          customConfig: "../ckeditor-addMcq-conf.js"
        });


        /*editor.on(LITE.Events.INIT, function(event) {
          $scope.selectUser();
        });*/

        $scope.editorStates[i] = new EditorState(editor);
      }


    };

    $scope.autoSaveQBPepo = function () {
      $http.post('/api/update_qb_inline', $scope.repoQuestions)
        .then(function (response) {
          $http.post('/api/update_qb_alternatives', $scope.repoQuestions)
            .then(function (response) {
              /*$http.post('/api/create_qb_alternatives', $scope.repoQuestions)
              .then(function (response) {
               // saveLog();
              });*/
            });
        });
    };

    $scope.changeSelectedOption = function (event, index, alt, parentIndex, qb_id, qb_pk) {


      var that = this;
      swal({
        title: "Do you want to change the correct answer?",
        text: "",
        dangerMode: true,
        buttons: ["No", "Yes!"],
      })
        .then((willDelete) => {
          if (willDelete) {

            for (var i = 0; i < alt.length; i++) {
              if (alt[i].qta_is_corr_alt == 'Y') {
                alt[i].qta_is_corr_alt = 'N';
              }
            }
            alt[index].qta_is_corr_alt = 'Y';
            $scope.repoQuestions[parentIndex].qstn_alternatives = alt;
            var req = {
              qb_id: qb_id,
              new_alt_id: alt[index].qta_pk,
              qb_pk: qb_pk,
              userName: JSON.parse(sessionStorage.getItem('username'))
            };
            $http.post('/api/update_QB_alt_correct_ans', req)
              .then(function (response) {
                $scope.reloadPage();
              });
            //$scope.safeApply();
            // $scope.alternativeslogTabClicked(qb_id);
          }
          else {
            for (var i = 0; i < alt.length; i++) {
              if (alt[i].qta_is_corr_alt == 'Y') {
                $("#radio" + parentIndex + i).prop("checked", true);
              }
            }
          }
        });


    };


    $scope.saveQuestBank = function () {
      /* $http.post('/api/update_qb_inline', $scope.repoQuestions)
         .then(function (response) {
           $http.post('/api/delete_qb_alternatives', $scope.repoQuestions)
           .then(function (response) {
             $http.post('/api/create_qb_alternatives', $scope.repoQuestions)
             .then(function (response) {*/
      swal('Questions Updated Successfully');
      /*     // saveLog();
          });
        });
      });*/
      //  $scope.getCKInstances("2")

    }

    $scope.getCKInstances = function (id) {
      for (var i = 0; i < $scope.repoQuestions.length; i++) {
        if ($scope.repoQuestions[i].qb_id == id) {
          if ($scope.repoQuestions[i].qst_lang == 'ENGLISH') {
            $scope.repoQuestions[i].qst_body = CKEDITOR.instances[id].getData();
            $scope.repoQuestions[i].qst_audit_by = $scope.username
          }
          else {
            return
          }
        }
      }
      $scope.autoSaveQBPepo()
    }
    $scope.getCKInstanceAlternatives = function (id, qba_id) {
      for (var i = 0; i < $scope.repoQuestions.length; i++) {
        if ($scope.repoQuestions[i].qb_id == qba_id) {
          if ($scope.repoQuestions[i].qst_lang == 'ENGLISH') {
            for (var j = 0; j < $scope.repoQuestions[i].qstn_alternatives.length; j++) {
              if ($scope.repoQuestions[i].qstn_alternatives[j].qta_pk == id) {
                $scope.repoQuestions[i].qstn_alternatives[j].qta_alt_desc = CKEDITOR.instances[id].getData()
                $scope.repoQuestions[i].qst_audit_by = $scope.username
                break;
              }
            }
          }
          else {
            return
          }
        }
      }
      $scope.autoSaveQBPepo()
    }
    $scope.getCKInstanceRemarks = function (id) {
      for (var i = 0; i < $scope.repoQuestions.length; i++) {
        if ($scope.repoQuestions[i].qb_id == id) {
          if ($scope.repoQuestions[i].qst_lang == 'ENGLISH') {
            $scope.repoQuestions[i].qst_remarks = CKEDITOR.instances['remark' + id].getData();
            $scope.repoQuestions[i].qst_audit_by = $scope.username
          }
          else {
            return
          }
        }
      }
      $scope.autoSaveQBPepo()
    }
    $scope.getCKInstanceReference = function (id) {
      for (var i = 0; i < $scope.repoQuestions.length; i++) {
        if ($scope.repoQuestions[i].qb_id == id) {
          if ($scope.repoQuestions[i].qst_lang == 'ENGLISH') {
            $scope.repoQuestions[i].reference_info = CKEDITOR.instances['ref' + id].getData();
            $scope.repoQuestions[i].qst_audit_by = $scope.username
          }
          else {
            return
          }
        }
      }
      $scope.autoSaveQBPepo()
    }
    $scope.getCKInstanceCalculation = function (id) {
      for (var i = 0; i < $scope.repoQuestions.length; i++) {
        if ($scope.repoQuestions[i].qb_id == id) {
          if ($scope.repoQuestions[i].qst_lang == 'ENGLISH') {
            $scope.repoQuestions[i].calculation_info = CKEDITOR.instances['calculation' + id].getData();
            $scope.repoQuestions[i].qst_audit_by = $scope.username
          }
          else {
            return
          }
        }
      }
      $scope.autoSaveQBPepo()
    }

    $scope.onEnd = function () {
      $timeout(function () {
        //var arr_ele = document.getElementsByClassName("editable");
        // if(!$scope.ckEditorFlag) {
        $scope.ckEditorFlag = true;
        //$scope.CKEdit();
        //$("#jsButton").click();
        $scope.watchRepoQuestionChange();
        // }

      }, 1);
    };

  }

  angular
    .module('qbAuthoringToolApp')
    .controller('qpRepoController', qpRepoController);

  qpRepoController.$inject = ['$scope', '$state', '$stateParams', '$filter', '$window', 'userService', 'repositoryService', '$q', '$http', '$sce', '$timeout'];

})();