function f() {

	var version = (location.search.match(/(\d\.\d)/) || ["4.5"])[0],
		ckeditorConfigUrl = "../ckeditor-addMcq-conf.js";
	var oldId;
	var NewId;
	var editorIds = ['editor1', 'editor2', 'editor3', 'editor4', 'editor5'];
	var editorProp = ['question', 'option1', 'option2', 'option3', 'option4']

	CKEDITOR.timestamp = 0x8999;

	function EditorState(editor) {
		this.editor = editor;
		this.checkedUsers = {};
	}

	var editorStates = {},
		editorId = null,
		$sidebar = $("#sidebar");

	(function () {


	})();

	function getContent(data) {

	}

	function destroyClickedElement(event) {
		document.body.removeChild(event.target);
	}

	function onEditorSelected(id, oldId) {
		var state = editorStates[oldId];
		state = editorStates[id];
		if (!state) {
			return;
		}
		editorId = id;
		state.editor.focus();
	}

	function onUserChanged(event) {
		var target = event.currentTarget;
		var id = $(target).val();
		selectUser(id);
		var state = editorStates[editorId];
		state && state.editor.focus();

	}

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