var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var path = require('path');

var port = process.argv[2] || '3000';

var initCol = '#9933FF';
var welcomeMsg = [{
    msg: '<small>Welcome to Matt\'s chat, built with Nodejs and Socket.IO! <br/> - Right click and drag to shift the 3D perspective. <br/> - Press shift and scroll to zoom.<br/> - type /help to see a list of commands <br/> <audio controls=""  loop="">   <source src="https://dl.dropboxusercontent.com/u/3965423/L.A.%20Noire-%20Official%20Soundtrack%20-%20Main%20Theme.mp3" type="audio/mpeg"> </audio> Inject HTML for fun!',
    col: initCol
}];

var initMsgs = [{
    msg: '[reset]',
    col: initCol
}];

var messages = JSON.parse(JSON.stringify(initMsgs));

var macros = {
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
            messages = JSON.parse(JSON.stringify(initMsgs));
            return '[chat history has been reset] ' + msg;
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
            return '<iframe src="http://weplay.io" width="600" height="300" scrolling="no"></iframe><audio autoplay controls><source src="https://dl.dropboxusercontent.com/u/3965423/Pokemon%20-%20Theme%20Song.mp3" type="audio/mpeg"></source></audio>' + msg;
        }
    },
    '/help': {
        desc: 'shows help and all custom macros',
        usg: '/help',
        fn: function() {
            var str = '<table style="font-size:14px; font-family: arial;">';
            for (var n in macros) {
                str += '<tr><td style="padding-right: 20px;">' + n + '</td><td style="padding-right:20px;">' + macros[n].desc + '</td><td>' + macros[n].usg + '</td></tr>';
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
            
            var w = macros[parts[0]] ? 'updated' : 'added new';

            var argCt = 0;
            var exampleArgs = ' ';

            for (var i = 0; i < 9; i++) {
                if (parts[1].trim().indexOf('{' + i + '}') === -1) {
                    break;
                }
                argCt++;
                exampleArgs += 'arg' + i + ' ';
            }

            macros[parts[0]] = {
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

if (!String.prototype.format) {
    String.prototype.format = function(args) {
        return this.replace(/{(\d+)}/g, function(match, number) {
            return typeof args[number] != 'undefined' ? args[number] : match;
        });
    };
}

function splitWithTail(str, delim, count) {
    var parts = str.split(delim);
    var tail = parts.slice(count).join(delim);
    var result = parts.slice(0, count);
    result.push(tail);
    return result;
}

function resolveMacros(msg) {
    if (msg.charAt(0) === '/') {
        var macroName = msg;
        if (msg.indexOf(' ') !== -1) {
            macroName = msg.substring(0, msg.indexOf(' '));
        }
        var macroInput = msg.substring(msg.indexOf(' ')).trim();

        if (macros[macroName] !== undefined) {
            if (macroInput !== msg) {
                macroInput = resolveMacros(macroInput);
            }
            msg = macros[macroName].fn(macroInput);
        }
    }
    return msg;
}

app.use(express.static(__dirname + '/static'));

app.get('/chat', function(req, res) {
    res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket) {
    //console.log('a user connected');
    socket.on('disconnect', function() {
        //console.log('user disconnected');
        //TODO: emit user disconnected
    });

    socket.on('chat message', function(msg, col) {
        //console.log('message: ' + msg);
        var p = false;
        if (msg.indexOf('/private') === 0) {
            p = true;
        }
        msg = resolveMacros(msg);
        if (p) {
            socket.emit('chat message', msg, col);
        } else {
            io.emit('chat message', msg, col);
            messages.push({
                msg: msg,
                col: col
            });
        }
    });

    socket.on('connected', function(col) {
        socket.broadcast.emit('connected', col);
    });

    socket.emit('load', messages.slice(messages.length - 9, messages.length).concat(welcomeMsg));
});

http.listen(parseInt(port), function() {
    //console.log('listening on *:' + port);
});