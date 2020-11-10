(function () {
	'use strict';

	function vetterReviewQuestionController($scope, $state, $filter, $window, userService, repositoryService, $http, $q, $timeout, $sce, $location, $anchorScroll) {
		var checkqbid = [];
		$scope.finallog = [];
		localStorage.setItem("selallQ", 'No');
		$scope.selallQ = 'No';
		$scope.saveqbid = ''
		//var topicParams = repositoryService.getExamModuleId(); // comment by shilpa
		window.localStorage.setItem("childqstpid", "0");
		var topicParams = {
			exam_name: window.localStorage.getItem('exam_name'),
			qstnpaper_id: window.localStorage.getItem('qstnpaper_id'),
			exampaper_pk: window.localStorage.getItem('exampaper_pk'),
			exam_id: window.localStorage.getItem('exam_id'),
			qba_module_fk: window.localStorage.getItem('qba_module_fk'),
		};

		var id = JSON.parse(window.localStorage.getItem('user')); // added by shilpa
		var role = JSON.parse(window.localStorage.getItem('role')); // added by shilpa
		var name = JSON.parse(window.localStorage.getItem('username')); // added by shilpa

		$scope.username = JSON.parse(sessionStorage.getItem('username'));  // Dipika HSS//
		//$scope.loginUser = userService.getUserData();   // comment by shilpa
		// added by shilpa
		$scope.loginUser = {
			id: id,
			name: name,
			role: role
		};

		/*$scope.examName =  topicParams.exam_name; 
    	$scope.currentQstnPaperId = topicParams.qstnpaper_id; //added by milan
    	$scope.examPaperPk = topicParams.exampaper_pk;
    	$scope.examPk = topicParams.exam_id;*/ // comment by shilpa

		//added by shilpa
		$scope.examName = window.localStorage.getItem('exam_name');
		$scope.currentQstnPaperId = window.localStorage.getItem('qstnpaper_id');  //added by milan
		$scope.examPaperPk = window.localStorage.getItem('exampaper_pk');
		$scope.examPk = window.localStorage.getItem('exam_id'); // 
		$scope.updated = {};

		//var pageFromEdit = repositoryService.getVetterEditedPageId();    
		var pageFromEdit = localStorage.getItem("currentPageId"); // added by shilpa
		if (pageFromEdit) {
			//alert(pageFromEdit);

		}
		$scope.pageList = [];
		$scope.countQst = 0;
		$scope.currentPageRecords = 0;
		$scope.currentPageId = 0;
		//$scope.NoQstnList=repositoryService.getShowQuestionsPerPageList(); // comment by shilpa
		$scope.NoQstnList = [{ no_Qstn: 5 }, { no_Qstn: 10 }, { no_Qstn: 15 }, { no_Qstn: 20 }, { no_Qstn: 40 }, { no_Qstn: 'ALL' }];// added by shilpa
		$scope.filter = 'Default'
		$scope.filter_exam = ['Default', 'Shortfall', 'Replace/Remove Request']
		$scope.selectNoQstn = $scope.NoQstnList[0];
		$scope.showQstn = $scope.selectNoQstn.no_Qstn;
		$scope.summary_details = [];
		var rep_act_qb_pk_list = [];
		$scope.replacedqb_pk = [];
		var checkQuest = [];
		var toPubQuest = [];
		var toPubSFQuest = [];

		var is_acceptAll = false;
		var is_rejectAll = false;

		var qstnPprId = repositoryService.getSelectedQuestionPaperId();
		var module_id = topicParams.qba_module_fk;
		$scope.publishQuestValue = 'NO';
		$scope.pubquestvalue = {}; // added by shilpa

		$scope.myTestvar = true;
		/*if(repositoryService.getBookMark()){
			$scope.selectNoQstn.no_Qstn = 'ALL'
			$location.hash(repositoryService.getBookMark());
			$anchorScroll();
		} */
		$scope.editPageNumber = localStorage.getItem("currentPageId");

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
		};

		$scope.repoQuestions;
		var repoQuestionsarry = [];





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
			var id = JSON.parse(window.localStorage.getItem('user')); // added by shilpa
			var role = JSON.parse(window.localStorage.getItem('role')); // added by shilpa
			var name = JSON.parse(window.localStorage.getItem('username'));
			var arr_ele = document.getElementsByClassName("editable");
			for (var i = 0; i < arr_ele.length; i++) {

				var state = $scope.editorStates[i];
				if (state) {

					var lite = state.editor.plugins.lite;

					lite && lite.findPlugin(state.editor).setUserInfo(
						{
							id: id,
							name: name
						});
				}
			}
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

		$scope.onEnd = function () {

			$timeout(function () {
				//var arr_ele = document.getElementsByClassName("editable");
				if (!$scope.ckEditorFlag) {
					$scope.ckEditorFlag = true;
					//$scope.CKEdit();
					//$("#jsButton").click();
					$scope.watchRepoQuestionChange();
				}

			}, 1);
		};

		$scope.onPrint = function () {
			$timeout(function () {
				//var arr_ele = document.getElementsByClassName("editable");
				if (!$scope.ckEditorFlag) {
					$scope.ckEditorFlag = true;
					//$scope.CKEdit();
					//$("#jsButton").click();
					$scope.watchRepoQuestionChangePrint();
					//$window.print();
				}

			}, 1);


		};

		$scope.print = function () {
			//$window.print();
		}

		$scope.CKEdit1 = function (id) {
			//	document.getElementById('board').style.visibility = 'visible'
			var arr_ele = document.getElementsByClassName("editable");
			var ele = null
			for (var i = 0; i < arr_ele.length; i++) {
				if (arr_ele[i].id == id) {
					var state = $scope.editorStates[i]
					if (state) {
						return
					}
					ele = arr_ele[i]
					var editor = CKEDITOR.inline(ele, {
						filebrowserBrowseUrl: '../ckeditor/ckeditor4.5/plugins/filemanager/browser/default/browser.html?Connector=/browser/browse',
						filebrowserImageUploadUrl: '/uploader/upload?Type=Image',
						customConfig: "../ckeditor-conf.js"

					});
					editor.on(LITE.Events.INIT, function (event) {
						$scope.selectUser()
						//	document.getElementById('board').style.visibility = 'hidden'
					});

					editor.on('key', function (event) {
						if (event.data.keyCode == 46) {
							event.cancel();
						}
					})

					$scope.editorStates[i] = new EditorState(editor);
					break;
				}
			}
		}

		$scope.CKEdit = function () {
			CKEDITOR.disableAutoInline = true;
			var arr_ele = document.getElementsByClassName("editable");
			for (var i = 0; i < arr_ele.length; i++) {
				var a = arr_ele[i].getElementsByTagName('ins')
				var b = arr_ele[i].getElementsByTagName('del')
				if (a.length > 0 || b.length > 0) {
					document.getElementById('board').style.visibility = 'visible'
					var editor = CKEDITOR.inline(arr_ele[i], {
						filebrowserBrowseUrl: '../ckeditor/ckeditor4.5/plugins/filemanager/browser/default/browser.html?Connector=/browser/browse',
						filebrowserImageUploadUrl: '/uploader/upload?Type=Image',
						customConfig: "../ckeditor-conf.js"

					});


					editor.on(LITE.Events.INIT, function (event) {
						$scope.selectUser();
						document.getElementById('board').style.visibility = 'hidden'
					});

					editor.on('key', function (event) {
						if (event.data.keyCode == 46) {
							event.cancel();
						}
					})

					$scope.editorStates[i] = new EditorState(editor);
				}
			}
			if (i == arr_ele.length || i == 0) {
				document.getElementById('board').style.visibility = 'hidden'
			}


		};

		$scope.CKEditPrint = function () {
			//alert("jjjj");
			CKEDITOR.disableAutoInline = true;
			var arr_ele = document.getElementsByClassName("editable");
			for (var i = 0; i < arr_ele.length; i++) {
				var editor = CKEDITOR.inline(arr_ele[i], {
					filebrowserBrowseUrl: '../ckeditor/ckeditor4.5/plugins/filemanager/browser/default/browser.html?Connector=/browser/browse',
					filebrowserImageUploadUrl: '/uploader/upload?Type=Image',
					customConfig: "../ckeditor-conf.js"

				});

				editor.on(LITE.Events.INIT, function (event) {
					$scope.selectUser();
				});

				$scope.editorStates[i] = new EditorState(editor);
			}
			// $window.print();

		};

		$scope.watchRepoQuestionChange = function () {

			// Watch for our DOM element's children to change
			var watch = $scope.$watch(function () {
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

		$scope.watchRepoQuestionChangePrint = function () {
			// Watch for our DOM element's children to change
			var watch = $scope.$watch(function () {
				return $scope.repoQuestions[0].current_time;
			}, function () {
				// Once change is detected, use $evalAsync to wait for
				// directives to finish
				$scope.$evalAsync(function () {
					//
					$scope.CKEditPrint();

				});
			});
			//	$window.print();
		};

		$scope.checkedQuest = function (pid_check, data, qbpk, status) {
			//added by shilpa
			if ($scope.selallQ == 'No') {
				if (status == 'YES') {

					if (data.qst_pid != '0' && data.qst_type == 'CS' && status == 'YES') {
						for (var i = 0; i < $scope.repoQuestions.length; i++) {
							let qbid = $scope.repoQuestions[i].qb_id;
							$scope.pubquestvalue[qbid] = ($scope.pubquestvalue[qbid] == undefined) ? "NO" : $scope.pubquestvalue[qbid];
							if ($scope.repoQuestions[i].copied_from_repo == 'Y' && $scope.repoQuestions[i].qb_id == data.qst_pid && $scope.repoQuestions[i].qst_pid == '0' && $scope.pubquestvalue[qbid] == 'NO') {
								$scope.pubquestvalue[qbid] = 'YES';
								checkQuest.push($scope.repoQuestions[i].qb_pk);
								checkqbid.push($scope.repoQuestions[i].qb_id);
								toPubQuest.push($scope.repoQuestions[i]);
							}
							else if ($scope.repoQuestions[i].copied_from_repo != 'Y' && $scope.repoQuestions[i].qb_id == data.qst_pid && $scope.repoQuestions[i].qst_pid == '0' && $scope.pubquestvalue[qbid] == 'NO') {
								$scope.pubquestvalue[qbid] = 'YES';
								checkQuest.push($scope.repoQuestions[i].qb_pk);
								toPubSFQuest.push($scope.repoQuestions[i]);
								checkqbid.push($scope.repoQuestions[i].qb_id);
							}
						}

					}
				} else {

					if (data.qst_pid == 0 && data.qst_type == 'CS') {
						for (var i = 0; i < $scope.repoQuestions.length; i++) {
							let qbid = $scope.repoQuestions[i].qb_id;
							$scope.pubquestvalue[qbid] = ($scope.pubquestvalue[qbid] == undefined) ? "NO" : $scope.pubquestvalue[qbid];
							if ($scope.repoQuestions[i].copied_from_repo == 'Y' && $scope.repoQuestions[i].qst_pid == pid_check && $scope.pubquestvalue[qbid] == 'YES') {
								$scope.pubquestvalue[qbid] = 'NO';
								let index2 = checkQuest.indexOf($scope.repoQuestions[i].qb_pk);
								checkQuest.splice(index2, 1);
								checkqbid.splice(index2, 1);
								let index = toPubQuest.indexOf($scope.repoQuestions[i]);
								toPubQuest.splice(index, 1);
							} else if ($scope.repoQuestions[i].copied_from_repo != 'Y' && $scope.repoQuestions[i].qst_pid == pid_check && $scope.pubquestvalue[qbid] == 'YES') {
								$scope.pubquestvalue[qbid] = 'NO';
								let index2 = checkQuest.indexOf($scope.repoQuestions[i].qb_pk);
								checkQuest.splice(index2, 1);
								checkqbid.splice(index2, 1);
								let index = toPubSFQuest.indexOf($scope.repoQuestions[i]);
								toPubSFQuest.splice(index, 1);
							}
						}
					}
				}
				if (status == 'YES') {
					checkQuest.push(qbpk);
					checkqbid.push(data.qb_id);
					if (data.copied_from_repo == 'Y') {
						toPubQuest.push(data);
					} else {
						toPubSFQuest.push(data);
					}
				} else {
					let index = checkQuest.indexOf(qbpk);
					checkQuest.splice(index, 1);
					checkqbid.splice(index, 1);
					if (data.copied_from_repo == 'Y') {
						//let index = toPubQuest.indexOf(data);
						toPubQuest.splice(index, 1);
					} else {
						let index = toPubSFQuest.indexOf(data);
						toPubSFQuest.splice(index, 1);
					}
				}
			} else {
				var parameters = {
					id: topicParams.qba_module_fk,
					examPk: $scope.examPk, examPaperPk: $scope.examPaperPk,
					off: "0", lim: "ALL"
				};
				var deferred = $q.defer();
				var transform = function (data) {
					return $.param(data);
				};
				parameters['filter'] = $scope.filter
				$http.post('/api/load_vetter_questions', parameters, {
					headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
					transformRequest: transform,
					timeout: 0
				}).then(function (response) {
					let alldata = response.data.data;
					if (status == 'YES') {

						if (data.qst_pid != '0' && data.qst_type == 'CS' && status == 'YES') {
							for (var i = 0; i < alldata.length; i++) {
								let qbid = alldata[i].qb_id;
								$scope.pubquestvalue[qbid] = ($scope.pubquestvalue[qbid] == undefined) ? "NO" : $scope.pubquestvalue[qbid];
								if (alldata[i].copied_from_repo == 'Y' && alldata[i].qb_id == data.qst_pid && alldata[i].qst_pid == '0' && $scope.pubquestvalue[qbid] == 'NO') {
									$scope.pubquestvalue[qbid] = 'YES';
									if (checkqbid.indexOf(alldata[i].qb_id) == '-1') {
										checkQuest.push(alldata[i].qb_pk);
										checkqbid.push(alldata[i].qb_id);
										toPubQuest.push(alldata[i]);
									}
								}
								else if (alldata[i].copied_from_repo != 'Y' && alldata[i].qb_id == data.qst_pid && alldata[i].qst_pid == '0' && $scope.pubquestvalue[qbid] == 'NO') {
									$scope.pubquestvalue[qbid] = 'YES';
									if (checkqbid.indexOf(alldata[i].qb_id) == '-1') {
										checkQuest.push(alldata[i].qb_pk);
										toPubSFQuest.push(alldata[i]);
										checkqbid.push(alldata[i].qb_id);
									}
								}
							}

						}
					} else {
						if (data.qst_pid == 0 && data.qst_type == 'CS') {
							for (var i = 0; i < alldata.length; i++) {
								let qbid = alldata[i].qb_id;
								$scope.pubquestvalue[qbid] = ($scope.pubquestvalue[qbid] == undefined) ? "NO" : $scope.pubquestvalue[qbid];
								if (alldata[i].copied_from_repo == 'Y' && alldata[i].qst_pid == pid_check) {

									$scope.pubquestvalue[qbid] = 'NO';
									let index2 = checkQuest.indexOf(alldata[i].qb_pk);

									checkQuest.splice(index2, 1);
									checkqbid.splice(index2, 1);

									//let index = toPubQuest.indexOf(alldata[i]);
									toPubQuest.forEach((item, index) => {
										if (item.qb_id == alldata[i].qb_id) {
											toPubQuest.splice(index, 1);
										}
									});
									//toPubQuest.splice(i, 1);
								} else if (alldata[i].copied_from_repo != 'Y' && alldata[i].qst_pid == pid_check) {
									$scope.pubquestvalue[qbid] = 'NO';
									let index2 = checkQuest.indexOf(alldata[i].qb_pk);
									checkQuest.splice(index2, 1);
									checkqbid.splice(index2, 1);
									//let index = toPubSFQuest.indexOf(alldata[i]);
									//toPubSFQuest.splice(index, 1);
									toPubSFQuest.forEach((item, index) => {
										if (item.qb_id == alldata[i].qb_id) {
											toPubSFQuest.splice(index, 1);
										}
									});
								}
							}
						}
					}
					if (status == 'YES') {
						checkQuest.push(qbpk);
						checkqbid.push(data.qb_id);
						if (data.copied_from_repo == 'Y') {
							toPubQuest.push(data);
						} else {
							toPubSFQuest.push(data);
						}
					} else {
						let index = checkQuest.indexOf(qbpk);
						checkQuest.splice(index, 1);
						checkqbid.splice(index, 1);
						if (data.copied_from_repo == 'Y') {
							//let index = toPubQuest.indexOf(data);
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
			// end 



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



			var parameters = {
				id: topicParams.qba_module_fk,
				examPk: $scope.examPk, examPaperPk: $scope.examPaperPk,
				off: "0", lim: "ALL"
			};
			var deferred = $q.defer();
			var transform = function (data) {
				return $.param(data);
			};
			parameters['filter'] = $scope.filter
			$http.post('/api/load_vetter_questions', parameters, {
				headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
				transformRequest: transform,
				timeout: 0
			}).then(function (response) {
				let alldata = response.data.data;



				if ($scope.publishQuestValue == 'YES') {

					$('.checkpub').prop('checked', false);
					$scope.publishQuestValue = 'NO';
				} else {

					$('.checkpub').prop('checked', true);
					$scope.publishQuestValue = 'YES';
					checkQuest = [];
					checkqbid = [];
					toPubQuest = [];
					toPubSFQuest = [];
				}
				if ($scope.publishQuestValue == 'YES') {
					for (var i = 0; i < $scope.repoQuestions.length; i++) {
						//checkQuest.push($scope.repoQuestions[i].qb_pk);
						//checkqbid.push($scope.repoQuestions[i].qb_id);
						// added by shilpa
						$scope.pubquestvalue[$scope.repoQuestions[i].qb_id] = 'YES'; // added by shilpa
						/*if($scope.repoQuestions[i].copied_from_repo == 'Y'){
	
							toPubQuest.push($scope.repoQuestions[i]);
						}else{
							toPubSFQuest.push($scope.repoQuestions[i]);
						}*/
					}

					for (var i = 0; i < alldata.length; i++) {
						checkQuest.push(alldata[i].qb_pk);
						checkqbid.push(alldata[i].qb_id);
						// added by shilpa
						//$scope.pubquestvalue[$scope.repoQuestions[i].qb_id] = 'YES'; // added by shilpa
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
					checkQuest = []; // added by shilpa
					toPubQuest = [];
					toPubSFQuest = [];
					checkqbid = [];
				}
			});

		};

		var saveLog = function () {
			var data = [];
			var output = [];
			var keys = [];
			var insQuest;
			var delQuest;
			for (var i = 0; i < $scope.repoQuestions.length; i++) {
				if ($scope.repoQuestions[i].qstn_alternatives == 0) {
					insQuest = $scope.repoQuestions[i].qst_body.search("</ins>");
					delQuest = $scope.repoQuestions[i].qst_body.search("</del>");
					if ((insQuest != -1) || (delQuest != -1) || (insAlt != -1) || (delAlt != -1)) {
						data.push($scope.repoQuestions[i]);
					}
				} else {
					for (var j = 0; j < $scope.repoQuestions[i].qstn_alternatives.length; j++) {
						insQuest = $scope.repoQuestions[i].qst_body.search("</ins>");
						delQuest = $scope.repoQuestions[i].qst_body.search("</del>");
						var insAlt = $scope.repoQuestions[i].qstn_alternatives[j].qta_alt_desc.search("</ins>");
						var delAlt = $scope.repoQuestions[i].qstn_alternatives[j].qta_alt_desc.search("</del>");
						if ((insQuest != -1) || (delQuest != -1) || (insAlt != -1) || (delAlt != -1)) {
							data.push($scope.repoQuestions[i]);
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
			var params = {
				id: parseInt($scope.loginUser.id),
				name: $scope.username,
				exam_id: parseInt(topicParams.exam_id),
				exampaper_pk: parseInt(topicParams.exampaper_pk),
				questData: output
			};
			$http.post('/api/removing_vetting_log_details', params)
				.then(function (response) {
					$http.post('/api/update_vetting_log_details', params)
						.then(function (response) {
							swal('Questions Saved Successfully');
							$scope.get_change_log_details();
						});
				});
		};



		$scope.savealldata = function (id) {

			let eid = window.localStorage.getItem('exam_id');
			let efk = window.localStorage.getItem('exampaper_pk');
			var qst_body = CKEDITOR.instances[id].getData();
			var req = {
				qst_body: qst_body,
				qb_id: id,
				exam_fk: eid,
				exampaper_fk: efk,
				qst_audit_by: $scope.loginUser.name
			};
			$http.post('/api/savealldata', req)
				.then(function (response) {
				});
			if (!qst_body.includes('<ins') && !qst_body.includes('<del')) {
				//CKEDITOR.instances[id].destroy();
			}
		}

		/*$scope.saveComments = function (id, qb_id) {
			let eid = window.localStorage.getItem('exam_id');
			let efk = window.localStorage.getItem('exampaper_pk');
			var comments = CKEDITOR.instances[id].getData();
			var req = {
				comments: comments,
				qb_id: qb_id,
				exam_fk: eid,
				exampaper_fk: efk,
				qst_audit_by: $scope.loginUser.name
			};
			$http.post('/api/save_comments', req)
				.then(function (response) {
				});
		}*/

		$scope.saveremarkdata = function (id) {
			//$scope.loadEditor('editorRemarks',true);
			let eid = window.localStorage.getItem('exam_id');
			let efk = window.localStorage.getItem('exampaper_pk');
			var remark = CKEDITOR.instances["remarkdata" + id].getData();

			var req = {
				remark: remark,
				qb_id: id,
				exam_fk: eid,
				exampaper_fk: efk,
				qst_audit_by: $scope.loginUser.name
			};

			$http.post('/api/saveremarkdata', req)
				.then(function (response) {
				});
			if (!remark.includes('<ins') && !remark.includes('<del')) {
				//CKEDITOR.instances["remarkdata" + id].destroy();
			}
		}

		$scope.saverefdata = function (id) {

			let eid = window.localStorage.getItem('exam_id');
			let efk = window.localStorage.getItem('exampaper_pk');
			var ref = CKEDITOR.instances["referencedata" + id].getData();

			var req = {
				ref: ref,
				qb_id: id,
				exam_fk: eid,
				exampaper_fk: efk,
				qst_audit_by: $scope.loginUser.name
			};
			$http.post('/api/saverefdata', req)
				.then(function (response) {
				});
			if (!ref.includes('<ins') && !ref.includes('<del')) {
				//CKEDITOR.instances["referencedata" + id].destroy();
			}
		}


		$scope.savecaldata = function (id) {

			let eid = window.localStorage.getItem('exam_id');
			let efk = window.localStorage.getItem('exampaper_pk');
			var cal = CKEDITOR.instances["calculationdata" + id].getData();

			var req = {
				cal: cal,
				qb_id: id,
				exam_fk: eid,
				exampaper_fk: efk,
				qst_audit_by: $scope.loginUser.name
			};
			$http.post('/api/savecaldata', req)
				.then(function (response) {
				});
			if (!cal.includes('<ins') && !cal.includes('<del')) {
				//CKEDITOR.instances["calculationdata" + id].destroy();
			}
		}

		$scope.saveall = function (id, qb_id) {
			let eid = window.localStorage.getItem('exam_id');
			let efk = window.localStorage.getItem('exampaper_pk');
			var qst_body = CKEDITOR.instances['alt' + id].getData();
			var req = {
				qst_body: qst_body,
				qta_pk: id,
				exam_fk: eid,
				exampaper_fk: efk,
				qst_audit_by: $scope.loginUser.name,
				qb_id: qb_id
			};
			$http.post('/api/edit_and_save_options', req)
				.then(function () {
					saveLogData();
				});
			if (!qst_body.includes('<ins') && !qst_body.includes('<del')) {
				//CKEDITOR.instances['alt' + id].destroy();
			}
		}



		var saveLogData = function () {

			var data = [];
			var output = [];
			var keys = [];
			var insQuest;
			var delQuest;
			for (var i = 0; i < $scope.repoQuestions.length; i++) {
				if ($scope.repoQuestions[i].qstn_alternatives == 0) {
					insQuest = $scope.repoQuestions[i].qst_body.search("</ins>");
					delQuest = $scope.repoQuestions[i].qst_body.search("</del>");
					if ((insQuest != -1) || (delQuest != -1) || (insAlt != -1) || (delAlt != -1)) {
						data.push($scope.repoQuestions[i]);
					}
				} else {
					for (var j = 0; j < $scope.repoQuestions[i].qstn_alternatives.length; j++) {
						insQuest = $scope.repoQuestions[i].qst_body.search("</ins>");
						delQuest = $scope.repoQuestions[i].qst_body.search("</del>");
						var insAlt = $scope.repoQuestions[i].qstn_alternatives[j].qta_alt_desc.search("</ins>");
						var delAlt = $scope.repoQuestions[i].qstn_alternatives[j].qta_alt_desc.search("</del>");
						if ((insQuest != -1) || (delQuest != -1) || (insAlt != -1) || (delAlt != -1)) {
							data.push($scope.repoQuestions[i]);
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
			var params = {
				id: parseInt($scope.loginUser.id),
				name: $scope.username,
				exam_id: parseInt(topicParams.exam_id),
				exampaper_pk: parseInt(topicParams.exampaper_pk),
				questData: output
			};
			//$http.post('/api/removing_vetting_log_details', params)
			//.then(function (response) {  
			$http.post('/api/update_vetting_log_details', params)
				.then(function (response) {
					$scope.get_change_log_details();
				});
			//});
		};



		// vetter track added before vetter logs out save details
		$scope.saveQuest = function () {
			var params = {
				qb_id: $scope.saveqbid,
				no_of_records: $scope.selectNoQstn.no_Qstn,
				page: $scope.currentPageId,
				exampaper_fk: window.localStorage.getItem('exampaper_pk'),
				user_fk: JSON.parse(window.localStorage.getItem('user'))
			}
			$http.post('/api/save_user_bookmarks', params)
			.then(response => {
				swal("Page bookmarked.")
			})
		};

		$scope.getUserBookMarks = function () {
			var params = {
				exampaper_fk: window.localStorage.getItem('exampaper_pk'),
				user_fk: JSON.parse(window.localStorage.getItem('user'))
			}
			$http.post('/api/get_user_bookmarks', params)
			.then(response => {
				$scope.saveqbid = response.data.data[0].qb_id
				for (var i = 0; i < $scope.NoQstnList.length; i++) {
					if (response.data.data[0].no_of_records == $scope.NoQstnList[i].no_Qstn) {
						$scope.selectNoQstn = $scope.NoQstnList[i]
					}
				}
				$scope.currentPageId = response.data.data[0].page
				pageFromEdit = $scope.currentPageId
				$scope.reloadPage()
				//$scope.reloadData($scope.currentPageId);
			})
		}

		$scope.safeApply = function (fn) {
			var phase = this.$root.$$phase;
			if (phase == '$apply' || phase == '$digest') {
				if (fn && (typeof (fn) === 'function')) {
					fn();
				}
			} else {
				this.$apply(fn);
			}
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
							exampaper_fk: topicParams.exampaper_pk,
							exam_fk: topicParams.exam_id,
							qb_pk: qb_pk,
							userName: JSON.parse(sessionStorage.getItem('username'))
						};
						$http.post('/api/update_alt_correct_ans', req)
							.then(function (response) {
								$scope.reloadPage();
							});
						$scope.safeApply();
						$scope.alternativeslogTabClicked(qb_id);
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

		$scope.populateQuestions = function (topic) {

			$scope.selectedTopic = topic;
			$scope.method = "default";
			if (pageFromEdit) {
				var page_id = pageFromEdit;
			} else {
				var page_id = 1;
			}

			if (isNaN($scope.selectNoQstn.no_Qstn) && 'ALL' == $scope.selectNoQstn.no_Qstn.toUpperCase()) {
				//alert('in')
				offset = 0;
				limit = 'ALL';
				$scope.showOffset = 0;
			} else {

				$scope.showOffset = ((page_id - 1) * $scope.showQstn);
				var offset = ((page_id - 1) * $scope.showQstn) + 1;//start for raw query
				var limit = $scope.showQstn * page_id;//end
				//alert(offset+'/'+limit);
			}
			var parameters = {
				id: topic.qba_module_fk,
				examPk: $scope.examPk, examPaperPk: $scope.examPaperPk,
				off: offset, lim: limit
			};
			var deferred = $q.defer();
			var transform = function (data) {
				return $.param(data);
			};
			//alert('1');  
			//alert('hi');     
			parameters['filter'] = $scope.filter
			$http.post('/api/load_vetter_questions', parameters, {
				headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
				transformRequest: transform,
				timeout: 0
			}).then(function (response) {
				$scope.repoQuestions = response.data.data;
				$scope.loadIndex();
				repoQuestionsarry = $scope.repoQuestions;
				$scope.countQst = response.data.count[0].count;
				$scope.countQst1 = response.data.count1[0].count;
				$scope.currentPageRecords = response.data.data.length;

				if (pageFromEdit) {
					$scope.currentPageId = pageFromEdit;
				} else {
					$scope.currentPageId = 1;
				}

				$scope.showPages();
				$scope.getStartedInitialization();
				deferred.resolve(response);
			}).catch(function (error) {
				deferred.reject(error);
			});

		};

		$scope.acceptAll = function () {



			swal({
				title: "Are you sure?",
				text: "You want to accept all changes in the content!",
				dangerMode: true,
				buttons: ["No", "Yes!"],
			})
				.then((willDelete) => {
					if (willDelete) {
						window.localStorage.setItem("AcRjQ", "Accept");
						$window.open('#!/trackAllQuestions', '_blank');



	    				/*var arr_ele = document.getElementsByClassName("editable");
	    				var l_length = 0;
	    				if(arr_ele != null && arr_ele.length>0)
	    				{
					
	    					l_length = arr_ele.length;

	    					for(var i=0;i<l_length;i++) 
	    					{
	    						var state = $scope.editorStates[i];
	    						if (state) {
	    							var lite = state.editor.plugins.lite;

	    							var countChanges = lite.findPlugin(state.editor).countChanges();

	    							if(countChanges > 0)
	    							{
	    								lite && lite.findPlugin(state.editor).acceptAll();
	    								state.editor.focus();
	    							}
			    					 
			    				}
			    			} 
			    		}   
                           swal("Question updated successfully", {
			    			icon: "success",
			    		});*/

					}

				}


				);




			/*if(confirm("Are you sure you want to Accept all changes?" )){
	  	
 	

			var arr_ele = document.getElementsByClassName("editable");
			var l_length = 0;
			if(arr_ele != null && arr_ele.length>0)
			{
				l_length = arr_ele.length;

				for(var i=0;i<l_length;i++) 
				{
					var state = $scope.editorStates[i];
					if (state) {
						var lite = state.editor.plugins.lite;
						lite && lite.findPlugin(state.editor).acceptAll();
					}
				}
			}   

			}  	
			else
			{
				return false;
			}*/

		};

		/*$scope.rejectAll = function(){


			if(confirm("Are you sure you want to Reject all changes?" ))
			{
				var arr_ele = document.getElementsByClassName("editable");
				var l_length = 0;
				if(arr_ele != null && arr_ele.length>0)
				{
					l_length = arr_ele.length;

					for(var i=0;i<l_length;i++) 
					{
						var state = $scope.editorStates[i];
						if (state) {
							var lite = state.editor.plugins.lite;
							lite && lite.findPlugin(state.editor).rejectAll();
						}
					}
				}  	 	

			}
			else
			{
				return false;
			}

			
		};*/

		$scope.rejectAll = function () {


			swal({
				title: "Are you sure?",
				text: "you want to Reject all changes in the content!",
				dangerMode: true,
				buttons: ["No", "Yes!"],
			})
				.then((willDelete) => {
					if (willDelete) {
						window.localStorage.setItem("AcRjQ", "Reject");
						$window.open('#!/trackAllQuestions', '_blank');

						/*	is_rejectAll = true;
							var arr_ele = document.getElementsByClassName("editable");
							var l_length = 0;
							if(arr_ele != null && arr_ele.length>0)
							{
								l_length = arr_ele.length;
	
								for(var i=0;i<l_length;i++) 
								{
									var state = $scope.editorStates[i];
									if (state) {
										var lite = state.editor.plugins.lite;
										lite && lite.findPlugin(state.editor).rejectAll();
										state.editor.focus();
									}
								}
							}  	 	
							swal("Question updated successfully", {
								icon: "success",
							});*/
					}
				}
				)
			/*else{
				return false;
			}
			*/

		};




		$scope.FinalrepoQuestions = $scope.repoQuestions;
		var repoQstwithReplacedId = [];
		$scope.repoQuestionsReplacedId = function () {

			$scope.repoQuestions.forEach(function (element) {
				element.rep_act_qb_pk = $scope.replaceQuestionhistory.find(function (data) {

					//return data.rep_act_qb_pk = element.qb_pk;
					if (data.rep_act_qb_pk = element.qb_pk) {

						repoQstwithReplacedId.push({ "qb_pk": element.qb_pk, "replacedId": data.rep_act_qb_pk });
					}
				});


			});

		}

		$scope.replaceQuestionhistory;

		$scope.loadReplacedQuestionHistory = function () {

			$http.get('/api/load_replace_question_history').then(function (response) {
				if (response.data.message == "success") {
					$scope.populateQuestions(topicParams);
					$scope.replaceQuestionhistory = response.data.obj;
					//  $scope.repoQuestionsReplacedId();

				}
			});
		}

		// $scope.loadReplacedQuestionHistory();

		//if($scope.repoQuestions != null){
		$scope.loadReplacedQuestionHistory();
		// }

		$scope.getTotalRecords = function () {

			if ($scope.repoQuestions == null || $scope.repoQuestions.length == 0)
				return 0;
			else {
				var questionCount = 0;
				for (var i = 0; i < $scope.repoQuestions.length; i++) {
					if ($scope.repoQuestions[i].qst_type == "M" && $scope.repoQuestions[i].qst_pid == 0) {
						//Do Nothing
					} else {
						questionCount++;
					}
				}
				return questionCount;
			}
		};


		//Author: Dhiraj Edit Question For Admin 
		$scope.editQuestionForVetter = function (questionData) {
			//alert($scope.currentPageId);

			localStorage.setItem("editqbpk", questionData.qb_pk);
			localStorage.setItem("currentPageId", $scope.currentPageId);
			localStorage.setItem("editqbid", questionData.qb_id);
			repositoryService.seteditAdminQuestion(questionData);
			repositoryService.setVetterEditedPageId($scope.currentPageId);
			repositoryService.setExamId(topicParams.exam_id);
			$state.go('vetterEditQuestion');
		}

		$scope.editChangeLogQuestion = function (qb_id) {
			var parameters = { qid: qb_id, exam_id: topicParams.exam_id, qba_module_fk: topicParams.qba_module_fk };
			var deferred = $q.defer();
			var transform = function (data) {
				return $.param(data);
			};
			$http.post('/api/load_pk_question_for_changeLog', parameters, { //load_pk_question_for_changeLog //load_pk_question
				headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
				transformRequest: transform,
				timeout: 0
			}).then(function (qst_data) {
				for (var i = 0; i < qst_data.data.data.length; i++) {
					if (qb_id.qb_id == qst_data.data.data[i].qb_id) {
						$scope.editQuestionForVetter(qst_data.data.data[i]);
					}
				}
			});
		}

		$scope.renderAsHtml = function (val) {
			/* let ckselallQ = localStorage.getItem("selallQ");
			if(ckselallQ == 'Yes'){
				$('.checkpub').prop('checked', true); 
			}else{
				$('.checkpub').prop('checked', false); 
			}*/
			return $sce.trustAsHtml(val);

		};
		/*$scope.navElement = function(elementid) {
			// set the location.hash
			$location.hash(elementid);
			$anchorScroll();
		  };*/

		//Pagination function
		$scope.reloadPage = function () {

			//var bookmark = repositoryService.getBookMark()
			/*if(bookmark){
				$scope.selectNoQstn.no_Qstn = 'ALL'
			}*/

			$scope.showPages();
			if ($scope.currentPageId) {
				$scope.reloadData($scope.currentPageId);
			} else {
				$scope.reloadData(1);
			}

			$scope.getStartedInitialization();
			/*if(bookmark)
				$scope.navElement(bookmark)*/
		}
		//Pagination function 
		$scope.reloadData = function (rowNum) {

			// alert('sawant');


			$scope.repoQuestions;
			$scope.destroyCKEditor();
			$scope.currentPageId = rowNum;
			var page = rowNum;
			var offset;
			var limit;

			if (isNaN($scope.selectNoQstn.no_Qstn) && 'ALL' == $scope.selectNoQstn.no_Qstn.toUpperCase()) {
				//alert('in')
				offset = 0;
				limit = 'ALL';
				$scope.showOffset = 0;
			} else {

				$scope.showOffset = ((page - 1) * $scope.showQstn);
				offset = ((page - 1) * $scope.showQstn) + 1;//start for raw query
				limit = $scope.showQstn * page;//end
				// alert(offset+'/'+limit);
				pageFromEdit = rowNum
			}

			var parameters = {
				id: topicParams.qba_module_fk,
				examPk: $scope.examPk, examPaperPk: $scope.examPaperPk,
				off: offset, lim: limit
			};
			var deferred = $q.defer();
			var transform = function (data) {
				return $.param(data);
			};
			parameters['filter'] = $scope.filter
			$http.post('/api/load_vetter_questions', parameters, {
				headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
				transformRequest: transform,
				timeout: 0
			}).then(function (response) {

				if (response.data.message == 'No Records Found') {
					pageFromEdit = 1
					$scope.reloadData(1)
					$scope.getStartedInitialization()
					return
				}
				$scope.repoQuestions = response.data.data;
				if ($scope.selallQ == 'Yes') {
					for (var i = 0; i < $scope.repoQuestions.length; i++) {
						let qbid = $scope.repoQuestions[i].qb_id;
						if (checkqbid.indexOf(qbid) != -1) {
							$scope.pubquestvalue[qbid] = 'YES';
						}

					}
				}
				else {
					for (var i = 0; i < $scope.repoQuestions.length; i++) {
						let qbid = $scope.repoQuestions[i].qb_id;
						$scope.pubquestvalue[qbid] = 'NO';
					}
				}


				repoQuestionsarry = response.data.data;
				$scope.countQst = response.data.count[0].count;
				$scope.currentPageRecords = response.data.data.length;
				$scope.currentPageId = rowNum;
				$scope.showPages();
				//$scope.getListofVetterRequestbyUser(); 
				$scope.loadIndex();

				deferred.resolve(response);
			}).catch(function (error) {
				deferred.reject(error);
			});
		}
		$scope.scrollTo = function (hash) {
			$location.hash(hash);
		};

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

			if (pageFromEdit) {
				var pageid = pageFromEdit;
			} else {
				var pageid = 1;
			}
			var options = {
				currentPage: pageid,
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

		//Show Preview
		$scope.showPreview = function () {
			repositoryService.setVetterQuestionsParameters(topicParams);
			$state.go('examPaperVetterPreview');
		}

		$scope.get_change_log_details = function () {
			var parameters = {
				user_id: $scope.loginUser.id,
				exam_id: topicParams.exam_id,
				role: $scope.loginUser.role,
				examFk: topicParams.exampaper_pk
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

		$scope.loadEditClass = function (qbPk) {
			var found = false;
			if ($scope.changeLogData != undefined && $scope.changeLogData.length != 0) {

				for (var i = 0; i < $scope.changeLogData.length; i++) {
					if ($scope.changeLogData[i].vlog_qb_fk == qbPk) {
						found = true;
						break;
					}
				}

				if (found) {
					return "glyphicon glyphicon-flag edit";
				} else {
					return "glyphicon glyphicon-flag";
				}
			} else {
				return false;
			}

		};

		$scope.get_summary_details = function () {
			var parameters = {
				userId: $scope.loginUser.id,
				examId: topicParams.exam_id,
				moduleId: topicParams.qba_module_fk,
				exam_paper_fk: topicParams.exampaper_pk,
				qstnpaper_id: topicParams.qstnpaper_id
			};
			var transform = function (data) {
				return $.param(data);
			};

			$http.post('/api/load_summary_details', parameters, {


				headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
				transformRequest: transform,
				timeout: 0
			}).then(function (response) {




				$scope.summary_details = response.data.obj;
				$scope.short_fall_qstn_mcq = response.data.shortfall_count;
				$scope.mcqSummaryTotal();
				var moduledata = {

					exam_pk: window.localStorage.getItem("exam_id"),
					e_pk: window.localStorage.getItem("exampaper_pk")
				};
				$http.post('/api/get_modulename_admin', moduledata).then(function (response) {
					$scope.moduleList = response.data.obj;

				});
			});
		}


		$scope.range = function () {

			var input = [];
			for (var i = 1; i <= $scope.summary_details.length - $scope.short_fall_qstn_mcq.length; i++) input.push(i);
			return input;
		};

		$scope.get_case_summary_details = function () {
			var parameters = {
				userId: $scope.loginUser.id,
				examId: topicParams.exam_id,
				moduleId: topicParams.qba_module_fk,
				exam_paper_fk: topicParams.exampaper_pk,
				qstnpaper_id: topicParams.qstnpaper_id
			};
			var transform = function (data) {
				return $.param(data);
			};
			$http.post('/api/load_case_summary_for_vetter', parameters, {
				headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
				transformRequest: transform,
				timeout: 0
			}).then(function (response) {
				$scope.caseSummary = response.data.obj;

				var params = {
					exam_fk: window.localStorage.getItem("exam_id"),
					examPaper: window.localStorage.getItem("exampaper_pk")
				}
				$http.post('/api/get_module_wise_data', params).then(function (response) {
					$scope.moduleLists = response.data.obj;
				});
				$scope.short_fall_qstn = response.data.shortfall_count;
				$scope.caseTotalParentQuestions = 0;
				$scope.caseTotalChildQuestions = 0;
				$scope.caseTotalMarks = 0.0;
				$scope.caseTotalShortfall = 0;
				$scope.caseTotalReplaceParentQuestions = 0.0
				$scope.caseTotalReplaceChildQuestions = 0
				$scope.caseTotalReplaceMarks = 0

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
					$scope.caseTotalReplaceParentQuestions = $scope.caseTotalReplaceParentQuestions + parseInt($scope.caseSummary[i].total_replace_parent_question)
					$scope.caseTotalReplaceChildQuestions = $scope.caseTotalReplaceChildQuestions + parseFloat($scope.caseSummary[i].total_replace_child_question)
					if ($scope.caseSummary[i].total_replace_question_marks)
						$scope.caseTotalReplaceMarks = $scope.caseTotalReplaceMarks + parseFloat($scope.caseSummary[i].total_replace_question_marks)
				}

				/*for(var j=0;j<$scope.short_fall_qstn.length;j++)
				{
					
					$scope.caseTotalShortfall = $scope.caseTotalShortfall + parseInt($scope.short_fall_qstn[j].count);
				}*/



			});
		}

		/* For Total Calculation */
		$scope.mcqSummaryTotal = function () {
			$scope.total_marks = 0;
			$scope.total_qstn = 0;
			$scope.totalShortfall = 0;
			$scope.total_replaced_ques = 0
			$scope.total_replace_question_marks = 0
			if ($scope.summary_details.length > 0) {
				for (var i = 0; i < $scope.summary_details.length; i++) {
					var details = $scope.summary_details[i];
					$scope.total_marks += parseFloat(details.summary_marks);
					$scope.total_qstn += parseFloat(details.summary_question);
					$scope.total_replaced_ques += parseFloat(details.total_replaced_quest)
					if (details.total_replace_question_marks)
						$scope.total_replace_question_marks += parseFloat(details.total_replace_question_marks)
					$scope.totalShortfall += parseFloat(details.short_fall_qstn)
				}
				/*for(var j = 0; j < $scope.short_fall_qstn_mcq.length; j++){
					$scope.totalShortfall += parseFloat($scope.short_fall_qstn_mcq[j].count);
				}*/
			}
		}

		$scope.loadUniqueList;
		$scope.loadActivatedQuestion = function () {
			$http.get('/api/load_unique_activated_question_list').then(function (response) {
				if (response.data.message == "success") {
					$scope.loadUniqueList = response.data.obj;
				}
			});
		}

		$scope.loadActivatedQuestion();

		$scope.isApprovedQstIdmatched = true;
		$scope.isApprovedQstId = [];
		$scope.isApprovedQstIdForRemove = [];
		var storeqb_pk;
		var getReplacedqb_pk;
		$scope.selectedQst_qbpk;
		$scope.recentlyReplaced_qbpk = [];
		$scope.requested_qbpk = [];

		$scope.matchApprovedQuestions = function () {
			var repqstList = [];
			if ($scope.repoQuestions != null) {


				$scope.repoQuestions.findIndex(function (data) {
					for (var i = 0; i < $scope.getRequestList.length; i++) {
						if (data.qb_pk == $scope.getRequestList[i].vlog_qb_fk && $scope.getRequestList[i].admin_status == "Approved") {
							storeqb_pk = $scope.getRequestList[i].vlog_qb_fk;
							//repqstList.push(storeqb_pk);
							// return data.qb_pk == $scope.getRequestList[i].vlog_qb_fk;  
							if (data.qb_pk == $scope.getRequestList[i].vlog_qb_fk) {
								repqstList.push({ req_qbid: data.qb_id, status: $scope.getRequestList[i].status });
							}

						}

					}
				});
			} else {
				$scope.populateQuestions(topicParams);
			}
			repqstList.forEach(function (element, index, array) {
				for (var i = 0; i < $scope.repoQuestions.length; i++) {
					if ($scope.repoQuestions[i].qb_id == element.req_qbid && element.status != 'D') {
						$scope.isApprovedQstId.push(element.req_qbid);
					} else if ($scope.repoQuestions[i].qb_id == element.req_qbid && element.status == 'D') {
						$scope.isApprovedQstIdForRemove.push(element.req_qbid);
					}
				}

			});




			$scope.isApprovedQstId = $scope.isApprovedQstId.filter(function (item, index, inputArray) {
				return inputArray.indexOf(item) == index;
			});


		}





		var reqQbPk;
		var reqQbId;
		var actiontype;
		$scope.getFilteredData = function (data, actionType) {
			$scope.repoobj = data;

			reqQbPk = data.qb_pk;
			window.localStorage.setItem('mqb_pk', data.qb_pk);
			reqQbId = data.qb_id;
			actiontype = actionType;
			var qstDetails = {};
			qstDetails.qb_pk = data.qb_pk;
			qstDetails.qst_marks = data.qst_marks;
			qstDetails.qba_topic_fk = data.qba_topic_fk;
			qstDetails.qb_id = data.qb_id;
			window.localStorage.setItem('mqb_id', data.qb_id);
			qstDetails.moduleId = topicParams.qba_module_fk;
			qstDetails.created_by = $scope.loginUser.id;
			qstDetails.exampaper_fk = $scope.examPaperPk;
			qstDetails.exam_fk = $scope.examPk;
			qstDetails.qst_type = data.qst_type;
			qstDetails.m_id = data.qba_module_mstr.qba_module_fk;
			qstDetails.s_id = data.qba_subject_master.qba_subject_fk;
			if (data.qst_type == 'CS') {
				var parameters = {
					id: topicParams.qba_module_fk,
					examPk: $scope.examPk, examPaperPk: $scope.examPaperPk,
					off: 0, lim: 'ALL'
				};
				parameters['filter'] = $scope.filter
				$http.post('/api/load_vetter_questions', parameters).then(function (response) {
					var temp = response.data.data;
					var childList = ($filter('filter')(temp, { qst_pid: data.qb_id }));
					$scope.caseChildCount = childList.length;
					qstDetails.child_qst_count = $scope.caseChildCount;
				})
			}

			var emptyqst_Details = {
				qb_pk: data.qb_pk,
				qst_type: data.qst_type,
				qst_marks: data.qst_marks,
				qba_topic_fk: data.qba_topic_fk,
				qb_id: data.qb_id,
				moduleId: topicParams.qba_module_fk,
				created_by: $scope.loginUser.id,
				exampaper_fk: $scope.examPaperPk,
				exam_fk: $scope.examPk,
				qba_topic_fk: data.qba_topic_fk,
				qba_subject_fk: data.qba_subject_master.qba_subject_pk,
				qba_course_fk: data.qba_course_master.qba_course_pk,
				qba_module_fk: data.qba_module_mstr.qba_module_pk,
				qst_request_remarks: "Replacement of QB ID " + reqQbId
				//qst_request_status: 
			};

			var replaceQstDetails = {

				rep_qb_pk: data.qb_pk,
				rep_id_marks: data.qst_marks,
				rep_id_qsttype: data.qst_type,
				req_id_module: data.qba_module_mstr.module_name,
				req_id_user: $scope.loginUser.id,
				req_id_isapproved: true,
				exampaper_fk: $scope.examPaperPk,
				exam_fk: $scope.examPk

			}
			var replacedby;
			var updateCulledTable = {
				exam_fk: $scope.examPk,
				exampaper_fk: $scope.examPaperPk,
				qb_pk: reqQbPk,
				//qst_request_status:
				//qst_request_status:'Approved',
				//qst_request_remarks:"Replaced by QB ID "+replacedby,
				qst_request_status: 'null'
			}


			$http.post('/api/load_inactive_questions', qstDetails).then(function (response) {

				if (response.data.data != null || response.data.data.length != 0) {
					$scope.filteredQustionList = response.data.data;
					$scope.getListofVetterRequestbyUser();

					$scope.requesetdQst = data.qb_id;

					if ($scope.filteredQustionList.length == 0) {

						$http.post('/api/load_inactive_questions_modulewise', qstDetails).then(function (response) {
							if (response.data.data.length > 0) {
								swal({
									text: "No replacement case is available for this unit, do you want to select from the same module?",
									dangerMode: true,
									buttons: ["No", "Yes!"],
								})
									.then((willDelete) => {
										if (willDelete) {
											if (response.data.data != null || response.data.data.length != 0) {
												$scope.filteredQustionList = response.data.data;
												$scope.getListofVetterRequestbyUser();
											}

										}
										else {
											swal({
												text: "Question not available, kindly add new question?",
												dangerMode: true,
												buttons: ["No", "Yes!"],
											})
												.then((willDelete) => {
													if (willDelete) {

														$http.post('/api/add_empty_qstforreplaced_or_deletedquestion', emptyqst_Details).then(function (response) {
															if (response.data.message == 'success') {
																replaceQstDetails.rep_act_qb_pk = response.data.obj.qb_pk;
																replacedby = response.data.obj.qb_id;
																if (data.qst_request_status == "Replacement request approved") {
																	updateCulledTable.qst_request_remarks = "Question Replaced by QB ID " + replacedby;
																} else {
																	updateCulledTable.qst_request_remarks = "Deleted,Replaced by QB ID " + replacedby;
																	updateCulledTable.qst_is_active = "I";
																}
																return $http.post('/api/update_culled_table_for_replaced_qstremarks', updateCulledTable).then(function (response) {
																	if (response.data.message == "success") {
																		$scope.populateQuestions(topicParams);
																		swal("New Question has been added!");
																		return $http.post('/api/save_replace_qstn_history', replaceQstDetails).then(function (response) {
																			if (response.data.message == "success") {
																				$scope.loadReplacedQuestionHistory();
																				$scope.getListofVetterRequestbyUser();
																				$scope.culledQstnRequestApprovedStatus();
																				//alert("New Question has been added!");
																			}
																		});
																	}
																});

															}
														});
													}
													else {

														angular.element(document.getElementById('addUserModal2').style.display = 'none');
														angular.element(document).find('.modal-open').css({ 'overflow': 'inherit' });
													}
												});
											// angular.element(document.getElementById('addUserModal2').style.display = 'none');  
											// angular.element(document).find('.modal-open').css({'overflow':'inherit'});
										}
									});
							}

							else if (response.data.data.length == 0) {

								$http.post('/api/load_inactive_questions_subjectwise', qstDetails).then(function (response) {
									if (response.data.data.length > 0) {

										swal({
											text: "No replacement case is available for this unit or module, do you want to select from the same subject?",
											dangerMode: true,
											buttons: ["No", "Yes!"],
										})
											.then((willDelete) => {
												if (willDelete) {
													if (response.data.data != null || response.data.data.length != 0) {
														$scope.filteredQustionList = response.data.data;
														$scope.getListofVetterRequestbyUser();
													}

												}
												else {
													// angular.element(document.getElementById('addUserModal2').style.display = 'none');  
													// angular.element(document).find('.modal-open').css({'overflow':'inherit'});

													swal({
														text: "Question not available, kindly add new question?",
														dangerMode: true,
														buttons: ["No", "Yes!"],
														//icon: "info",					  
													})
														.then((willDelete) => {
															if (willDelete) {

																$http.post('/api/add_empty_qstforreplaced_or_deletedquestion', emptyqst_Details).then(function (response) {
																	if (response.data.message == 'success') {
																		replaceQstDetails.rep_act_qb_pk = response.data.obj.qb_pk;
																		replacedby = response.data.obj.qb_id;
																		if (data.qst_request_status == "Replacement request approved") {
																			updateCulledTable.qst_request_remarks = "Question Replaced by QB ID " + replacedby;
																		} else {
																			updateCulledTable.qst_request_remarks = "Deleted,Replaced by QB ID " + replacedby;
																			updateCulledTable.qst_is_active = "I";
																		}
																		return $http.post('/api/update_culled_table_for_replaced_qstremarks', updateCulledTable).then(function (response) {
																			if (response.data.message == "success") {
																				$scope.populateQuestions(topicParams);
																				swal("New Question has been added!");
																				return $http.post('/api/save_replace_qstn_history', replaceQstDetails).then(function (response) {
																					if (response.data.message == "success") {
																						$scope.loadReplacedQuestionHistory();
																						$scope.getListofVetterRequestbyUser();
																						$scope.culledQstnRequestApprovedStatus();
																						//alert("New Question has been added!");
																					}
																				});
																			}
																		});

																	}
																});
															}
															else {

																angular.element(document.getElementById('addUserModal2').style.display = 'none');
																angular.element(document).find('.modal-open').css({ 'overflow': 'inherit' });
															}
														});
												}
											});


									}
									else {

										swal({
											text: "Question not available, kindly add new question?",
											dangerMode: true,
											buttons: ["No", "Yes!"],
										})
											.then((willDelete) => {
												if (willDelete) {

													$http.post('/api/add_empty_qstforreplaced_or_deletedquestion', emptyqst_Details).then(function (response) {
														if (response.data.message == 'success') {
															replaceQstDetails.rep_act_qb_pk = response.data.obj.qb_pk;
															replacedby = response.data.obj.qb_id;
															if (data.qst_request_status == "Replacement request approved") {
																updateCulledTable.qst_request_remarks = "Question Replaced by QB ID " + replacedby;
															} else {
																updateCulledTable.qst_request_remarks = "Deleted,Replaced by QB ID " + replacedby;
																updateCulledTable.qst_is_active = "I";
															}
															return $http.post('/api/update_culled_table_for_replaced_qstremarks', updateCulledTable).then(function (response) {
																if (response.data.message == "success") {
																	$scope.populateQuestions(topicParams);
																	swal("New Question has been added!");
																	return $http.post('/api/save_replace_qstn_history', replaceQstDetails).then(function (response) {
																		if (response.data.message == "success") {
																			$scope.loadReplacedQuestionHistory();
																			$scope.getListofVetterRequestbyUser();
																			$scope.culledQstnRequestApprovedStatus();
																			//alert("New Question has been added!");
																		}
																	});
																}
															});

														}
													});
												}
												else {

													angular.element(document.getElementById('addUserModal2').style.display = 'none');
													angular.element(document).find('.modal-open').css({ 'overflow': 'inherit' });
												}
											});

									}

								});
							}


							else {

								swal({
									text: "Question not available, kindly add new question?",
									dangerMode: true,
									buttons: ["No", "Yes!"],
								})
									.then((willDelete) => {
										if (willDelete) {

											$http.post('/api/add_empty_qstforreplaced_or_deletedquestion', emptyqst_Details).then(function (response) {
												if (response.data.message == 'success') {
													replaceQstDetails.rep_act_qb_pk = response.data.obj.qb_pk;
													replacedby = response.data.obj.qb_id;
													if (data.qst_request_status == "Replacement request approved") {
														updateCulledTable.qst_request_remarks = "Question Replaced by QB ID " + replacedby;
													} else {
														updateCulledTable.qst_request_remarks = "Deleted,Replaced by QB ID " + replacedby;
														updateCulledTable.qst_is_active = "I";
													}
													return $http.post('/api/update_culled_table_for_replaced_qstremarks', updateCulledTable).then(function (response) {
														if (response.data.message == "success") {
															$scope.populateQuestions(topicParams);
															swal("New Question has been added!");
															return $http.post('/api/save_replace_qstn_history', replaceQstDetails).then(function (response) {
																if (response.data.message == "success") {
																	$scope.loadReplacedQuestionHistory();
																	$scope.getListofVetterRequestbyUser();
																	$scope.culledQstnRequestApprovedStatus();
																	//alert("New Question has been added!");
																}
															});
														}
													});

												}
											});
										}
										else {

											angular.element(document.getElementById('addUserModal2').style.display = 'none');
											angular.element(document).find('.modal-open').css({ 'overflow': 'inherit' });
										}
									});

							}


						});

					}

				}

			});
		}


		$scope.getFilteredDataForMCQ = function (data, actionType) {

			$scope.repoobj = data;
			reqQbPk = data.qb_pk;
			window.localStorage.setItem('mqb_pk', data.qb_pk);
			reqQbId = data.qb_id;
			actiontype = actionType;
			var qstDetails = {};
			qstDetails.qb_pk = data.qb_pk;
			qstDetails.qst_marks = data.qst_marks;
			qstDetails.qba_topic_fk = data.qba_topic_fk;
			qstDetails.qb_id = data.qb_id;
			window.localStorage.setItem('mqb_id', data.qb_id);
			qstDetails.moduleId = topicParams.qba_module_fk;
			qstDetails.created_by = $scope.loginUser.id;
			qstDetails.exampaper_fk = $scope.examPaperPk;
			qstDetails.exam_fk = $scope.examPk;
			qstDetails.qst_type = data.qst_type;
			if (data.qst_type == 'CS') {
				var childList = ($filter('filter')($scope.repoQuestions, { qst_pid: data.qb_id }));
				$scope.caseChildCount = childList.length;
				qstDetails.child_qst_count = $scope.caseChildCount;
			}

			var emptyqst_Details = {
				qb_pk: data.qb_pk,
				qst_type: data.qst_type,
				qst_marks: data.qst_marks,
				qba_topic_fk: data.qba_topic_fk,
				qb_id: data.qb_id,
				moduleId: topicParams.qba_module_fk,
				created_by: $scope.loginUser.id,
				exampaper_fk: $scope.examPaperPk,
				exam_fk: $scope.examPk,
				qba_topic_fk: data.qba_topic_fk,
				qba_subject_fk: data.qba_subject_master.qba_subject_pk,
				qba_course_fk: data.qba_course_master.qba_course_pk,
				qba_module_fk: data.qba_module_mstr.qba_module_pk,
				qst_request_remarks: "Replacement of QB ID " + reqQbId
				//qst_request_status: 
			};

			var replaceQstDetails = {

				rep_qb_pk: data.qb_pk,
				rep_id_marks: data.qst_marks,
				rep_id_qsttype: data.qst_type,
				req_id_module: data.qba_module_mstr.module_name,
				req_id_user: $scope.loginUser.id,
				req_id_isapproved: true,
				exampaper_fk: $scope.examPaperPk,
				exam_fk: $scope.examPk

			}
			var replacedby;
			var updateCulledTable = {
				exam_fk: $scope.examPk,
				exampaper_fk: $scope.examPaperPk,
				qb_pk: reqQbPk,
				//qst_request_status:
				//qst_request_status:'Approved',
				//qst_request_remarks:"Replaced by QB ID "+replacedby,
				qst_request_status: 'null'
			}


			$http.post('/api/load_inactive_questions', qstDetails).then(function (response) {
				if (response.data.data != null || response.data.data.length != 0) {
					$scope.filteredQustionList = response.data.data;
					$scope.getListofVetterRequestbyUser();


					//return false;
					// $scope.getListofVetterRequestbyUser(); 
					$scope.requesetdQst = data.qb_id;
					//}else{
					if ($scope.filteredQustionList.length == 0) {

						swal({
							text: "Question not available, kindly add new question?",
							buttons: ["Cancel", "Ok!"],
						})
							.then((willDelete) => {
								if (willDelete) {
									$http.post('/api/add_empty_qstforreplaced_or_deletedquestion', emptyqst_Details).then(function (response) {
										if (response.data.message == 'success') {
											replaceQstDetails.rep_act_qb_pk = response.data.obj.qb_pk;
											replacedby = response.data.obj.qb_id;
											if (data.qst_request_status == "Replacement request approved") {
												updateCulledTable.qst_request_remarks = "Question Replaced by QB ID " + replacedby;
											} else {
												updateCulledTable.qst_request_remarks = "Deleted,Replaced by QB ID " + replacedby;
												updateCulledTable.qst_is_active = "I";
											}
											return $http.post('/api/update_culled_table_for_replaced_qstremarks', updateCulledTable).then(function (response) {
												if (response.data.message == "success") {
													$scope.populateQuestions(topicParams);
													swal("New Question has been added!");
													return $http.post('/api/save_replace_qstn_history', replaceQstDetails).then(function (response) {
														if (response.data.message == "success") {
															$scope.loadReplacedQuestionHistory();
															$scope.getListofVetterRequestbyUser();
															$scope.culledQstnRequestApprovedStatus();
															//alert("New Question has been added!");
														}
													});
												}
											});

										}
									});
								}
								else {

									angular.element(document.getElementById('addUserModal2').style.display = 'none');
									angular.element(document).find('.modal-open').css({ 'overflow': 'inherit' });
								}
							});





					}
				}

			});
		}

		$scope.setExamDetails = function (records, actiontype) {
			var course_name = records.qba_course_master.qba_course_name;
			var course_code = records.qba_course_master.qba_course_code;
			var module_name = records.qba_module_mstr.module_name;
			var topic_name = records.qba_topic_master.topic_name;
			var topic_code = records.qba_topic_master.qba_topic_code;
			var subject_name = records.qba_subject_master.subject_name;
			var subject_code = records.qba_subject_master.qba_subject_code;
			var qst_marks = records.qst_marks;
			var qst_neg_marks = records.qst_neg_marks;
			var c_id = records.qba_course_master.qba_course_fk;
			var s_id = records.qba_subject_master.qba_subject_fk;
			var m_id = records.qba_module_mstr.qba_module_fk;
			var t_id = records.qba_topic_fk;

			window.localStorage.setItem('course_name_vetter', course_name);
			window.localStorage.setItem('actiontype', actiontype);
			window.localStorage.setItem('course_code_vetter', course_code);
			window.localStorage.setItem('module_name_vetter', module_name);
			window.localStorage.setItem('topic_name_vetter', topic_name);
			window.localStorage.setItem('topic_code_vetter', topic_code);
			window.localStorage.setItem('subject_name_vetter', subject_name);
			window.localStorage.setItem('subject_code_vetter', subject_code);
			window.localStorage.setItem('qst_marks_vetter', qst_marks);
			window.localStorage.setItem('qst_neg_marks_vetter', qst_neg_marks);

			window.localStorage.setItem('c_id_vetter', c_id);
			window.localStorage.setItem('s_id_vetter', s_id);
			window.localStorage.setItem('m_id_vetter', m_id);
			window.localStorage.setItem('t_id_vetter', t_id);


			repositoryService.setAddShortFallQuestion(records);
			repositoryService.setSelectedCourse(records.qba_course_master);
			repositoryService.setSelectedSubject(records.qba_subject_master);
			repositoryService.setSelectedModule(records.qba_module_mstr);
			repositoryService.setSelectedTopic(records.qba_topic_master);

		}
		$scope.setExampaperforparent = function (records, actiontype) {
			var course_code = records.qba_course_master.qba_course_code;
			var course_name = records.qba_course_master.qba_course_name;
			var course_id = records.qba_course_master.qba_course_fk;
			var module_name = records.qba_module_mstr.module_name;
			var module_id = records.qba_module_mstr.qba_module_fk;

			var subject_name = records.qba_subject_master.subject_name;
			var qba_subject_fk = records.qba_subject_master.qba_subject_fk;
			var qba_subject_code = records.qba_subject_master.qba_subject_code;
			var topic_name = records.qba_topic_master.topic_name;
			var qba_topic_code = records.qba_topic_master.qba_topic_code;
			var qba_topic_pk = records.qba_topic_master.qba_topic_pk;

			window.localStorage.setItem('actiontype', actiontype);
			window.localStorage.setItem("course_code_vetter_csq", course_code);
			window.localStorage.setItem("course_id_vetter_csq", course_id);
			window.localStorage.setItem("course_name_vetter_csq", course_name);
			window.localStorage.setItem("module_name_vetter_csq", module_name);
			window.localStorage.setItem("module_id_vetter_csq", module_id);

			window.localStorage.setItem("subject_name_vetter_csq", subject_name);
			window.localStorage.setItem("subject_id_vetter_csq", qba_subject_fk);
			window.localStorage.setItem("subject_code_vetter_csq", qba_subject_code);
			window.localStorage.setItem("topic_name_vetter_csq", topic_name);
			window.localStorage.setItem("topic_code_vetter_csq", qba_topic_code);
			window.localStorage.setItem("topic_id_vetter_csq", qba_topic_pk);

		}


		$scope.course = window.localStorage.getItem("course");
		$scope.subject = window.localStorage.getItem("subject");
		$scope.module = window.localStorage.getItem("module");
		$scope.topic = window.localStorage.getItem("topic");
		$scope.markss = window.localStorage.getItem("marks");
		$scope.negavtivemarks = window.localStorage.getItem("negavtivemarks");

		var req_replaceIdList = [];
		$scope.loadIndex = function () {

			var replacedList = [];
			var reqqbpkList = [];

			if ($scope.replaceQuestionhistory != null && $scope.repoQuestions != null) {

				$scope.repoQuestions.findIndex(function (data) {
					for (var i = 0; i < $scope.replaceQuestionhistory.length; i++) {
						if (data.qb_pk == $scope.replaceQuestionhistory[i].rep_act_qb_pk && $scope.replaceQuestionhistory[i].rep_act_qb_pk != 0) {
							replacedList.push(data.qb_pk);
							reqqbpkList.push($scope.replaceQuestionhistory[i].rep_qb_pk);

						}



					}
				});

				$scope.replaceQuestionhistory.forEach(function (datapk) {
					if (datapk.rep_act_qb_pk != 0) {
						req_replaceIdList.push({ req_qbpk: datapk.rep_qb_pk, inplace_qbpk: datapk.rep_act_qb_pk, activated_qb_id: datapk.rep_act_qb_id });
					}
				});


			}
			else {

				$scope.populateQuestions(topicParams);
			}


			if (replacedList.length != null) {
				$scope.recentlyReplaced_qbpk = replacedList;
				$scope.requested_qbpk = reqqbpkList;
				$scope.req_replaceIdList = req_replaceIdList;
				$scope.recentlyReplaced_qbpk = $scope.recentlyReplaced_qbpk.filter(function (item, index, inputArray) {
					return inputArray.indexOf(item) == index;
				});
				$scope.requested_qbpk = $scope.requested_qbpk.filter(function (item, index, inputArray) {
					return inputArray.indexOf(item) == index;
				});

				$scope.req_replaceIdList = $scope.req_replaceIdList.filter(function (item, index, inputArray) {
					return inputArray.indexOf(item) == index;
				});

			}
		}

		$scope.findQbid = function (req) {
			if (req != undefined) {
				var qbidmatch;
				$scope.repoQuestions.findIndex(function (data) {
					if (data.qb_pk == req) {
						qbidmatch = data.qb_id;
					}
				});

				return qbidmatch;
			}
		}

		$scope.arrayToString = function (string) {
			return string.join(",");
		}

		$scope.replaceQuestionhistory;

		$scope.loadReplacedQuestionHistory = function () {

			$http.get('/api/load_replace_question_history').then(function (response) {
				if (response.data.message == "success") {

					$scope.replaceQuestionhistory = response.data.obj;

					$scope.loadIndex();
				}
			});
		}



		$scope.loadReplacedQuestionHistory();
		$scope.loadIndex();

		$scope.qstReplaced = false;
		$scope.questionSelectionbyUser = function (data, selectedqst, selectedqbid, actiontype) {

			var finalid = { finalQstId: selectedqst };
			finalid.examId = $scope.examPk; //examid.exam_pk;
			finalid.examPaperId = $scope.examPaperPk;//response.data.obj.exampaper_pk;
			finalid.qst_request_remarks = "Replacement of QB ID " + reqQbId;
			if (data.qst_type == 'CS') {

				finalid.maxChildLimit = $scope.caseChildCount;
			}
			finalid.userName = name;
			var replaceId = { finalQstId: reqQbPk }
			if (selectedqst != null) {

				$http.post('/api/copy_culled_questions', finalid).then(function (response) {
					if (response != null) {

						$scope.repoQuestions;
						$scope.myTestvar != $scope.myTestvar;

						var replacedby = data.qb_id;
						var updateCulledTable = {
							exam_fk: $scope.examPk,
							exampaper_fk: $scope.examPaperPk,
							qb_pk: reqQbPk,
							qst_request_remarks: "Question Replaced by QB ID " + replacedby,
							qst_request_status: 'null',
							username: $scope.username
						}

						if (actiontype == 'remove') {
							// updateCulledTable.qst_request_remarks = "Question Removed and Replaced by QB ID "+replacedby;
							updateCulledTable.qst_request_remarks = "Question Permanently Removed and Replaced by QB ID " + replacedby;
							//updateCulledTable.qst_is_active = "I"; // comment by shilpa
							updateCulledTable.qst_is_active = "A";
						}

						return $http.post('/api/update_culled_table_for_replaced_qstremarks', updateCulledTable).then(function (response) {

							$scope.username = response.data.username;
							if (response.data.message == "success") {
								swal("Replace Data Updated!");
								$scope.populateQuestions(topicParams);
								$scope.loadReplacedQuestionHistory();
								$scope.culledQstnRequestApprovedStatus();
								angular.element(document.getElementById('addUserModal2').style.display = 'none');
								angular.element(document).find('.modal-open').css({ 'overflow': 'inherit' });
								/*return false;
								return  $http.post('/api/update_replace_qstn_history_with_activated_question',updateReplacehistrory).then(function(response){
									if(response.data.message == "success"){
										alert("Replace Histroy Updated!..");  
										$scope.qstReplaced = true; 
										$scope.populateQuestions(topicParams);

									}

								});  */
							}
						});



					} else {
						return false;
					}

				});
			}
		}


		$scope.confirmAlert = function (data, selectedqst, selectedqbid) {
			swal({
				title: "Are you sure?",
				text: " you want to replace QB ID " + reqQbId + " with QB ID " + selectedqbid,
				dangerMode: true,
				buttons: ["No", "Yes!"],
			})
				.then((willDelete) => {
					var flag = false
					//api for update case_summary or multi_summary
					data.exampaper_fk = topicParams.exampaper_pk
					data.exam_fk = topicParams.exam_id
					data.qst_marks = data.no_of_question
					if (data.qst_type == 'CS') {
						$http.post('/api/replace_update_case_summary', data).then(function (response) {
							if (response.data.message == 'success') {
								flag = true
								if (willDelete) {
									$scope.questionSelectionbyUser(data, selectedqst, selectedqbid, actiontype);
								}
							}
						})
					}
					else if (data.qst_type == 'M') {
						$http.post('/api/replace_update_mcq_summary', data).then(function (response) {
							if (response.data.message == 'success') {
								flag = true
								if (willDelete) {
									$scope.questionSelectionbyUser(data, selectedqst, selectedqbid, actiontype);
								}
							}
						})
					}
				});
			window.localStorage.setItem('mqb_pk', selectedqbid);

			/*if(confirm("Are you sure you want to replace QB ID " + reqQbId + " with QB ID " +selectedqbid+"?" )){
				  $scope.questionSelectionbyUser(data,selectedqst,selectedqbid,actiontype);
			} */
		}


		$scope.getRequestList;
		$scope.getListofVetterRequestbyUser = function () {

			var status = { status: 'R', created_by: $scope.loginUser.id, qstnpaperid: $scope.currentQstnPaperId };
			$http.post('/api/get_list_of_vetter_requestby_user', status).then(function (response) {
				if (response.data.message == 'success') {
					$scope.getRequestList = response.data.obj;

					for (var i = 0; i < $scope.getRequestList.length; i++) {

						if ($scope.getRequestList[i].admin_status == "Approved") {

							$scope.matchApprovedQuestions();
						}
					}

				}
			});
		}

		/* Runs of Page Initialization */
		if (!pageFromEdit) {
			$scope.populateQuestions(topicParams);
			$scope.get_change_log_details();
			$scope.get_summary_details();
			$scope.get_case_summary_details();
			$scope.loadReplacedQuestionHistory();
		} else {

			$scope.reloadData(pageFromEdit);
			$scope.get_change_log_details();
			$scope.get_summary_details();
			$scope.get_case_summary_details();
		}

		function currentTime() {
			var d = new Date();
			d = d.toString().replace(/GMT/, "");
			d = d.toString().replace(/India Standard Time/, "");
			d = d.toString().replace(/["'()]/g, "");
			return d;
		}

		$scope.allquestions;
		var allQuestions = [];
		$scope.loadAllQuestion = function () {
			$http.get('/api/load_all_question').then(function (response) {
				$scope.allquestions = response.data.obj;
				allQuestions = response.data.obj;
			});
		}
		$scope.loadAllQuestion();

		function arr_diff(a1, a2) {

			var a = [], diff = [];

			for (var i = 0; i < a1.length; i++) {
				a[a1[i]] = true;
				a.push(a1[i]);
			}

			for (var i = 0; i < a2.length; i++) {
				if (a[a2[i]]) {//&& a2[i] != "Mango"
					delete a[a2[i]];
				} else {
					a[a2[i]] = true;
					a.push(a1[i]);
				}
			}

			for (var k in a) {
				diff.push(a[k]);
			}

			return diff;
		};



		$scope.getListofVetterRequestbyUser();

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
			CKEDITOR.remove('editor1');
			$scope.loadEditor('editor1', true);
			$scope.loadEditor('editorRemarks', true);
			$scope.loadEditor('editorReference', true);
			$scope.loadEditor('editorCalculations', true);

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
					examPk: $scope.examPk,
					qb_id: data.qb_id,
					qstnpaper_id: $scope.currentQstnPaperId,
					exam_name: $scope.examName,
					examPaperPk: $scope.examPaperPk
				};
			} else {
				var Req = {
					qb_pk: data.qb_pk,
					examPk: $scope.examPk,
					qb_id: data.qst_pid,
					qstnpaper_id: $scope.currentQstnPaperId,
					exam_name: $scope.examName,
					examPaperPk: $scope.examPaperPk
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
			$scope.newChildQuestion.parent_child_type = $scope.parent_child_type;
			$scope.newChildQuestion.replace_id = $scope.replace_id;
			$scope.newChildQuestion.examFk = $scope.examPk;
			$scope.newChildQuestion.exampaperFk = $scope.examPaperPk;
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
			$scope.newChildQuestion.qb_id = $scope.casePassage[0].qb_id;
			var parentId = {
				qb_id: $scope.casePassage[0].qb_id,
				exam_fk: $scope.examPk,
				exampaper_fk: $scope.examPaperPk,
				marks: $scope.marks
			};
			var req = $scope.newChildQuestion;
			//return false;
			var alertdialog = confirm("Are you sure you want to save the child question?")
			if (alertdialog) {
				document.getElementById('board').style.visibility = 'visible'
				$("#ChildModel").click()
				return $http.post('/api/save_csq_child', req)
					.then(function (response) {
						$http.post('/api/update_CSQ_child_count', parentId)
							.then(function (res) {
								alert('QBID ' + response.data.replace_by_qb_id + ' Saved Successfully.');
								document.getElementById('board').style.visibility = 'hidden'
								$window.location.reload();
								//repositoryService.setBookMark($scope.newChildQuestion.parentId)
								//$('#addChildQuesModel').modal('hide')
								//$scope.reloadPage()
							});
					});
			}
			else {
				return false;
			}

		};
		// end by shilpa

		$scope.requestForReplaceQuestion = function (data, reqtype) {
			var currentExamfk = $scope.examPk;
			var currentUser = $scope.loginUser.id;
			var requestType = reqtype;
			requestType = (reqtype == "R") ? 'Replace' : 'Remove';
			//var QPorOB = reqtype; // add by shilpa
			// add by shilpa
			if (requestType == 'Remove') { // Remove
				if (reqtype == 'RM') {
					reqtype = 'RM';
				} else {
					reqtype = (reqtype == "QP") ? 'QP' : 'QB';  // removed from qp or qb 
				}
			} else {
				reqtype = 'R'; // replace
			}

			var vetterReq = {
				seq: 0,
				vlog_qb_fk: data.qb_pk,
				vlog_exam_fk: $scope.examPk,//data.exam_fk, 
				status: reqtype,
				remarks: data.qst_remarks,
				created_dt: currentTime(),
				created_by: $scope.loginUser.id,
				updated_dt: currentTime(),
				updated_by: $scope.loginUser.id,
				qb_id: data.qb_id,
				qstnpaper_id: $scope.currentQstnPaperId,
				exam_name: $scope.examName,
				exampaper_fk: $scope.examPaperPk
			};

			var vetterLogResponse;
			return $http.post('/api/check_vetter_request_present', vetterReq).then(function (response) {
				vetterLogResponse = response.data.obj;
				if (vetterLogResponse != null && vetterLogResponse.length > 0) {

					vetterLogResponse.findIndex(function (checkData) {
						if (checkData.vlog_qb_fk == data.qb_pk && checkData.exampaper_fk == data.exampaper_fk && (checkData.status == reqtype || checkData.status == 'E') && (checkData.admin_status == '' || checkData.admin_status == null)) {
							if (checkData.status == 'E') {  // E for question edit
								if (reqtype == "R") { // replace
									swal({
										title: "Are you sure, you want to raise a replacement request for QB ID " + data.qb_id,
										//text: 'Do you want to ' +requestType+ ' Question Id '+data.qb_id,	
										text: 'Are you sure, you want to replace the  question ' + data.qb_id + ' from QB',
										dangerMode: true,
										buttons: ["No", "Yes!"],
									})
										.then((willDelete) => {
											if (willDelete) {

												vetterReq.status = reqtype;

												var replaceQstDetails = {
													rep_qb_pk: data.qb_pk,
													rep_id_marks: data.qst_marks,
													rep_id_qsttype: data.qst_type,
													req_id_module: data.qba_module_mstr.module_name,
													req_id_user: $scope.loginUser.id,
													req_id_isapproved: false,
													rep_act_qb_pk: 0,
													exampaper_fk: $scope.examPaperPk,
													exam_fk: $scope.examPk
												}

												$http.post('/api/vetter_req_for_replace_question', vetterReq).then(function (response) {
													if (response.data.message == 'success') {

														$scope.vettingLogRequestApprovedStatus();


														swal("Request submitted successfully!", {
															icon: "success",
														});

														return $http.post('/api/save_replace_qstn_history', replaceQstDetails).then(function (response) {
															if (response.data.message == "success") {
																$scope.getListofVetterRequestbyUser();
																$scope.vettingLogRequestApprovedStatus();
															}
														});

													} else if (response.data.message == 'RequestPresent') {
														swal("Request already done!");
														return false;
													} else {
														swal("Error while making request!");
													}
												});
											}
										});
								} else if (reqtype == "RM") { // removed
									swal({
										title: "The question will be permanently deleted from the question bank. Do you want to delete ",
										//text: 'Do you want to ' +requestType+ ' Question Id '+data.qb_id,	
										text: 'Are you sure, you want to remove the  question ' + data.qb_id + ' from QB',
										dangerMode: true,
										buttons: ["No", "Yes!"],
									})
										.then((willDelete) => {
											if (willDelete) {

												vetterReq.status = reqtype;

												var replaceQstDetails = {
													rep_qb_pk: data.qb_pk,
													rep_id_marks: data.qst_marks,
													rep_id_qsttype: data.qst_type,
													req_id_module: data.qba_module_mstr.module_name,
													req_id_user: $scope.loginUser.id,
													req_id_isapproved: false,
													rep_act_qb_pk: 0,
													exampaper_fk: $scope.examPaperPk,
													exam_fk: $scope.examPk
												}

												$http.post('/api/vetter_req_for_replace_question', vetterReq).then(function (response) {
													if (response.data.message == 'success') {

														$scope.vettingLogRequestApprovedStatus();


														swal("Request submitted successfully!", {
															icon: "success",
														});

														return $http.post('/api/save_replace_qstn_history', replaceQstDetails).then(function (response) {
															if (response.data.message == "success") {
																$scope.getListofVetterRequestbyUser();
																$scope.vettingLogRequestApprovedStatus();
															}
														});

													} else if (response.data.message == 'RequestPresent') {
														swal("Request already done!");
														return false;
													} else {
														swal("Error while making request!");
													}
												});
											}
										});
								} else if (reqtype == 'QP') {
									swal({
										title: "Are you sure?",
										//text: 'you want to ' +requestType+ ' Question Id '+data.qb_id,
										text: 'Are you sure, you want to remove the child question ' + data.qb_id + ' from QP ?',
										dangerMode: true,
										buttons: ["No", "Yes!"],
									})
										.then((willDelete) => {
											if (willDelete) {

												//vetterReq.status = reqtype; // comment by shilpa
												vetterReq.status = reqtype; // added by shilpa

												var replaceQstDetails = {
													rep_qb_pk: data.qb_pk,
													rep_id_marks: data.qst_marks,
													rep_id_qsttype: data.qst_type,
													req_id_module: data.qba_module_mstr.module_name,
													req_id_user: $scope.loginUser.id,
													req_id_isapproved: false,
													rep_act_qb_pk: 0,
													exampaper_fk: $scope.examPaperPk,
													exam_fk: $scope.examPk
												}

												$http.post('/api/vetter_req_for_replace_question', vetterReq).then(function (response) {
													if (response.data.message == 'success') {
														swal({
															title: "Are you sure?",
															//text: 'you want to ' +requestType+ ' Question Id '+data.qb_id,
															text: 'Would you like to a replacement child question ' + data.qb_id + ' ?',
															dangerMode: true,
															buttons: ["No", "Yes!"],
														})
															.then((willReplace) => {
																if (willReplace) {

																	$scope.updateQstReqRemark(data, 'QP'); // added by shilpa
																	$scope.vettingLogRequestApprovedStatus();
																	$scope.requestForAddChildQuestion(data, 'C');

																	$http.post('/api/save_replace_qstn_history', replaceQstDetails).then(function (response) {
																		if (response.data.message == "success") {
																			$scope.getListofVetterRequestbyUser();
																			$scope.vettingLogRequestApprovedStatus();

																		}
																	});


																}
																else {

																	$scope.updateQstReqRemark(data, 'QP'); // added by shilpa
																	$scope.vettingLogRequestApprovedStatus();
																	swal({
																		title: "Removed from QP successfully!!",
																		text: "Removed from QP successfully!!",
																		type: "success"
																	}).then((removed) => {
																		$http.post('/api/save_replace_qstn_history', replaceQstDetails).then(function (response) {
																			if (response.data.message == "success") {
																				$scope.getListofVetterRequestbyUser();
																				$scope.vettingLogRequestApprovedStatus();
																			}
																		});
																		$scope.reloadPage();
																	});

																}
															});
													} else if (response.data.message == 'RequestPresent') {
														swal("Request already done!");
														return false;
													} else {
														swal("Error while making request!");
													}
												});

											}
										});


								} else if (reqtype == 'QB') {
									swal({
										title: "The question will be permanently deleted from Question Bank",
										//text: 'Do you want to ' +requestType+ ' Question Id '+data.qb_id,	
										text: 'Are you sure, you want to remove the child question ' + data.qb_id + ' from QB ?',
										dangerMode: true,
										buttons: ["No", "Yes!"],
									})
										.then((willDelete) => {
											if (willDelete) {

												//vetterReq.status = reqtype; // comment by shilpa
												vetterReq.status = reqtype; // added by shilpa

												var replaceQstDetails = {
													rep_qb_pk: data.qb_pk,
													rep_id_marks: data.qst_marks,
													rep_id_qsttype: data.qst_type,
													req_id_module: data.qba_module_mstr.module_name,
													req_id_user: $scope.loginUser.id,
													req_id_isapproved: false,
													rep_act_qb_pk: 0,
													exampaper_fk: $scope.examPaperPk,
													exam_fk: $scope.examPk
												}

												$http.post('/api/vetter_req_for_replace_question', vetterReq).then(function (response) {
													if (response.data.message == 'success') {

														swal({
															title: "Are you sure?",
															//text: 'you want to ' +requestType+ ' Question Id '+data.qb_id,
															text: 'Would you like to a replacement child question ' + data.qb_id + ' ?',
															dangerMode: true,
															buttons: ["No", "Yes!"],
														})
															.then((willReplace) => {
																if (willReplace) {

																	$scope.updateQstReqRemark(data, 'QB'); // added by shilpa
																	$scope.vettingLogRequestApprovedStatus();
																	$scope.requestForAddChildQuestion(data, 'C');

																	/*swal("Request submitted successfully!", {
																		icon: "success",
																	});*/

																	return $http.post('/api/save_replace_qstn_history', replaceQstDetails).then(function (response) {
																		if (response.data.message == "success") {
																			$scope.getListofVetterRequestbyUser();
																			$scope.vettingLogRequestApprovedStatus();
																		}
																	});

																} else {

																	$scope.updateQstReqRemark(data, 'QB'); // added by shilpa
																	$scope.vettingLogRequestApprovedStatus();

																	swal({
																		title: "Removed from QB successfully!!",
																		text: "Removed from QB successfully!!",
																		type: "success"
																	}).then((removed) => {
																		$http.post('/api/save_replace_qstn_history', replaceQstDetails).then(function (response) {
																			if (response.data.message == "success") {
																				$scope.getListofVetterRequestbyUser();
																				$scope.vettingLogRequestApprovedStatus();
																			}
																		});
																		$scope.reloadPage();
																	});

																}

															});

													} else if (response.data.message == 'RequestPresent') {
														swal("Request already done!");
														return false;
													} else {
														swal("Error while making request!");
													}
												});
											}
										});
								}

							} else if (reqtype == "R") {
								var replaceresponse_reqtype = "RM";
								swal({
									text: "A replacement request for this question is already raised and is pending for approval, do you want to change that request with removal request?",
									dangerMode: true,
									buttons: ["No", "Yes"],
								})
									.then((willDelete) => {
										if (willDelete) {

											vetterReq.status = replaceresponse_reqtype;

											$http.post('/api/update_vetter_req_for_replace_remove_question', vetterReq).then(function (response) {
												if (response.data.message == 'success') {
													swal("Request updated successfully!");

													var replaceQstDetails_remove = {
														rep_qb_pk: data.qb_pk,
														rep_id_marks: data.qst_marks,
														rep_id_qsttype: data.qst_type,
														req_id_module: data.qba_module_mstr.module_name,
														req_id_user: $scope.loginUser.id,
														req_id_isapproved: false,
														rep_act_qb_pk: 0,
														exampaper_fk: $scope.examPaperPk,
														exam_fk: $scope.examPk
													};

													return $http.post('/api/save_replace_qstn_history', replaceQstDetails_remove).then(function (response) {
														if (response.data.message == "success") {
															$scope.getListofVetterRequestbyUser();
															$scope.vettingLogRequestApprovedStatus();
														}
													});

												}
											});
										}
									});
							} else if (reqtype == "RM") {
								var removeresponse_reqtype = "R";

								swal({
									text: "A remove request for this question is already raised and is pending for approval, do you want to change that request with replacement request?",
									dangerMode: true,
									buttons: ["No", "Yes"],
								})
									.then((willDelete) => {
										if (willDelete) {

											vetterReq.status = removeresponse_reqtype;

											$http.post('/api/update_vetter_req_for_replace_remove_question', vetterReq).then(function (response) {
												if (response.data.message == 'success') {
													$scope.getListofVetterRequestbyUser();
													$scope.vettingLogRequestApprovedStatus();
													swal("Request updated successfully!");
													var replaceQstDetails_replace = {
														rep_qb_pk: data.qb_pk,
														rep_id_marks: data.qst_marks,
														rep_id_qsttype: data.qst_type,
														req_id_module: data.qba_module_mstr.module_name,
														req_id_user: $scope.loginUser.id,
														req_id_isapproved: false,
														rep_act_qb_pk: 0,
														exampaper_fk: $scope.examPaperPk,
														exam_fk: $scope.examPk
													};
													return $http.post('/api/save_replace_qstn_history', replaceQstDetails_replace).then(function (response) {
														if (response.data.message == "success") {

															$scope.getListofVetterRequestbyUser();
															$scope.vettingLogRequestApprovedStatus();
														}
													});

												}
											});
										}
									});
							}

						} else {
							if (checkData.status == 'RM') {
								swal("Question is removed already!", {
									icon: "warning",
								});
							} else if (checkData.status == 'R') {
								swal("Question is replaced already!", {
									icon: "warning",
								});
							} else if (checkData.status == 'QP') {
								swal("Question is removed from QP already!", {
									icon: "warning",
								});
							} else if (checkData.status == 'QB') {
								swal("Question is removed from QB already!", {
									icon: "warning",
								});
							}

						}
					});

				} else {

					if (requestType) {
						if (reqtype == 'QP') {
							swal({
								title: "Are you sure?",
								//text: 'you want to ' +requestType+ ' Question Id '+data.qb_id,
								text: 'Are you sure, you want to remove the child question ' + data.qb_id + ' from QP ?',
								dangerMode: true,
								buttons: ["No", "Yes!"],
							})
								.then((willDelete) => {
									if (willDelete) {

										//vetterReq.status = reqtype; // comment by shilpa
										vetterReq.status = reqtype; // added by shilpa

										var replaceQstDetails = {
											rep_qb_pk: data.qb_pk,
											rep_id_marks: data.qst_marks,
											rep_id_qsttype: data.qst_type,
											req_id_module: data.qba_module_mstr.module_name,
											req_id_user: $scope.loginUser.id,
											req_id_isapproved: false,
											rep_act_qb_pk: 0,
											exampaper_fk: $scope.examPaperPk,
											exam_fk: $scope.examPk
										}

										$http.post('/api/vetter_req_for_replace_question', vetterReq).then(function (response) {
											if (response.data.message == 'success') {
												swal({
													title: "Are you sure?",
													//text: 'you want to ' +requestType+ ' Question Id '+data.qb_id,
													text: 'Would you like to a replacement child question ' + data.qb_id + ' ?',
													dangerMode: true,
													buttons: ["No", "Yes!"],
												})
													.then((willReplace) => {
														if (willReplace) {

															$scope.updateQstReqRemark(data, 'QP'); // added by shilpa
															$scope.vettingLogRequestApprovedStatus();
															$scope.requestForAddChildQuestion(data, 'C');

															/*swal({
															title: "Removed from QP successfully!!",
															text: "Removed from QP successfully!!",
															type: "success"
															}).then((removed)=>{*/
															$http.post('/api/save_replace_qstn_history', replaceQstDetails).then(function (response) {
																if (response.data.message == "success") {
																	$scope.getListofVetterRequestbyUser();
																	$scope.vettingLogRequestApprovedStatus();
																}
															});
															/*$scope.reloadPage();
																});*/


														}
														else {

															$scope.updateQstReqRemark(data, 'QP'); // added by shilpa
															$scope.vettingLogRequestApprovedStatus();

															swal({
																title: "Removed from QP successfully!!",
																text: "Removed from QP successfully!!",
																type: "success"
															}).then((removed) => {
																$http.post('/api/save_replace_qstn_history', replaceQstDetails).then(function (response) {
																	if (response.data.message == "success") {
																		$scope.getListofVetterRequestbyUser();
																		$scope.vettingLogRequestApprovedStatus();
																	}
																});
																$scope.reloadPage();
															});

														}
													});
											} else if (response.data.message == 'RequestPresent') {
												swal("Request already done!");
												return false;
											} else {
												swal("Error while making request!");
											}
										});

									}
								});



						} else if (reqtype == 'QB') {

							swal({
								title: "The question will be permanently deleted from Question Bank",
								//text: 'Do you want to ' +requestType+ ' Question Id '+data.qb_id,	
								text: 'Are you sure, you want to remove the child question ' + data.qb_id + ' from QB ?',
								dangerMode: true,
								buttons: ["No", "Yes!"],
							})
								.then((willDelete) => {
									if (willDelete) {

										//vetterReq.status = reqtype; // comment by shilpa
										vetterReq.status = reqtype; // added by shilpa

										var replaceQstDetails = {
											rep_qb_pk: data.qb_pk,
											rep_id_marks: data.qst_marks,
											rep_id_qsttype: data.qst_type,
											req_id_module: data.qba_module_mstr.module_name,
											req_id_user: $scope.loginUser.id,
											req_id_isapproved: false,
											rep_act_qb_pk: 0,
											exampaper_fk: $scope.examPaperPk,
											exam_fk: $scope.examPk
										}

										$http.post('/api/vetter_req_for_replace_question', vetterReq).then(function (response) {
											if (response.data.message == 'success') {

												swal({
													title: "Are you sure?",
													//text: 'you want to ' +requestType+ ' Question Id '+data.qb_id,
													text: 'Would you like to a replacement child question ' + data.qb_id + ' ?',
													dangerMode: true,
													buttons: ["No", "Yes!"],
												})
													.then((willReplace) => {
														if (willReplace) {

															$scope.updateQstReqRemark(data, 'QB'); // added by shilpa
															$scope.vettingLogRequestApprovedStatus();
															$scope.requestForAddChildQuestion(data, 'C');

															/*swal("Request submitted successfully!", {
																icon: "success",
															});*/

															return $http.post('/api/save_replace_qstn_history', replaceQstDetails).then(function (response) {
																if (response.data.message == "success") {
																	$scope.getListofVetterRequestbyUser();
																	$scope.vettingLogRequestApprovedStatus();
																}
															});

														} else {

															$scope.updateQstReqRemark(data, 'QB'); // added by shilpa
															$scope.vettingLogRequestApprovedStatus();
															swal({
																title: "Removed from QB successfully!!",
																text: "Removed from QB successfully!!",
																type: "success"
															}).then((removed) => {
																$http.post('/api/save_replace_qstn_history', replaceQstDetails).then(function (response) {
																	if (response.data.message == "success") {
																		$scope.getListofVetterRequestbyUser();
																		$scope.vettingLogRequestApprovedStatus();
																	}
																});
																$scope.reloadPage();
															});

														}

													});

											} else if (response.data.message == 'RequestPresent') {
												swal("Request already done!");
												return false;
											} else {
												swal("Error while making request!");
											}
										});
									}
								});
						}
						else if (reqtype == 'R') { // Replace Request
							swal({
								title: "Are you sure, you want to raise a replacement request for QB ID " + data.qb_id,
								//text: 'Do you want to ' +requestType+ ' Question Id '+data.qb_id,	
								text: 'Are you sure, you want to replace the question ' + data.qb_id + ' from QB',
								dangerMode: true,
								buttons: ["No", "Yes!"],
							})
								.then((willDelete) => {
									if (willDelete) {

										vetterReq.status = reqtype;

										var replaceQstDetails = {
											rep_qb_pk: data.qb_pk,
											rep_id_marks: data.qst_marks,
											rep_id_qsttype: data.qst_type,
											req_id_module: data.qba_module_mstr.module_name,
											req_id_user: $scope.loginUser.id,
											req_id_isapproved: false,
											rep_act_qb_pk: 0,
											exampaper_fk: $scope.examPaperPk,
											exam_fk: $scope.examPk
										}

										$http.post('/api/vetter_req_for_replace_question', vetterReq).then(function (response) {
											if (response.data.message == 'success') {

												$scope.vettingLogRequestApprovedStatus();


												swal("Request submitted successfully!", {
													icon: "success",
												});

												return $http.post('/api/save_replace_qstn_history', replaceQstDetails).then(function (response) {
													if (response.data.message == "success") {
														$scope.getListofVetterRequestbyUser();
														$scope.vettingLogRequestApprovedStatus();
													}
												});

											} else if (response.data.message == 'RequestPresent') {
												swal("Request already done!");
												return false;
											} else {
												swal("Error while making request!");
											}
										});
									}
								});
						} else if (reqtype == 'RM') { //  Remove Request
							swal({
								title: "The question will be permanently deleted from the question bank. Do you want to delete ",
								//text: 'Do you want to ' +requestType+ ' Question Id '+data.qb_id,	
								text: 'Are you sure, you want to remove the  question ' + data.qb_id + ' from QB',
								dangerMode: true,
								buttons: ["No", "Yes!"],
							})
								.then((willDelete) => {
									if (willDelete) {

										vetterReq.status = reqtype;

										var replaceQstDetails = {
											rep_qb_pk: data.qb_pk,
											rep_id_marks: data.qst_marks,
											rep_id_qsttype: data.qst_type,
											req_id_module: data.qba_module_mstr.module_name,
											req_id_user: $scope.loginUser.id,
											req_id_isapproved: false,
											rep_act_qb_pk: 0,
											exampaper_fk: $scope.examPaperPk,
											exam_fk: $scope.examPk
										}

										$http.post('/api/vetter_req_for_replace_question', vetterReq).then(function (response) {
											if (response.data.message == 'success') {

												$scope.vettingLogRequestApprovedStatus();


												swal("Request submitted successfully!", {
													icon: "success",
												});

												return $http.post('/api/save_replace_qstn_history', replaceQstDetails).then(function (response) {
													if (response.data.message == "success") {
														$scope.getListofVetterRequestbyUser();
														$scope.vettingLogRequestApprovedStatus();
													}
												});

											} else if (response.data.message == 'RequestPresent') {
												swal("Request already done!");
												return false;
											} else {
												swal("Error while making request!");
											}
										});
									}
								});
						}


						/*if(confirm('Do you want to ' +requestType+ ' Question Id '+data.qb_id+ "?"))
						{ 
					
						} */
					}

				}

			});
		};

		// added by shilpa removed request by user QP or QB
		$scope.updateQstReqRemark = function (data, QPorQB) {
			var req = {
				qb_pk: data.qb_pk,
				exam_fk: $scope.examPk,
				QPorQB: QPorQB,
				qb_id: data.qb_id,
				exampaper_fk: $scope.examPaperPk,
				userName: $scope.username
			};
			$http.post('/api/update_Qst_Req_Remark', req)
				.then(function (response) {
				});
		};
		// end by shilpa


		$scope.culledqstnApprovedStatusList;
		$scope.culledQstnRequestApprovedStatus = function () {
			var reqExampaper = {
				exampaper_fk: topicParams.exampaper_pk,
				qba_module_fk: topicParams.qba_module_fk
			}
			$http.post('/api/checkvetter_publisher_request_status_culledqstnbank', reqExampaper).then(function (response) {
				if (response.data.message == "success") {
					$scope.culledqstnApprovedStatusList = response.data.obj;
				}
			});
		};

		$scope.vetterApprovedStatusList;
		$scope.vettingLogRequestApprovedStatus = function () {
			var reqExampaper = {
				exampaper_fk: topicParams.exampaper_pk,
				qba_module_fk: topicParams.qba_module_fk,
				vetter_fk: $scope.loginUser.id
			}
			$http.post('/api/checkvetter_publisher_request_status_vettinglog', reqExampaper).then(function (response) {
				if (response.data.message == "success") {
					$scope.vetterApprovedStatusList = response.data.obj;
				}
			});
		};
		$scope.culledQstnRequestApprovedStatus();
		$scope.vettingLogRequestApprovedStatus();
		function checkifRequestExist(itemList) {
			var request_approved_culledcount = 0;
			var request_approved_vettingcount = 0;

			if (itemList != null && itemList.length > 0) {
				for (var key in itemList) {
					if (itemList[key].hasOwnProperty('qst_request_status')) {
						if (itemList[key].qst_request_status != null && itemList[key].qst_request_status != "null" && itemList[key].qst_request_status != 'Replacement request approved') {
							var request_status = itemList[key].qst_request_status;
							if (request_status.indexOf('rejected') == -1) {
								request_approved_culledcount += 1;
							}

						} else {
							request_approved_culledcount;
						}
					} else if (itemList[key].hasOwnProperty('admin_status')) {
						if ((itemList[key].status != null && itemList[key].status != 'E' && itemList[key].admin_status == null && itemList[key].is_active != 'I')) {
							request_approved_vettingcount += 1;
						} else {
							request_approved_vettingcount;
						}
					}
				}
			}
			if (request_approved_culledcount !== 0) {
				return 1;
			} else {
				if (request_approved_vettingcount !== 0) {
					return 1;
				} else {
					return 0
				}
			}
		};



		$scope.vettingCompletion = function () {

			//alert('ssssssssssss')
			var parameters = {
				id: topicParams.qba_module_fk,
				examPk: $scope.examPk, examPaperPk: $scope.examPaperPk,
				off: "0", lim: "ALL"
			};
			var deferred = $q.defer();
			var transform = function (data) {
				return $.param(data);
			};

			parameters['filter'] = $scope.filter
			$http.post('/api/load_vetter_questions', parameters, {
				headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
				transformRequest: transform,
				timeout: 0
			}).then(function (response) {
				var alldata = response.data.data;

				var flag = true; // added by shilpa
				var casePassageId = []; // added by shilpa

				for (var i = 0; i < alldata.length; i++) {
					if (alldata[i].qst_pid == '0' && alldata[i].qst_type == 'CS') { // added by shilpa
						casePassageId.push(alldata[i].qb_id);
					}
				}

				for (var i = 0; i < casePassageId.length; i++) {
					var count = 0;
					for (var j = 0; j < alldata.length; j++) {

						if (alldata[j].qst_pid == casePassageId[i] && alldata[j].qst_type == 'CS') {
							count = count + 1;
						}
					}

					if (count < 2) {
						flag = false;
					}
				}
				if (flag == false && $scope.loginUser.role != 'PUB') {
					swal('Case Passage must have at least 2 child');
					return false;
				}


				var requiredParams = {
					user_id: $scope.loginUser.id,
					exam_id: topicParams.exam_id,
					mod_id: topicParams.qba_module_fk,
					exampaper_fk: topicParams.exampaper_pk
				};
				var deferred = $q.defer();
				var transform = function (data) {
					return $.param(data);
				};

				if ($scope.loginUser.role == 'PUB') {
					//alert('kkkkkkkkk')
					if (toPubSFQuest.length > 0) {
						$http.post('/api/insert_quest_to_publish', toPubSFQuest).then(function (response) {
							contentUpdateInRepo();
						});
					}
					else
						contentUpdateInRepo();
				}

				return $http.post('/api/get_pending_vetter_moduleIds', requiredParams, {
					headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
					transformRequest: transform,
					timeout: 0
				}).then(function (response) {
					$scope.pendingModuleIds = response.data.obj;
					if ($scope.loginUser.role == 'VET') {
						swal('Vetting done');
						$state.go('vetterPublisherHomePage');
					}

					deferred.resolve(response);
				}).catch(function (error) {
					deferred.reject(error);
				});
			});
		}

		$scope.vettingDone = function (datas) {
			var parameters = { exam_pk: topicParams.exam_id };

			$http.post('/api/get_exam_details', parameters)
				.then(function (response) {

					var examdata = response.data.obj;
					var exam_total_qstn = examdata[0].total_qts;
					var exam_total_marks = examdata[0].total_marks;
					var totalMCQCSQQstn = parseInt($scope.total_qstn + $scope.caseTotalChildQuestions);
					var totalMCQCSQMarks = parseInt($scope.total_marks + $scope.caseTotalMarks);

					if (exam_total_marks > totalMCQCSQMarks || exam_total_qstn > totalMCQCSQQstn) {
						swal("Selected questions are less than required", {
							icon: "warning",
						});
						return false;
					}
				});
			var data = [];
			var qst_request_status = [];
			var transform = function (data) {
				return $.param(data);
			};
			var parameters = {
				id: topicParams.qba_module_fk,
				examPk: $scope.examPk, examPaperPk: $scope.examPaperPk,
				off: 1, lim: "ALL"
			};
			parameters['filter'] = $scope.filter
			$http.post('/api/load_vetter_questions', parameters, {
				headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
				transformRequest: transform,
				timeout: 0
			}).then(function (response) {
				var data1 = response.data.data
				for (var i = 0; i < data1.length; i++) {
					qst_request_status.push(data1[i].qst_request_status);

				}
				if (qst_request_status.length > 0) {
					qst_request_status = qst_request_status.join();
				}

				if (qst_request_status.indexOf('Replacement request approved') != -1) {
					swal("Request is in Approved State, Please complete Request Replace / Deletion procedure before submit.");
					return false;
				}

				if (qst_request_status.indexOf('Deletion request approved') != -1) {
					swal("Replace/Removal request are in pending state. Kindly complete Replace/Removal request before submit.");
					return false;
				}
				else {


					$scope.culledQstnRequestApprovedStatus();
					$scope.vettingLogRequestApprovedStatus();

					if (checkifRequestExist($scope.vetterApprovedStatusList) != 0) {
						swal("Replace/Removal request are in pending state. Kindly complete Replace/Removal request before submit.");
						return false;
					}

					if ($scope.loginUser.role == 'PUB') {
						let req = {
							qb_pks: checkQuest,
							exampaper_fk: $window.localStorage.getItem("exampaper_pk"),
							exam_fk: $window.localStorage.getItem("exam_id")

						};


						// added by shilpa
						$http.post('/api/getAllCount', req)
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



								// end by shilpa

								var flag = true; // added by shilpa
								var casePassageId = []; // added by shilpa 
								for (var i = 0; i < toPubQuest.length; i++) {
									if (toPubQuest[i].qst_pid == '0' && toPubQuest[i].qst_type == 'CS') { // added by shilpa
										casePassageId.push(toPubQuest[i].qb_id);
									}
								}
								for (var i = 0; i < toPubSFQuest.length; i++) {
									if (toPubSFQuest[i].qst_pid == '0' && toPubSFQuest[i].qst_type == 'CS') { // added by shilpa
										casePassageId.push(toPubSFQuest[i].qb_id);
									}
								}
								//added by shilpa
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
								if (toPubQuest != null && toPubQuest.length == 0 && toPubSFQuest && toPubSFQuest.length == 0) {
									swal('Please select questions to publish');
									return;
								}

								var countChanges = 0;
								var arr_ele = document.getElementsByClassName("editable");
								var l_length = 0;
								if (arr_ele != null && arr_ele.length > 0) {
									l_length = arr_ele.length;

									for (var i = 0; i < l_length; i++) {
										var state = $scope.editorStates[i];
										if (state) {
											if (state.editor.plugins) {
												var lite = state.editor.plugins.lite;
												if (lite) {
													/*if ($scope.editorStates[i].editor.name.includes('comment')) {
														continue
													}*/
													countChanges = lite.findPlugin(state.editor).countChanges();
												}
											}
										}

										if (countChanges > 0) {
											break;
										}
									}
								}

								if (countChanges > 0) {
									swal('Please Accept All/Reject All changes before submit.');
									return;
								}

								var reqExampaper = {
									exampaper_fk: topicParams.exampaper_pk,
									exam_fk: $scope.examPk
								}

								$http.post('/api/is_addquestion_left', reqExampaper).then(function (response) {

									if (response.data.message == "success") {
										$scope.is_add_question_left = response.data.obj[0].count;

										if ($scope.is_add_question_left > 0) {
											swal('You have to frame additional questions as there is a shortfall. You Cannot submit')
										}
										else {

											swal({
												text: "Are you sure you want to Publish?",
												dangerMode: true,
												buttons: ["No", "Yes!"],
											})
												.then((willDelete) => {
													if (willDelete) {
														$scope.vettingCompletion();
													}
												});


										}
									}
								});
							});
					} // publisher end

					if ($scope.loginUser.role != 'PUB') {
						let request_list = $scope.getRequestList;
						var replaceRequestStatus = true;
						var status = ''
						for (var i = 0; i < request_list.length; i++) {
							if (request_list[i].admin_status == '' && request_list[i].status == 'R') {
								replaceRequestStatus = false;
								status = 'R'
							}
							if (request_list[i].admin_status == '' && request_list[i].status == 'RM') {
								replaceRequestStatus = false;
								status = 'RM'
							}
						}
						if (replaceRequestStatus == false) {
							if (status == 'R') {
								swal("Replace request are in pending state. Kindly complete Replace request before submit.");
							}
							else if (status == 'RM') {
								swal("Remove request are in pending state. Kindly complete Remove request before submit.");
							}
							return false;
						}
						var data_for_count = {
							module_id: $window.localStorage.getItem("qba_module_fk"),
							e_pk: $window.localStorage.getItem("exampaper_pk"),
							e_id: $window.localStorage.getItem("exam_id")
						}
						$http.post('/api/get_count', data_for_count)
							.then(function (response) {


								$scope.act_count = response.data.obj[0][0].count;
								$scope.act_total_marks = response.data.obj[0][0].total_marks;
								//obj1 -> exam master data
								$scope.total_marks = response.data.obj1[0][0].total_marks;
								$scope.total_qst = response.data.obj1[0][0].total_qts;
								let total_case_questions = response.data.obj1[0][0].case_question;
								let total_child_marks = response.data.obj1[0][0].case_marks;



								if ($scope.act_count < $scope.total_qst && $scope.act_total_marks < $scope.total_marks) {
									swal({
										text: "Total Questions are less than required, kindly add a MCQ or a CSQ Question",
										buttons: ["Cancel", "Ok!"],
										showCancelButton: true,
									})
										.then((csq) => {

										});

								}

								var reqExampaper = {
									exampaper_fk: topicParams.exampaper_pk,
									exam_fk: $scope.examPk
								}

								$http.post('/api/is_addquestion_left', reqExampaper).then(function (response) {

									if (response.data.message == "success") {
										$scope.is_add_question_left = response.data.obj[0].count;

										if ($scope.is_add_question_left > 0) {
											swal({
												title: " Are you sure you want to Submit?",    //commend added by dipika
												text: "You have to frame additional questions as there is a shortfall!",
												dangerMode: true,
												buttons: ["No", "Yes!"],
											})
												.then((willDelete) => {
													if (willDelete) {
														$scope.vettingCompletion();
													}
												});

										}
										else {

											swal({
												text: "Are you sure you want to Submit?",
												dangerMode: true,
												buttons: ["No", "Yes!"],
											})
												.then((willDelete) => {
													if (willDelete) {
														$scope.vettingCompletion();
													}
												});

										}
									}
								});
							});
					}
				}
			})
		};

		var updatePubStatus = function () {

			var requiredParams = {
				checkedQuests: checkQuest,
				checkedqbids: checkqbid,
				exampaper_fk: topicParams.exampaper_pk,
				mod_id: topicParams.qba_module_fk,
				exam_fk: $scope.examPk
			};


			$http.post('/api/update_qb_active', requiredParams).then(function (response) {
			})

			$http.post('/api/update_pub_status', requiredParams).then(function (response) {
				$state.go('vetterPublisherHomePage');

			})
		};

		$scope.publishingDone = function () {
			var requiredParams = {
				user_id: $scope.loginUser.id,
				exam_id: topicParams.exam_id,
				mod_id: topicParams.qba_module_fk,
				exampaper_fk: topicParams.exampaper_pk
			};
			var deferred = $q.defer();
			var transform = function (data) {
				return $.param(data);
			};
			$http.post('/api/get_pending_publisher_moduleIds', requiredParams, {
				headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
				transformRequest: transform,
				timeout: 0
			}).then(function (response) {
				$scope.pendingPublisherIds = response.data.obj;
				swal('Publishing done');
				updatePubStatus();
				$state.go('vetterPublisherHomePage');
				deferred.resolve(response);
			}).catch(function (error) {
				deferred.reject(error);
			});
		};

		$scope.printPage = function (divID) {

			// //var divElements = document.getElementById(divID).innerHTML;
			// //alert("bb")
			// var parameters ={
			// 	examPaperPk : window.localStorage.getItem("exampaper_pk"),
			// 	examPk : window.localStorage.getItem("exam_id"),
			// 	id : window.localStorage.getItem("qba_module_fk"),

			// }
			// $http.post('/api/load_query_for_print', parameters)
			//    .then(function (response) {
			// 	   $scope.repoQuestions = response.data.data
			// 	//$state.go('PrintPage');
			// 	$window.open('#!/PrintPage','_blank')

			//    });

			// //window.print();

			$window.open('#!/PrintPage', '_blank')

		}

		$scope.printPagepublisher = function (divID) {


			$window.open('#!/PrintPagePublisher', '_blank')

		}

		$scope.addShortfallQuestinon = function (records) {
			window.localStorage.removeItem("csq_passage_data");
			repositoryService.setAddShortFallQuestion(records);
			repositoryService.setSelectedCourse(records.qba_course_master);
			repositoryService.setSelectedSubject(records.qba_subject_master);
			repositoryService.setSelectedModule(records.qba_module_mstr);
			repositoryService.setSelectedTopic(records.qba_topic_master);

			var addquestion_cname = records.qba_course_master.qba_course_name;
			var addquestion_ccode = records.qba_course_master.qba_course_code;
			var addquestion_cfk = records.qba_course_master.qba_course_fk;

			var addquestion_sname = records.qba_subject_master.subject_name;
			var addquestion_scode = records.qba_subject_master.qba_subject_code;
			var addquestion_sfk = records.qba_subject_master.qba_subject_fk;

			var addquestion_mname = records.qba_module_mstr.module_name;
			var addquestion_mfk = records.qba_module_mstr.qba_module_fk;

			var addquestion_tname = records.qba_topic_master.topic_name;
			var addquestion_tcode = records.qba_topic_master.qba_topic_code;
			var addquestion_tfk = records.qba_topic_master.qba_topic_pk;

			var qst_marks = records.qst_marks;
			var qst_neg_marks = records.qst_neg_marks;
			var csq_qb_id = records.qb_id;
			var csq_qb_pk = records.qb_pk;
			var qst_type = records.qst_type;

			window.localStorage.setItem("course_code_vetter_csq", addquestion_ccode);
			window.localStorage.setItem("course_id_vetter_csq", addquestion_cfk);
			window.localStorage.setItem("course_name_vetter_csq", addquestion_cname);
			window.localStorage.setItem("module_name_vetter_csq", addquestion_mname);
			window.localStorage.setItem("module_id_vetter_csq", addquestion_mfk);

			window.localStorage.setItem("subject_name_vetter_csq", addquestion_sname);
			window.localStorage.setItem("subject_id_vetter_csq", addquestion_sfk);
			window.localStorage.setItem("subject_code_vetter_csq", addquestion_scode);
			window.localStorage.setItem("topic_name_vetter_csq", addquestion_tname);
			window.localStorage.setItem("topic_code_vetter_csq", addquestion_tcode);
			window.localStorage.setItem("topic_id_vetter_csq", addquestion_tfk);
			window.localStorage.setItem("shortfall_csq_parent_qb_id", csq_qb_id);
			window.localStorage.setItem("shortfall_csq_parent_qb_pk", csq_qb_pk);
			window.localStorage.setItem("shortfall_question_qst_type", qst_type);


			if (records.qst_type == 'M') {
				$state.go('addmcq');
			} else {
				$state.go('add_shortfall_csq_parent');
			}
		}


		$scope.addShortfallMCQuestinon = function (records) {
			repositoryService.setAddShortFallQuestion(records);
			repositoryService.setSelectedCourse(records.qba_course_master);
			repositoryService.setSelectedSubject(records.qba_subject_master);
			repositoryService.setSelectedModule(records.qba_module_mstr);
			repositoryService.setSelectedTopic(records.qba_topic_master);

			var addquestion_cname = records.qba_course_master.qba_course_name;
			var addquestion_ccode = records.qba_course_master.qba_course_code;
			var addquestion_cfk = records.qba_course_master.qba_course_fk;

			var addquestion_sname = records.qba_subject_master.subject_name;
			var addquestion_scode = records.qba_subject_master.qba_subject_code;
			var addquestion_sfk = records.qba_subject_master.qba_subject_fk;

			var addquestion_mname = records.qba_module_mstr.module_name;
			var addquestion_mfk = records.qba_module_mstr.qba_module_fk;

			var addquestion_tname = records.qba_topic_master.topic_name;
			var addquestion_tcode = records.qba_topic_master.qba_topic_code;
			var addquestion_tfk = records.qba_topic_master.qba_topic_pk;

			var qst_marks = records.qst_marks;
			var qst_neg_marks = records.qst_neg_marks;
			var qb_id = records.qb_id;
			var qb_pk = records.qb_pk;
			var qst_type = records.qst_type;




			window.localStorage.setItem('course_name_vetter', addquestion_cname);

			window.localStorage.setItem('course_code_vetter', addquestion_ccode);
			window.localStorage.setItem('module_name_vetter', addquestion_mname);
			window.localStorage.setItem('topic_name_vetter', addquestion_tname);
			window.localStorage.setItem('topic_code_vetter', addquestion_tcode);
			window.localStorage.setItem('subject_name_vetter', addquestion_sname);
			window.localStorage.setItem('subject_code_vetter', addquestion_scode);
			window.localStorage.setItem('qst_marks_vetter', qst_marks);
			window.localStorage.setItem('qst_neg_marks_vetter', qst_neg_marks);

			window.localStorage.setItem('c_id_vetter', addquestion_cfk);
			window.localStorage.setItem('s_id_vetter', addquestion_sfk);
			window.localStorage.setItem('m_id_vetter', addquestion_mfk);
			window.localStorage.setItem('t_id_vetter', addquestion_tfk);
			window.localStorage.setItem("shortfall_csq_parent_qb_pk", qb_pk);
			window.localStorage.setItem("shortfall_csq_parent_qb_id", qb_id);
			window.localStorage.setItem("shortfall_question_qst_type", qst_type);





			if (records.qst_type == 'M') {
				$state.go('add_shortfall_mcq');
			} else {
				$state.go('add_shortfall_csq_parent');
			}
		}
		var contentUpdateInRepo = function () {


			if (toPubQuest.length == 0 && toPubSFQuest.length == 0) {
				swal('Please select questions to publish');
			}
			else {


				if (toPubQuest.length != 0) {
					var arr = toPubQuest
					for (var z = 0; z < toPubSFQuest.length; z++) {
						if (toPubSFQuest[z].qst_type == 'CS')
							arr.push(toPubSFQuest[z])
					}

					$http.post('/api/updateSummaryCount', arr).then(function (response) {
					});
					var pub = []
					var pubSF = []
					var parameters = {
						id: topicParams.qba_module_fk,
						examPk: $scope.examPk, examPaperPk: $scope.examPaperPk,
						off: 0, lim: 'ALL'
					};
					parameters['filter'] = $scope.filter
					$http.post('/api/load_vetter_questions', parameters).then(function (response) {
						let alldata = response.data.data;
						for (var i = 0; i < alldata.length; i++) {
							if (alldata[i].copied_from_repo == 'N') {
								for (var j = 0; j < toPubSFQuest.length; j++) {
									if (toPubSFQuest[j].qb_id != alldata[i].qb_id) {
										continue
									}
									else {
										j == toPubSFQuest.length + 1
									}
								}
								if (j == toPubSFQuest.length)
									pubSF.push(alldata[i])
							}
							pub.push(alldata[i]);
						}
						$http.post('/api/insert_quest_to_publish', pubSF).then(function (response) {
						});

						$http.post('/api/update_quest_to_publish', pub).then(function (response) {
							$http.post('/api/remove_alt_to_publish', pub).then(function (response) {
								$http.post('/api/insert_alt_to_publish', pub).then(function (response) {
									var requiredParams = {
										checkedQuests: checkQuest,
										exampaper_fk: topicParams.exampaper_pk,
										mod_id: topicParams.qba_module_fk,
										exam_fk: $scope.examPk
									};
									$http.post('/api/update_alter', requiredParams).then(function (response) {
									});
									// added by shilpa		


									swal('Exam Published.');
									updatePubStatus();

								});
							});
						});
					})
				}
			}
		};

		function EditorState(editor) {
			this.editor = editor;
			this.checkedUsers = {};
		}

		$scope.alternativeslogTabClicked = function (qb_id, qb_pk) {

			$(".logtab").attr("style", "display: none;");
			$("a").attr("aria-expanded", "false");
			var the_string = 'alternativeslog' + qb_id;
			var req = {
				qb_id: qb_id,
				exam_fk: topicParams.exam_id,
				exampaper_fk: topicParams.exampaper_pk
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

		$scope.loadEditor = function (id, focus) {

			if (id == "editor1") {

				var editor = CKEDITOR.replace(id, {
					height: "80",
					filebrowserBrowseUrl: '../ckeditor/ckeditor4.5/plugins/filemanager/browser/default/browser.html?Connector=/browser/browse',
					filebrowserImageUploadUrl: '/uploader/upload?Type=Image',
					customConfig: "../ckeditor-addMcq-conf.js",
					removePlugins: 'contextmenu,tabletools'
				});

			} else if (id == "editorRemarks" || id == "editorReference" || id == "editorCalculations") {
				var editor = CKEDITOR.replace(id, {
					height: "80",
					filebrowserBrowseUrl: '../ckeditor/ckeditor4.5/plugins/filemanager/browser/default/browser.html?Connector=/browser/browse',
					filebrowserImageUploadUrl: '/uploader/upload?Type=Image',
					customConfig: "../" + $scope.ckEditorConfigFile,
					removePlugins: 'contextmenu,tabletools'
				});
			}
			else {
				var editor = CKEDITOR.inline(id, {
					height: "400",
					filebrowserBrowseUrl: '../ckeditor/ckeditor4.5/plugins/filemanager/browser/default/browser.html?Connector=/browser/browse',
					filebrowserImageUploadUrl: '/uploader/upload?Type=Image',
					removePlugins: 'floatingspace,maximize,resize,specialchar, contextmenu,tabletools',
					customConfig: "../ckeditor-addMcq-conf.js",
					sharedSpaces: {
						top: 'top',
						bottom: 'bottom'
					},
					removeMenuItem: 'lite-acceptone,lite-rejectone'
				});
			}

			$scope.editorStates[id] = new EditorState(editor);
		};

		angular.element(document).ready(function () {
            /*$scope.selectedCourse = repositoryService.getSelectedCourse();
            $scope.selectedSubject = repositoryService.getSelectedSubject();
            $scope.selectedTopic = repositoryService.getSelectedTopic();     */

			// $scope.loadEditor('editor1',true);

			/*   $timeout( function(){  
				   for(var i = 0;i<$scope.newChildQuestion.alternatives.length;i++) {
					   var editorId = 'editor'+$scope.newChildQuestion.alternatives[i].editorId; 
					   $scope.loadEditor(editorId,true);
				   }    
			   },50);*/
			if ($scope.loginUser.role == 'VET') {
				CKEDITOR.config.removeButtons = 'lite-acceptall,lite-acceptone,lite-rejectall,lite-rejectone'; //works????
				CKEDITOR.config.removePlugins = 'scayt,menubutton,contextmenu';
			}

		});

	}

	angular.module('qbAuthoringToolApp')
		.controller('vetterReviewQuestionController', vetterReviewQuestionController);

	vetterReviewQuestionController.$inject = ['$scope', '$state', '$filter', '$window', 'userService', 'repositoryService', '$http', '$q', '$timeout', '$sce', '$location', '$anchorScroll'];

})();