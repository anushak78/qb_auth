function f() {
	//var username =  getURLParameter('username');
	//var userid =  getURLParameter('userid');
	//var users = [{name: "Vetter1", id : 18}, {name: "Vetter2", id : 15}, {name : "Publisher", id : 21}],

	//var users = [{name: username, id:userid}],
	//html = '',
	var version = (location.search.match(/(\d\.\d)/) || ["4.5"])[0],
		ckeditorConfigUrl = "../ckeditor-addmcq-conf.js";

	var oldId;
	var NewId;
	var editorIds = ['editor1', 'editor2', 'editor3', 'editor4', 'editor5'];
	var editorProp = ['question', 'option1', 'option2', 'option3', 'option4']

	/*for (var i = 0, len = users.length; i < len; ++i) {
		var user = users[i];
		var name = "user-" + i;
		var h = '<input type="checkbox" class="user-cb" id="' + name + '" name="' + name + '" data-userid="' + user.id + '" /><label for="'+ name + '">' + user.name + '</label>';
		html += h;
	}*/

	//document.getElementById("filters").innerHTML = html;
	//$(".ckeditor-version-name").html(CKEDITOR.version);
	/*$("#editor-tabs").tabs({
		activate: onTabChanged
	});*/
	CKEDITOR.timestamp = 0x8999;
	/*
	var arr_questions = [
		{id:'Q1',question:'Generally who adopts the Comparative Method for estimating the value of abc? ',option1:'Goodwill',option2:'Valuation of specialized buildings ',option3:'Buildings erected to serve specific purpose such as bars ',option4:'Land with building because the property is generally sold as a single piece',note:'[Note: The net profit is capitalized by multiplying it by the YP for certain number of years or in perpetuity and therefore, the option  at (d) is the appropriate answer]',remarks:''},
		{id:'Q2',question:'Encumbrance factor refers to the -----  because it is the earning capacity of the building that determines the value of the land',option1:'Location - nearness to schools ',option2:'The value of land is obtained by subtracting the latter from the capitalised value  ',option3:'Restaurants etc',option4:'Useful life of the structure or in perpetuity gives the capitalized value ',note:'[Note: If invested at specified rate of interest for certain number of years and hence option (c) is correct answer to the question]',remarks:''},
		{id:'Q3',question:'Risks of malicious damage to computerised systems can be from disgruntled employees who wish to disrupt the services or from individuals with malafide intentions to use technology for perpetrating fraud for financial gains?',option1:'Access to the system and a particular application can be controlled through a mechanism of passwords',option2:'The accounting controls are introduced in the application software',option3:'Review of operations to establish if there is a compliance to the established policies, standards & procedures ',option4:'All this requires a proper change management policy for software',note:'[Note:  The quality of banking services and the efficiency of banking operations have become increasingly dependent upon the application of information technology]',remarks:''},
	];*/

	/*var hashmap = {};
	hashmap['Q1'] = arr_questions[0];
	hashmap['Q2'] = arr_questions[1];
	hashmap['Q3'] = arr_questions[2];*/

	function EditorState(editor) {
		this.editor = editor;
		this.checkedUsers = {};
	}

	var editorStates = {},
		editorId = null,
		$sidebar = $("#sidebar");
	/*$select = $sidebar.find("#users");
	$versions = $sidebar.find("#ckeditor-version-select"),
	_options = $versions[0].options;
	
jQuery.each(["4.2","4.3","4.4", "4.5"], function(i, v) {
	_options[i] = new Option("Version " + v, v);
});
*/
	//$versions.val(version).change(function(e) {
	//var v = $(e.currentTarget).val();
	//location.href = location.href.replace(/\?.*/,"") + '?' + v;
	//});




	(function () {

		/*var id = getURLParameter('id');
		var username =  getURLParameter('username');
		var obj = hashmap[id]
		var question;
		//var obj = arr_questions[1];
		
		for(var i = 0 ; i < editorIds.length; i++)
		{
			var editorId = editorIds[i];
			var prop = editorProp[i];
			question =  obj[prop];
			$('#QHead').text(id + ":");
			if (typeof(Storage) !== "undefined") {
							
				if(localStorage.getItem(id + editorId) != null)
				{
					question =  localStorage.getItem(id + editorId);				// Retrieve
				}
				
				$('#'+editorId).val(question);
				
			} else {
				document.getElementById("result").innerHTML = "Sorry, your browser does not support Web Storage...";
			}

		}*/



		//$('#editor2').val(obj.option1);
		//$('#editor3').val(obj.option2);
		//$('#editor4').val(obj.option3);
		//$('#editor5').val(obj.option4);


		/*$(document).on("focus","textarea", function(){
			alert("textarea focus");
			$(this).blur();
		});*/

		/*loadEditor('editor1', true);
		loadEditor('editor2', true);
		loadEditor('editor3', true);
		loadEditor('editor4', true);
		loadEditor('editor5', true);*/


		/*var select = $select[0];
		$.each(users, function(i, user) {
			var option  = new Option(user.name, user.id);
			select.options[i] = option;
		});
		$select.change(onUserChanged);*/

		//var id = ui.newPanel.find("textarea").attr("id");
		//var oldId = ui.oldPanel && ui.oldPanel.find("textarea").attr("id");
		//onEditorSelected('editor2', 'editor2');
	})();
	/*
	$.each(editorStates, function(i, state) {
		// example of listening to an LITE plugin event. The events are dispatched through the editor
		state.editor.on(LITE.Events.SHOW_HIDE, function(event) {
			var show = event.data.show;
			//$sidebar.find("#show-status").text(show ? "Shown" : "Hidden").toggleClass("on", show);
	
		});
	
		// called each time a new instance of an LITE tracker is created
		state.editor.on(LITE.Events.INIT, function(event) {
			var lite = event.data.lite;
			lite.toggleShow(true);
			//lite.acceptAll(false);
			//lite.commands = [/*LITE.Commands.TOGGLE_TRACKING, LITE.Commands.TOGGLE_SHOW/*, LITE.Commands.ACCEPT_ALL, LITE.Commands.REJECT_ALL, LITE.Commands.ACCEPT_ONE, LITE.Commands.REJECT_ONE ];
		});
	});*/

	/* backup
	$.each(editorStates, function(i, state) {
			// example of listening to an LITE plugin event. The events are dispatched through the editor
			state.editor.on(LITE.Events.SHOW_HIDE, function(event) {
				var show = event.data.show;
				
		
			});
		
			// called each time a new instance of an LITE tracker is created
			state.editor.on(LITE.Events.INIT, function(event) {
				var lite = event.data.lite;
				lite.toggleShow(true);
			
				
			});
		});
	*/
	/*$("#test-data").click(function(event) {
		event.preventDefault();
		var state = editorStates[editorId];
		if (state) {
			state.editor.setData('<p>Aug 11 2013</p><p><span class="ice-ins ice-cts-1" data-cid="2" data-time="1376218678796" data-userid="15" data-username="David" >Added by David</span>, then <span class="ice-ins ice-cts-2" data-cid="11" data-time="1376218687062" data-userid="18" data-username="Roger" >added by Roger</span>, subsequently <span class="ice-del ice-cts-3" data-cid="3" data-time="1376243289388" data-userid="21" data-username="Syd" >deleted by Syd</span>, then <span class="ice-ins ice-cts-3" data-cid="19" data-time="1376218693458" data-userid="21" data-username="Syd" >added by Syd</span> using the <b>Track Changes CKEditor Plugin</b>.</p><p>Aug 11 2000</p><p><span class="ice-ins ice-cts-1" data-cid="21" data-time="966006011847" data-userid="15" data-username="David" >Added by David</span>, then <span class="ice-ins ice-cts-2" data-cid="111" data-time="966006011847" data-userid="18" data-username="Roger" >added by Roger</span>, subsequently <span class="ice-del ice-cts-3" data-cid="113" data-time="966006011847" data-userid="21" data-username="Syd" >deleted by Syd</span>, then <span class="ice-ins ice-cts-3" data-cid="119" data-time="966006011847" data-userid="21" data-username="Syd" >added by Syd</span> using the <b>Track Changes CKEditor Plugin</b>.</p>');
		}
		return false;
	});*/

	/*$("#reload-editor").click(function(event) {
		event.preventDefault();
		var state = editorStates[editorId];
		if (state) {
			state.editor.destroy();
			loadEditor(editorId);
		}
		return false;
	});*/

	/*
	$("#load-q1").click(function(event) {
		
		var fileToLoad = document.getElementById("fileToLoad").files[0];
 
	    var fileReader = new FileReader();
	    fileReader.onload = function(fileLoadedEvent) 
	    {
	        var textFromFileLoaded = fileLoadedEvent.target.result;
	
			var state = editorStates[editorId];
			
			if (state) {
				state.editor.setData(textFromFileLoaded);
			}
	        
	    };
	    fileReader.readAsText(fileToLoad, "UTF-8");
	});*/
	/*if(username == 'Publisher') 
		$("#userAccount").text('publisher@gmail.com');
	else
		$("#userAccount").text('vetter@gmail.com');

	$("#back").click(function(event) {
		if(username == 'Publisher')			
			location.href="examination-papername-publisher.html?username="+username+"&userid="+userid;
		else
			location.href="examination-papername-vetter.html?username="+username+"&userid="+userid;
	});*/




	function getContent(data) {

	}



	function destroyClickedElement(event) {
		document.body.removeChild(event.target);
	}

	/*function onTabChanged(event, ui) {
		var state = editorStates[editorId];
		
		var id = ui.newPanel.find("textarea").attr("id");
		var oldId = ui.oldPanel && ui.oldPanel.find("textarea").attr("id");
		onEditorSelected(id, oldId);
		
		
	}
	function getURLParameter(sParam)
		{
			var sPageURL = window.location.search.substring(1);
			var sURLVariables = sPageURL.split('&');
			
			for(var i=0;i<sURLVariables.length;i++)
			{
				var sParameterName = sURLVariables[i].split('=');
				if(sParameterName[0] == sParam) 
				{
					return sParameterName[1];
				}
			}
			
		}*/
	/*function loadEditor(id, focus) {
		
		var state = editorStates[id];
		if (state) {
			$('#'+id).val("This editor was <strong>reloaded</strong>");
		}
		
		if(id=="editor1")
		{
			var editor = CKEDITOR.replace( id , { 
				height: "80" ,
				filebrowserBrowseUrl: '../ckeditor/ckeditor4.5/plugins/filemanager/browser/default/browser.html?Connector=/browser/browse',
				filebrowserImageUploadUrl: '/uploader/upload?Type=Image',
				customConfig: ckeditorConfigUrl
			});
		}
		else{
			var editor = CKEDITOR.inline( id , { 
				height: "400" ,
				filebrowserBrowseUrl: '../ckeditor/ckeditor4.5/plugins/filemanager/browser/default/browser.html?Connector=/browser/browse',
				filebrowserImageUploadUrl: '/uploader/upload?Type=Image',
				removePlugins: 'floatingspace,maximize,resize',
				customConfig: ckeditorConfigUrl,
				sharedSpaces: {
				 top: 'top',
				 bottom: 'bottom'
			   }
			});
		}*/


	//function onConfigLoaded(e) {
	//var conf = e.editor.config;
	//var lt = conf.lite = conf.lite || {};
	//if (location.href.indexOf("debug") > 0) {
	//	lt.includeType = "debug";
	//} 

	/*if(getCheckedUsers() != "Publisher")
	{
			conf.removePlugins = 'liststyle,tabletools,scayt,menubutton,contextmenu';		
	}
	else{
		conf.addPlugins = 'menubutton,contextmenu';		
	}*/

	//}

	//editor.on('configLoaded', onConfigLoaded);
	/*
	if (focus) {
		editor.on(LITE.Events.INIT, function(event) {
			onEditorSelected(id);
		});

		editor.on("loaded", function(e) {
			onEditorSelected(id);
		});
	}*/

	//editorStates[id] = new EditorState(editor);
	//}

	function onEditorSelected(id, oldId) {
		var state = editorStates[oldId];
		/*if (state) {
			var checks = getCheckedUsers();
			var c = {};
			checks.each(function(i,e) {
				c[e] = true;
			});
			state.checkedUsers = c;
		}*/

		state = editorStates[id];
		if (!state) {
			return;
		}

		editorId = id;
		//selectUser(state.userId||users[0].id, true);
		//setCheckedUsers(state.checkedUsers);
		state.editor.focus();
	}

	function onUserChanged(event) {
		var target = event.currentTarget;
		var id = $(target).val();
		selectUser(id);
		var state = editorStates[editorId];
		state && state.editor.focus();

	}

	/*function selectUser(id, inUI) {
		if (inUI) {
			return $select.val(id).change();
		}
		var i;
		for (i = 0; i < users.length; ++i) {
			if (users[i].id == id) {
				break;
			}
		}
		var user = users[i];
		var state = editorStates[editorId];
		if (user && state) {
			state.userId = id;
			var lite = state.editor.plugins.lite;
			lite && lite.findPlugin(state.editor).setUserInfo(user);
		}
	}*/
	/*
	function getCheckedUsers() {
		var checks = $("#filters input:checked");
		var checked = checks.map(function(i,e) {
			return $(e).attr("data-userid");
		});
		return checked;
	}
	
	function getCheckedUsers() {
		var checks = $("#filters input:checked");
		var checked = checks.map(function(i,e) {
			return $(e).attr("name");
		});
		return checked;
	}
	
	function setCheckedUsers(checked) {
		var $checks = $("#filters input[type=checkbox]");
		checked = checked || {};
		$checks.each(function(i,e) {
			var $e = $(e);
			var id = $e.attr("data-userid");
			$e.prop("checked", id in checked);
		});
	}
	*/




}
if (typeof (jQuery) == "undefined" || typeof (CKEDITOR) == "undefined") {
	alert("To run this demo, please install ckeditor in a folder called ckeditor next to the demo file, then install the LITE plugin as described in the documentation. Thanks.");
}
else {
	//$(window).load(f);
	f();
}


