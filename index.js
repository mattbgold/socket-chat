var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var port = process.argv[2] || '3000';

app.get('/chat', function(req, res) {
    res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket) {
    console.log('a user connected');
    //TODO: emit user connected

    socket.on('disconnect', function() {
        console.log('user disconnected');
        //TODO: emit user disconnected
    });

    socket.on('chat message', function(msg) {
        console.log('message: ' + msg);
        io.emit('chat message', msg);
    });
});

http.listen(parseInt(port), function() {
    console.log('listening on *:' + port);
});