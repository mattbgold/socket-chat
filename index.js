var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var path = require('path');
var macros = require('./macros');
var port = process.argv[2] || '3000';

app.use(express.static(__dirname + '/static'));

app.get('/chat', function(req, res) {
    res.sendFile(__dirname + '/index.html');
});

var welcomeMsg = {
    msg: '<small>Welcome to Matt\'s chat, built with Nodejs and Socket.IO! <br/> - Right click and drag to shift the 3D perspective. <br/> - Press shift and scroll to zoom.<br/> - type /help to see a list of commands <br/> <audio controls=""  loop="">   <source src="https://dl.dropboxusercontent.com/u/3965423/L.A.%20Noire-%20Official%20Soundtrack%20-%20Main%20Theme.mp3" type="audio/mpeg"> </audio> Inject HTML for fun!',
    col: '#9933FF'
};

var messages = [];

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
		else if (msg.indexOf('/reset') === 0) {
		    messages = [];
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