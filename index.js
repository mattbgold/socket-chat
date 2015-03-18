var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var path = require('path');

var port = process.argv[2] || '3000';

var initCol = '#9933FF';
var initMsgs = [{msg: 'Welcome to Matt\'s chat, built with Nodejs and Socket.IO! Right click and drag to shift the 3D perspective. Press shift and scroll to zoom.', col: initCol}, {msg: 'This chat is anonymous and the latest 10 posts are always visible.', col: initCol}, {msg: '<audio controls="" autoplay="" loop="">   <source src="https://dl.dropboxusercontent.com/u/3965423/L.A.%20Noire-%20Official%20Soundtrack%20-%20Main%20Theme.mp3" type="audio/mpeg"> </audio> Inject HTML for fun!', col: initCol}];

var messages = JSON.parse(JSON.stringify(initMsgs));

var macros = {
   '/private': {desc: 'send a message just to yourself', fn: null},
   '/reset': {desc: 'erase chat history', fn: function() {
    messages = JSON.parse(JSON.stringify(initMsgs));
    return '[chat history has been reset]';
}}, '/mp3': {desc: 'plays a given mp3 file', fn: function(msg) {
    return '<audio autoplay controls><source src="'+msg+'" type="audio/mpeg"></audio>';
}}, '/img': {desc: 'embeds a given image', fn: function(msg) {
    return '<marquee direction="right"><img src="'+msg+'"/></marquee>';
}}, '/troll': {desc: 'provide an annoying image!', fn: function(msg) {
    var id = Math.random();
    return '<img id="trolld" src="'+msg+'" style="position: fixed; top: 40%; left: 40%;" /><script>$(function(){ setTimeout(function(){$("#trolld").fadeOut("slow", function(){$(this).remove();});}, 5000); });</script>';
}}, '/script': {desc: 'runs a given script', fn: function(msg) {
    return '<script>$(function(){ '+msg+'});</script>';
}}, '/style': {desc: 'applies given css rules', fn: function(msg) {
    return '<style>'+msg+'</style>';
}}, '/macros': {desc: 'shows all macro descriptions', fn: function() {
    var str = '<table style="font-size:14px; font-family: arial;">';
    for(var n in macros) {
      str+='<tr><td style="padding-right: 20px;">' + n + '</td><td>'+macros[n].desc+'</td></tr>';
    }
    str+='</table>';
    return str;
}}, '/macro': {desc: 'add a new macro', fn: function(inp){
    var parts = splitWithTail(inp.trim(), ' ', 1);
    macros[parts[0]] = { desc: 'custom', fn: function(argstr) {
        var args = argstr.trim().split(' ');
        return parts[1].trim().format(args);
    }};

    return '[added new macro: '+parts[0]+']';
}}};

if (!String.prototype.format) {
  String.prototype.format = function(args) {
    return this.replace(/{(\d+)}/g, function(match, number) { 
      return typeof args[number] != 'undefined'
        ? args[number]
        : match
      ;
    });
  };
}

function splitWithTail(str,delim,count){
  var parts = str.split(delim);
  var tail = parts.slice(count).join(delim);
  var result = parts.slice(0,count);
  result.push(tail);
  return result;
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
        if(msg.charAt(0) === '/') {
            var macroName = msg;
            if(msg.indexOf(' ') !== -1) {
                macroName = msg.substring(0, msg.indexOf(' '));
            }
            var macroInput = msg.substring(msg.indexOf(' '));
            if(macroName == '/private') {
                socket.emit('chat message', macroInput, col);
                return false;
            }
            else if(macros[macroName] !== undefined) {
                msg = macros[macroName].fn(msg.substring(msg.indexOf(' ')));
            }
        }
        io.emit('chat message', msg, col);
        messages.push({msg: msg, col: col});
    });

    socket.on('connected', function(col) {
        io.emit('connected', col);
    });

    socket.emit('load', messages.slice(messages.length-10,messages.length));
});

http.listen(parseInt(port), function() {
    //console.log('listening on *:' + port);
});
