// macros.js
// =========
module.exports = {
	'/private': {
		desc: 'send a message just to yourself',
		usg: '/private example message',
		fn: function(msg) {
			return msg;
		}
	},
	'/reset': {
		desc: 'erase chat history',
		usg: '/reset',
		fn: function(msg) {
			return '[chat history has been reset]';
		}
	},
	'/mp3': {
		desc: 'plays a given mp3 file',
		usg: '/mp3 http://myfile.mp3',
		fn: function(msg) {
			return '<audio autoplay controls><source src="' + msg + '" type="audio/mpeg"></audio>';
		}
	},
	'/img': {
		desc: 'embeds a given image',
		usg: '/img http://myimage.gif',
		fn: function(msg) {
			return '<marquee direction="right"><img src="' + msg + '"/></marquee>';
		}
	},
	'/troll': {
		desc: 'provide an annoying image!',
		usg: '/troll http://myimage.gif',
		fn: function(msg) {
			var id = Math.random();
			return '<img id="trolld" src="' + msg + '" style="position: fixed; top: 40%; left: 40%;" /><script>$(function(){ setTimeout(function(){$("#trolld").fadeOut("slow", function(){$(this).remove();});}, 5000); });</script>';
		}
	},
	'/script': {
		desc: 'runs a given script',
		usg: '/script alert("Hello World");',
		fn: function(msg) {
			return '<script>$(function(){ ' + msg + '});</script>';
		}
	},
	'/pokemon': {
		desc: 'Gotta catch \'em all!',
		usg: '/pokemon',
		fn: function(msg) {
			return '<iframe src="http://weplay.io" width="600" height="300" scrolling="no"></iframe><audio autoplay controls><source src="https://dl.dropboxusercontent.com/u/3965423/Pokemon%20-%20Theme%20Song.mp3" type="audio/mpeg"></source></audio>';
		}
	},
	'/help': {
		desc: 'shows help and all custom macros',
		usg: '/help',
		fn: function() {
			var str = '<table style="font-size:14px; font-family: arial;">';
			for (var n in module.exports) {
				str += '<tr><td style="padding-right: 20px;">' + n + '</td><td style="padding-right:20px;">' + module.exports[n].desc + '</td><td>' + module.exports[n].usg + '</td></tr>';
			}
			str += '</table>';
			return str;
		}
	},
	'/macro': {
		desc: 'add a new macro that takes 0-9 args',
		usg: '/macro /big &lt;h1&gt;{0}&lt;/h1&gt;',
		fn: function(inp) {
			var parts = splitWithTail(inp.trim(), ' ', 1);
			if (parts[0] === '/private' || parts[0] === '/mp3' || parts[0] === '/img' || parts[0] === '/reset' || parts[0] === '/script' || parts[0] === '/macro' || parts[0] === '/help')
				return '[failed to create macro: name taken by system command]';
			
			var w = module.exports[parts[0]] ? 'updated' : 'added new';

			var argCt = 0;
			var exampleArgs = ' ';

			for (var i = 0; i < 9; i++) {
				if (parts[1].trim().indexOf('{' + i + '}') === -1) {
					break;
				}
				argCt++;
				exampleArgs += 'arg' + i + ' ';
			}

			module.exports[parts[0]] = {
				desc: 'custom macro',
				usg: parts[0] + exampleArgs,
				fn: function(argstr) {
					var args = [argstr.trim()];
					if (argCt > 0)
						args = splitWithTail(argstr.trim(), ' ', argCt - 1);
					
					return parts[1].trim().format(args);
				}
			};

			return '[' + w + ' macro: ' + parts[0] + ']';
		}
	}
};

function splitWithTail(str, delim, count) {
    var parts = str.split(delim);
    var tail = parts.slice(count).join(delim);
    var result = parts.slice(0, count);
    result.push(tail);
    return result;
}

String.prototype.format = function(args) {
	return this.replace(/{(\d+)}/g, function(match, number) {
		return typeof args[number] != 'undefined' ? args[number] : match;
	});
};
