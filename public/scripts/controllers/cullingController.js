(function () {
	'use strict';
	function cullingController($scope, $state, $q, $http, repositoryService, examService, userService) {

		var count = 1;
		$scope.questionIds = [];
		$scope.noOfCol = 0;
		$scope.maxCaseChildCount = 100;
		$scope.headerList = [];
		$scope.dataList = [];
		$scope.dataCaseList = [];
		$scope.cullingSummary = [];

		$scope.cullingCriteria = [
			{
				id: count, topic: '', typeOfQue: 'Multiple Choice', numOfQue: 5, numOfChildQue: 0, marks: 1, totalMarks: 5,
				addRemove: 'add'
			}];

		$scope.examMaster = {};
		$scope.totalInputQuestions = 0;
		$scope.totalInputMarks = 0;
		$scope.totalcaseQuestions = 0;
		$scope.totalcaseMarks = 0;
		$scope.questionIdsAfterCulling = [];
		$scope.error_msg = [];
		var qstnPprId = repositoryService.getSelectedQuestionPaperId();
		var examselected_id = "0";
		$scope.dataset = {
			name: '--Select--',
			schema: []
		};
		$scope.loginUser = userService.getUserData();
		$scope.username = JSON.parse(sessionStorage.getItem('username'));  // Dipika HSS//
		$scope.role = JSON.parse(window.localStorage.getItem("role"));
		$scope.sortByDateChk = true;
		var caseShortFallMap = {};

		$scope.selectedExampaper = [];
		$scope.adminSelectedExampaper = [];
		$scope.exam_pk = []
		$scope.loadExamPaperList = function () {
			$scope.sel_exampk = window.localStorage.getItem("selected_exampk");
			var sel_data = {
				exam_fk: $scope.sel_exampk
			}

			$http.post('/api/published_exam_paper_in_culling', sel_data).then(function (response) {
				//if(response.data.message == "success"){  
				$scope.loadExamPaperList = response.data.obj;

				$scope.populateQuestions(topicParams);
				for (var i = 0; i < $scope.loadExamPaperList.length; i++) {
					var status = $scope.loadExamPaperList[i].status;
					$scope.dataset.schema.push({
						module_name: $scope.loadExamPaperList[i].qstnpaper_id,
						exam_paper_pk: $scope.loadExamPaperList[i].exampaper_pk, checked: false
					});


				}
				//	}
			});
		};
		//$scope.loadExamPaperList(); 


		var getTemplateName = function () {
			var params = { exam_id: parseInt($scope.selectedExam.exam_pk) };
			$http.post('/api/get_template_name', params).then(function (response) {
				if (response.data.code == 0) {
					$scope.templateNames = response.data.obj;
				}
			});
		};

		$scope.addRow = function (rowId) {
			$scope.cullingCriteria.push({ id: ++count, topic: '', typeOfQue: 'Multiple Choice', numOfQue: 0, numOfChildQue: 0, marks: 0, totalMarks: 0, addRemove: 'remove' });
		};


		$scope.removeRow = function (rowId) {
			//$scope.row=rowNum;
			//$scope.cullingCriteria.splice(objToRemove);
			for (var i = 0; i < $scope.cullingCriteria.length; i++) {
				if ($scope.cullingCriteria[i].id == rowId) {
					$scope.cullingCriteria.splice(i, 1);
					break;
				}
			}

		};

		$scope.totalMarksForEachRow = function (criteria) {
			if (criteria.typeOfQue == 'Case Study') {
				criteria.totalMarks = criteria.numOfQue * criteria.numOfChildQue * criteria.marks;
				return criteria.totalMarks;
			} else if (criteria.typeOfQue == 'Multiple Choice') {
				criteria.totalMarks = criteria.numOfQue * criteria.marks;
				return criteria.totalMarks;
			}
			return 0;
		};

		$scope.isNormalInteger = function (str) {
			return /^[+]?([0-9]+(?:[\.][0-9]*)?|\.[0-9]+)(?:[eE][+-]?[0-9]+)?$/.test(str);
		}

		$scope.onlyUnique = function (value, index, self) {
			return self.indexOf(value) === index;
		}

		/*$scope.getSummarycount=function(data){
			var total=0;
			for(var i=0;i<data.length;i++)
			{
				if($scope.isNormalInteger(data[i].userCount))
				total+=parseFloat(data[i].userCount);
			}
			return total;
		}*/

		$scope.getSummarycount = function (topic_pk) {

			var total = 0;

			for (var i = 0; i < $scope.dataList.length; i++) {


				if ($scope.dataList[i].topic_pk == topic_pk) {

					for (var j = 0; j < $scope.dataList[i].marks_count.length; j++) {
						if ($scope.isNormalInteger($scope.dataList[i].marks_count[0].userCount))
							total += parseFloat($scope.dataList[i].marks_count[j].userCount);
					}

				}


			}

			return total;

		}


		/*$scope.getSummaryMarks=function(data){
			var  total=0;
			for(var i=0;i<data.length;i++)
			{
				if($scope.isNormalInteger(data[i].userCount))
				total+=parseFloat(data[i].userCount*data[i].marks);
			}
			return total;
		}*/

		$scope.getSummaryMarks = function (topic_pk) {
			var total = 0;
			/*for(var i=0;i<data.length;i++)
			{
				if($scope.isNormalInteger(data[i].userCount))
				total+=parseFloat(data[i].userCount*data[i].marks);
			}*/

			for (var i = 0; i < $scope.dataList.length; i++) {


				if ($scope.dataList[i].topic_pk == topic_pk) {

					for (var j = 0; j < $scope.dataList[i].marks_count.length; j++) {
						if ($scope.isNormalInteger($scope.dataList[i].marks_count[0].userCount))
							total += parseFloat($scope.dataList[i].marks_count[j].userCount * $scope.dataList[i].marks_count[j].marks);
					}

				}


			}

			return total;
		}


		/*$scope.getFallShortQuest = function(data){
			var fallShortQuest = 0;
			for(var i=0; i<data.length; i++){
				if(parseFloat(data[i].userCount) > parseFloat(data[i].count)){
					if($scope.isNormalInteger(data[i].userCount))
					fallShortQuest+=parseFloat(data[i].userCount - data[i].count);
				} 
			}      
			return fallShortQuest;
		}*/

		$scope.getFallShortQuest = function (topic_pk) {
			var fallShortQuest = 0;
			/*for(var i=0; i<data.length; i++){
				if(parseFloat(data[i].userCount) > parseFloat(data[i].count)){
					if($scope.isNormalInteger(data[i].userCount))
					fallShortQuest+=parseFloat(data[i].userCount - data[i].count);
				} 
			}    */
			for (var i = 0; i < $scope.dataList.length; i++) {

				if ($scope.dataList[i].topic_pk == topic_pk) {

					for (var j = 0; j < $scope.dataList[i].marks_count.length; j++) {
						if (parseFloat($scope.dataList[i].marks_count[0].userCount) > parseFloat($scope.dataList[i].marks_count[j].count)) {
							if ($scope.isNormalInteger($scope.dataList[i].marks_count[0].userCount))
								fallShortQuest += parseFloat($scope.dataList[i].marks_count[j].userCount - $scope.dataList[i].marks_count[j].count);
						}
					}

				}

			}
			return fallShortQuest;
		}

		$scope.getMCQSummarycount = function (module_pk) {

			var data = [];
			data = $scope.dataList;
			var total = 0;

			for (var i = 0; i < data.length; i++) {
				if (data[i].module_fk == module_pk) {
					for (var j = 0; j < data[i].marks_count.length; j++) {
						if ($scope.isNormalInteger(data[i].marks_count[j].userCount))
							total += parseFloat(data[i].marks_count[j].userCount);
					}
				}

			}
			return total;
		}



		$scope.getMCQSummaryMarks = function (module_pk) {

			var data = [];
			data = $scope.dataList;
			var total = 0;
			for (var i = 0; i < data.length; i++) {
				if (data[i].module_fk == module_pk) {
					for (var j = 0; j < data[i].marks_count.length; j++) {
						if ($scope.isNormalInteger(data[i].marks_count[j].userCount))
							total += parseFloat(data[i].marks_count[j].userCount * data[i].marks_count[j].marks);
					}
				}
			}
			return total;
		}




		$scope.getMCQFallShortQuest = function (module_pk) {
			var data = [];
			data = $scope.dataList;

			var fallShortQuest = 0;
			for (var i = 0; i < data.length; i++) {

				if (parseFloat(data[i].userCount) > parseFloat(data[i].count)) {
					if ($scope.isNormalInteger(data[i].userCount))
						fallShortQuest += parseFloat(data[i].userCount - data[i].count);
				}
				if (data[i].module_fk == module_pk) {

					for (var j = 0; j < data[i].marks_count.length; j++) {
						if (parseFloat(data[i].marks_count[j].userCount) > parseFloat(data[i].marks_count[j].count)) {
							if ($scope.isNormalInteger(data[i].marks_count[j].userCount))
								fallShortQuest += parseFloat(data[i].marks_count[j].userCount - data[i].marks_count[j].count);
						}
					}

				}

			}
			return fallShortQuest;
		}

		$scope.getTotalCount = function (topic_array) {
			var data = [];
			data = topic_array;
			var total = 0;
			if (topic_array != undefined) {
				for (var i = 0; i < data.length; i++) {

					total += parseFloat($scope.getSummarycount(data[i].topic_pk));
					//$scope.totalQstnCount = total
				}
				//repositoryService.setTotalCount(total);

				$scope.totalQstnCount = total;
				repositoryService.setTotalCount(total);
				return total;
			}
		}

		$scope.getTotalMarks = function (topic_array) {
			var data = [];
			data = topic_array;
			var total = 0;
			if (topic_array != undefined) {
				for (var i = 0; i < data.length; i++) {

					total += parseFloat($scope.getSummaryMarks(data[i].topic_pk));
					//$scope.totalQstnCount = total
				}
				repositoryService.setTotalMarks(total);

				$scope.totalMCQMarks = total;
				return total;
			}
		}

		$scope.getTotalShortFallQuestions = function (topic_array) {
			var data = [];
			data = topic_array;
			var total = 0;
			if (topic_array != undefined) {
				for (var i = 0; i < data.length; i++) {

					total += parseFloat($scope.getFallShortQuest(data[i].topic_pk));
					//$scope.totalQstnCount = total
				}
				repositoryService.setShortFallQuestion(total);

				$scope.totalShrtfallQstnCount = total
				return total;
			}
		}


		$scope.TopicwiseShortFallDetails = function () {

			var topicwiseFallShort = [];
			if ($scope.shortFallrecords != undefined || $scope.shortFallrecords != null) {
				for (var j = 0; j < $scope.shortFallrecords.length; j++) {
					for (var i = 0; i < $scope.shortFallrecords[j].marks_count.length; i++) {
						if (parseFloat($scope.shortFallrecords[j].marks_count[i].userCount) > parseFloat($scope.shortFallrecords[j].marks_count[i].count)) {
							if ($scope.isNormalInteger($scope.shortFallrecords[j].marks_count[i].userCount))
								topicwiseFallShort.push({
									topic_pk: $scope.shortFallrecords[j].topic_pk,
									topicName: $scope.shortFallrecords[j].topic_name,
									marks: $scope.shortFallrecords[j].marks_count[i].marks,
									course: $scope.selectedCourse.qba_course_pk,
									subject: $scope.selectedSubject.qba_subject_pk,
									module_fk: $scope.shortFallrecords[j].module_fk,
									eachFallShortQuestion: parseFloat($scope.shortFallrecords[j].marks_count[i].userCount - $scope.shortFallrecords[j].marks_count[i].count)
								});
						}
					}
				}
				repositoryService.setShortFallRecords(topicwiseFallShort);
				return topicwiseFallShort;
			}
		}

		$scope.TopicwiseCaseShortFallDetails = function () {

			var caseShortfallList = [];
			caseShortFallMap = new Object;
			var shortFallQuest = 0;
			var caseData = $scope.dataCaseList;
			for (var i = 0; i < caseData.length; i++) {
				//	if(caseData[i].topic_pk==topic_pk){
				for (var j = 0; j < caseData[i].case_marks_count.length; j++) {
					if (parseFloat(caseData[i].case_marks_count[j].parent_userCount) > parseFloat(caseData[i].case_marks_count[j].case_count_questions)) {
						if ($scope.isNormalInteger(caseData[i].case_marks_count[j].parent_userCount)) {
							shortFallQuest += parseFloat(caseData[i].case_marks_count[j].parent_userCount - caseData[i].case_marks_count[j].case_count_questions);

							caseData[i].shortfall_count = parseFloat(caseData[i].case_marks_count[j].parent_userCount - caseData[i].case_marks_count[j].case_count_questions);

							var key = caseData[i].topic_pk + "~" + caseData[i].case_marks_count[j].case_marks;
							var shortFallrecord = caseShortFallMap[key];
							if (shortFallrecord == null || shortFallrecord == undefined) {
								var newRecord = {
									topic_pk: caseData[i].topic_pk,
									topicName: caseData[i].topic_name,
									module_pk: caseData[i].module_fk,
									course_pk: $scope.selectedCourse.qba_course_pk,
									subject_pk: $scope.selectedSubject.qba_subject_pk,
									case_marks: caseData[i].case_marks_count[j].case_marks,
									shortfallCount: caseData[i].shortfall_count,
									no_of_child_questions: caseData[i].case_marks_count[j].case_count_child_questions
								};
								caseShortFallMap[key] = newRecord;
							}
							else {
								shortFallrecord.shortfallCount = shortFallQuest;
							}
						}
					}
				}
				//	}
			}
			$.each(caseShortFallMap, function (index, value) {
				caseShortfallList.push(value);
			})
			repositoryService.setCaseShortFallRecords(caseShortfallList);
		};

		var subject_code = $scope.selectedSubject == null ? 0 : $scope.selectedSubject.qba_subject_code;
		var courser_code = $scope.selectedCourse == null ? 0 : $scope.selectedCourse.qba_course_code;
		var subject_abbreviation = $scope.selectedsubjectabbrevi == null ? 0 : $scope.selectedsubjectabbrevi.subject_abbreviation;
		var exam_name = $scope.selectedExam == null ? 0 : $scope.selectedExam.exam_name;

		window.localStorage.setItem('subject_code', subject_code);
		window.localStorage.setItem('courser_code', courser_code);
		window.localStorage.setItem('subject_abbreviation', subject_abbreviation);
		window.localStorage.setItem('exam_name', exam_name);



		$scope.generateExamPaper = function () {
			var totalCSQCasequestions = $scope.totalcaseQuestions;
			var totalQuestions = $scope.totalInputQuestions;
			var total = parseFloat($scope.totalQstnCount + $scope.totalCSQChildCount);
			var totalCSQMarks = $scope.totalCSQMarks; //added by chintan
			var totalcaseMarks = $scope.totalcaseMarks; //added by chintan
			var totalMarks = $scope.totalInputMarks;
			var totalMCQCSQMarks = 0
			if ($scope.totalCSQMarks && $scope.totalMCQMarks) {
				totalMCQCSQMarks = parseFloat($scope.totalMCQMarks + $scope.totalCSQMarks);
			}
			else if ($scope.totalMCQMarks) {
				totalMCQCSQMarks = parseFloat($scope.totalMCQMarks);
			}
			else if ($scope.totalCSQMarks) {
				totalMCQCSQMarks = parseFloat($scope.totalCSQMarks);
			}
			if (totalQuestions > total || totalMarks > totalMCQCSQMarks || $scope.totalCSQChildCount < totalCSQCasequestions || totalCSQMarks < totalcaseMarks) {

				swal("Selected questions are less than required", {
					icon: "warning",
				});
				return false;
			}
			var flag = $scope.validatePage();

			$scope.TopicwiseShortFallDetails();
			$scope.TopicwiseCaseShortFallDetails();
			var subjectId = $scope.selectedSubject == null ? 0 : $scope.selectedSubject.qba_subject_pk;


			var subject_code = $scope.selectedSubject == null ? 0 : $scope.selectedSubject.qba_subject_code;
			var courser_code = $scope.selectedCourse == null ? 0 : $scope.selectedCourse.qba_course_code;
			var subject_abbreviation = $scope.selectedsubjectabbrevi == null ? 0 : $scope.selectedsubjectabbrevi.subject_abbreviation;
			var exam_name = $scope.selectedExam == null ? 0 : $scope.selectedExam.exam_name;

			window.localStorage.setItem('subject_code', subject_code);
			window.localStorage.setItem('courser_code', courser_code);
			window.localStorage.setItem('subject_abbreviation', subject_abbreviation);
			window.localStorage.setItem('exam_name', exam_name);
			// var selected_e_pk = window.localStorage.getItem("examselected_id");

			$scope.selected_e_pk = [];
			$scope.selected_e_pk.push(window.localStorage.getItem("examselected_id"));
			var admin_examselected_id = [] 
			admin_examselected_id.push(window.localStorage.getItem("admin_examselected_id"));

			var parameters =
			{
				subject: subjectId,
				selected_e_pk: $scope.selected_e_pk,
				admin_e_pk: admin_examselected_id
			};
			var deferred = $q.defer();
			var transform = function (data) {
				return $.param(data);
			};
			if (flag == 0) {
				$http.post('/api/TopicwiseQstnId', parameters, {
					headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
					transformRequest: transform,
					timeout: 0
				}).then(function (response) {
					var questionIdMap = response.data.obj;
					$scope.selectRandomQuestions(questionIdMap);
					//repositoryService.setCullingQuestionIdList($scope.questionIdsAfterCulling);
					repositoryService.setQuestionIdMap(questionIdMap);
					examService.setExamMasterData($scope.examMaster);
					examService.setSelectedExam($scope.selectedExam.exam_name);
					//Apical

					$http.post('/api/TopicwiseCaseQstnId', parameters, {
						headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
						transformRequest: transform,
						timeout: 0
					}).then(function (caseResponse) {
						var caseQuestionIdMap = caseResponse.data.obj;
						//$scope.selectRandomCaseQuestions(caseQuestionIdMap);
						//repositoryService.setCullingQuestionIdList($scope.questionIdsAfterCulling);

						repositoryService.setCaseQuestionIdMap(caseQuestionIdMap);

						var caseCullingParams = {
							subject: subjectId,
							maxChildPerCase: $scope.maxCaseChildCount,
							userInput: $scope.dataCaseList,
							selected_e_pk: $scope.selected_e_pk,
							status: status
						}
						var params = { caseCullingData: caseCullingParams };
						$http.post('/api/Case_Question_Culling', params, {
							headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
							transformRequest: transform,
							timeout: 0
						}).then(function (caseCullingResponse) {
							var caseQuestionIds = caseCullingResponse.data.obj;

							$scope.questionIdsAfterCulling = $scope.questionIdsAfterCulling.concat(caseQuestionIds);
							repositoryService.setCullingQuestionIdList($scope.questionIdsAfterCulling);
							repositoryService.setMaxChildPerCase($scope.maxCaseChildCount);
							repositoryService.setCaseSummary($scope.dataCaseList);

							$state.go('qp_preview');
						})


					})
					//Then


					deferred.resolve(response);
				}).catch(function (error) {
					deferred.reject(error);
				});
			}
			else {
				$("html, body").animate({ scrollTop: 0 }, "fast");
				//alert("please select all mandatory details.")
			}

		};

		$scope.selectRandomQuestions = function (questionMap) {
			for (var i = 0; i < $scope.dataList.length; i++) {
				var topic = $scope.dataList[i];
				var topicPk = topic.topic_pk;

				for (var j = 0; j < topic.marks_count.length; j++) {
					var marksData = topic.marks_count[j];
					if (marksData.userCount > 0 && marksData.count > 0) {
						var key = topicPk + "~" + marksData.marks;
						var questionList = questionMap[key];

						if ($scope.sortByDateChk) {
							questionList.sort(function (a, b) { return b - a });
						}


						if (questionList != null && questionList.length > 0) {
							if (parseInt(marksData.userCount) >= marksData.count) {
								$scope.questionIdsAfterCulling = $scope.questionIdsAfterCulling.concat(questionList);
							} else {
								if ($scope.sortByDateChk) {
									var sortedCulledList = questionList.slice(0, marksData.userCount);
									$scope.questionIdsAfterCulling = $scope.questionIdsAfterCulling.concat(sortedCulledList);
								} else {
									$scope.generateRandomIds(marksData.userCount, questionList);
								}
							}
						}
					}
				}
			}
		};



		$scope.generateRandomIds = function (count, arr_questions) {
			var arrayOfIds = arr_questions;
			var finalArray = [];

			function shuffleArray(arrayOfIds) {
				for (var i = arrayOfIds.length - 1; i > 0; i--) {
					var j = Math.floor(Math.random() * (i + 1));
					var temp = arrayOfIds[i];
					arrayOfIds[i] = arrayOfIds[j];
					arrayOfIds[j] = temp;
				}
				finalArray = arrayOfIds;
			}
			shuffleArray(arrayOfIds);

			var arr_selectedQIds = finalArray.slice(0, count);
			$scope.questionIdsAfterCulling = $scope.questionIdsAfterCulling.concat(arr_selectedQIds);

		};

		$scope.selectedCourse = {};
		$scope.selectedSubject = {};
		$scope.selectedsubjectabbrevi = {};
		$scope.selectedTopic = {};
		$scope.topicRecords = {};

		$scope.selectedExam = {};


		$scope.getCoursename = function () {
			if ($scope.selectedExam == null) {
				$scope.selectedCourse = "";
				$scope.selectedsubjectabbrevi = {};
				$scope.selectedSubject = "";
				$scope.dataCaseList = "";
				$scope.dataList = "";
				return;
			}
			var courseId = $scope.selectedExam.qba_course_fk;
			var subId = $scope.selectedExam.qba_subject_fk;
			var deferred = $q.defer();
			var parameters = { id: courseId };
			$http.post('/api/load_courses', parameters).then(function (response) {
				var errcode = response.data.code;
				// alert("errcode"+errcode);
				if (errcode == 500) {
					$state.go('login');
				}
				else {
					$scope.examList = response.data.obj;
					$scope.selectedCourse = $scope.examList[0];
					deferred.resolve(response);
					$scope.getSubjectList(subId);
					if ($scope.selectedExam == "") {
						$scope.selectedCourse = "";

					}
				}
				getTemplateName();
			}).catch(function (error) {
				deferred.reject(error);
			});
		}

		$scope.getalldata = function () {
			$scope.dataset = {
				name: '--Select--',
				schema: []
			};

			if ($scope.selectedExam == null) {

				$scope.selectedCourse = "";
				$scope.selectedsubjectabbrevi = {};
				$scope.selectedSubject = "";
				$scope.dataCaseList = "";
				$scope.dataList = "";
				$scope.totalInputQuestions = "";
				$scope.totalInputMarks = "";
				$scope.totalcaseQuestions = "";
				$scope.totalcaseMarks = "";
				return;
			}

			var exam_name = $scope.selectedExam.exam_name;

			var deferred = $q.defer();
			var parameters = { exam_name: exam_name };
			$http.post('/api/load_alldata', parameters).then(function (response) {

				var errcode = response.data.code;
				var cname = response.data.obj[0][0].qba_course_name;
				var sname = response.data.obj[0][0].subject_name;
				var selected_exampk = response.data.obj[0][0].exam_pk;
				window.localStorage.setItem("cname", cname);
				window.localStorage.setItem("sname", sname);
				window.localStorage.setItem("selected_exampk", selected_exampk);
				//$scope.loadExamPaperList();

				$scope.sel_exampk = window.localStorage.getItem("selected_exampk");

				var sel_data = {

					exam_fk: $scope.sel_exampk
				}

				$http.post('/api/published_exam_paper_in_culling', sel_data).then(function (response) {
					//if(response.data.message == "success"){  
					$scope.loadExamPaperList = response.data.obj;

					//$scope.populateQuestions(topicParams);
					for (var i = 0; i < $scope.loadExamPaperList.length; i++) {
						var status = $scope.loadExamPaperList[i].status;


						$scope.dataset.schema.push({
							module_name: $scope.loadExamPaperList[i].qstnpaper_id,
							exam_paper_pk: $scope.loadExamPaperList[i].exampaper_pk, checked: false
						});


					}
					//	}
				});
				// alert("errcode"+errcode);
				if (errcode == 500) {
					$state.go('login');
				}
				else {

					$scope.course = [
						{
							qba_course_name: response.data.obj[0][0].qba_course_name,
							qba_course_code: response.data.obj[0][0].qba_course_code,
							qba_course_pk: response.data.obj[0][0].qba_course_pk,
							exampaper_pk: response.data.obj[0][0].exam_pk
						}
					];
					$scope.selectedCourse = $scope.course[0];
					$scope.subjectList = [
						{
							qba_subject_code: response.data.obj[0][0].qba_subject_code,
							subject_name: response.data.obj[0][0].subject_name,
							qba_subject_pk: response.data.obj[0][0].qba_subject_pk,
							exampaper_pk: response.data.obj[0][0].exam_pk
						}
					];
					$scope.selectedSubject = $scope.subjectList[0];


					$scope.subjectabbrevi = [
						{
							subject_abbreviation: response.data.obj[0][0].subject_abbreviation,

						}
					];
					$scope.selectedsubjectabbrevi = $scope.subjectabbrevi[0];

					$scope.casequestion = [
						{
							casequestion: response.data.obj[0][0].case_question,

						}
					];
					$scope.selectedcasequestion = $scope.casequestion[0];
					$scope.getTopicListTable();


					deferred.resolve(response);

				}

			}).catch(function (error) {
				deferred.reject(error);
			});


		}


		$scope.getSubjectList = function () {

			$scope.headerList = [];
			$scope.dataList = [];
			if ($scope.selectedCourse == null) {
				$scope.subjectList = [];
				$scope.dataCaseList = "";
				return;
			}
			//var courseId = $scope.selectedCourse.qba_course_pk;
			var subjectId = $scope.selectedExam.qba_subject_fk;
			var parameters = { id: subjectId };      // var parameters = {id:courseId};
			var deferred = $q.defer();
			var transform = function (data) {
				return $.param(data);
			};
			$http.post('/api/load_subjects', parameters, {
				headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
				transformRequest: transform,
				timeout: 0
			}).then(function (response) {
				var errcode = response.data.code;
				if (errcode == 500) {
					$state.go('login');
				}
				$scope.subjectList = response.data.obj;
				$scope.selectedSubject = $scope.subjectList[0];
				$scope.getTopicListTable();
				deferred.resolve(response);
				if ($scope.selectedCourse == "") {
					$scope.selectedSubject = "";
				}
			}).catch(function (error) {
				deferred.reject(error);
			});
		};

		$scope.getExamMasterData = function () {

			if ($scope.selectedSubject == null) {
				return;
			}
			var courseId = $scope.selectedCourse.qba_course_pk;
			var subjectId = $scope.selectedSubject.qba_subject_pk;
			var examfk = $scope.selectedCourse.exampaper_pk;
			//var parameters = {course:courseId,subject:subjectId};
			var parameters = {
				course: courseId,
				subject: subjectId,
				exampaper_pk: examfk
			};
			var deferred = $q.defer();
			var transform = function (data) {
				return $.param(data);
			};
			$http.post('/api/load_exam_master', parameters).then(function (response) {
				$scope.examMaster = response.data.obj;
				if ($scope.examMaster != null) {
					$scope.totalInputQuestions = $scope.examMaster.total_qts;
					$scope.totalInputMarks = $scope.examMaster.total_marks;
					$scope.totalcaseQuestions = $scope.examMaster.case_question;
					$scope.totalcaseMarks = $scope.examMaster.case_marks;

				} else {
					$scope.totalcaseQuestions = 0;
					$scope.totalcaseMarks = 0;
				}
				deferred.resolve(response);
			}).catch(function (error) {
				deferred.reject(error);
			});

		};


		$scope.getTopicListTable = function () {

			var selectedExamPaperID = [];
			var adminSelectedExampaperID = [];
			$scope.getExamMasterData();
			if ($scope.selectedSubject == null) {
				return;
			}
			data = $('#dates-field3').val();
		//	var admin_data = $('#date4').val();
			examselected_id = 0;
		//	var admin_examselected_id = 0;

			if (data != null) {
				for (var i = 0; i < data.length; i++) {
					selectedExamPaperID.push(data[i]);
				}
			}
			/*if (admin_data != null) {
				for (var i = 0; i < admin_data.length; i++) {
					adminSelectedExampaperID.push(admin_data[i]);
				}
			}*/
			if (selectedExamPaperID.length > 0) {
				examselected_id = selectedExamPaperID.join();
			}
			/*if (adminSelectedExampaperID.length > 0) {
				admin_examselected_id = adminSelectedExampaperID.join()
			}*/
			window.localStorage.setItem("examselected_id", examselected_id);
			//window.localStorage.setItem("admin_examselected_id", admin_examselected_id)
			var parameters = {
				course: $scope.selectedCourse.qba_course_pk,
				subject: $scope.selectedSubject.qba_subject_pk,
				exampaper_pk: $scope.selectedCourse.exampaper_pk, // exam_pk
				e_pk: examselected_id,
				//admin_e_pk: admin_examselected_id
			};

			var deferred = $q.defer();
			var data = [];
			var module_fk = [];
			var headerMarks = [];

			var topic_name = [];

			var topic_code = [];

			var module_fks = [];
			var topic_pk = [];
			var marks_count = [];


			var transform = function (data) {
				return $.param(data);
			};
			$http.post('/api/load_topics_table', parameters, {
				headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
				transformRequest: transform,
				timeout: 0
			}).then(function (response) {

				var res = response.data;
				if (res.message != "No Data Found") {
					data = res.data.topicList;
					for (var i = 0; i < data.length; i++) {
						module_fk.push(data[i].module_fk); // all module ids
					}
					if (module_fk.length > 0) {
						module_fk = module_fk.join();
					}
					var modulename = {
						module_ID: module_fk,
						course: $scope.selectedCourse.qba_course_pk,
						subject: $scope.selectedSubject.qba_subject_pk,
						examp_pk: $scope.selectedCourse.exampaper_pk, // exma_pk 
						e_pk: examselected_id
					};
					$http.post('/api/get_modulename', modulename, {
						headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
						transformRequest: transform,
						timeout: 0
					}).then(function (response) {
						$scope.moduleList = response.data.obj




						repositoryService.setSelectedTopic(data);
						// alert("data=="+data[0].marks_count.length);
						var marksCnt = res.data.marksCnt;
						$scope.marks_length = marksCnt.length;
						if (res.code == 0) {

							/* for(var i=0;i<data[0].marksCnt.length;i++)
							{
								//alert(i+"--"+JSON.stringify(data[0].marks_count));
								headerMarks.push({
									marks : data[0].marks_count[i].marks
								})
							}
	 */
							for (var i = 0; i < marksCnt.length; i++) {
								headerMarks.push({
									marks: marksCnt[i].qst_count,
								})
							}

							for (var i = 0; i < data.length; i++) {

								topic_name.push(data[i].topic_name);
								topic_code.push(data[i].qba_topic_code);
								module_fks.push(data[i].module_fk);
								topic_pk.push(data[i].topic_pk);
								marks_count.push(data[i].marks_count);
							}

							var topicname_unique = topic_name.filter($scope.onlyUnique);
							var topic_pk_id = topic_pk.filter($scope.onlyUnique);
							var topicname_code = topic_code.filter($scope.onlyUnique);

							getTemplateName()

							$scope.topic_array = [];
							var unique_module = [];
							angular.forEach(topicname_unique, function (value, key) {
								angular.forEach($scope.moduleList, function (value1, key1) {
									if (value1.qba_topic_pk == topic_pk_id[key]) {

										unique_module.push(value1.module_name);
										$scope.topic_array.push({
											topic_code: topicname_code[key],
											topic_name: value,
											//module_fk:$scope.moduleList,
											topic_pk: topic_pk_id[key],
											marks_count: marks_count[key],
											//module_id:m_name[key]
										});
									}
								});

							});
							var module_ids = []
							for (var i = 0; i < $scope.moduleList.length; i++) {
								module_ids.push($scope.moduleList[i].qba_module_fk);
							}
							module_ids = module_ids.filter($scope.onlyUnique);
							var req_moduleids = {
								module_ids: module_ids
							};
							$http.post('/api/get_module_details', req_moduleids)
								.then(function (modules_data) {
									$scope.module_details = modules_data.data.obj;
								});

							headerMarks.sort(function (a, b) {
								return a.marks - b.marks;
							});
							$scope.headerList = headerMarks;
							$scope.dataList = data;
							$scope.shortFallrecords = data;

							$scope.noOfCol = res.data.marksCnt;
							//$scope.headerList=data.
							// $scope.headerList=[{marks:1},{marks:2},{marks:3}]
							deferred.resolve(response);
						}
						else {
							$scope.headerList = [];
							$scope.dataList = [];
						}

						$scope.getTopicListCaseTable();


					}).catch(function (error) {
						deferred.reject(error);
					});
				}
				else {
					$scope.headerList = [];
					$scope.dataList = [];
					$scope.getTopicListCaseTable();
				}
				deferred.resolve(response);
			}).catch(function (error) {
				deferred.reject(error);
				$scope.getTopicListCaseTable();
			});

		}



		$scope.getTopicListCaseTable = function () {

			var deferred = $q.defer();
			var caseData = [];
			var topic_name = [];
			var module_fk = [];
			var topic_code = [];
			var case_marksCnt;
			var headerCaseMarks = [];
			//var moduleList =[];
			var module_name = [];
			var module_fks = [];
			var topic_pk = [];
			var case_marks_count = [];
			$scope.selected_e_pk = [];
			$scope.selected_e_pk.push(window.localStorage.getItem("examselected_id"));
			var admin_examselected_id = []
			admin_examselected_id.push(window.localStorage.getItem("admin_examselected_id"));
			var parameters = {
				course: $scope.selectedCourse.qba_course_pk,
				subject: $scope.selectedSubject.qba_subject_pk,
				e_pk: $scope.selected_e_pk,
				admin_e_pk: admin_examselected_id
			};

			var transform = function (data) {
				return $.param(data);
			};
			$http.post('/api/load_case_question_culling_report', parameters, {
				headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
				transformRequest: transform,
				timeout: 0
			}).then(function (caseResponse) {
				var res = caseResponse.data;
				getTemplateName()
				if (res.code == 0) {

					caseData = res.data.case_topicList;
					case_marksCnt = res.data.case_marksCnt;
					for (var i = 0; i < caseData.length; i++) {
						// caseData[i].module_fk;
						module_fk.push(caseData[i].module_fk);
					}

					if (module_fk.length > 0) {
						module_fk = module_fk.join();
					}


					var modulename = {
						module_ID: module_fk,
						course: $scope.selectedCourse.qba_course_pk,
						subject: $scope.selectedSubject.qba_subject_pk,
						exam_pk: $scope.selectedCourse.exampaper_pk, // exam_pk
						e_pk: $scope.selected_e_pk
					};
					$scope.case_topic_array = [];
					$scope.casemoduleList = [];

					$http.post('/api/get_modulename', modulename, {
						headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
						transformRequest: transform,
						timeout: 0
					}).then(function (response) {


						$scope.casemoduleList = response.data.obj;
						var module_details = {};
						var module_ids = [];
						for (var i = 0; i < $scope.casemoduleList.length; i++) {
							module_ids.push($scope.casemoduleList[i].qba_module_fk);
						}
						module_ids = module_ids.filter($scope.onlyUnique);
						var req_moduleids = {
							module_ids: module_ids
						};
						$http.post('/api/get_module_details', req_moduleids)
							.then(function (modules_data) {
								$scope.case_module_details = modules_data.data.obj;
							});


						deferred.resolve(response);



						repositoryService.setSelectedCaseTopic(caseData);
						if (res.code == 0) {
							for (var i = 0; i < case_marksCnt.length; i++) {
								headerCaseMarks.push({
									marks: case_marksCnt[i].qst_count,
								})
							}

							for (var i = 0; i < caseData.length; i++) {

								topic_name.push(caseData[i].topic_name);
								topic_code.push(caseData[i].qba_topic_code);
								module_fks.push(caseData[i].module_fk);
								topic_pk.push(caseData[i].topic_pk);
								case_marks_count.push(caseData[i].case_marks_count);
							}

							var topicname_unique = topic_name.filter($scope.onlyUnique);
							var topic_pk_id = topic_pk.filter($scope.onlyUnique);
							var topicname_code = topic_code.filter($scope.onlyUnique);




							var unique_module = [];
							angular.forEach(topicname_unique, function (value, key) {
								angular.forEach($scope.casemoduleList, function (value1, key1) {
									if (value1.qba_topic_pk == topic_pk_id[key]) {

										unique_module.push(value1.module_name);
										$scope.case_topic_array.push({
											topic_code: topicname_code[key],
											topic_name: value,
											//module_fk:$scope.moduleList,
											topic_pk: topic_pk_id[key],
											case_marks_count: case_marks_count[key],
											//module_id:m_name[key]
										});
									}
								});

							});


							headerCaseMarks.sort(function (a, b) {
								return a.marks - b.marks;
							});
							$scope.headerCaseList = headerCaseMarks;
							$scope.dataCaseList = caseData;

							$scope.noOfCaseCol = res.data.case_marksCnt;
							deferred.resolve(caseResponse);

						}
						else {
							$scope.headerCaseList = [];
							$scope.dataCaseList = [];
						}

					});
				}
				else {
					var module_ids = []
					for (var i = 0; i < $scope.casemoduleList.length; i++) {
						module_ids.push($scope.casemoduleList[i].qba_module_fk);
					}
					module_ids = module_ids.filter($scope.onlyUnique);
					var req_moduleids = {
						module_ids: module_ids
					};
					$http.post('/api/get_module_details', req_moduleids)
						.then(function (modules_data) {
							$scope.case_module_details = modules_data.data.obj;
						});
					$scope.headerCaseList = [];
					$scope.dataCaseList = [];
					return false;
				}
			}).catch(function (error) {
				deferred.reject(error);
			});


		}

		/* 	$scope.getParentSummaryCount=function(caseData){
				var total=0;
				for(var i=0;i<caseData.length;i++) {
					if($scope.isNormalInteger(caseData[i].parent_userCount))
					total+=parseFloat(caseData[i].parent_userCount);
				}
				return total;
			} */
		$scope.getParentSummaryCount = function (topic_pk) {

			var total = 0;
			$scope.val = topic_pk;
			for (var i = 0; i < $scope.dataCaseList.length; i++) {


				if ($scope.dataCaseList[i].topic_pk == topic_pk) {

					for (var j = 0; j < $scope.dataCaseList[i].case_marks_count.length; j++) {
						if ($scope.isNormalInteger($scope.dataCaseList[i].case_marks_count[0].parent_userCount))
							total += parseFloat($scope.dataCaseList[i].case_marks_count[j].parent_userCount);
					}

				}


			}
			$scope.parent_topic_pk = total;
			window.localStorage.setItem("total_parent_question", $scope.parent_topic_pk);
			return total;

		}

		$scope.getCSQParentSummaryCount = function (module_pk) {

			var total = 0;
			for (var i = 0; i < $scope.dataCaseList.length; i++) {


				if ($scope.dataCaseList[i].module_fk == module_pk) {

					for (var j = 0; j < $scope.dataCaseList[i].case_marks_count.length; j++) {
						if ($scope.isNormalInteger($scope.dataCaseList[i].case_marks_count[0].parent_userCount))
							total += parseFloat($scope.dataCaseList[i].case_marks_count[j].parent_userCount);

					}

				}

			}
			$scope.parent_module_pk = total;
			return total;

		}

		/* $scope.getChildSummaryCount=function(caseData){
			var total=0;
			for(var i=0;i<caseData.length;i++) {
				// if($scope.isNormalInteger(caseData[i].child_userCount))
				// total+=parseFloat(caseData[i].child_userCount);
				total+=caseData[i].parent_userCount *caseData[i]. case_count_child_questions
			}
			
			return total;
		} */

		$scope.getChildSummaryCount = function (topic_pk) {
			var total = 0;

			for (var i = 0; i < $scope.dataCaseList.length; i++) {

				if ($scope.dataCaseList[i].topic_pk == topic_pk) {

					for (var j = 0; j < $scope.dataCaseList[i].case_marks_count.length; j++) {
						if ($scope.isNormalInteger($scope.dataCaseList[i].case_marks_count[0].parent_userCount))
							total += parseFloat($scope.dataCaseList[i].case_marks_count[j].parent_userCount) * $scope.dataCaseList[i].case_marks_count[j].case_count_child_questions;
					}

				}

			}
			$scope.child_topic_pk = total;
			return total;
		}

		$scope.getCSQChildSummaryCount = function (module_pk) {
			var total = 0;

			for (var i = 0; i < $scope.dataCaseList.length; i++) {

				if ($scope.dataCaseList[i].module_fk == module_pk) {

					for (var j = 0; j < $scope.dataCaseList[i].case_marks_count.length; j++) {
						if ($scope.isNormalInteger($scope.dataCaseList[i].case_marks_count[0].parent_userCount))
							total += parseFloat($scope.dataCaseList[i].case_marks_count[j].parent_userCount) * $scope.dataCaseList[i].case_marks_count[j].case_count_child_questions;
					}

				}

			}
			$scope.child_module_pk = total;
			return total;
		}

		$scope.getCaseSummaryMarks = function (topic_pk) {

			var total = 0;
			for (var i = 0; i < $scope.dataCaseList.length; i++) {

				// if($scope.isNormalInteger(caseData[i].child_userCount))
				// // total+=parseFloat(caseData[i].child_userCount*caseData[i].case_marks);
				// total+=caseData[i].parent_userCount *caseData[i].case_count_child_questions*caseData[i].case_marks
				if ($scope.dataCaseList[i].topic_pk == topic_pk) {

					for (var j = 0; j < $scope.dataCaseList[i].case_marks_count.length; j++) {
						if ($scope.isNormalInteger($scope.dataCaseList[i].case_marks_count[0].parent_userCount))
							total += parseFloat($scope.dataCaseList[i].case_marks_count[j].parent_userCount) * $scope.dataCaseList[i].case_marks_count[j].case_count_child_questions * $scope.dataCaseList[i].case_marks_count[j].case_marks;
					}

				}

			}
			$scope.marks_topic_pk = total;
			return total;
		}


		$scope.getCSQCaseSummaryMarks = function (module_pk) {

			var total = 0;
			for (var i = 0; i < $scope.dataCaseList.length; i++) {

				// if($scope.isNormalInteger(caseData[i].child_userCount))
				// // total+=parseFloat(caseData[i].child_userCount*caseData[i].case_marks);
				// total+=caseData[i].parent_userCount *caseData[i].case_count_child_questions*caseData[i].case_marks
				if ($scope.dataCaseList[i].module_fk == module_pk) {

					for (var j = 0; j < $scope.dataCaseList[i].case_marks_count.length; j++) {
						if ($scope.isNormalInteger($scope.dataCaseList[i].case_marks_count[0].parent_userCount))
							total += parseFloat($scope.dataCaseList[i].case_marks_count[j].parent_userCount) * $scope.dataCaseList[i].case_marks_count[j].case_count_child_questions * $scope.dataCaseList[i].case_marks_count[j].case_marks;
					}

				}

			}
			$scope.marks_module_pk = total;
			return total;
		}



		$scope.getCaseShortFallQuest = function (topic_pk) {
			var shortFallQuest = 0;
			caseShortFallMap = new Object;
			var topicId = topic_pk;
			//	var moduleId = module_pk;

			//var caseData = caseRow.case_marks_count;
			var caseData = $scope.dataCaseList;
			for (var i = 0; i < caseData.length; i++) {
				if (caseData[i].topic_pk == topic_pk) {
					for (var j = 0; j < caseData[i].case_marks_count.length; j++) {
						if (parseFloat(caseData[i].case_marks_count[j].parent_userCount) > parseFloat(caseData[i].case_marks_count[j].case_count_questions)) {

							if ($scope.isNormalInteger(caseData[i].case_marks_count[j].parent_userCount)) {
								shortFallQuest += parseFloat(caseData[i].case_marks_count[j].parent_userCount - caseData[i].case_marks_count[j].case_count_questions);

								caseData[i].shortfall_count = parseFloat(caseData[i].case_marks_count[j].parent_userCount - caseData[i].case_marks_count[j].case_count_questions);

								var key = topicId + "~" + caseData[i].case_marks_count[j].case_marks;
								var shortFallrecord = caseShortFallMap[key];
								if (shortFallrecord == null || shortFallrecord == undefined) {
									var newRecord = {
										topic_pk: topicId,
										topicName: caseData[i].topic_name,
										module_pk: caseData[i].module_fk,
										course_pk: $scope.selectedCourse.qba_course_pk,
										subject_pk: $scope.selectedSubject.qba_subject_pk,
										case_marks: caseData[i].case_marks_count[j].case_marks,
										shortfallCount: caseData[i].shortfall_count,
										no_of_child_questions: caseData[i].case_marks_count[j].case_count_child_questions
									};
									caseShortFallMap[key] = newRecord;

								} else {
									// shortFallrecord.shortfallCount = caseData[i].shortfall_count;
									shortFallrecord.shortfallCount = shortFallQuest;

								}
							}
						}
					}
				}
			}

			$scope.sf_topic_pk = shortFallQuest;
			return shortFallQuest;
		}


		$scope.getCSQCaseShortFallQuest = function (module_pk) {
			var shortFallQuest = 0;

			var caseData = $scope.dataCaseList;
			for (var i = 0; i < caseData.length; i++) {
				if (caseData[i].module_fk == module_pk) {
					for (var j = 0; j < caseData[i].case_marks_count.length; j++) {
						if (parseFloat(caseData[i].case_marks_count[j].parent_userCount) > parseFloat(caseData[i].case_marks_count[j].case_count_questions)) {

							if ($scope.isNormalInteger(caseData[i].case_marks_count[j].parent_userCount)) {
								shortFallQuest += parseFloat(caseData[i].case_marks_count[j].parent_userCount - caseData[i].case_marks_count[j].case_count_questions);

								caseData[i].shortfall_count = parseFloat(caseData[i].case_marks_count[j].parent_userCount - caseData[i].case_marks_count[j].case_count_questions);


							}
						}
					}
				}
			}

			$scope.sf_module_pk = shortFallQuest;
			return shortFallQuest;
		}

		/* $scope.getCaseShortFallQuest = function(caseRow){
			var shortFallQuest = 0;
			var topicId = caseRow.topic_pk;
			var moduleId = caseRow.module_fk;
			
			var caseData = caseRow.case_marks_count;
			for(var i=0; i<caseData.length; i++){
				if(parseFloat(caseData[i].parent_userCount) > parseFloat(caseData[i].case_count_questions)){
					if($scope.isNormalInteger(caseData[i].parent_userCount))
					{
						shortFallQuest+=parseFloat(caseData[i].parent_userCount - caseData[i].case_count_questions);
						caseData[i].shortfall_count = parseFloat(caseData[i].parent_userCount - caseData[i].case_count_questions);
						
						var key = topicId + "~" + caseData[i].case_marks;
						var shortFallrecord = caseShortFallMap[key];
						if(shortFallrecord == null || shortFallrecord == undefined) {
							var newRecord = {topic_pk:topicId, 
								topicName:caseRow.topic_name,
								module_pk:moduleId, 
								course_pk: $scope.selectedCourse.qba_course_pk,
								subject_pk: $scope.selectedSubject.qba_subject_pk,  
								case_marks:caseData[i].case_marks,
							shortfallCount:caseData[i].shortfall_count} ;
							caseShortFallMap[key] = newRecord;                 
							} else {
							shortFallrecord.shortfallCount = caseData[i].shortfall_count;
						}
					}
				} 
				
				
			}      
			
			
			
			return shortFallQuest;
		} */

		$scope.getTotalParentCount = function (topic_array) {
			var data = [];
			//data=$scope.dataCaseList;
			data = topic_array;
			var total = 0;
			if (topic_array != undefined) {
				for (var i = 0; i < data.length; i++) {

					total += parseFloat($scope.getParentSummaryCount(data[i].topic_pk));
					//$scope.totalQstnCount = total
				}
				//repositoryService.setTotalCount(total);

				$scope.totalParentQstnCount = total;

				return total;
			}
		}

		$scope.getTotalChildCount = function (topic_array) {
			var data = [];
			//data=$scope.dataCaseList;
			data = topic_array;
			var total = 0;
			if (topic_array != undefined) {
				for (var i = 0; i < data.length; i++) {
					total += parseFloat($scope.getChildSummaryCount(data[i].topic_pk));
					//$scope.totalQstnCount = total
				}
				//repositoryService.setTotalCount(total);
				$scope.totalCSQChildCount = total;
				return total;
			}
		}

		$scope.getTotalCaseMarks = function (topic_array) {
			var data = [];
			data = topic_array;
			var total = 0;
			//data=$scope.dataCaseList;
			if (topic_array != undefined) {
				for (var i = 0; i < data.length; i++) {
					total += parseFloat($scope.getCaseSummaryMarks(data[i].topic_pk));
				}
				$scope.totalCSQMarks = total;
				//repositoryService.setTotalMarks(total);
				return total;
			}
		}

		$scope.getTotalCaseShortFall = function (topic_array) {
			var total = 0;
			var data = [];
			//data=$scope.dataCaseList;
			data = topic_array;
			if (topic_array != undefined) {
				for (var i = 0; i < data.length; i++) {
					total += parseFloat($scope.getCaseShortFallQuest(data[i].topic_pk));
				}
				//repositoryService.setShortFallQuestion(total);
				$scope.totalCaseShortfall = total;
				return total;
			}
		}

		$scope.saveData = function () {

			swal("table data" + $scope.dataList[1].marks_count[1].userCount);
		}

		$scope.validatePage = function () {
			$scope.error_msg = [];
			var flag = 0;
			if ($scope.selectedExam == undefined || $scope.selectedExam == null || !$scope.selectedExam.hasOwnProperty('exam_pk')) {

				$scope.error_msg.push("Please select Exam.");
			}
			else {
				if ($scope.selectedCourse == undefined || $scope.selectedCourse == null || !$scope.selectedCourse.hasOwnProperty('qba_course_pk'))
					$scope.error_msg.push("Please select Course.");

				if ($scope.selectedCourse == undefined || $scope.selectedSubject == null || !$scope.selectedSubject.hasOwnProperty('qba_subject_pk'))
					$scope.error_msg.push("Please select Subject.");

				if (($scope.dataList == undefined || $scope.dataList == null || $scope.dataList.length == 0) && ($scope.dataCaseList == undefined || $scope.dataCaseList == null || $scope.dataCaseList.length == 0)) {
					$scope.error_msg.push("Exam doesn't consist question");
					return;
				}

				if ($scope.maxCaseChildCount == undefined || $scope.maxCaseChildCount == null ||
					$scope.maxCaseChildCount == 0 || $scope.maxCaseChildCount == "") {
					$scope.error_msg.push("Max child field cannot be left blank and cannot be zero");
					return;
				}

				if (($scope.totalQstnCount == null || $scope.totalQstnCount == undefined || $scope.totalQstnCount == 0) &&
					($scope.totalParentQstnCount == null || $scope.totalParentQstnCount == undefined || $scope.totalParentQstnCount == 0)) {
					$scope.error_msg.push("Kindly enter question requirement.");
					return;
				}

				if (($scope.totalQstnCount == null || $scope.totalQstnCount == undefined ||
					$scope.totalQstnCount == 0 || $scope.totalQstnCount == $scope.totalShrtfallQstnCount) &&
					($scope.totalParentQstnCount == null || $scope.totalParentQstnCount == undefined ||
						$scope.totalParentQstnCount == 0 || $scope.totalParentQstnCount == $scope.totalCaseShortfall))
					$scope.error_msg.push("As you have culled only shortfall question, paper cannot be generated.");

			}
			// if($scope.selectedExam != null || $scope.selectedExam != undefined)
			// {


			// }




			if ($scope.error_msg.length > 0)
				flag = 1;

			return flag;
		}

		$scope.getTopicList = function () {
			var subjectId = $scope.selectedSubject == null ? 0 : $scope.selectedSubject.qba_subject_pk;
			var parameters = { id: subjectId };
			var deferred = $q.defer();
			var transform = function (data) {
				return $.param(data);
			};
			$http.post('/api/load_topics', parameters, {
				headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
				transformRequest: transform,
				timeout: 0
			}).then(function (response) {
				$scope.topicRecords = response.data.obj;
				deferred.resolve(response);
			}).catch(function (error) {
				deferred.reject(error);
			});
		};

		$scope.saveTemplate = function () {
			var params1 = {
				exam_id: parseInt($scope.selectedExam.exam_pk),
				exam_name: $scope.selectedExam.exam_name,
				template_name: $scope.templateName,
				max_child_per_case: $scope.maxCaseChildCount,
				exam_paper: $('#dates-field3').val(),
		//		admin_exam_paper: $('#date4').val(),
				flag: $scope.sortByDateChk
			};
			$http.post('/api/cull_save_temp', params1).then(function (response) {
				if (response.data.code == 0) {
					var params2 = {
						template_id_fk: parseInt(response.data.obj.id_pk),
						templateDetails: $scope.dataList
					};
					$http.post('/api/cull_save_temp_details', params2).then(function (response) {
						if (response.data.code == 0) {
							getTemplateName();
						}
					});

					var params3 = {
						template_id_fk: parseInt(response.data.obj.id_pk),
						caseTemplateDetails: $scope.dataCaseList
					};

					$http.post('/api/cull_save_case_temp_details', params3).then(function (response) {
						if (response.data.message == "success") {
							swal("Template save successfully.");
						}
					});
				}
				else {
					swal("Template already exists")
				}
			});

		};
		$scope.$watch('dataList', function () {
			var params = { template_id_fk: $scope.loadTempDetails }
			$http.post('/api/cull_load_template_details', params).then(function (response) {
				var templateData = response.data.obj;
				for (var i = 0; i < $scope.dataList.length; i++) {
					for (var m = 0; m < $scope.dataList[i].marks_count.length; m++) {
						for (var j = 0; j < templateData.length; j++) {
							if ((templateData[j].topic_name.trim() == $scope.dataList[i].topic_name) && (parseFloat(templateData[j].marks)) == parseFloat($scope.dataList[i].marks_count[m].marks)) {
								$scope.dataList[i].marks_count[m].userCount = templateData[j].user_count;
							}
						}
					}
				}
			});
		});

		$scope.$watch('dataCaseList', function () {
			var params = { template_id_fk: $scope.loadTempDetails }
			$http.post('/api/cull_load_case_template_details', params).then(function (response) {

				var templateData = response.data.obj;
				$scope.maxCaseChildCount = response.data.maxChildCount;
				for (var i = 0; i < $scope.dataCaseList.length; i++) {
					for (var m = 0; m < $scope.dataCaseList[i].case_marks_count.length; m++) {
						for (var j = 0; j < templateData.length; j++) {
							if ((templateData[j].case_topic_name.trim() == $scope.dataCaseList[i].topic_name) && (parseFloat(templateData[j].case_marks) == parseFloat($scope.dataCaseList[i].case_marks_count[m].case_marks)) && ($scope.dataCaseList[i].case_marks_count[m].case_count_child_questions == templateData[j].case_child_count)) {
								$scope.dataCaseList[i].case_marks_count[m].parent_userCount = templateData[j].case_parent_count;
								$scope.dataCaseList[i].case_marks_count[m].child_userCount = templateData[j].case_child_count;
							}
						}
					}
				}

			});
		})



		$scope.loadTemplateDetails = function () {
			var params = { template_id_fk: $scope.loadTempDetails }
			$http.post('/api/load_flag', params).then(res => {
				$scope.sortByDateChk = res.data.obj[0].flag
				$scope.exam_pk = res.data.obj[0].exam_paper
		//		var admin_exam_pk = res.data.obj[0].admin_exam_paper
				$('#dates-field3').select2().val($scope.exam_pk)
		//		$('#date4').select2().val(admin_exam_pk)
				$('#dates-field3').select2().trigger('change.select2');
		//		$('#date4').select2().trigger('change.select2');
				$('#dates-field3').select2().trigger('change');
		//		$('#date4').select2().trigger('change');
			})
			$http.post('/api/cull_load_template_details', params).then(function (response) {
				var templateData = response.data.obj;
				for (var i = 0; i < $scope.dataList.length; i++) {
					for (var m = 0; m < $scope.dataList[i].marks_count.length; m++) {
						for (var j = 0; j < templateData.length; j++) {
							if ((templateData[j].topic_name.trim() == $scope.dataList[i].topic_name) && (parseFloat(templateData[j].marks)) == parseFloat($scope.dataList[i].marks_count[m].marks)) {
								$scope.dataList[i].marks_count[m].userCount = templateData[j].user_count;
							}
						}
					}
				}
			});
			$scope.loadCaseTemplateDetails();
		};


		$scope.loadCaseTemplateDetails = function () {
			var params = { template_id_fk: $scope.loadTempDetails }
			$http.post('/api/cull_load_case_template_details', params).then(function (response) {

				var templateData = response.data.obj;
				$scope.maxCaseChildCount = response.data.maxChildCount;
				for (var i = 0; i < $scope.dataCaseList.length; i++) {
					for (var m = 0; m < $scope.dataCaseList[i].case_marks_count.length; m++) {
						for (var j = 0; j < templateData.length; j++) {
							if ((templateData[j].case_topic_name.trim() == $scope.dataCaseList[i].topic_name) && (parseFloat(templateData[j].case_marks) == parseFloat($scope.dataCaseList[i].case_marks_count[m].case_marks)) && ($scope.dataCaseList[i].case_marks_count[m].case_count_child_questions == templateData[j].case_child_count)) {
								$scope.dataCaseList[i].case_marks_count[m].parent_userCount = templateData[j].case_parent_count;
								$scope.dataCaseList[i].case_marks_count[m].child_userCount = templateData[j].case_child_count;
							}
						}
					}
				}

			});
		};

		$scope.resetField = function () {
			$scope.templateName = "";
		}

		// $scope.loadCaseQuestionCullingReport();                   
		angular.element(document).ready(function () {



			setTimeout(function () {
				$('#dates-field3').select2({
					//includeSelectAllOption: false
				});
			/*	$('#date4').select2({})*/
			}, 0)



			$("#dates-field3").change(function () {
				$scope.getTopicListTable();
			});
		/*	$('#date4').change(function () {
				$scope.getTopicListTable();
			})*/



			var deferred = $q.defer();
			$scope.headerList = [];
			$scope.dataList = [];
			//$scope.loadCaseQuestionCullingReport();         
			$http.post('/api/load_courses', {
				headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' }
			}).then(function (response) {
				var errcode = response.data.code;
				// alert("errcode"+errcode);
				if (errcode == 500) {
					$state.go('login');
				}
				else {
					$scope.examList = response.data.obj;
					$scope.selectedCourse = $scope.examList[0];
					deferred.resolve(response);
				}



			}).catch(function (error) {
				deferred.reject(error);
			});

			var exam_name = $scope.selectedExam.exam_name;
			$http.get('/api/load_exam_master_table').then(function (response) {
				$scope.loadExamNames = response.data.obj[0];

				$scope.selectedExam = $scope.loadExamNames;

				//$scope.loadExamPaperList();
				deferred.resolve(response);
			}).catch(function (error) {
				deferred.reject(error);
			});
		});


	}


	angular
		.module('qbAuthoringToolApp')
		.controller('cullingController', cullingController);

	cullingController.$inject = ['$scope', '$state', '$q', '$http', 'repositoryService', 'examService', 'userService'];

})();



// var app = angular.module('culling',[]);
// app.controller('cullingController',function($scope,$state){


// });