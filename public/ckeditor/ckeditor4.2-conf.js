CKEDITOR.editorConfig = function (config) {
	var lite = config.lite = config.lite || {};
	config.extraPlugins = 'lite';
	//config.extraPlugins = 'lite,eqneditor';
	config.removePlugins = 'pagebreak,specialchar';
	config.entities_processNumerical = true;
	config.entities_processNumerical = 'force';
	//	lite.includes  = ["js/rangy/rangy-core.js", "js/ice.js", "js/dom.js", "js/selection.js", "js/bookmark.js","lite-interface.js"];
	lite.isTracking = true;
	lite.userStyles = {
		"3": 7,
		"4": 6,
		"5": 5,
		"6": 4,
		"7": 3,
		"8": 2,
		"9": 1,
		"10": 7,
		"11": 6,
		"12": 5,
		"13": 4,
		"14": 3,
		"15": 2,
		"16": 1,
		"17": 7,
		"18": 6,
		"19": 5,
		"20": 4,
		"21": 3,
		"22": 2,
		"23": 1,
		"24": 7,
		"25": 6,
		"26": 5,
		"27": 4,
		"28": 3,
		"29": 2,
		"30": 1,
		"31": 7,
		"32": 6,
		"33": 5,
		"34": 4,
		"35": 3,
		"36": 2,
		"37": 1,
		"38": 7,
		"39": 6,
		"40": 5,
		"41": 4,
		"42": 3,
		"43": 2,
		"44": 1,
		"45": 7,
		"46": 6,
		"47": 5,
		"48": 4,
		"49": 3,
		"50": 2,
		"51": 1,
		"52": 7,
		"53": 6,
		"54": 5,
		"55": 4,
		"56": 3,
		"57": 2,
		"58": 1,
		"59": 7,
		"60": 6,
		"61": 5,
		"62": 4,
		"63": 3,
		"64": 2,
		"65": 1,
		"66": 7,
		"67": 6,
		"68": 5,
		"69": 4,
		"70": 3,
		"71": 2,
		"72": 1,
		"73": 7,
		"74": 6,
		"75": 5,
		"76": 4,
		"77": 3,
		"78": 2,
		"79": 1,
		"80": 7,
		"81": 6,
		"82": 5,
		"83": 4,
		"84": 3,
		"85": 2,
		"86": 1,
		"87": 7,
		"88": 6,
		"89": 5,
		"90": 4,
		"91": 3,
		"92": 2,
		"93": 1,
		"94": 7,
		"95": 6,
		"96": 5,
		"97": 4,
		"98": 3,
		"99": 2,
		"100": 1,

	};
	// these are the default tooltip values. If you want to use this default configuration, just set lite.tooltips = true;
	lite.tooltips = {
		show: true,
		path: "js/opentip-adapter.js",
		classPath: "OpentipAdapter",
		cssPath: "css/opentip.css",
		delay: 500
	};
	//	lite.commands = [/*LITE.Commands.TOGGLE_TRACKING, */LITE.Commands.TOGGLE_SHOW/*, LITE.Commands.ACCEPT_ALL, LITE.Commands.REJECT_ALL, LITE.Commands.ACCEPT_ONE, LITE.Commands.REJECT_ONE */];
	config.enterMode = CKEDITOR.ENTER_BR;
	config.autoParagraph = false;
	config.title = false;
};
CKEDITOR.on('dialogDefinition', function (ev) {
	// Take the dialog window name and its definition from the event data.
	var dialogName = ev.data.name;
	var dialogDefinition = ev.data.definition;

	if (dialogName == 'image') {
		dialogDefinition.removeContents('Link');
		dialogDefinition.removeContents('advanced');
	}
});