(function () {
	/* Begin fixes for IE */
	Function.prototype.bind = Function.prototype.bind || function () {
		"use strict";
		var fn = this, args = Array.prototype.slice.call(arguments),
			object = args.shift();
		return function () {
			return fn.apply(object,
				args.concat(Array.prototype.slice.call(arguments)));
		};
	};

	/* Mozilla fix for MSIE indexOf */
	Array.prototype.indexOf = Array.prototype.indexOf || function (searchElement /*, fromIndex */) {
		"use strict";
		if (this == null) {
			throw new TypeError();
		}
		var t = Object(this);
		var len = t.length >>> 0;
		if (len === 0) {
			return -1;
		}
		var n = 0;
		if (arguments.length > 1) {
			n = Number(arguments[1]);
			if (n != n) { // shortcut for verifying if it's NaN
				n = 0;
			} else if (n != 0 && n != Infinity && n != -Infinity) {
				n = (n > 0 || -1) * Math.floo1r(Math.abs(n));
			}
		}
		if (n >= len) {
			return -1;
		}
		var k = n >= 0 ? n : Math.max(len - Math.abs(n), 0);
		for (; k < len; k++) {
			if (k in t && t[k] === searchElement) {
				return k;
			}
		}
		return -1;
	};

	/* Mozilla fix for MSIE lastIndexOf */
	Array.prototype.lastIndexOf = Array.prototype.indexOf || function (searchElement /*, fromIndex */) {
		"use strict";
		if (this == null) {
			throw new TypeError();
		}
		var t = Object(this);
		var len = t.length >>> 0;
		while (--len >= 0) {
			if (len in t && t[len] === searchElement) {
				return len;
			}
		}
		return -1;
	};
	/* End fixes fo IE */

})();