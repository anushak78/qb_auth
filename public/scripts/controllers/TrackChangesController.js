(function () {
	'use strict';


	function TrackChangesController($scope, $filter, $window, userService, repositoryService, $q, $http, examService, $state, $sce, $timeout) {

		let acceptOrReject = window.localStorage.getItem('AcRjQ');
		let finaldata = [];
		$scope.examPaperPk = window.localStorage.getItem('exampaper_pk');
		$scope.qba_module_fk = window.localStorage.getItem('qba_module_fk');
		$scope.examPk = window.localStorage.getItem('exam_id'); //  
		$scope.trackQuestions = [];
		var id = JSON.parse(window.localStorage.getItem('user')); // added by shilpa
		var role = JSON.parse(window.localStorage.getItem('role')); // added by shilpa
		var name = JSON.parse(window.localStorage.getItem('username')); // added by shilpa
		$scope.editorStates = {};
		$scope.username = JSON.parse(sessionStorage.getItem('username'));  // Dipika HSS//

		$scope.loginUser = {
			id: id,
			name: name,
			role: role
		};

		$scope.ckEditorFlag = false;
		let parameters = {
			id: $scope.qba_module_fk,
			examPk: $scope.examPk,
			examPaperPk: $scope.examPaperPk
		};


		$http.post('/api/loadchanged_questions', parameters).then(function (response) {

			$scope.trackQuestions = response.data.data;
			$scope.safeApply();

			if (response.data.code == 1) {
				swal("All questions accepted successfully", {
					icon: "success",
				}).then(function () {
					$window.close();
				});



			}
		});


		$scope.isNormalInteger = function (str) {
			return /^[+]?([0-9]+(?:[\.][0-9]*)?|\.[0-9]+)(?:[eE][+-]?[0-9]+)?$/.test(str);
		};


		$scope.onload = function () {
			$timeout(function () {

				if (!$scope.ckEditorFlag) {
					$scope.ckEditorFlag = true;

					$scope.watchRepoQuestionChangeQuestions();
				}
			}, 1);
		};


		$scope.watchRepoQuestionChangeQuestions = function () {

			var watch = $scope.$watch(function () {
				return $scope.trackQuestions;
			}, function () {

				$scope.$evalAsync(function () {

					$scope.CKEditTrack();

				});
			});

		};
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

		$scope.CKEditTrack = function () {
			var defer = $q.defer();
			//var promises = [];
			CKEDITOR.disableAutoInline = true;
			var arr_ele = document.getElementsByClassName("editable");
				(arr_ele.length);
			var config = {
				filebrowserBrowseUrl: '../ckeditor/ckeditor4.5/plugins/filemanager/browser/default/browser.html?Connector=/browser/browse',
				filebrowserImageUploadUrl: '/uploader/upload?Type=Image',
				customConfig: "../ckeditor-conf.js",
				/* on: {
					 instanceReady: function(evt) {}
				 }*/
			};
			(async function loop() {
				for (var i = 0; i < arr_ele.length; i++) {
					var editor = CKEDITOR.inline(arr_ele[i], config);
					$scope.editorStates[i] = new EditorState(editor);
					let state = $scope.editorStates[i];
					await new Promise(resolve => editor.on(LITE.Events.INIT, function (event) {

						if (state) {
							let lite = state.editor.plugins.lite;
							let countChanges = lite.findPlugin(state.editor).countChanges();
							(async function loop() {
								await new Promise(resolve1 => {
									if (countChanges > 0) {
										(async function loop() {
											await new Promise(resolve2 => {

												resolve1();
												if (acceptOrReject == 'Accept') {
													lite && lite.findPlugin(state.editor).acceptAll();
												} else if (acceptOrReject == 'Reject') {
													lite && lite.findPlugin(state.editor).rejectAll();
												}


												//alert(JSON.stringify($scope.trackQuestions[i]));
												state.editor.focus();

												// $scope.safeApply();


											})
										})().then(function () {
											resolve2();

										});


									} else {
										resolve();
									}
								});
							})().then(function () {

								resolve();
							});

						}

					}));
				}
			})().then(function () {
				//alert(JSON.stringify($scope.trackQuestions));
				swal("Question updated successfully", {
					icon: "success",
				}).then(function () {
					$scope.windowclose();
				});

				//loadData();

			});


			
			//return defer.promise;

		};


		$scope.editorStates = {};
		function EditorState(editor) {
			this.editor = editor;
			this.checkedUsers = {};
		};




		$scope.windowclose = function () {
			//$timeout(function(){
			let change_data = { data: $scope.trackQuestions };
			$http.post('/api/updateTrack_Questions', change_data).then(function (response) {

				$window.close();
				$window.onunload = refreshParent;

			});
			// },3000);	
        	/*$timeout(function(){
        		let change_data ={data:$scope.trackQuestions};
        	$scope.updateData(change_data);
        	},2000);*/

		}

		$scope.renderAsHtml = function (val) {
			return $sce.trustAsHtml(val);
		};
		function refreshParent() {
			window.opener.location.reload();
		}


		angular.element(window).bind('load', function () {

		});

	}



	angular
		.module('qbAuthoringToolApp')
		.controller('TrackChangesController', TrackChangesController);


	TrackChangesController.$inject = ['$scope', '$filter', '$window', 'userService',
		'repositoryService', '$q', '$http', 'examService', '$state', '$sce', '$timeout'];

})();

