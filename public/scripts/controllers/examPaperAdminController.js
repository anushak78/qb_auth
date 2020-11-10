(function () {
    'use strict';


    function examPaperAdminController($scope, $filter, $window, userService, repositoryService, $q, $http, examService, $state, $sce, $timeout) {
        var checkqbid = [];
        window.localStorage.setItem("childqstpid", "0");
        localStorage.setItem("selallQ", 'No');
        $scope.selallQ = 'No';
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
        $scope.NoQstnList = [{ no_Qstn: 5 }, { no_Qstn: 10 }, { no_Qstn: 15 }, { no_Qstn: 20 }, { no_Qstn: 40 }, { no_Qstn: 'ALL' }]; // added by shilpa
        $scope.selectNoQstn = $scope.NoQstnList[0];
        $scope.selectedModule = {};
        $scope.selectedCourse = {};
        $scope.selectedSubject = {};
        $scope.selectedTopic = {};
        $scope.languageList = [{ lang_name: 'ENGLISH' }];
        $scope.selectedLanguage = $scope.languageList[0];

        $scope.loginUser = userService.getUserData();
        $scope.username = JSON.parse(sessionStorage.getItem('username'));  // Dipika HSS//
        $scope.role = JSON.parse(window.localStorage.getItem("role"));


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
        $scope.flag = false
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
        $scope.isNormalInteger = function (str) {
            return /^[+]?([0-9]+(?:[\.][0-9]*)?|\.[0-9]+)(?:[eE][+-]?[0-9]+)?$/.test(str);
        };

        var saveLogData = function () {

            var data = [];
            var output = [];
            var keys = [];
            var insQuest;
            var delQuest;
            for (var i = 0; i < $scope.showfinalpaper.length; i++) {
                if ($scope.showfinalpaper[i].qstn_alternatives == 0) {
                    insQuest = $scope.showfinalpaper[i].qst_body.search("</ins>");
                    delQuest = $scope.showfinalpaper[i].qst_body.search("</del>");
                    if ((insQuest != -1) || (delQuest != -1) || (insAlt != -1) || (delAlt != -1)) {
                        data.push($scope.showfinalpaper[i]);
                    }
                } else {
                    for (var j = 0; j < $scope.showfinalpaper[i].qstn_alternatives.length; j++) {
                        insQuest = $scope.showfinalpaper[i].qst_body.search("</ins>");
                        delQuest = $scope.showfinalpaper[i].qst_body.search("</del>");
                        var insAlt = $scope.showfinalpaper[i].qstn_alternatives[j].qta_alt_desc.search("</ins>");
                        var delAlt = $scope.showfinalpaper[i].qstn_alternatives[j].qta_alt_desc.search("</del>");
                        if ((insQuest != -1) || (delQuest != -1) || (insAlt != -1) || (delAlt != -1)) {
                            data.push($scope.showfinalpaper[i]);
                        }
                    }
                }

            }
            angular.forEach(data, function (item) {
                var key = item["qb_pk"];
                if (keys.indexOf(key) === -1) {
                    keys.push(key);
                    output.push(item);
                }
            });

            let eid = window.localStorage.getItem('eid');
            let efk = window.localStorage.getItem('e_pk');
            var params = {
                id: parseInt($scope.loginUser.id),
                name: $scope.username,
                exam_id: eid,
                exampaper_pk: efk,
                questData: output
            };
            $http.post('/api/removing_vetting_log_details', params)
                .then(function (response) {
                    $http.post('/api/update_vetting_log_details', params)
                        .then(function (response) {
                            $scope.get_change_log_details();
                        });
                });
        };

        $scope.selectAllQuest = function () {
            if ($scope.publishQuestValue == 'NO') {
                localStorage.setItem("selallQ", 'Yes');
                $scope.selallQ = 'Yes';
            }
            else if ($scope.publishQuestValue == 'YES') {
                localStorage.setItem("selallQ", 'No');
                $scope.selallQ = 'No';
            }

            if ($scope.selectedLanguage != null) {
                var lang_name = $scope.selectedLanguage.lang_name;
            }
            let es = window.localStorage.getItem("es"); // added by shilpa

            var parameters = {
                off: 0,
                lim: 'ALL',
                exam_fk: exam_fkId,
                examPaper: exampaper_fk,
                language: lang_name,
                es: es, // added by shilpa exam status
                //added by dipika
            };
            $http.post('/api/load_admin_questions', parameters).then(function (response) {



                let alldata = response.data.data;


                if ($scope.publishQuestValue == 'YES') {
                    $('.checkpub').prop('checked', false);
                    $scope.publishQuestValue = 'NO';
                } else {
                    $('.checkpub').prop('checked', true);
                    $scope.publishQuestValue = 'YES';

                    toPubQuest = [];
                    toPubSFQuest = [];
                    checkqbid = [];
                }

                if ($scope.publishQuestValue == 'YES') {
                    for (var i = 0; i < $scope.showfinalpaper.length; i++) {
                        $scope.pubquestvalue[$scope.showfinalpaper[i].qb_id] = 'YES'; // added by shilpa
                        /*if ($scope.showfinalpaper[i].copied_from_repo == 'Y') {
                            toPubQuest.push($scope.showfinalpaper[i]);
                        } else {
                            toPubSFQuest.push($scope.showfinalpaper[i]);
                        }*/
                    }

                    for (var i = 0; i < alldata.length; i++) {
                        checkqbid.push(alldata[i].qb_id);
                        //$scope.pubquestvalue[alldata[i].qb_id] = 'YES'; // added by shilpa
                        if (alldata[i].copied_from_repo == 'Y') {
                            toPubQuest.push(alldata[i]);
                        } else {
                            toPubSFQuest.push(alldata[i]);
                        }
                    }
                } else {
                    // added by shilpa
                    for (var i = 0; i < $scope.repoQuestions.length; i++) {
                        $scope.pubquestvalue[$scope.repoQuestions[i].qb_id] = 'NO';
                    }

                    toPubQuest = [];
                    toPubSFQuest = [];
                    checkqbid = [];
                }
            });
        };

        $scope.checkedQuest = function (data, status) {
            //added by shilpa
            if ($scope.selallQ == 'No') {
                if (status == 'YES') { // parent check
                    if (data.qst_pid != '0' && data.qst_type == 'CS' && status == 'YES') {
                        for (var i = 0; i < $scope.showfinalpaper.length; i++) {
                            let qbid = $scope.showfinalpaper[i].qb_id;
                            $scope.pubquestvalue[qbid] = ($scope.pubquestvalue[qbid] == undefined) ? "NO" : $scope.pubquestvalue[qbid];
                            if ($scope.showfinalpaper[i].copied_from_repo == 'Y' && $scope.showfinalpaper[i].qb_id == data.qst_pid && $scope.showfinalpaper[i].qst_pid == '0' && $scope.pubquestvalue[qbid] == 'NO') {
                                $scope.pubquestvalue[qbid] = 'YES';
                                toPubQuest.push($scope.showfinalpaper[i]);
                                checkqbid.push($scope.showfinalpaper[i].qb_id);
                            }
                            else if ($scope.showfinalpaper[i].copied_from_repo != 'Y' && $scope.showfinalpaper[i].qb_id == data.qst_pid && $scope.showfinalpaper[i].qst_pid == '0' && $scope.pubquestvalue[qbid] == 'NO') {
                                $scope.pubquestvalue[qbid] = 'YES';
                                toPubSFQuest.push($scope.showfinalpaper[i]);
                                checkqbid.push($scope.showfinalpaper[i].qb_id);
                            }
                        }
                    }
                } else { // child uncheck
                    if (data.qst_pid == 0 && data.qst_type == 'CS') {
                        for (var i = 0; i < $scope.showfinalpaper.length; i++) {
                            let qbid = $scope.showfinalpaper[i].qb_id;
                            $scope.pubquestvalue[qbid] = ($scope.pubquestvalue[qbid] == undefined) ? "NO" : $scope.pubquestvalue[qbid];
                            if ($scope.showfinalpaper[i].copied_from_repo == 'Y' && $scope.showfinalpaper[i].qst_pid == data.qb_id && $scope.pubquestvalue[qbid] == 'YES') {
                                $scope.pubquestvalue[qbid] = 'NO';
                                let index2 = toPubQuest.indexOf($scope.showfinalpaper[i].qb_pk);
                                checkqbid.splice(index2, 1);
                                let index = toPubQuest.indexOf($scope.showfinalpaper[i]);
                                toPubQuest.splice(index, 1);

                            } else if ($scope.showfinalpaper[i].copied_from_repo != 'Y' && $scope.showfinalpaper[i].qst_pid == data.qb_id && $scope.pubquestvalue[qbid] == 'YES') {
                                $scope.pubquestvalue[qbid] = 'NO';
                                let index2 = toPubSFQuest.indexOf($scope.showfinalpaper[i].qb_pk);
                                checkqbid.splice(index2, 1);
                                let index = toPubSFQuest.indexOf($scope.showfinalpaper[i]);
                                toPubSFQuest.splice(index, 1);
                            }
                        }
                    }
                }
                // end

                if (status == 'YES') {
                    checkqbid.push(data.qb_id);
                    if (data.copied_from_repo == 'Y') {
                        toPubQuest.push(data);
                    } else {
                        toPubSFQuest.push(data)
                    }
                } else {
                    let index = checkqbid.indexOf(data.qb_id);
                    checkqbid.splice(index, 1);
                    if (data.copied_from_repo == 'Y') {
                        // let index = toPubQuest.indexOf(data);
                        toPubQuest.splice(index, 1);
                    } else {
                        let index = toPubSFQuest.indexOf(data);
                        toPubSFQuest.splice(index, 1);
                    }
                }
            } else {
                if ($scope.selectedLanguage != null) {
                    var lang_name = $scope.selectedLanguage.lang_name;
                }
                let es = window.localStorage.getItem("es"); // added by shilpa
                var parameters = {
                    off: 0,
                    lim: 'ALL',
                    exam_fk: exam_fkId,
                    examPaper: exampaper_fk,
                    language: lang_name,
                    es: es, // added by shilpa exam status
                    //added by dipika
                };
                $http.post('/api/load_admin_questions', parameters).then(function (response) {
                    let alldata = response.data.data;
                    if (status == 'YES') { // parent check
                        if (data.qst_pid != '0' && data.qst_type == 'CS' && status == 'YES') {
                            for (var i = 0; i < alldata.length; i++) {
                                let qbid = alldata[i].qb_id;
                                $scope.pubquestvalue[qbid] = ($scope.pubquestvalue[qbid] == undefined) ? "NO" : $scope.pubquestvalue[qbid];
                                if (alldata[i].copied_from_repo == 'Y' && alldata[i].qb_id == data.qst_pid && alldata[i].qst_pid == '0') {
                                    $scope.pubquestvalue[qbid] = 'YES';
                                    if (checkqbid.indexOf(alldata[i].qb_id) == '-1') {
                                        toPubQuest.push(alldata[i]);
                                        checkqbid.push(alldata[i].qb_id);
                                    }
                                }
                                else if (alldata[i].copied_from_repo != 'Y' && alldata[i].qb_id == data.qst_pid && alldata[i].qst_pid == '0') {
                                    $scope.pubquestvalue[qbid] = 'YES';
                                    toPubSFQuest.push(alldata[i]);
                                    checkqbid.push(alldata[i].qb_id);
                                }
                            }
                        }
                    } else { // child uncheck
                        if (data.qst_pid == 0 && data.qst_type == 'CS') {
                            for (var i = 0; i < alldata.length; i++) {
                                let qbid = alldata[i].qb_id;
                                $scope.pubquestvalue[qbid] = ($scope.pubquestvalue[qbid] == undefined) ? "NO" : $scope.pubquestvalue[qbid];
                                if (alldata[i].copied_from_repo == 'Y' && alldata[i].qst_pid == data.qb_id) {
                                    $scope.pubquestvalue[qbid] = 'NO';
                                    // let index2 = toPubQuest.indexOf(alldata[i].qb_pk);
                                    //checkqbid.splice(index2, 1);
                                    // let index = toPubQuest.indexOf(alldata[i]);
                                    //toPubQuest.splice(index, 1);
                                    toPubQuest.forEach((item, index) => {
                                        if (item.qb_id == alldata[i].qb_id) {
                                            toPubQuest.splice(index, 1);
                                            checkqbid.splice(index, 1);
                                        }
                                    });

                                } else if (alldata[i].copied_from_repo != 'Y' && alldata[i].qst_pid == data.qb_id) {
                                    $scope.pubquestvalue[qbid] = 'NO';
                                    ///let index2 = toPubSFQuest.indexOf(alldata[i].qb_pk);
                                    // checkqbid.splice(index2, 1);
                                    //  let index = toPubSFQuest.indexOf(alldata[i]);
                                    // toPubSFQuest.splice(index, 1);
                                    toPubSFQuest.forEach((item, index) => {
                                        if (item.qb_id == alldata[i].qb_id) {
                                            toPubQuest.splice(index, 1);
                                            checkqbid.splice(index, 1);
                                        }
                                    });
                                }
                            }
                        }
                    }
                    if (status == 'YES') {
                        checkqbid.push(data.qb_id);
                        if (data.copied_from_repo == 'Y') {
                            toPubQuest.push(data);
                        } else {
                            toPubSFQuest.push(data)
                        }
                    } else {
                        let index = checkqbid.indexOf(data.qb_id);
                        checkqbid.splice(index, 1);
                        if (data.copied_from_repo == 'Y') {
                            // let index = toPubQuest.indexOf(data);
                            toPubQuest.splice(index, 1);
                        } else {
                            let index = toPubSFQuest.indexOf(data);
                            toPubSFQuest.splice(index, 1);
                        }
                    }
                    if (i == alldata.length) {

                    }
                });
            }

        };

        $scope.getSummarycount = function (data) {
            for (var i = 0; i < data.length; i++) {
                var total = 0;
                $scope.topicName[i].summaryQuestions = 0;
                for (var j = 0; j < data[i].marks_count.length; j++) {
                    if ($scope.isNormalInteger(data[i].marks_count[j].userCount))
                        total += parseFloat(data[i].marks_count[j].userCount);
                    $scope.topicName[i].summaryQuestions = total
                }
            }
        };

        $scope.getSummaryMarks = function (data) {
            for (var i = 0; i < data.length; i++) {
                var total = 0;
                $scope.topicName[i].summaryMarks = 0;
                for (var j = 0; j < data[i].marks_count.length; j++) {
                    if ($scope.isNormalInteger(data[i].marks_count[j].userCount))
                        total += parseFloat(data[i].marks_count[j].userCount * data[i].marks_count[j].marks);
                    $scope.topicName[i].summaryMarks = total;
                }
            }
        };

        $scope.getTotalCount = function () {
            var data = [];
            data = $scope.topicName;
            var total = 0;
            for (var i = 0; i < data.length; i++) {
                total += parseFloat($scope.getSummarycount(data[i]));
            }
            return total;
        };

        $scope.getTotalMarks = function () {
            var total = 0;
            var data = [];
            data = $scope.topicName;
            for (var i = 0; i < data.length; i++) {
                total += parseFloat($scope.getSummaryMarks(data[i]));
            }
            return total;
        };

        $scope.totalMarks = $scope.getTotalMarks();
        $scope.totalCount = $scope.getTotalCount();

        //nikhil's code start's here
        $scope.getModuleList = function () {
            var subjectId = $scope.examMaster == null ? 0 : $scope.examMaster.qba_subject_fk;
            var examPaperId = exampaper_fk;
            var parameters = { examPaperId: exampaper_fk };
            var deferred = $q.defer();
            var transform = function (data) {
                return $.param(data);
            };
            $http.post('/api/getModules_for_vetter', parameters, {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
                transformRequest: transform,
                timeout: 0
            }).then(function (response) {
                $scope.moduleList = response.data.obj;
                $scope.dataset.schema = $scope.moduleList;
                setTimeout(function () {
                    if ($("#dates-field2").length != 0) {
                        $('#dates-field2').select2({
                            includeSelectAllOption: true
                        });
                    }
                }, 0)
                setTimeout(function () {
                    if ($("#dates-field3").length != 0) {
                        $('#dates-field3').select2({
                            includeSelectAllOption: true
                        });
                    }
                }, 0)
                deferred.resolve(response);
            }).catch(function (error) {
                deferred.reject(error);
            });
        };

        $scope.remarkTabClicked = function (id, pk) {
            var remarkId = 'remark' + id;
            var referenceId = 'reference' + id;
            var calculationId = 'calculation' + id;
            var log = "alternativeslog" + pk
            $('#' + log).hide();
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

        $scope.referenceTabClicked = function (id, pk) {
            var remarkId = 'remark' + id;
            var referenceId = 'reference' + id;
            var calculationId = 'calculation' + id;
            var log = "alternativeslog" + pk
            $('#' + log).hide();
            $('#' + remarkId).hide();
            $('#' + referenceId).toggle();
            $('#' + calculationId).hide();
        }

        $scope.calculationTabClicked = function (id, pk) {
            var remarkId = 'remark' + id;
            var referenceId = 'reference' + id;
            var calculationId = 'calculation' + id;
            var log = "alternativeslog" + pk
            $('#' + log).hide();
            $('#' + remarkId).hide();
            $('#' + referenceId).hide();
            $('#' + calculationId).toggle();
        }

        $scope.getSummarycount($scope.topicName);
        $scope.getSummaryMarks($scope.topicName);
        $scope.getModuleList();
        $scope.getUserList = function (roleCode) {

            $scope.moduleError = ''
            $scope.moduleErrorpublisher = ''
            $scope.currentUserType = roleCode;
            var parameters = { role: roleCode };
            var deferred = $q.defer();
            var transform = function (data) {
                return $.param(data);
            };
            $http.post('/api/get_user_list', parameters, {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
                transformRequest: transform,
                timeout: 0
            }).then(function (response) {
                $scope.userList = response.data.obj;
                deferred.resolve(response);
            }).catch(function (error) {
                deferred.reject(error);
            });
            // $scope.getModuleList();
            $scope.closeModalpopup();
        };

        var examid = examService.getExamMasterData();
        //var exam_fkId = repositoryService.getsetExamId(); // comment by shilpa
        // var exam_fkId = localStorage.getItem('eid');//sandip padekar
        var exam_fkId = window.localStorage.getItem('eid');

        $scope.exam_fkId = exam_fkId;

        $scope.assignVetterOrPublisher = function () {
            var validation = 1;
            if ($scope.examMaster.exam_pk != null || $scope.examMaster.exam_pk != undefined) {
                $scope.vettingInfo.examId = $scope.examMaster.exam_pk;
            }
            else {
                $scope.vettingInfo.examId = exam_fkId;
            }
            var data;
            $scope.vettingInfo.currentQstnPaperId = $scope.currentQstnPaperId;
            if ($scope.currentUserType == 'VET') {
                data = $('#dates-field3').val();
                $scope.vettingInfo.vetterId = $("#vetter").val();
            }
            else {
                $scope.vettingInfo.vetterId = $("#publisher").val();
                // data = $('#dates-field2').val();
                data = $scope.dataset.schema
            }
            var module_pk = [];
            var module_name = [];
            if (data != null) {
                for (var i = 0; i < data.length; i++) {
                    if ($scope.currentUserType == 'VET') {
                        module_pk.push(JSON.parse(data[i]).qba_module_fk);
                        module_name.push(JSON.parse(data[i]).module_name);
                    }
                    else {
                        module_pk.push(data[i].qba_module_fk);
                        module_name.push(data[i].module_name);
                    }
                    $scope.selectedModule = $scope.dataset.schema[i];
                }
            }
            $scope.vettingInfo.vettingStatus = 'Active';
            $scope.vettingInfo.auditBy = $scope.username;
            $scope.vettingInfo.module_id = module_pk.join();
            $scope.vettingInfo.module_name = module_name.join();
            $scope.vettingInfo.qb_id = qstnPprId;
            $scope.vettingInfo.exampaper_fk = exampaper_fk;

            if ($scope.vettingInfo.module_id == '') {
                $('#moduleErrorVetter').css({ 'display': 'block' });
                $scope.moduleError = "Please select module id";
                $scope.moduleErrorpublisher = '';
                validation = 0;
            }
            if (isNaN($scope.vettingInfo.vetterId) == true) {
                $('#vetterError').css({ 'display': 'block' });
                $scope.vError = "Please select vetter";
                $scope.publisherError = '';
                validation = 0;
            }
            if ($scope.currentUserType == 'PUB') {
                if ($scope.vettingInfo.module_id == '') {
                    $('#moduleErrorpublisher').css({ 'display': 'block' });
                    $scope.moduleErrorpublisher = "Please select module id";
                    $scope.vError = '';
                    validation = 0;
                }
                if (isNaN($scope.vettingInfo.vetterId) == true) {
                    $('#publisherError').css({ 'display': 'block' });
                    $scope.publisherError = "Please select publisher";
                    $scope.moduleError = '';
                    validation = 0;
                }
            }


            if ($scope.currentUserType == 'VET' && validation == 1) {
                $scope.assignModule();
            }

            if ($scope.currentUserType == 'PUB' && validation == 1) {
                var reqExampaper = {
                    exampaper_fk: exampaper_fk,
                    exam_fk: exam_fkId,
                    module_id: $scope.vettingInfo.module_id
                };
                $http.post('/api/assign_publisher_without_vetting', $scope.vettingInfo).then(function (response) {
                    if (response.data.obj[0].case == 0) {
                        $("#addUserModal").click();
                        $("#addPublisherModal").click();
                        swal('Assignment cannot be done because vetting is pending');
                        return;
                    }
                    else {
                        $http.post('/api/is_addquestion_left', reqExampaper).then(function (response) {
                            if (response.data.message == "success") {
                                $scope.is_add_question_left = response.data.obj[0].count;
                                if ($scope.is_add_question_left > 0) {
                                    swal('New questions are pending to be framed, hence cannot be assigned to publisher.')
                                }
                                else {
                                    $scope.assignModule();
                                }
                            }
                            else {
                                $scope.assignModule();
                            }
                        });
                    }
                })



            }
        };

        $scope.assignModule = function () {
            var validation = 1;
            if (validation == 1) {
                $("#addUserModal").click();
                $("#addPublisherModal").click();

                $http.post('/api/assign_vetter_publisher', $scope.vettingInfo)
                    .then(function (response) {
                        if (response.data.message == "success") {
                            swal('Assignment done');
                        }
                        else {
                            $('span.redcolor').css({ 'display': 'none' });
                            var respData = response.data.obj[0];
                            swal('Module ' + respData[0].module_names + ' is Active and already assigned to ' + respData[0].user_id);
                        }
                        $scope.getVettingStatus();
                    });
            }
        };

        $scope.get_change_log_details = function () {
            var parameters = {
                // exam_id: $scope.examMaster.exam_pk,
                exam_fk: exam_fkId,
                examPaper: exampaper_fk,
                //role: $scope.loginUser.role
                role: JSON.parse(window.localStorage.getItem("role"))
            };
            var transform = function (data) {

                return $.param(data);
            };
            $http.post('/api/get_change_log_details', parameters, {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
                transformRequest: transform,
                timeout: 0
            }).then(function (response) {
                $scope.changeLogData = response.data.data;

                $scope.changeLogDataCount = response.data.data.length;
            });
        };


        //Author: Dhiraj Edit Question For Admin
        $scope.editQuestionForVetter = function (questionData) {
            repositoryService.seteditAdminQuestion(questionData);
            repositoryService.setVetterEditedPageId($scope.currentPageId);
            repositoryService.setExamId($scope.examMaster.exam_pk);
            $state.go('vetterEditQuestion');
        }

        $scope.renderAsHtml = function (val) {
            return $sce.trustAsHtml(val);
        };


        Array.prototype.remove = function () {
            var args = Array.apply(null, arguments);
            var indices = [];
            for (var i = 0; i < args.length; i++) {
                var arg = args[i];
                var index = this.indexOf(arg);
                while (index > -1) {
                    indices.push(index);
                    index = this.indexOf(arg, index + 1);
                }
            }
            indices.sort();
            for (var i = 0; i < indices.length; i++) {
                var index = indices[i] - i;
                this.splice(index, 1);
            }
        }

        function checkRequestStatus(itemList) {
            var approve_rejcount = 0;
            var ln = itemList.length;
            for (var key in itemList) {
                if (itemList[key].admin_status != null || itemList[key].admin_status != '') {
                    approve_rejcount += 1;
                } else {
                    approve_rejcount;
                }
            }
            if (approve_rejcount != ln) {
                return 0;
            } else {
                return 1
            }
        }

        $scope.approvalofVetterRequest = function (data, statusRequest) {
            if (checkRequestStatus(data) == 0) {
                var checkTrue = data.findIndex(function (item) {
                    if (item.checked == true) {
                        return item.checked == true;
                    }
                });

                if (checkTrue == -1) {
                    swal("Select atleast one request to approve or reject!");
                    return false;
                }
            } else {
                swal("All requests have been approved or rejected!");
            }

            var arrSelected = [];
            var seleced_vlogqbpk = [];
            var seleced_qb_id = [];
            var seleced_qb_id_status = [];
            var qb_id_status = [];
            var requestStatus = [];
            var approvedStatus = "Approved";
            var rejectedStatus = "Rejected";
            var currentexampaper_fk;
            if (statusRequest) {
                for (var i in data) {
                    if (data[i].checked) {
                        currentexampaper_fk = data[i].exampaper_fk;
                        //arrSelected.push(data[i]);
                        seleced_vlogqbpk.push(data[i].vlog_qb_fk);
                        seleced_qb_id.push(data[i].qb_id);
                        qb_id_status.push(data[i].status);
                        seleced_qb_id_status.push(data[i].status);

                        requestStatus = seleced_qb_id_status;
                        //requestStatus.push({admins:seleced_qb_id_status[i],culleds: ( seleced_qb_id_status[i] != 'D') ? "Replacement request approved" :  "Deletion request approved"});

                        if (statusRequest == "Approved") {
                            requestStatus.push((seleced_qb_id_status[i] != 'RM') ? "Replacement request approved" : "Deletion request approved");
                        } else {
                            requestStatus.push((seleced_qb_id_status[i] != 'RM') ? "Replacement request rejected" : "Deletion request rejected");
                        }
                        requestStatus.remove('D', 'R', 'RM');

                        var reqStatus = {
                            vlog_qb_fk: seleced_vlogqbpk,//arrSelected[k].vlog_qb_fk,
                            created_by: data[i].created_by,
                            status: qb_id_status,//data[i].status,requestStatus[k].admins,
                            qb_id: seleced_qb_id,//arrSelected[i].qb_id,
                            vlog_exam_fk: data[i].vlog_exam_fk,
                            exampaper_fk: currentexampaper_fk,
                            admin_status: statusRequest,
                            admin_status_culledtbl: requestStatus,//[k].culleds
                            admin_login: $scope.loginUser.name
                        };
                        var updateReplacehistrory = {
                            rep_qb_pk: seleced_vlogqbpk,
                            req_id_user: data[i].created_by
                        };
                    }


                }

            }

            $http.post('/api/approval_of_vetter_request', reqStatus).then(function (response) {
                if (response.data.message == "success") {
                    $scope.vettingData = response.data.obj;
                    var arrObj = [];

                    var obj;

                    seleced_vlogqbpk.findIndex(function (data) {
                        for (var i = 0; i < $scope.vettingData.length; i++) {
                            if (data == $scope.vettingData[i].vlog_qb_fk && $scope.vettingData[i].status == "R" && $scope.vettingData[i].admin_status == "Approved") {

                                obj = {
                                    qb_pk: $scope.vettingData[i].vlog_qb_fk,
                                    qb_id: $scope.vettingData[i].qb_id,
                                    exam_fk: $scope.vettingData[i].vlog_exam_fk,
                                    exampaper_fk: currentexampaper_fk,
                                    qst_type: 'M',
                                    qst_lang: 'ENGLISH',
                                    qst_request_status: "Replacement request approved"
                                }

                                arrObj.push(obj);
                                // return obj;
                            } else if (data == seleced_vlogqbpk[i] && $scope.vettingData[i].status == "RM" && $scope.vettingData[i].admin_status == "Approved") {
                                obj = {
                                    qb_pk: $scope.vettingData[i].vlog_qb_fk,
                                    qb_id: $scope.vettingData[i].qb_id,
                                    exam_fk: $scope.vettingData[i].vlog_exam_fk,
                                    exampaper_fk: currentexampaper_fk,
                                    qst_type: 'M',
                                    qst_request_status: "Deletion request approved"
                                }

                                arrObj.push(obj);

                                //return obj;
                            }
                            else if (data == seleced_vlogqbpk[i] && ($scope.vettingData[i].status == "R" && $scope.vettingData[i].admin_status == "Rejected")) {
                                obj = {
                                    qb_pk: $scope.vettingData[i].vlog_qb_fk,
                                    qb_id: $scope.vettingData[i].qb_id,
                                    exam_fk: $scope.vettingData[i].vlog_exam_fk,
                                    exampaper_fk: currentexampaper_fk,
                                    qst_type: 'M',
                                    qst_request_status: "Replacement request rejected"
                                }

                                arrObj.push(obj);

                                //return obj;
                            }
                            else if (data == seleced_vlogqbpk[i] && ($scope.vettingData[i].status == "RM" && $scope.vettingData[i].admin_status == "Rejected")) {
                                obj = {
                                    qb_pk: $scope.vettingData[i].vlog_qb_fk,
                                    qb_id: $scope.vettingData[i].qb_id,
                                    exam_fk: $scope.vettingData[i].vlog_exam_fk,
                                    exampaper_fk: currentexampaper_fk,
                                    qst_type: 'M',
                                    qst_request_status: "Deletion request rejected"
                                }

                                arrObj.push(obj);

                                //return obj;
                            }
                        }
                    });

                    /* for(var i=0;i<response.data.obj.length;i++){



                         //response.data.obj[i].status == "R" &&
                         if(response.data.obj[i].vlog_qb_fk == seleced_vlogqbpk[i] && response.data.obj[i].status == "R"){

                           obj = {
                             qb_pk: response.data.obj[i].vlog_qb_fk,
                             qb_id:response.data.obj[i].qb_id,
                             exam_fk:response.data.obj[i].vlog_exam_fk,
                             exampaper_fk:currentexampaper_fk,
                             qst_request_status:"Replacement request approved"
                           }
                         } else if(response.data.obj[i].vlog_qb_fk == seleced_vlogqbpk[i] && response.data.obj[i].status == "D"){
                           obj = {
                             qb_pk: response.data.obj[i].vlog_qb_fk,
                             qb_id:response.data.obj[i].qb_id,
                             exam_fk:response.data.obj[i].vlog_exam_fk,
                             exampaper_fk:currentexampaper_fk,
                             qst_request_status:"Deletion request approved"
                           }
                         }
                     }*/

                    if (arrObj == undefined) {
                        return false;
                    }
                    //repositoryService.setIsAdminApprovedReq = (true);

                    return $http.post('/api/update_culled_table_for_replaced_qststatus', arrObj).then(function (response) {
                        if (response.data.message == "success") {
                            swal("Vetter Request " + reqStatus.admin_status + "!");
                            // alert("Replace Histroy Updated!..");
                            $scope.getListofVetterRequest();
                        }
                    });

                    /*  return $http.post('/api/update_replace_qstn_history',updateReplacehistrory).then(function(response){
                        if(response.data.message == "success"){
                          alert("Replace Histroy Updated!..");
                          $scope.getListofVetterRequest();
                        }
                    });*/

                }
            });
        }

        $scope.getListofVetterRequest = function () {
            var status = { status: 'R', qstnpaperid: qstnPprId };
            $http.post('/api/get_list_of_vetterRequest', status).then(function (response) {
                if (response != null) {
                    $scope.getRequestList = response.data.obj;
                }
            });
        }

        $scope.importFile = function () {
            var formData = new FormData();

            if ($('#file')[0].files[0] === undefined) {
                swal('Please select file to upload');
                //changes made over here
            } else if ($('#file')[0].files[0].name.split(".")[$('#file')[0].files[0].name.split(".").length - 1] == 'zip') {
                let e_pk = window.localStorage.getItem('e_pk');
                let eid = window.localStorage.getItem('eid');
                let userName = JSON.parse(sessionStorage.getItem('username'));
                let language = window.localStorage.getItem('language');
                formData.append('uploadFileType', $('#file').val());
                formData.append('userName', userName);
                formData.append('exam_fk', eid);
                formData.append('exampaper_fk', e_pk);
                formData.append('language', language);

                angular.forEach($('#file')[0].files, function (v, k) {                        //fd.append('file', files[k]);

                    formData.append('file', $('#file')[0].files[k]);
                });

                // formData.append('file', $('#file')[0].files[0]);

                // $("#loader").show();
                //changes done here. here
                $.ajax({
                    url: window.location.origin + '/api/importPaperAdmin',
                    type: 'POST',
                    data: formData,
                    processData: false,  // tell jQuery not to process the data
                    contentType: false,  // tell jQuery not to set contentType
                    success: function (data) {

                        if (data['code'] == 1) {
                            swal('Data Uploaded Successfully.');
                        } else if (data['code'] == 0) {
                            swal('Invalid File Format');
                        }
                        else {
                            swal('Data Upload Failed.')
                        }
                    }
                });
            } else {
                swal('Please select file of .zip format');
            }
            $('#file').val('');
            $("#close-modal").click();
        };

        $scope.export = function () {

            /*var params = {
                exam_fk: repositoryService.getsetExamId(), //eid
                examPaper: repositoryService.getExampaper_fk(), // e_pk
                language: $scope.selectedLanguage.lang_name
            }*/
            //below 3 line sandip commented
            // var e_pk = localStorage.getItem('e_pk');
            // var eid = localStorage.getItem('eid');
            // var examstatus = localStorage.getItem('es');
            var e_pk = window.localStorage.getItem('e_pk');
            var eid = window.localStorage.getItem('eid');
            var examstatus = window.localStorage.getItem('es');
            var params = {
                exam_fk: eid,
                examPaper: e_pk,
                language: $scope.selectedLanguage.lang_name,
                examstatus: examstatus,
                userName: $scope.username
            }

            $http.post('/api/export', params).then(function (response) {
                if (response.data.code == '2') {
                    $timeout(function () {
                        $http.post('/api/export', params).then(function (response) {
                            window.open(response.data.obj);

                            $http.post('/api/exportInNseFormat', params).then(function (response) {
                                window.open(response.data.obj);
                            });
                        })
                    }, 5000)
                    return
                }
                window.open(response.data.obj);

                $http.post('/api/exportInNseFormat', params).then(function (response) {
                    window.open(response.data.obj);

                });
            });
        }

        /*   var checkForEnablePublishing = function(){
            if($scope.vettingStatus.length == 0){
              $scope.disablePublishingButton = true;
            }else{
              for(var i=0;i<$scope.vettingStatus.length;i++){
                if($scope.vettingStatus[i].vetting_flag.trim() == 'D' &&
                  $scope.vettingStatus[i].um_user_mstr.um_user_role_mapping.um_role_mstr.role_code.trim() == 'PUB'){
                  $scope.enablePublishButton = true;
              }else if($scope.vettingStatus[i].um_user_mstr.um_user_role_mapping.um_role_mstr.role_code.trim() == 'PUB'){
                $scope.enablePublishButton = false;
              }
            }
          }
      };*/

        var checkForEnablePublishing = function () {
            var params = { examPaperId: exampaper_fk, role_fk: 2 }
            if ($scope.vettingStatus.length == 0 && $scope.examStatus == 'N') {
                $scope.enablePublishingButton = true;

            }
            else {
                $http.post('/api/check_for_enable_publishing', params).then(function (response) {
                    if (response.data.obj[0].count == '0' && $scope.examStatus == 'N') {
                        $scope.enableAssignButtons = true;
                        $scope.flag = true
                    }
                    else {
                        if ($scope.examStatus == 'A') {
                            $scope.flag = true
                        }
                        $scope.enablePublishingButton = false;
                        $scope.enableAssignButtons = false;
                    }
                });
            }
        }

        $scope.pubToRepo = function () {
            if (toPubQuest.length == 0 && toPubSFQuest.length == 0) {
                swal('Please select questions to publish');
            }
            else {
                /* if(toPubQuest.length != 0){
                   $http.post('/api/update_quest_to_publish',toPubQuest).then(function(response){
                     $http.post('/api/remove_alt_to_publish',toPubQuest).then(function(response){
                       $http.post('/api/insert_alt_to_publish',toPubQuest).then(function(response){
                         if (toPubSFQuest.length != 0){
                           $http.post('/api/insert_quest_to_publish',toPubSFQuest).then(function(response){
                             $http.post('/api/insert_alt_to_publish',toPubSFQuest).then(function(response){
                             });
                           });
                         }
                       });
                     });
                   });
               }*/
                var qb_pks = []
                for (var z = 0; z < toPubQuest.length; z++) {
                    qb_pks.push(toPubQuest[z].qb_pk)
                }
                for (var z = 0; z < toPubSFQuest.length; z++) {
                    qb_pks.push(toPubSFQuest[z].qb_pk)
                }
                var sendRequest = {
                    qb_pks: qb_pks,
                    exampaper_fk: window.localStorage.getItem("e_pk"),
                    exam_fk: window.localStorage.getItem("eid")
                }
                $http.post('/api/getAllCount', sendRequest)
                    .then(function (response) {
                        let total_selected_questions = response.data.total_selected_questions;
                        let total_selected_marks = response.data.total_selected_marks;
                        let total_parent_selected = response.data.total_parent_selected;
                        let total_child_marks_selected = response.data.total_child_marks_selected;
                        let total_questions_master = response.data.total_questions_master;
                        let total_marks_master = response.data.total_marks_master;
                        let total_csq_master = response.data.total_csq_master;
                        let total_csq_marks_master = response.data.total_csq_marks_master;

                        if (total_selected_questions < total_questions_master || total_parent_selected < total_csq_master || total_selected_marks < total_marks_master || total_child_marks_selected < total_csq_marks_master) {
                            swal('Total Questions Selected are less than required');
                            return false;
                        }
                        swal({
                            text: "Are you sure you want to publish?",
                            dangerMode: true,
                            buttons: ["No", "Yes!"],
                        })
                            .then((willDelete) => {
                                if (willDelete) {
                                    var flag = true; // added by shilpa
                                    var casePassageId = []; // added by shilpa
                                    var examPaperQB_PK = [];
                                    var examPaperQB_BODY = []; // added by 
                                    var examPaperQB_rem = {};
                                    var examPaperQB_ref = {};
                                    var examPaperQB_cal = {};
                                    var examPaperQB_Alter_body = []; // added by shilpa
                                    for (var i = 0; i < toPubQuest.length; i++) {
                                        if (toPubQuest[i].qst_pid == '0' && toPubQuest[i].qst_type == 'CS') { // added by shilpa
                                            casePassageId.push(toPubQuest[i].qb_id);
                                        }
                                        examPaperQB_PK.push(toPubQuest[i].qb_pk);
                                        examPaperQB_BODY.push(toPubQuest[i].qst_body); // added by shilpa
                                        examPaperQB_rem[toPubQuest[i].qb_pk] = toPubQuest[i].qst_remarks;
                                        examPaperQB_ref[toPubQuest[i].qb_pk] = toPubQuest[i].reference_info;
                                        examPaperQB_cal[toPubQuest[i].qb_pk] = toPubQuest[i].calculation_info;
                                        if (toPubQuest[i].qstn_alternatives.length > 0) {
                                            for (var k = 0; k < toPubQuest[i].qstn_alternatives.length; k++) {
                                                examPaperQB_Alter_body.push({
                                                    qta_id: toPubQuest[i].qb_id,
                                                    qta_qst_id: toPubQuest[i].qb_pk,
                                                    qta_order: toPubQuest[i].qstn_alternatives[k].qta_order,
                                                    qta_alt_desc: toPubQuest[i].qstn_alternatives[k].qta_alt_desc
                                                })
                                            }
                                        }
                                    }

                                    for (var i = 0; i < toPubSFQuest.length; i++) {
                                        if (toPubSFQuest[i].qst_pid == '0' && toPubSFQuest[i].qst_type == 'CS') { // added by shilpa
                                            casePassageId.push(toPubSFQuest[i].qb_id);
                                        }
                                        examPaperQB_PK.push(toPubSFQuest[i].qb_pk);
                                        examPaperQB_BODY.push(toPubSFQuest[i].qst_body); // added by shilpa
                                        examPaperQB_rem[toPubSFQuest[i].qb_pk] = toPubSFQuest[i].qst_remarks;
                                        examPaperQB_ref[toPubSFQuest[i].qb_pk] = toPubSFQuest[i].reference_info;
                                        examPaperQB_cal[toPubSFQuest[i].qb_pk] = toPubSFQuest[i].calculation_info;
                                        if (toPubSFQuest[i].qstn_alternatives.length > 0) {
                                            for (var k = 0; k < toPubSFQuest[i].qstn_alternatives.length; k++) {

                                                examPaperQB_Alter_body.push({
                                                    qta_id: toPubSFQuest[i].qb_id,
                                                    qta_qst_id: toPubSFQuest[i].qb_pk,
                                                    qta_order: toPubSFQuest[i].qstn_alternatives[k].qta_order,
                                                    qta_alt_desc: toPubSFQuest[i].qstn_alternatives[k].qta_alt_desc
                                                })
                                            }
                                        }
                                    }


                                    //added by 
                                    var lang_name = $scope.selectedLanguage.lang_name;
                                    let es = window.localStorage.getItem("es"); // added by shilpa
                                    var parameters = {
                                        off: 0,
                                        lim: 'ALL',
                                        exam_fk: window.localStorage.getItem('eid'),
                                        examPaper: window.localStorage.getItem('e_pk'),
                                        language: lang_name,
                                        es: es
                                    }
                                    $http.post('/api/load_admin_questions', parameters).then(function (response) {
                                        let alldata = response.data.data;
                                        let examPaperQB_PK1 = []
                                        let examPaperQB_BODY1 = []
                                        let examPaperQB_rem1 = []
                                        let examPaperQB_ref1 = []
                                        let examPaperQB_cal1 = []
                                        let examPaperQB_no_of_questions = []
                                        let examPaperQB_Alter_body1 = []
                                        var pub = []
                                        for (var i = 0; i < alldata.length; i++) {
                                            if (alldata[i].copied_from_repo == 'Y') {
                                                pub.push(alldata[i]);
                                            }
                                        }
                                        for (var i = 0; i < pub.length; i++) {
                                            examPaperQB_PK1.push(pub[i].qb_pk);
                                            examPaperQB_BODY1.push(pub[i].qst_body); // added by shilpa
                                            examPaperQB_rem1[pub[i].qb_pk] = pub[i].qst_remarks;
                                            examPaperQB_ref1[pub[i].qb_pk] = pub[i].reference_info;
                                            examPaperQB_cal1[pub[i].qb_pk] = pub[i].calculation_info;
                                            examPaperQB_no_of_questions.push(pub[i].no_of_question);
                                            if (pub[i].qstn_alternatives.length > 0) {
                                                for (var k = 0; k < pub[i].qstn_alternatives.length; k++) {
                                                    examPaperQB_Alter_body1.push({
                                                        qta_id: pub[i].qb_id,
                                                        qta_qst_id: pub[i].qb_pk,
                                                        qta_order: pub[i].qstn_alternatives[k].qta_order,
                                                        qta_alt_desc: pub[i].qstn_alternatives[k].qta_alt_desc
                                                    })
                                                }
                                            }
                                        }
                                        var params1 = {
                                            qb_alterbody: examPaperQB_Alter_body1,
                                            qb_pk: examPaperQB_PK1,
                                            exam_fk: pub[0].exam_fk,
                                            exampaper_fk: pub[0].exampaper_fk,
                                            qb_body: examPaperQB_BODY1, // added by shilpa
                                            qst_remarks: examPaperQB_rem1,
                                            reference_info: examPaperQB_ref1,
                                            calculation_info: examPaperQB_cal1,
                                            no_of_question: examPaperQB_no_of_questions
                                        };
                                        for (var i = 0; i < casePassageId.length; i++) {
                                            var count = 0;
                                            for (var j = 0; j < toPubQuest.length; j++) {

                                                if (toPubQuest[j].qst_pid == casePassageId[i] && toPubQuest[j].qst_type == 'CS') {
                                                    count = count + 1;
                                                }
                                            }
                                            for (var j = 0; j < toPubSFQuest.length; j++) {

                                                if (toPubSFQuest[j].qst_pid == casePassageId[i] && toPubSFQuest[j].qst_type == 'CS') {
                                                    count = count + 1;
                                                }
                                            }
                                            if (count < 2) {
                                                flag = false;
                                            }
                                        }
                                        if (flag == false) {
                                            swal('Selected Case Passage must have at least 2 child');
                                            return false;
                                        }
                                        // end by shilpa 
                                        if (toPubQuest.length != 0) {
                                            var params = {
                                                qb_alterbody: examPaperQB_Alter_body,
                                                qb_pk: examPaperQB_PK,
                                                exam_fk: toPubQuest[0].exam_fk,
                                                exampaper_fk: toPubQuest[0].exampaper_fk,
                                                qb_body: examPaperQB_BODY, // added by shilpa
                                                qst_remarks: examPaperQB_rem,
                                                reference_info: examPaperQB_ref,
                                                calculation_info: examPaperQB_cal
                                            };
                                        } else {
                                            var params = {
                                                qb_alterbody: examPaperQB_Alter_body,
                                                qb_pk: examPaperQB_PK,
                                                exam_fk: toPubSFQuest[0].exam_fk,
                                                exampaper_fk: toPubSFQuest[0].exampaper_fk,
                                                qb_body: examPaperQB_BODY, // added by shilpa
                                                qst_remarks: examPaperQB_rem,
                                                reference_info: examPaperQB_ref,
                                                calculation_info: examPaperQB_cal
                                            };
                                        }

                                        $http.post('/api/insertExamPaperQB_PK', params).then(function (response) {
                                            $http.post('/api/update_admin_status', params).then(function (response) {
                                                //added by shilpa
                                                $http.post('/api/updateQBody', params1).then(function (response) {
                                                    $http.post('/api/insertNewChildQuestion', toPubSFQuest).then(function (response) {
                                                    });
                                                });
                                            });
                                        });
                                    })

                                    $state.go('publishedExams');

                                    swal('Questions published Successfully!');


                                }
                            });
                    })
            }
        };

        $scope.populateQuestions = function (topic) {

            $scope.selectedTopic = topic;
            $scope.method = "default";
            var parameters = {
                id: topic.qba_module_fk,
                examPk: $scope.examPk, examPaperPk: $scope.examPaperPk,
                off: 0, lim: $scope.selectNoQstn.no_Qstn
            };
            var deferred = $q.defer();
            var transform = function (data) {
                return $.param(data);
            };

            $http.post('/api/load_vetter_questions', parameters, {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
                transformRequest: transform,
                timeout: 0
            }).then(function (response) {
                $scope.repoQuestions = response.data.data;
                $scope.loadIndex();
                repoQuestionsarry = $scope.repoQuestions;
                $scope.countQst = response.data.count;
                $scope.currentPageRecords = response.data.data.length;
                $scope.showOffset = 0;
                $scope.currentPageId = 1;
                $scope.showPages();
                $scope.getStartedInitialization();
                deferred.resolve(response);
            }).catch(function (error) {
                deferred.reject(error);
            });


        };




        $scope.getFilteredData = function () {
            $scope.qst_type = 'M'
            var details = {
                course: window.localStorage.getItem("cname"),
                course_fk: window.localStorage.getItem("course_fk"),
                subject_code: window.localStorage.getItem("sid"),
                moduleId: window.localStorage.getItem("mids"),

                exampaper_pk: window.localStorage.getItem("e_pk"),
                exam_id: window.localStorage.getItem("eid"),
                qstType: 'M'
            }

            $http.post('/api/load_inactive_questions_admin', details)
                .then(function (response) {
                    $scope.filteredQustionList = response.data.data;
                    $scope.qst_type = response.data.data[0].qst_type;
                });

        };


        $scope.prepareCSQInactiveQuestions = function () {
            $scope.qst_type = 'CS'
            var questiondels = {
                course: window.localStorage.getItem("cname"),
                course_fk: window.localStorage.getItem("course_fk"),
                subject_code: window.localStorage.getItem("sid"),
                moduleId: window.localStorage.getItem("mids"),

                exampaper_pk: window.localStorage.getItem("e_pk"),
                exam_id: window.localStorage.getItem("eid"),
                qstType: 'CS'

            }
            $http.post('/api/load_case_inactive_question_admin', questiondels)
                .then(function (response) {
                    $scope.filteredQustionList = "";
                    $scope.filteredQustionList = response.data.data;

                    $scope.qst_type = response.data.data[0].qst_type;
                });

        }




        $scope.confirmAlertAdminForMCQ = function (data, selectedqbid) {

            swal({
                title: "Are you sure?",
                text: " you want to add this question",
                dangerMode: true,
                buttons: ["No", "Yes!"],
            })
                .then((willDelete) => {
                    if (willDelete) {
                        //$scope.questionSelectionbyUser(data,selectedqbid);
                        /* var insertdata = {
                           qb_id : selectedqbid,
                           data : data
                        }; */
                        /*swal("Question Added successfully!", {
                            icon: "success",
                            // buttons: ["No", "Yes!"],
                        })

                            .then((add) => {*/
                        // if (add) 
                        data.exampaper_id = window.localStorage.getItem("e_pk");
                        data.exam_id = window.localStorage.getItem("eid");
                        data.exampaper_fk = window.localStorage.getItem("e_pk");
                        data.exam_fk = window.localStorage.getItem("eid");

                        //$("#addUserModal2").modal("hide");
                        $("#close-button").click();
                        document.getElementById('board').style.visibility = 'visible'
                        $http.post('/api/replace_update_mcq_summary', data).then(function (response) { })
                        $http.post('/api/add_question_to_display', data).then(function (response) {
                            document.getElementById('board').style.visibility = 'hidden'
                            swal("Question Added successfully!")
                                .then((willDelete) => {
                                    $window.location.reload();
                                })

                        });
                        //  }

                        //});

                    }
                });



        }



        $scope.confirmAlertAdminForCSQ = function (data, selectedqbid) {


            swal({
                title: "Are you sure?",
                text: " you want to add this question",
                dangerMode: true,
                buttons: ["No", "Yes!"],
            })
                .then((willDelete) => {
                    if (willDelete) {
                        //$scope.questionSelectionbyUser(data,selectedqbid);
                        /* var insertdata = {
                           qb_id : selectedqbid,
                           data : data
                        }; */
                        /*swal("Question Added successfully!", {
                            icon: "success",
                            buttons: ["No", "Yes!"],
                        })

                            .then((add) => {*/
                        // if (add) {
                        data.exampaper_id = window.localStorage.getItem("e_pk");
                        data.exam_id = window.localStorage.getItem("eid");
                        data.exampaper_fk = window.localStorage.getItem("e_pk");
                        data.exam_fk = window.localStorage.getItem("eid");
                        data.qst_marks = data.no_of_question
                        data.qbId = data.qb_id
                        data.userName = data.qst_audit_by
                        data.remark = ''

                        $("#close-button").click();
                        //$("#addUserModal2").modal("hide");
                        document.getElementById('board').style.visibility = 'visible'
                        $http.post('/api/add_parent_question', data).then(function (response) {
                            var childdata = response.data.obj;
                            return $http.post('/api/add_child_question', childdata).then(function (response) {
                                $http.post('/api/replace_update_case_summary', data).then(function (response) {
                                    document.getElementById('board').style.visibility = 'hidden'
                                    swal("Question Added successfully!")
                                        .then((willDelete) => {
                                            $window.location.reload();
                                        })
                                })
                            });


                            //$window.location.reload();

                        });
                        //  }

                        //});

                    }
                });



        }


        $scope.getVettingStatus = function () {
            var params = { qpPprId: qstnPprId }
            $http.post('/api/get_vetting_status', params)
                .then(function (response) {
                    $scope.vettingStatus = response.data.data;
                    var vetter_len = $scope.vettingStatus.length;
                    $scope.vetter_status = [];
                    for (var i = 0; i < vetter_len; i++) {
                        $scope.vetter_status.push(response.data.data[i].vetting_status);

                    }
                    checkForEnablePublishing();
                }, function errorCallback(response) {
                });
        }
        $scope.getVettingStatus();

        $scope.getListofVetterRequest();


        $scope.getPubVettingStatus = function () {
            let qstnpaper_id = window.localStorage.getItem('qid');
            var req = {
                qstnpaper_id: qstnpaper_id
            };

            $http.post('/api/getPub_Vetting_Status', req).then(function (response) {
                $scope.pubvettingstatus = response.data.obj;
            });
        };

        $scope.getPubVettingStatus();
        $scope.loadFinalExamPaper = function () {
            var id = repositoryService.getFinalExamPaperId();
            var lang_name = '';
            if ($scope.selectedLanguage != null) {
                lang_name = $scope.selectedLanguage.lang_name;
            }
            let es = window.localStorage.getItem("es"); // added by shilpa

            var parameters = {
                off: 0,
                lim: id.length,
                exam_fk: exam_fkId,
                examPaper: exampaper_fk,
                language: lang_name,
                es: es, // added by shilpa exam status
                //added by dipika
            };
            window.localStorage.setItem("language", lang_name)
            $http.post('/api/load_admin_questions', parameters).then(function (response) {

                if (response.data.message != "error") {
                    $scope.showfinalpaper = response.data.data;
                    $scope.countQst = response.data.count[0].count;
                    $scope.countQst1 = response.data.count1[0].count;
                    let qstnpaper_id = window.localStorage.getItem('qid');
                    var req = {
                        qstnpaper_id: qstnpaper_id
                    };
                    $http.post('/api/getPub_Vetting_Status', req).then(function (response) {
                        $scope.pubvettingstatus = response.data.obj;
                    });
                }
                else {
                    $scope.reloadPage()
                }
            });
        }
        //$scope.loadFinalExamPaper();

        //$scope.currentExamname = repositoryService.getSelectedExamname(); // comment by shilpa
        // $scope.currentQstnPaperId = repositoryService.getSelectedQuestionPaperId(); // comment by shilpa
        $scope.currentExamname = window.localStorage.getItem('en');
        $scope.currentQstnPaperId = window.localStorage.getItem('qid');

        //Pagination function
        $scope.reloadPage = function () {
            //alert('ddddeee');
            $scope.showPages();
            $scope.reloadData(1);
            $scope.getStartedInitialization();
        }

        //Pagination function 
        $scope.reloadData = function (rowNum) {
            $scope.showfinalpaper;
            var page = rowNum;
            var offset;
            var limit;

            if (isNaN($scope.selectNoQstn.no_Qstn) && 'ALL' == $scope.selectNoQstn.no_Qstn.toUpperCase()) {
                offset = 0;
                limit = 'ALL';
                $scope.showOffset = 0;
            } else {
                $scope.showOffset = ((page - 1) * $scope.showQstn);
                offset = ((page - 1) * $scope.showQstn) + 1;//start for raw query
                limit = $scope.showQstn * page;//end
            }
            var id = repositoryService.getFinalExamPaperId();
            var lang_name = '';
            if ($scope.selectedLanguage != null) {
                lang_name = $scope.selectedLanguage.lang_name;
            }
            let es = window.localStorage.getItem("es"); // added by shilpa
            var parameters = {
                off: offset,
                lim: limit,
                exam_fk: exam_fkId,
                examPaper: exampaper_fk,
                language: lang_name,
                es: es  // added by shilpa exam status

            };
            $http.post('/api/load_admin_questions', parameters).then(function (response) {

                if (response.data.message != "error") {

                    $scope.showfinalpaper = response.data.data;
                    $scope.countQst = response.data.count[0].count;
                    $scope.countQst1 = response.data.count1[0].count;

                    if ($scope.selallQ == 'Yes') {
                        for (var i = 0; i < $scope.showfinalpaper.length; i++) {
                            let qbid = $scope.showfinalpaper[i].qb_id;
                            if (checkqbid.indexOf(qbid) != -1) {
                                $scope.pubquestvalue[qbid] = 'YES';
                            }

                        }
                    }
                    else {
                        for (var i = 0; i < $scope.showfinalpaper.length; i++) {
                            let qbid = $scope.showfinalpaper[i].qb_id;
                            $scope.pubquestvalue[qbid] = 'NO';
                        }
                    }
                    let qstnpaper_id = window.localStorage.getItem('qid');
                    var req = {
                        qstnpaper_id: qstnpaper_id
                    };
                    $http.post('/api/getPub_Vetting_Status', req).then(function (response) {
                        $scope.pubvettingstatus = response.data.obj;
                    });
                    $scope.showPages();

                }
                else {
                    $scope.countQst = 0
                    $scope.showfinalpaper = "no records to show"

                }


            });
        }

        $scope.showPages = function () {
            var noOfPage = 0;
            if ($scope.countQst != 0) {

                $scope.pageList = [];
                if (isNaN($scope.selectNoQstn.no_Qstn) && 'ALL' == $scope.selectNoQstn.no_Qstn.toUpperCase()) {
                    $scope.showQstn = $scope.countQst;
                    noOfPage = 1;
                } else {
                    $scope.showQstn = $scope.selectNoQstn.no_Qstn;
                    noOfPage = ($scope.countQst / $scope.showQstn);
                }
                for (var i = 0; i < noOfPage; i++) {
                    $scope.pageList.push(
                        {
                            id: (i + 1)
                        })
                }
            }
        }
        $scope.mcqSummaryTotal = function () {

            $scope.total_marks = 0;
            $scope.total_qstn = 0;
            $scope.totalShortfall = 0;
            $scope.total_replaced_quest = 0;
            $scope.total_replace_question_marks = 0;
            if ($scope.summary.length > 0) {
                for (var i = 0; i < $scope.summary.length; i++) {
                    var details = $scope.summary[i];

                    $scope.total_qstn += parseFloat(details.summary_question);
                    $scope.total_replaced_quest += parseFloat(details.total_replaced_quest);
                    $scope.total_marks += parseFloat(details.summary_marks);
                    if (details.total_replace_question_marks)
                        $scope.total_replace_question_marks += parseFloat(details.total_replace_question_marks)
                    $scope.totalShortfall += parseFloat(details.short_fall_qstn);
                }
            }
        }

        $scope.vetterStatusColor = function (status) {
            if (status == 'Done') {
                return "colorgreen";
            } else {
                return "colorblue";
            }

        };

        $scope.getMultiChkVal = function () {
        }

        $scope.loadSummaryForAdmin = function () {
            let qpid = window.localStorage.getItem('qid');
            let eid = window.localStorage.getItem('eid');
            let efk = window.localStorage.getItem('e_pk');

            let qba_module_fk = window.localStorage.getItem('qba_module_fk');
            var params = {
                qpid: qpid, //qstnpaperid
                exam_fk: eid, // eid
                examPaper: efk, //e_pk
                moduleId: qba_module_fk
            };

            $http.post('/api/load_summary_for_admin', params).then(function (response) {

                var summary_data = [];
                var module_fk = [];
                var modules_data = [];
                $scope.summary = response.data.obj;
                summary_data = response.data.obj;
                modules_data = response.data.obj;

                for (var i = 0; i < summary_data.length; i++) {
                    module_fk.push(summary_data[i].module_fk);

                }

                if (module_fk.length > 0) {
                    module_fk = module_fk.join();
                }
                window.localStorage.setItem("module_fk_for_mcq", module_fk);

                var moduledata = {
                    module_ID: module_fk,
                    exam_pk: window.localStorage.getItem("eid"),
                    e_pk: window.localStorage.getItem("e_pk")
                };
                $http.post('/api/get_modulename_admin', moduledata).then(function (response) {
                    $scope.moduleList = response.data.obj;
                    var module_details = {};
                    var module_ids = [];
                    for (var i = 0; i < $scope.moduleList.length; i++) {
                        module_ids.push($scope.moduleList[i].module_fk);
                    }
                    $scope.onlyUnique = function (value, index, self) {
                        return self.indexOf(value) === index;
                    }
                    module_ids = module_ids.filter($scope.onlyUnique);
                    var req_moduleids = {
                        module_ids: module_ids
                    };
                });

                $scope.mcqSummaryTotal();
            }, function errorCallback(response) {
            });
        }


        $scope.loadCaseSummaryForAdmin = function () {
            let qpid = window.localStorage.getItem('qid');
            let eid = window.localStorage.getItem('eid');
            let efk = window.localStorage.getItem('e_pk');
            let qba_module_fk = window.localStorage.getItem('qba_module_fk');
            var params = {
                /* qpid: qstnPprId,
                exam_fk: exam_fkId,
                examPaper: exampaper_fk */
                qpid: qpid, //qstnpaperid
                exam_fk: eid, // eid
                examPaper: efk, //e_pk
                moduleId: qba_module_fk
            };
            $http.post('/api/load_case_summary_for_admin', params).then(function (response) {

                var param = {
                    exam_fk: eid,
                    examPaper: efk
                }
                $http.post('/api/get_module_wise_data', params).then(function (response) {
                    $scope.moduleLists = response.data.obj;
                });


                $scope.caseSummary = response.data.obj;
                $scope.caseTotalParentQuestions = 0;
                $scope.caseTotalChildQuestions = 0;
                $scope.caseTotalMarks = 0.0;
                $scope.caseTotalShortfall = 0;
                $scope.caseTotalReplaceParentQuestions = 0;
                $scope.caseTotalReplaceChildQuestions = 0;
                $scope.caseTotalReplaceMarks = 0;
                for (var i = 0; i < $scope.caseSummary.length; i++) {
                    if (!$scope.caseSummary[i].parent_count) {
						$scope.caseSummary[i].parent_count = 0
					}
					if (!$scope.caseSummary[i].child_count) {
						$scope.caseSummary[i].child_count = 0
					}
					if (!$scope.caseSummary[i].summary_marks) {
						$scope.caseSummary[i].summary_marks = 0
					}
					if (!$scope.caseSummary[i].short_fall_qstn) {
						$scope.caseSummary[i].short_fall_qstn = 0
					}
					if (!$scope.caseSummary[i].total_replace_parent_question) {
						$scope.caseSummary[i].total_replace_parent_question = 0
					}
					if (!$scope.caseSummary[i].total_replace_child_question) {
						$scope.caseSummary[i].total_replace_child_question = 0
					}
                    $scope.caseTotalParentQuestions = $scope.caseTotalParentQuestions + parseInt($scope.caseSummary[i].parent_count);
                    $scope.caseTotalChildQuestions = $scope.caseTotalChildQuestions + parseInt($scope.caseSummary[i].child_count);
                    $scope.caseTotalMarks = $scope.caseTotalMarks + parseFloat($scope.caseSummary[i].summary_marks);
                    $scope.caseTotalShortfall = $scope.caseTotalShortfall + parseInt($scope.caseSummary[i].short_fall_qstn);
                    $scope.caseTotalReplaceParentQuestions = $scope.caseTotalReplaceParentQuestions + parseInt($scope.caseSummary[i].total_replace_parent_question);
                    $scope.caseTotalReplaceChildQuestions = $scope.caseTotalReplaceChildQuestions + parseInt($scope.caseSummary[i].total_replace_child_question);
                    if ($scope.caseSummary[i].total_replace_question_marks)
                        $scope.caseTotalReplaceMarks = $scope.caseTotalReplaceMarks + parseFloat($scope.caseSummary[i].total_replace_question_marks);
                }





            }, function errorCallback(response) {
            });
        }


        $scope.getStartedInitialization = function () {

            var noOfPage = 0;
            var remainder = 0;

            if (isNaN($scope.selectNoQstn.no_Qstn) && 'ALL' == $scope.selectNoQstn.no_Qstn.toUpperCase()) {
                noOfPage = 1;
            } else {
                $scope.showQstn = $scope.selectNoQstn.no_Qstn;
                noOfPage = parseInt($scope.countQst / $scope.showQstn);
                remainder = $scope.countQst % $scope.showQstn
            }

            if (remainder > 0)
                noOfPage = noOfPage + 1;

            var options = {
                currentPage: 1,
                totalPages: noOfPage,
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
            if ($("#pagination1").length != 0) {
                $('#pagination1').bootstrapPaginator(options);
            }
            if ($("#pagination2").length != 0) {
                $('#pagination2').bootstrapPaginator(options);
            }
        };

        //ends here

        $scope.loadLanguages = function () {
            $http.post('/api/get_languages')
                .then(function (response) {
                    $scope.languageList = response.data.obj;
                    $scope.selectedLanguage = $scope.languageList[0];
                })
        };
        $scope.editCaseForAdmin = function (caseData) {
            $scope.adminCaseEditFlag = true;
            repositoryService.setadminCaseEditFlag($scope.adminCaseEditFlag);
            repositoryService.seteditAdminQuestion(caseData);
            //    $scope.setExamDetails();  
            $state.go('addcsq_parent');
        }

        /* 	$scope.ckEditorFlag = false; */

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



        $scope.saveremarkdata = function (id, lang) {
            //$scope.loadEditor('editorRemarks',true);
            let eid = window.localStorage.getItem('eid');
            let efk = window.localStorage.getItem('e_pk');
            var remark = CKEDITOR.instances["remarkdata" + id].getData();

            var req = {
                remark: remark,
                qb_id: id,
                exam_fk: eid,
                exampaper_fk: efk,
                qst_audit_by: $scope.username
            };
            if (lang == 'ENGLISH') {
                $http.post('/api/saveremarkdata', req)
                    .then(function (response) {
                    });
                //CKEDITOR.instances["remarkdata" + id].destroy();
            }
            else {
                return
            }
        }

        $scope.saverefdata = function (id, lang) {

            let eid = window.localStorage.getItem('eid');
            let efk = window.localStorage.getItem('e_pk');
            var ref = CKEDITOR.instances["referencedata" + id].getData();

            var req = {
                ref: ref,
                qb_id: id,
                exam_fk: eid,
                exampaper_fk: efk,
                qst_audit_by: $scope.username
            };
            if (lang == 'ENGLISH') {
                $http.post('/api/saverefdata', req)
                    .then(function (response) {
                    });
                //CKEDITOR.instances["referencedata" + id].destroy();
            }
            else {
                return
            }
        }


        $scope.savecaldata = function (id, lang) {

            let eid = window.localStorage.getItem('eid');
            let efk = window.localStorage.getItem('e_pk');
            var cal = CKEDITOR.instances["calculationdata" + id].getData();

            var req = {
                cal: cal,
                qb_id: id,
                exam_fk: eid,
                exampaper_fk: efk,
                qst_audit_by: $scope.username
            };
            if (lang == 'ENGLISH') {
                $http.post('/api/savecaldata', req)
                    .then(function (response) {
                    });
                //CKEDITOR.instances["calculationdata" + id].destroy()
            }
            else {
                return
            }
        }


        $scope.onEnd = function () {
            $timeout(function () {
                //var arr_ele = document.getElementsByClassName("editable");
                if (!$scope.ckEditorFlag) {

                    //$scope.CKEdit();
                    //$("#jsButton").click();

                    if ($scope.pubvettingstatus.length > 0 && $scope.examStatus == 'N') {
                        $scope.watchRepoQuestionChange();
                        $scope.ckEditorFlag = true;
                    }
                    else {
                        $(".editable").attr('contenteditable', 'false');
                    }

                }

            }, 500);
        };

        $scope.CKEdit = function (id) {


            CKEDITOR.disableAutoInline = true;

            //var arr_ele = document.getElementsByClassName("editable");
            var arr_ele = $(".editable");
            for (var i = 0; i < arr_ele.length; i++) {
                if (arr_ele[i].id == id) {
                    if ($scope.examStatus != 'A') {
                        var state = $scope.editorStates[i]
                        if (state) {
                            return
                        }
                        //document.getElementById('board').style.visibility = 'visible'
                        var editor = CKEDITOR.inline(arr_ele[i], {
                            filebrowserBrowseUrl: '../ckeditor/ckeditor4.5/plugins/filemanager/browser/default/browser.html?Connector=/browser/browse',
                            filebrowserImageUploadUrl: '/uploader/upload?Type=Image',
                            customConfig: "../ckeditor-addMcq-conf.js"
                        });


                        editor.on(LITE.Events.INIT, function (event) {
                            // $scope.selectUser();
                            //document.getElementById('board').style.visibility = 'hidden'
                        });

                        $scope.editorStates[i] = new EditorState(editor);
                    }
                }
            }


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

        //added by shilpa
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

            $scope.loadEditor('editor1', true);
            $scope.loadEditor('editorRemarks', true);
            $scope.loadEditor('editorReference', true);
            $scope.loadEditor('editorCalculations', true);
            let eid = window.localStorage.getItem('eid');
            let efk = window.localStorage.getItem('e_pk');

            $timeout(function () {
                for (var i = 0; i < $scope.newChildQuestion.alternatives.length; i++) {
                    var editorId = 'editor' + $scope.newChildQuestion.alternatives[i].editorId;
                    if (!CKEDITOR.instances.editorId) {
                        $scope.loadEditor(editorId, true);
                    }
                }
            }, 50);
            if (type == 'P') {
                var Req = {
                    qb_pk: data.qb_pk,
                    examPk: eid,
                    qb_id: data.qb_id,
                    qstnpaper_id: qstnPprId,
                    exam_name: exam_name,
                    examPaperPk: efk
                };
            } else {
                var Req = {
                    qb_pk: data.qb_pk,
                    examPk: eid,
                    qb_id: data.qst_pid,
                    qstnpaper_id: qstnPprId,
                    exam_name: exam_name,
                    examPaperPk: efk
                };
            }

            return $http.post('/api/get_case_passage_child_details', Req)
                .then(function (response) {
                    $scope.casePassage = response.data.data;
                    $scope.parent_child_type = type;
                    $scope.replace_id = data.qb_id;
                    if (type == 'C') {
                        $('#addChildQuesModel').modal(
                            { show: true }
                        );
                    }
                });
        };

        $scope.saveCSQChild = function () {
            let eid = window.localStorage.getItem('eid');
            let efk = window.localStorage.getItem('e_pk');
            $scope.newChildQuestion.parent_child_type = $scope.parent_child_type;
            $scope.newChildQuestion.replace_id = $scope.replace_id;
            $scope.newChildQuestion.examFk = eid;
            $scope.newChildQuestion.exampaperFk = efk;
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
            $scope.newChildQuestion.userName = JSON.parse(localStorage.getItem("username"));

            var parentId = {
                qb_id: $scope.casePassage[0].qb_id,
                exam_fk: eid,
                exampaper_fk: efk,
                marks: $scope.marks
            };
            var req = $scope.newChildQuestion;
            var alertdialog = confirm("Are you sure you want to save the child question?")
            if (alertdialog) {
                return $http.post('/api/save_csq_child_admin', req)
                    .then(function (response) {
                        $http.post('/api/update_CSQ_child_count', parentId)
                            .then(function (res) {
                                alert("QBID " + response.data.replace_by_qb_id + " Saved Successfully.");
                                $window.location.reload();
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

        $scope.editQuestionForAdmin = function (questionData) {

            repositoryService.seteditAdminQuestion(questionData);
            //    $scope.setExamDetails();  
            $state.go('adminEditQuestion');
        }

        $scope.alternativeslogTabClicked = function (qb_id, qb_pk) {
            $(".logtab").attr("style", "display: none;");
            let eid = window.localStorage.getItem('eid');
            let efk = window.localStorage.getItem('e_pk');
            $("a").attr("aria-expanded", "false");
            //var name = "alternativeslog"+qb_id;
            var the_string = 'alternativeslog' + qb_id;
            var req = {
                qb_id: qb_id,
                exam_fk: eid,
                exampaper_fk: efk
            };
            $http.post('/api/getAlternativesLog', req)
                .then(function (response) {

                    $scope.the_string = response.data.obj;
                    $scope.finallog = $scope.the_string;
                    if ($scope.the_string.length == 0) {
                        $("a").attr("aria-expanded", "false");

                    }
                    var log = "alternativeslog" + qb_id
                    $('#' + log).toggle();
                    var remarkId = 'remark' + qb_pk;
                    var referenceId = 'reference' + qb_pk;
                    var calculationId = 'calculation' + qb_pk;

                    $('#' + remarkId).hide();
                    $('#' + referenceId).hide();
                    $('#' + calculationId).hide();
                });
        }

        $scope.exportInSifyFormat = function () {
            var examstatus = window.localStorage.getItem('es');
            var params = {
                exam_fk: repositoryService.getsetExamId(),
                examPaper: repositoryService.getExampaper_fk(),
                language: $scope.selectedLanguage.lang_name,
                examstatus: examstatus
            };
            $http.post('/api/export_parent_questions_in_sify_format', params).then(function (response) {
                var data_qb_id = []
                if (response.data['code'] == 1) {
                    window.open(response.data.obj);
                    for (var k = 0; k < response.data.data.length; k++) {
                        data_qb_id.push({ id: response.data.data[k].id, qb_id: response.data.data[k].qb_id })
                    }
                }
                params.data_qb_id = data_qb_id
                $http.post('/api/export_childQuestions_in_sify_format', params).then(function (response) {
                    if (response.data['code'] == 1) {
                        window.open(response.data.obj);
                    }
                });
            });


        }

        /*  CKEDITOR.on( 'instanceReady', function( evt ) {
              var editor = evt.editor,
              body = CKEDITOR.document.getBody();
              editor.on( 'blur', function() {
                   $http.post('/api/savealldata', $scope.showfinalpaper)
                      .then(function (response) {
                                $http.post('/api/edit_and_save_options', $scope.showfinalpaper)
                              .then(function () {
                                  saveLogData();
                              }); 
                      });		
              });    
          });*/


        $scope.savealldata = function (id, lang) {
            let eid = window.localStorage.getItem('eid');
            let efk = window.localStorage.getItem('e_pk');
            var qst_body = CKEDITOR.instances[id].getData();
            var req = {
                qst_body: qst_body,
                qb_id: id,
                exam_fk: eid,
                exampaper_fk: efk,
                qst_audit_by: $scope.username
            };
            if (lang == 'ENGLISH') {
                $http.post('/api/savealldata', req)
                    .then(function (response) {
                    });
               // CKEDITOR.instances[id].destroy();
            }
            else {
                return
            }
        }

        $scope.saveall = function (id, qb_id) {
            let eid = window.localStorage.getItem('eid');
            let efk = window.localStorage.getItem('e_pk');
            var qst_body = CKEDITOR.instances['alt' + id].getData();
            var req = {
                qst_body: qst_body,
                qta_pk: id,
                exam_fk: eid,
                exampaper_fk: efk,
                qst_audit_by: $scope.username,
                qb_id: qb_id
            };
            $http.post('/api/edit_and_save_options', req)
                .then(function () {
                    saveLogData();
                });
            //CKEDITOR.instances['alt' + id].destroy();
        }
        $scope.watchRepoQuestionChange = function () {
            // alert('dddee');
            // Watch for our DOM element's children to change
            var watch = $scope.$watch(function () {
                return $scope.showfinalpaper[0].current_time;
            }, function () {
                // Once change is detected, use $evalAsync to wait for
                // directives to finish
                $scope.$evalAsync(function () {



                    $scope.CKEdit();


                });
            });
        };

        angular.element(document).ready(function () {
            //$scope.CKEdit();

            document.getElementById('board').style.visibility = 'hidden'
            window.localStorage.setItem("language", $scope.languageList[0].lang_name);
            $scope.get_change_log_details();
            $scope.loadSummaryForAdmin();
            $scope.loadCaseSummaryForAdmin();
            $scope.loadLanguages();
            // $scope.vError = "";

            if (Object.keys($scope.selectedUser).length > 0) {
                var vetter = $scope.selectedUser
                $("#vetter").select2({
                    placeholder: 'Select vetter',
                    //allowClear: true,
                    data: vetter
                }).change(function (e) {
                    $scope.vError = '';
                });
            }

            if ($scope.selectedPublisher != undefined) {
                var publisher = $scope.selectedPublisher
                $("#publisher").select2({
                    placeholder: 'Select publisher',
                    //allowClear: true,
                    data: publisher
                }).change(function (e) {
                    $scope.publisherError = '';
                });

            }


            $("#dates-field2").change(function () {
                if ($(this).val() != "") {
                    $('#moduleErrorpublisher').css({ "display": "none" });
                }
                else {
                    $('#moduleErrorpublisher').css({ "display": "block" });
                }
            });

            $("#publisher").change(function () {
                if ($(this).val() != "") {
                    $('#publisherError').css({ "display": "none" });
                }
                else {
                    $('#publisherError').css({ "display": "block" });
                }
            });

            $("#dates-field3").change(function () {


                if ($(this).val() != "") {
                    $('#moduleErrorVetter').css({ "display": "none" });
                    $scope.moduleErrorVetter = '';
                }
                else {
                    $('#moduleErrorVetter').css({ "display": "block" });
                }
            });
            $("#vetter").change(function () {
                if ($(this).val() != "") {
                    $('#vetterError').css({ "display": "none" });
                }
                else {
                    $('#vetterError').css({ "display": "block" });
                }
            });

            var id = repositoryService.getFinalExamPaperId();
            var lang_name = '';
            if ($scope.selectedLanguage != null) {
                lang_name = $scope.selectedLanguage.lang_name;
            }

            let es = window.localStorage.getItem("es"); // added by shilpa
            // var finalid = {finalQstId:id}
            var parameters = {
                off: 0,
                lim: $scope.selectNoQstn.no_Qstn,
                exam_fk: exam_fkId,
                examPaper: exampaper_fk,
                language: lang_name,
                es: es
            };
            $http.post('/api/load_admin_questions', parameters).then(function (response) {

                if (response != null) {
                    $scope.showfinalpaper = response.data.data;
                    $scope.countQst = response.data.count[0].count;
                    $scope.countQst1 = response.data.count1[0].count;
                    $scope.showPages();
                    $scope.getStartedInitialization();
                }
            });


        });

        $scope.closeModalpopup = function () {
            $("#vetter").select2("val", "");
            $("#publisher").select2("val", "");
            $('span.redcolor').css({ 'display': 'none' });
            $("body").css("padding-right", "0");
        }
        $scope.back = function () {
            $window.history.back();

        }
        $scope.showPreview = function () {
            var examid = repositoryService.getsetExamId();
            var examname = repositoryService.getSelectedExamname();
            var qstnpaperId = repositoryService.getSelectedQuestionPaperId();
            var qba_module_fk = repositoryService.getExamModuleId();
            var exampaper_pk = repositoryService.getExampaper_fk();
            var module_fk = [];
            var setDetails = {
                exam_id: examid,
                qba_module_fk: qba_module_fk,
                exam_name: examname,
                qstnpaper_id: qstnpaperId,
                exampaper_pk: exampaper_pk


            }
            repositoryService.setVetterQuestionsParameters(setDetails);
            $state.go('examPaperAdminPreview');
        },



            //               $scope.printPage = function(){    
            //                                 var contents = $("#printTable").html();
            //                                 var frame1 = $('<iframe />');
            //                                 frame1[0].name = "frame1";
            //                                 frame1.css({ "position": "absolute", "top": "-1000000px" });
            //                                 $("body").append(frame1);   
            //                                 var frameDoc = frame1[0].contentWindow ? frame1[0].contentWindow : frame1[0].contentDocument.document ? frame1[0].contentDocument.document : frame1[0].contentDocument;
            //                                 frameDoc.document.open();
            //         //Create a new HTML document.
            //         frameDoc.document.write('<html><head><title>DIV Contents</title>');
            //         frameDoc.document.write('</head><body>');
            //         //Append the external CSS file.
            // frameDoc.document.write('<link href="css/bootstrap.min.css" rel="stylesheet" type="text/css" />');
            //         frameDoc.document.write('<link href="css/style.css" rel="stylesheet" type="text/css" />');
            // frameDoc.document.write('<link href="https://maxcdn.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css" rel="stylesheet" >');
            //  
            //         //Append the DIV contents.
            //         frameDoc.document.write(contents);
            //         frameDoc.document.write('</body></html>');
            //         frameDoc.document.close();
            //         setTimeout(function () {
            //                 window.frames["frame1"].focus();
            //                 window.frames["frame1"].print();
            //                 frame1.remove();
            //         }, 500);

            //         },

            $scope.loadPrintData = function () {
                // alert('loadprintdata');
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


        $scope.printPage = function () {


            var url = $state.href('PrintPageAdmin');
            window.open(url, '_blank');


        };





        // added by shilpa
        $scope.changeSelectedOption = function (event, index, alt, parentIndex, qb_id) {
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
                        $scope.showfinalpaper[parentIndex].qstn_alternatives = alt;
                        let eid = window.localStorage.getItem('eid');
                        let efk = window.localStorage.getItem('e_pk');
                        var req = {
                            qb_id: qb_id,
                            new_alt_id: alt[index].qta_pk,
                            exampaper_fk: efk,
                            exam_fk: eid,
                            userName: $scope.username
                        };
                        $http.post('/api/update_alt_correct_ans', req)
                            .then(function (response) {
                                $scope.reloadPage();
                            });
                        //$scope.alternativeslogTabClicked(qb_id);     
                        $scope.safeApply();

                    }
                    else {
                        for (var i = 0; i < alt.length; i++) {
                            if (alt[i].qta_is_corr_alt == 'Y') {
                                $("#radio" + parentIndex + i).prop("checked", true);
                            }
                        }
                    }
                });


        },



            $scope.safeApply = function (fn) {
                var phase = this.$root.$$phase;
                if (phase == '$apply' || phase == '$digest') {
                    if (fn && (typeof (fn) === 'function')) {
                        fn();
                    }
                } else {
                    this.$apply(fn);
                }
            }







    }



    angular
        .module('qbAuthoringToolApp')
        .controller('examPaperAdminController', examPaperAdminController);


    examPaperAdminController.$inject = ['$scope', '$filter', '$window', 'userService',
        'repositoryService', '$q', '$http', 'examService', '$state', '$sce', '$timeout'];

})();



