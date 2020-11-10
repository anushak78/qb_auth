(function () {
    'use strict';

    function qpPreviewController($scope, $filter, $window, userService, repositoryService, $state, $q, $http, $sce, examService, SweetAlert) {
        $scope.repoQuestions = [];

        $scope.courseList = [];
        $scope.subjectList = [];
        $scope.topicList = [];
        $scope.method = "default";
        $scope.searchquerylist = {};
        $scope.searchquery = "";
        $scope.countquery = "";

        $scope.pageList = [];
        $scope.countQst = 0;
        $scope.NoQstnList = repositoryService.getShowQuestionsPerPageList();

        $scope.selectNoQstn = $scope.NoQstnList[0];
        $scope.selectedCourse = {};
        $scope.selectedSubject = {};
        $scope.selectedTopic = {};
        $scope.showQstn = $scope.NoQstnList[0].no_Qstn;
        $scope.loginUser = userService.getUserData();
        $scope.username = JSON.parse(sessionStorage.getItem('username'));  // Dipika HSS//
        $scope.role = JSON.parse(localStorage.getItem("role"));
        $scope.cullingQuestionIdList = [];
        $scope.finalQstId = [];
        $scope.finalQstIdx = [];

        /*$scope.totalMarks = repositoryService.getTotalMarks();
        $scope.totalQuestion = repositoryService.getTotalCount();*/
        $scope.topicName = repositoryService.getSelectedTopic();

        $scope.caseSummaryList = repositoryService.getCaseSummary();

        $scope.shortfallQstn = repositoryService.getShortFallQuestion();

        $scope.questionHistoryList = [{ qstnpaper_id: '', exam_name: '', year: '' }];

        $scope.shortFallrecords = repositoryService.getShortFallRecords();

        $scope.caseShortFallrecords = repositoryService.getCaseShortFallRecords();
        $scope.replacedQuestionIdArray = [];

        $scope.maxCaseChildCount = repositoryService.getMaxChildPerCase();

        $scope.ParentQuestionMarksMap = {};
        document.getElementById('board').style.visibility = 'hidden'


        $scope.renderAsHtml = function (val) {
            return $sce.trustAsHtml(val);
        };


        $scope.isNormalInteger = function (str) {
            return /^[+]?([0-9]+(?:[\.][0-9]*)?|\.[0-9]+)(?:[eE][+-]?[0-9]+)?$/.test(str);
        }

        $scope.getSummarycount = function (data, questPprId) {
            for (var i = 0; i < data.length; i++) {
                var total = 0;
                $scope.topicName[i].summaryQuestions = 0;
                for (var j = 0; j < data[i].marks_count.length; j++) {
                    if ($scope.isNormalInteger(data[i].marks_count[j].userCount))
                        total += parseFloat(data[i].marks_count[j].userCount);
                    $scope.topicName[i].summaryQuestions = total;
                    $scope.topicName[i].questionPaperId = questPprId;
                    $scope.topicName[i].totalQuestion = $scope.totalQuestion;
                }
            }
            return total;
        }

        $scope.getSummaryMarks = function (data) {
            for (var i = 0; i < data.length; i++) {
                var total = 0;
                $scope.topicName[i].summaryMarks = 0;
                for (var j = 0; j < data[i].marks_count.length; j++) {
                    if ($scope.isNormalInteger(data[i].marks_count[j].userCount))
                        total += parseFloat(data[i].marks_count[j].userCount * data[i].marks_count[j].marks);
                    $scope.topicName[i].summaryMarks = total;
                    $scope.topicName[i].totalMarks = $scope.totalMarks;
                }
            }
            return total;
        }

        $scope.getFallShortQuest = function (data) {
            for (var i = 0; i < data.length; i++) {
                var fallShortQuest = 0;
                $scope.topicName[i].fallShortQuest = 0;
                $scope.topicName[i].totalFallShortQuest = $scope.shortfallQstn;
                for (var j = 0; j < data[i].marks_count.length; j++) {
                    if ($scope.isNormalInteger(data[i].marks_count[j].userCount))
                        if (parseFloat(data[i].marks_count[j].userCount) > parseFloat(data[i].marks_count[j].count)) {
                            fallShortQuest += parseFloat(data[i].marks_count[j].userCount - data[i].marks_count[j].count);
                            $scope.topicName[i].fallShortQuest = fallShortQuest;
                        }
                }
            }
            return fallShortQuest;
        }

        $scope.getFallShortQuest($scope.topicName);

        $scope.getTotalCount = function () {
            var data = [];
            data = $scope.topicName;
            var total = 0;
            for (var i = 0; i < data.length; i++) {
                total += parseFloat($scope.getSummarycount([data[i]]));
            }
            return total;
        }


        $scope.getTotalMarks = function () {
            var total = 0;
            var data = [];
            data = $scope.topicName;
            for (var i = 0; i < data.length; i++) {
                total += parseFloat($scope.getSummaryMarks([data[i]]));
            }
            return total;
        }

        $scope.getTotalShortFallQuestions = function () {
            var total = 0;
            var data = [];
            data = $scope.topicName;
            for (var i = 0; i < $scope.topicName.length; i++) {
                total += parseFloat($scope.getFallShortQuest([data[i]]));
            }
            return total;
        }

        $scope.totalMarks = $scope.getTotalMarks();
        //$scope.shortfallQstn = $scope.getTotalShortFallQuestions();
        $scope.totalQuestion = $scope.getTotalCount();

        //Pagination function
        $scope.reloadPage = function () {
            $scope.showPages();
            $scope.reloadData(1);
            $scope.getStartedInitialization();
        }

        //Pagination function 
        $scope.reloadData = function (rowNum) {
            $scope.repoQuestions = [];
            var loadedQuestId = [];
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
            var arr_cullingQIds = repositoryService.getCullingQuestionIdList();
            var parameters = { qbPkArray: arr_cullingQIds, off: offset, lim: limit, childLimit: $scope.maxCaseChildCount };
            var deferred = $q.defer();
            var transform = function (data) {
                return $.param(data);
            };
            $http.post('/api/load_questions_for_preview', parameters, {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
                transformRequest: transform,
                timeout: 0
            }).then(function (response) {
                $scope.repoQuestions = response.data.data;
                $scope.countQst = response.data.count[0].count;
                $scope.showPages();
                deferred.resolve(response);
                return $scope.finalQstId;

            }).catch(function (error) {
                deferred.reject(error);
            });
        }
        //Pagination function
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
                        }
                    )
                }

            }
        };

        $scope.remarkTabClicked = function (id) {
            var remarkId = 'remark' + id;
            var referenceId = 'reference' + id;
            var calculationId = 'calculation' + id;

            $('#' + remarkId).toggle();
            $('#' + referenceId).hide();
            $('#' + calculationId).hide();

            var remarkLiId = 'remarkLi' + id;
            if ($('#' + remarkLiId).hasClass('active')) {
                $('#' + remarkLiId).removeClass('active');
            } else {
                $('#' + remarkLiId).addClass('active');
            }
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

        $scope.replaceTabClicked = function (oldQuestion) {
            swal({
                title: "Are you sure?",
                text: " you want to replace the question?",
                dangerMode: true,
                buttons: ["No", "Yes!"],
            })
                .then((willDelete) => {
                    if (willDelete) {
                        var questionType = oldQuestion.qst_type;

                        var oldQuestionPk = oldQuestion.qb_pk;
                        var topicId = oldQuestion.qba_topic_fk;

                        var oldQuestionMarks;
                        var arr_availableQuestions;
                        var key;

                        if (questionType == "M") {
                            oldQuestionMarks = oldQuestion.qst_marks;
                            var allQuestionIdMap = repositoryService.getQuestionIdMap();
                            key = topicId + "~" + oldQuestionMarks;
                            arr_availableQuestions = allQuestionIdMap[key];
                        } else if (questionType == "CS") {
                            oldQuestionMarks = $scope.ParentQuestionMarksMap[oldQuestionPk];
                            var allCaseQuestionIdMap = repositoryService.getCaseQuestionIdMap();
                            //var childCount = $scope.maxCaseChildCount;
                            var childCount = $scope.ParentQuestionMarksMap[oldQuestionPk + "child"]
                            key = topicId + "~" + oldQuestionMarks + "~" + childCount;
                            arr_availableQuestions = allCaseQuestionIdMap[key];
                        }

                        //var arr_selectedQuestions = $scope.finalQstId;
                        var arr_selectedQuestions = repositoryService.getCullingQuestionIdList()

                        arr_availableQuestions = arr_availableQuestions.filter(function (el) {
                            return !arr_selectedQuestions.includes(el);
                        });
                        if ($scope.replacedQuestionIdArray != null && $scope.replacedQuestionIdArray.length > 0
                            && arr_availableQuestions != null && arr_availableQuestions.length > 0) {
                            arr_availableQuestions = arr_availableQuestions.filter(function (el) {
                                return !$scope.replacedQuestionIdArray.includes(el);
                            });
                        }

                        if (arr_availableQuestions == null || arr_availableQuestions.length == 0) {
                            //swal('No replacement available.');
                            var r = confirm("No replacement available. Please confirm to repeat previous questions.");
                            if (r == true) {
                                /* if(questionType == 'M'){
                                     arr_availableQuestions = allQuestionIdMap[key];
                                 }
                                 else if(questionType == 'CS'){
                                     arr_availableQuestions = allCaseQuestionIdMap[key]
                                 }*/
                                $scope.replacedQuestionIdArray = []
                            }
                            else {
                                return;
                            }
                        }

                        function shuffleArray(arrayOfIds) {
                            for (var i = arrayOfIds.length - 1; i > 0; i--) {
                                var j = Math.floor(Math.random() * (i + 1));
                                var temp = arrayOfIds[i];
                                arrayOfIds[i] = arrayOfIds[j];
                                arrayOfIds[j] = temp;
                            }
                        }
                        shuffleArray(arr_availableQuestions);

                        $scope.replacedQuestionIdArray.push(oldQuestionPk);
                        var newQuestionId = arr_availableQuestions[0];

                        var qIds = [];
                        qIds.push(newQuestionId);
                        if (questionType == "M") {
                            var parameters = { qbPkArray: qIds, off: 0, lim: 5, childLimit: 0 };
                        }
                        if (questionType == "CS") {
                            var parameters = { qbPkArray: qIds, off: 0, lim: $scope.maxCaseChildCount, childLimit: $scope.maxCaseChildCount };
                        }
                        var deferred = $q.defer();
                        var transform = function (data) {
                            return $.param(data);
                        };
                        $http.post('/api/load_questions_for_preview', parameters, {
                            headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
                            transformRequest: transform,
                            timeout: 0
                        }).then(function (response) {
                            var repoIndex = $scope.repoQuestions.findIndex(function (repoQuestions) {
                                return repoQuestions.qb_pk == oldQuestionPk;
                            });
                            if (questionType == "M") {
                                $scope.repoQuestions.splice(repoIndex, 1, response.data.data[0]);
                            } else if (questionType == "CS") {
                                var caseWithChildlist = response.data.data;
                                var pointer = repoIndex;
                                for (var i = 0; i < caseWithChildlist.length; i++) {
                                    $scope.repoQuestions.splice(pointer + i, 1, caseWithChildlist[i]);
                                }
                            }

                            for (var i = 0; i < $scope.repoQuestions.length; i++) {
                                if ($scope.finalQstId[i] == oldQuestionPk) {
                                    $scope.finalQstId.splice(i, 1, response.data.data[0].qb_pk);
                                }
                            }
                            deferred.resolve(response);
                            return $scope.finalQstId;
                        }).catch(function (error) {
                            deferred.reject(error);
                        });
                    }
                    else {
                        return false
                    }
                });

        };
        $scope.remove = function (abc) {
            var abc = abc;
            swal({
                text: "Are you sure you to want to remove this question, as this may create shortfall?",
                dangerMode: true,
                buttons: ["No", "Yes!"],
            })
                .then((willDelete) => {
                    if (willDelete) {
                        $scope.removeTabClicked(abc);
                    }
                });
        }
        $scope.removeTabClicked = function (repoQues) {
            var q_id = repoQues.qb_pk;
            var topic = repoQues.qba_topic_master.topic_name;
            var topic_pk = repoQues.qba_topic_master.qba_topic_pk;
            var marks = repoQues.qst_marks;
            var qstType = repoQues.qst_type;

            if (qstType == 'M') {
                for (var i = 0; i < $scope.topicName.length; i++) {
                    if ($scope.topicName[i].topic_name == topic) {
                        for (var j = 0; j < $scope.topicName[i].marks_count.length; j++) {
                            if ($scope.topicName[i].marks_count[j].marks == marks) {
                                $scope.topicName[i].fallShortQuest += 1
                                $scope.topicName[i].totalFallShortQuest += 1
                                for (var k = 0; k < $scope.shortFallrecords.length; k++) {
                                    if (topic == $scope.shortFallrecords[k].topicName && marks == $scope.shortFallrecords[k].marks) {
                                        $scope.shortFallrecords[k].eachFallShortQuestion += 1
                                        break
                                    }
                                }
                                if (k == $scope.shortFallrecords.length || $scope.shortFallrecords.length == 0) {
                                    var temp = {
                                        topic_pk: $scope.topicName[i].topic_pk,
                                        topicName: topic,
                                        eachFallShortQuestion: 1,
                                        module_fk: $scope.topicName[i].module_fk,
                                        marks: marks,
                                        subject: examService.getExamMasterData().qba_subject_fk,
                                        course: examService.getExamMasterData().qba_course_fk

                                    }
                                    $scope.shortFallrecords.push(temp)
                                }
                                //$scope.topicName[i].marks_count[j].userCount = $scope.topicName[i].marks_count[j].userCount - 1;
                            }
                        }
                    }
                }
            } else {
                var childList = ($filter('filter')($scope.repoQuestions, { qst_pid: repoQues.qb_id }));
                var childCount = repoQues.no_of_question;
                var topicOfRemovedQues1 = ($filter('filter')($scope.caseSummaryList, { topic_pk: topic_pk }));
                var topicOfRemovedQues = {}
                var case_marks = $scope.ParentQuestionMarksMap[q_id];
                for (var a = 0; a < topicOfRemovedQues1.length; a++) {
                    for (var b = 0; b < topicOfRemovedQues1[a].case_marks_count.length; b++) {
                        if (case_marks == topicOfRemovedQues1[a].case_marks_count[b].case_marks && childCount == topicOfRemovedQues1[a].case_marks_count[b].case_count_child_questions) {
                            topicOfRemovedQues = topicOfRemovedQues1[a]
                            break
                        }
                    }
                }
                for (var i = 0; i < topicOfRemovedQues.case_marks_count.length; i++) {
                    if (topicOfRemovedQues.case_marks_count[i].case_marks == case_marks) {
                        //topicOfRemovedQues.case_marks_count[i].parent_userCount -= 1;
                        //topicOfRemovedQues.case_marks_count[i].child_userCount -= childCount;
                        for (var j = 0; j < $scope.caseShortFallrecords.length; j++) {
                            if ($scope.caseShortFallrecords[j].topicName == topic && $scope.caseShortFallrecords[j].no_of_child_questions == childCount) {
                                $scope.caseShortFallrecords[j].shortfallCount += 1
                                break
                            }
                        }
                        if (j == $scope.caseShortFallrecords.length || $scope.caseShortFallrecords.length == 0) {
                            var temp = {
                                shortfallCount: 1,
                                topicName: topic,
                                case_marks: case_marks,
                                no_of_child_questions: childCount,
                                course_pk: examService.getExamMasterData().qba_course_fk,
                                topic_pk: topicOfRemovedQues.topic_pk,
                                subject_pk: examService.getExamMasterData().qba_subject_fk,
                                module_pk: topicOfRemovedQues.module_fk
                            }
                            $scope.caseShortFallrecords.push(temp)
                        }
                    }
                }
            }
            $scope.totalMarks = $scope.getTotalMarks();
            //$scope.shortfallQstn = $scope.getTotalShortFallQuestions();
            $scope.totalQuestion = $scope.getTotalCount();

            var questionId = $scope.finalQstId;
            var questionToBeRemoved = { quest_id: q_id };
            var index = questionId.indexOf(q_id);
            if (index > -1) {
                questionId.splice(index, 1);
            }
            $scope.replacedQuestionIdArray.push(q_id);


            /*var page = pageNo;
            $scope.showOffset = ((page-1)*$scope.showQstn);
            var offset = ((page-1)*$scope.showQstn)+1;//start for raw query
            var limit = $scope.showQstn*page;//end*/

            var parameters = { qbPkArray: questionId, off: 0, lim: $scope.selectNoQstn.no_Qstn, childLimit: $scope.maxCaseChildCount };
            var deferred = $q.defer();
            var transform = function (data) {
                return $.param(data);
            };
            $http.post('/api/load_questions_for_preview', parameters, {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
                transformRequest: transform,
                timeout: 0
            }).then(function (response) {
                $scope.repoQuestions = response.data.data;
                $scope.countQst = response.data.count[0].count;
                $scope.showOffset = 0;
                $scope.showPages();
                deferred.resolve(response);
            }).catch(function (error) {
                deferred.reject(error);
            });
        };


        $scope.historyTabClicked = function (q_id) {
            // var questionId = repositoryService.getCullingQuestionIdList();
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
                $scope.questionHistoryList = response.data.obj;
                // $('#historyModal').modal('show');

                deferred.resolve(response);
            }).catch(function (error) {
                deferred.reject(error);
            });
        };

        angular.element(document).ready(function () {

            $('html, body').scrollTop(0);



            var arr_cullingQIds = repositoryService.getCullingQuestionIdList();
            var parameters = { qbPkArray: arr_cullingQIds, off: 0, lim: $scope.selectNoQstn.no_Qstn, childLimit: $scope.maxCaseChildCount };
            var deferred = $q.defer();
            var transform = function (data) {
                return $.param(data);
            };
            //    return false;
            $http.post('/api/load_questions_for_preview', parameters, {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
                transformRequest: transform,
                timeout: 0
            }).then(function (response) {
                $scope.repoQuestions = response.data.data;
                $scope.countQst = response.data.count[0].count;
                $scope.finalQstId = arr_cullingQIds;
                $scope.showOffset = 0;
                $scope.showPages();
                $scope.getStartedInitialization();
                deferred.resolve(response);
                return $scope.finalQstId;
            }).catch(function (error) {
                deferred.reject(error);
            });


            //Load CS Parent Question Marks Map
            var examMaster = examService.getExamMasterData();
            var parameters2 = { subjectId: examMaster.qba_subject_fk };

            $http.post('/api/load_case_parent_marks_map', parameters2, {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
                transformRequest: transform,
                timeout: 0
            }).then(function (response) {
                $scope.ParentQuestionMarksMap = response.data.obj;
                deferred.resolve(response);
            }).catch(function (error) {
                deferred.reject(error);
            });


        });
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
            $('#pagination1').bootstrapPaginator(options);
            $('#pagination2').bootstrapPaginator(options);
        };



        function currentTime() {
            var d = new Date();
            d = d.toString().replace(/GMT/, "");
            d = d.toString().replace(/India Standard Time/, "");
            d = d.toString().replace(/["'()]/g, "");
            return d;
        }




        $scope.createExamPaper = function (qstnId) {

            var exam_name = window.localStorage.getItem('exam_name');
            var courser_code = window.localStorage.getItem('courser_code');
            var subject_code = window.localStorage.getItem('subject_code');
            var subject_abbreviation = window.localStorage.getItem('subject_abbreviation');


            //$scope.saveTopicwiseShortFallQstn();
            var selected_exam = examService.getSelectedExam();
            var examid = examService.getExamMasterData();
            var qp = "QPN";
            var days = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            var x = Math.floor(Math.random() * 10000) + 1;
            var dt = new Date();
            var currentMonth = dt.getMonth();
            var currentYear = dt.getFullYear();
            var generated_examname = examid.exam_name + " " + days[currentMonth] + " " + currentYear + "-" + x;
            var qstnPaperId = exam_name + "-" + courser_code + "-" + subject_code + "-" + subject_abbreviation;

            window.localStorage.setItem('qid', qstnPaperId);
            window.localStorage.setItem('en', exam_name);
            var finalid = { finalQstId: qstnId }
            repositoryService.setFinalExamPaperId(qstnId);
            $scope.new_exampaper_pk = [];
            $scope.new_exampaper_pk = window.localStorage.getItem("examselected_id").split(",");
            // $scope.new_exampaper_pk = window.localStorage.getItem("examselected_id");
            var exam_paper = {
                qstnpaper_id: qstnPaperId,
                exam_name: selected_exam,//examid.exam_name,
                created_dt: currentTime(),
                exam_qb_pk: qstnId,
                qba_subject_fk: examid.qba_subject_fk,
                qba_course_fk: examid.qba_course_fk,
                exam_fk: examid.exam_pk,
                new_exampaper_pk: $scope.new_exampaper_pk
            }

            repositoryService.setExamId(examid.exam_pk);

            repositoryService.setSelectedExamname(selected_exam);
            repositoryService.setSelectedQuestionPaperId(qstnPaperId);
            swal({
                title: "Are you sure?",
                text: " you want to Create Exam Paper?",
                dangerMode: true,
                buttons: ["No", "Yes!"],
            })
                .then((willDelete) => {
                    if (willDelete) {
                        document.getElementById('board').style.visibility = "visible"
                        $http.post('/api/add_exam_paper', exam_paper).then(function (response) {
                            if (response.data.message == "success") {
                                window.localStorage.setItem('es', 'N');
                                //swal("Exam paper created successfully!");
                                //$scope.saveSummaryForAdmin();
                                $scope.qstnPaperId = response.data.qstnpaper_id;
                                window.localStorage.setItem('qid', $scope.qstnPaperId);
                                $scope.getSummarycount($scope.topicName, qstnPaperId);
                                $scope.getSummaryMarks($scope.topicName);
                                repositoryService.setExampaper_fk(response.data.obj.exampaper_pk);//added by milan for vetter assignment right after create exam paper.

                                finalid.examId = examid.exam_pk;
                                finalid.examPaperId = response.data.obj.exampaper_pk;
                                window.localStorage.setItem('e_pk', finalid.examPaperId);
                                window.localStorage.setItem('eid', finalid.examId);

                                finalid.maxChildLimit = $scope.maxCaseChildCount;

                                finalid.userName = $scope.username
                                //call function here..$scope.saveTopicwiseShortFallQstn(examid.exam_pk,response.data.obj.exampaper_pk);
                                $http.post('/api/copy_culled_questions', finalid).then(function (response) {
                                    if (response != null) {

                                        //    $scope.saveTopicwiseShortFallQstn(finalid.examId,finalid.examPaperId);
                                        //$scope.saveTopicwiseCaseShortFallQstn(finalid.examId,finalid.examPaperId);
                                        var questionpaper_id = window.localStorage.getItem('qid');
                                        var params = {
                                            topicDetails: $scope.topicName,
                                            exam_fk: finalid.examId,
                                            exampaper_fk: finalid.examPaperId,
                                            questionpaper_id: questionpaper_id  //added by dipika
                                        }
                                        if (Object.keys($scope.topicName).length == 0) {
                                            // $scope.saveTopicwiseShortFallQstn(finalid.examId,finalid.examPaperId);
                                            $scope.saveTopicwiseCaseShortFallQstn(finalid.examId, finalid.examPaperId)
                                            swal("Exam paper created successfully!");
                                            document.getElementById('board').style.visibility = 'hidden'
                                            $scope.getCaseSummaryData(params.exam_fk, params.exampaper_fk, qstnPaperId);
                                            $state.go('examPaperAdmin');
                                        }
                                        else {
                                            $scope.saveTopicwiseShortFallQstn(finalid.examId, finalid.examPaperId);
                                            $http.post('/api/save_summary_for_admin', params).then(function (response) {
                                                if (response != null) {
                                                    swal("Exam paper created successfully!");
                                                    document.getElementById('board').style.visibility = 'hidden'
                                                    $scope.getCaseSummaryData(params.exam_fk, params.exampaper_fk, qstnPaperId);
                                                    $state.go('examPaperAdmin');
                                                }
                                            })
                                        }

                                    }
                                })

                            }
                        });

                    }
                    else {

                    }
                });


        }

        $scope.getCaseSummaryData = function (exam_pk, exampaper_pk, qstn_paper_id) {
            var casedata = $scope.caseSummaryList;
            var l_length = 0;
            var case_data_obj;
            var case_marks_length = 0;
            var caseSummaryData = [];
            var caseTopicData = [];
            if (casedata != null && casedata.length > 0) {
                l_length = casedata.length;
                for (var i = 0; i < l_length; i++) {
                    case_data_obj = new Object();
                    case_data_obj.topic_name = casedata[i].topic_name;
                    case_data_obj.topic_code = casedata[i].qba_topic_code;

                    case_marks_length = casedata[i].case_marks_count.length;
                    caseTopicData = casedata[i].case_marks_count;
                    case_data_obj.parent_count = 0;
                    case_data_obj.child_count = 0;
                    case_data_obj.summary_marks = 0;
                    case_data_obj.short_fall_qstn = 0;
                    for (var j = 0; j < case_marks_length; j++) {

                        //if(caseTopicData[j].case_marks == '1.00')
                        //{
                        case_data_obj.parent_count = parseInt(case_data_obj.parent_count) + parseInt(caseTopicData[j].parent_userCount);
                        //case_data_obj.child_count =  caseTopicData[j].child_userCount;
                        //case_data_obj.summary_marks = caseTopicData[j].case_marks*caseTopicData[j].child_userCount;  
                        case_data_obj.child_count = parseInt(case_data_obj.child_count) + parseInt(caseTopicData[j].parent_userCount * caseTopicData[j].case_count_child_questions);        // added by dipika


                        case_data_obj.summary_marks = parseFloat(case_data_obj.summary_marks) + parseFloat(caseTopicData[j].parent_userCount * caseTopicData[j].case_count_child_questions * caseTopicData[j].case_marks);    // added by dipika
                        if (parseInt(caseTopicData[j].parent_userCount) > parseInt(caseTopicData[j].case_count_questions)) {
                            case_data_obj.short_fall_qstn = parseInt(case_data_obj.short_fall_qstn) + parseInt(caseTopicData[j].parent_userCount - caseTopicData[j].case_count_questions);
                            for (var k = 0; k < $scope.caseShortFallrecords.length; k++) {
                                if (case_data_obj.topic_name == $scope.caseShortFallrecords[k].topicName && parseInt(caseTopicData[j].case_count_child_questions) == parseInt($scope.caseShortFallrecords[k].no_of_child_questions)) {
                                    if (case_data_obj.short_fall_qstn < $scope.caseShortFallrecords[k].shortfallCount) {
                                        case_data_obj.short_fall_qstn += ($scope.caseShortFallrecords[k].shortfallCount - case_data_obj.short_fall_qstn);
                                    }
                                }
                            }
                        }
                        else {
                            case_data_obj.short_fall_qstn = parseInt(case_data_obj.short_fall_qstn) + 0;
                            for (var k = 0; k < $scope.caseShortFallrecords.length; k++) {
                                if (case_data_obj.topic_name == $scope.caseShortFallrecords[k].topicName && parseInt(caseTopicData[j].case_count_child_questions) == parseInt($scope.caseShortFallrecords[k].no_of_child_questions) && parseFloat(caseTopicData[j].case_marks) == parseFloat($scope.caseShortFallrecords[k].case_marks)) {
                                    case_data_obj.short_fall_qstn = $scope.caseShortFallrecords[k].shortfallCount;
                                }
                            }
                        }

                        // }
                    }
                    var questionpaper_id = window.localStorage.getItem('qid');

                    case_data_obj.topic_pk = casedata[i].topic_pk;
                    //case_data_obj.qstn_paper_id = qstn_paper_id; 
                    case_data_obj.qstn_paper_id = questionpaper_id;   //comment added by dipika
                    case_data_obj.module_id = (casedata[i].module_id != undefined) ? casedata[i].module_id : 0;
                    case_data_obj.module_name = '';//casedata[i].module_name;
                    case_data_obj.module_fk = casedata[i].module_fk;
                    case_data_obj.audit_date = '';
                    case_data_obj.exam_fk = exam_pk;
                    case_data_obj.exampaper_fk = exampaper_pk;

                    caseSummaryData.push(case_data_obj)

                }
            }


            var params = {
                caseSummary: caseSummaryData
            }
            $http.post('/api/insert_case_summary', params).then(function (response) {
                if (response.data.message == "success") {

                    $state.go('examPaperAdmin');
                }
            });
        }

        $scope.saveTopicwiseShortFallQstn = function (exam_pk, exampaper_pk) {
            var params = {
                shortfall: $scope.shortFallrecords,
                exam_id: exam_pk,
                exampprId: exampaper_pk,
                pub_status: 'A',
                username: $scope.username
            }
            if ($scope.shortFallrecords.length == 0) {
                $scope.saveTopicwiseCaseShortFallQstn(exam_pk, exampaper_pk)
            }
            $http.post('/api/save_topicwise_shortfall_questions', params).then(function (response) {
                $scope.saveTopicwiseCaseShortFallQstn(exam_pk, exampaper_pk)


            })
        }

        $scope.saveTopicwiseCaseShortFallQstn = function (exam_pk, exampaper_pk) {
            var params = {
                shortfall: $scope.caseShortFallrecords,
                exam_id: exam_pk,
                exampprId: exampaper_pk,
                userName: $scope.username
            }
            $http.post('/api/save_topicwise_shortfall_case_questions', params).then(function (response) {
            })
        }

        $scope.previewBackButton = function () {
            $state.go('culling');
            $('.modal-backdrop').remove();
            $('body').removeClass('modal-open');
        }


    }

    angular
        .module('qbAuthoringToolApp')
        .controller('qpPreviewController', qpPreviewController);

    qpPreviewController.$inject = ['$scope', '$filter', '$window', 'userService', 'repositoryService', '$state', '$q', '$http', '$sce', 'examService'];

})();