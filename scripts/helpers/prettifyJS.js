// http://jsbeautifier.org/
// http://www.brightonclick.com/a/display.php?r=1452115&treqn=960539940&runauction=1&crr=4a0e6a6eef3077c7d968,wDY00TN2QjZiBjZx0jMgJkNhw2ZwV2cCZTIwFmaqsWYg1mc2FGcqFmQ2EiQ2ESR3ECdwBHb93d53db4c22daf9e9d75&cbrandom=0.5528219654889386&cbtitle=EnterVideo%20-%20Cloud%20CDN&cbiframe=0&cbWidth=1203&cbHeight=321&cbdescription=&cbkeywords=&cbref=
// http://www.brightonclick.com/a/display.php?r=1452115
// http://entervideo.net/watch/d695b4fb02190d8

var text = '';
var re = {
	variable: /([$\w]+)/,
	string: /"[^"\\]*(?:\\.[^"\\]*)*"/,
	SIAF: /\(function\s*\(([^)]*)\)\s*\{([\s\S]*)\}\)\(([$\w\s,]*?)\)/,
	word: (e, flags='g') => new RegExp('\\b' + e + '\\b', flags),
	join: (regexes, flags) => new RegExp(regexes.map(e => e.source || e).join(''), flags)
};
var util = {
	typeOf: value => {
		if (!value) return 'var';
		if (value[0] == '[') return 'arr';
		if (value[0] == '{') return 'obj';
		try {
			value = JSON.parse(value);
			if (typeof value == 'boolean') return 'flag';
			if (typeof value == 'number') return 'num';
			if (typeof value == 'string') return 'str';
		} catch(e) {
			var match = value.match.bind(value);
			var has = value.includes.bind(value);
			var starts = value.startsWith.bind(value);
			var ends = value.endsWith.bind(value);

			if (match(/[=!]=/)) return 'flag';
			if (has('Math.random')) return 'rand';
			if (match(/set(Timeout|Interval)\(/)) return 'timer';
			if (has('function')) return 'func';

			if (m = match(/document\.getElementsByTagName\(['"](\w+)['"]\)\[0\](\.parent)?/)) {
				return (m[1] == 'script' && m[2]) ? 'scriptLocation' : m[1];
			}
			if (m = match(/createElement\(['"](\w+)['"]\)$/)) return m[1];
			if (has('Element(') || has('element')) return 'tag';
			if (has('Event(') || has('event')) return 'event';
			if (has('window.open') || ends('contentDocument')) return 'window';
			if (starts('parseInt')) return 'num';
			if (starts('typeof')) return 'type';
			if (ends('.length')) return 'len';
			if (!match(/['"]/) && match(/-\s*0x?0?/)) return 'num';
			if (!match(/['"]/) && has('-')) return 'delta';
			if (match(re.join([/\.split\(/, re.string, /\)$/]))) return 'strs';
			if (match(re.join([/\.split\(/, re.string, /\)\[\d+\]/]))) return 'str';
			if (match(re.join([re.string, /\s*\+\s*/]))) return 'str';
			if (match(re.join([/\s*\+\s*/, re.string]))) return 'str';
			if (match(/^new Date\([^)]*\)$/)) return 'date';
			if (match(/^\s*in\s*/)) return 'key';
			if (match(/\d+; ?\w+ ?[<>=]+ ?\w+(?:\.length)? ?; ?\w+ ?[-+=]* ?(?:\d+)? ?\)/)) return 'i';
			if (ends('.target')) return 'target';
			if (ends('.contentDocument')) return 'frame_document';

			if (value == 'this') return '_this';
			if (value && value.trim() && !isNaN(value)) return 'num';

		}
		console.log(value);
		return 'var';
	},
	mostCommonElement: arr => {
		var counts = {};
		var max = 0, el;
		arr.forEach(e => {
			counts[e] = (counts[e] || 0) + 1;
			if (counts[e] > max) {
				max = counts[e], el = e;
			}
		})
		return {element: el, count: max};
	},
	findCommonPrefix: names => {
		var averageLength = (names.map(e => e.length).reduce((a, b) => a + b, 0) / names.length) >> 0;
		var x;
		names = names.filter(e => e.startsWith('_0x'));
		for (var i = averageLength - 1; i > 1; i--) {
			x = util.mostCommonElement(names.map(e => e.slice(0, i)));
			if (x.count > names.length * 0.9 || x.count >= names.length - 1) {
				return x.element;
			}
		}
	}
};

var app = {
	parseEncodedValues: function () {
		// text = text.replace(/"[^"]*"/g, value => {
		// 	//console.log('found ' + value);
		// 	try {
		// 		return JSON.stringify(value);
		// 	} catch (e) {
		// 		return value;
		// 	}
		// });
	},
	restoreSIAFVariableNames: function () {
		text.replace(re.SIAF, (match, uglyArguments, body, prettyArguments) => {
			console.log('found siaf - ugly: ' + uglyArguments + ', pretty: ' + prettyArguments);
			uglyArguments = uglyArguments.split(/\s*,\s*/);
			prettyArguments = prettyArguments.split(/\s*,\s*/);
			uglyArguments.forEach((e, i) => {
				text = text.replace(re.word(e), prettyArguments[i]);
			});
		})
	},
	arrays: {},
	findStringArrays: function () {
		//'"", ""'
		var additionalStrings = re.join(['(?:', /\s*,\s*/, re.string, ')*']);
		var regex = re.join([re.variable, '\\s*=\\s*(\\[', re.string, additionalStrings, '\\])'], 'g');

	  	 /([$\w]*)\s*=\s*(\["[^"\\]*(?:\\.[^"\\]*)*"(?:\s*,\s*"[^"\\]*(?:\\.[^"\\]*)*")*\])/;
	    //(varname)  =   ( ["_________string_______"(?:\s*,\s*"_________string_______")* ])
	    console.log('finding arrays');
		text.replace(/"", ""/g, '\\"", "\\"').replace(regex, (_, name, value, ...args) => {
			console.log([_, name, value, ...args]);
			try {
				console.log('array ' + name);
				this.arrays[name] = JSON.parse(value);
			} catch(e) {
				console.warn('failed to parse array: ' + value);
			}
		});
	},
	addNewLines: function() {
		text = text.replace(/([;}]+|\{)/g, '$1\n').replace(/\}/g, '\n}');
	},
	replaceArrayValues: function () {
		Object.entries(this.arrays).forEach(([name, array]) => {
			var regex = new RegExp('\\b' + name + '\\[(\\d+)\\]', 'g');
			text = text.replace(regex, (_, key) => '"' + array[key] + '"');
		});
	},
	preferDotSyntax: function () {
		var regex = /([$\w]+)\["([$\w]+)"\]/g;
		for (var i = 0; i < 10 && text.match(regex); i++) {
			text = text.replace(regex, (_, object, prop) => object + '.' + prop);
		}
		regex = /\["([$\w]+)"\]\(/g;
		text = text.replace(regex, (_, name) => '.' + name + '(');
	},
	variables: {},
	counts: {},
	updateVariableNames: function(){
		[ /var ([$\w]+)(?: *= *)?(.*[^,;])?[,;]?\n/g,
		  /^\s*([$\w]+) *= *(.*[^,;])[,;]?$/gm
		].forEach((regex, i) => {
			text.replace(regex, (match, name, value) => {
				i == 1 ? console.log('yay', value): '';
				if (!this.variables[name] || this.variables[name].type == 'var')
					this.variables[name] = {name: name, value: value, type: util.typeOf(value)};
			});
		});

		var save = (type) => (match, name) => this.variables[name] = {name: name, type: type};

		text.replace(/function\s*(?:[$\w]*)\s*\(([^)]+)\)/gm, (match, arguments) => {
			arguments = arguments.split(',').map(e => e.trim());
			console.log('arguments', arguments)
			arguments.forEach(name => {
				if (!this.variables[name] || this.variables[name].type == 'var')
					this.variables[name] = {name: name, type: 'arg'};
			})
		})
		// text.replace(/var ([$\w]+)(?: *= *)\{\s\n/g, save('obj'));
		// text.replace(/var ([$\w]+)(?: *= *)function/g, save('func'));
		text.replace(/function\s*([$\w]+)/g, save('func'));

		var prefix = util.findCommonPrefix(Object.keys(this.variables));
		var prefixed = Object.values(this.variables).filter(e => e.name.startsWith(prefix));
		console.log(Object.values(this.variables).filter(e => !e.name.startsWith(prefix)));

		this.counts = prefixed.reduce((c, {type}) => {
			c[type] = (c[type] || 0) + 1;
			return c;
		}, {});

		var i = {};
		prefixed.forEach(({name, type}) => {
			i[type] = (i[type] || 0) + 1;
			text = text.replace(re.word(name), name => {
				return type + (this.counts[type] == 1 ? '' : '_' + i[type]);
			});
		});

	},
	main: function (_text) {
		text = _text;
		this.parseEncodedValues();
		this.restoreSIAFVariableNames();
		this.findStringArrays();
		this.addNewLines();
		this.replaceArrayValues();
		this.preferDotSyntax();
		this.updateVariableNames();
		//console.log(text);
	}
};

// app.main(_text);