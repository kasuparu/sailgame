"use strict";
var fs = require('fs');

var config;

if (fs.existsSync('./config/config.js')) {
	config = require('./config/config');
} else {
	config = require('./config/config.js.dist');
}

global.config = config;

var express = require('express');
var winston = require('winston');
var http = require('http');
var path = require('path');
var requireJs = require('requirejs');
var requireJsConfig = {
    baseUrl: path.join(__dirname, '/static/src'),
    nodeRequire: require
};

requireJs.config(requireJsConfig);

var loglevel = 'development' === process.env.env ? 'info' : (config.loglevel || 'info');

var logger = new (winston.Logger)({
    transports: [
        new (winston.transports.Console)({
            level: loglevel
        })
    ]
});

var app = express();

// all environments
app.set('port', config.web.node.port);
app.set('host', config.web.node.host);
app.use(express.logger('dev'));

// development only
if ('development' === app.get('env')) {
    app.use(express.errorHandler());
	
}

app.use('/phaser', express.static(__dirname + '/phaser'));
app.use('/', express.static(__dirname + '/static'));

var server = http.createServer(app);

server.listen(app.get('port'), app.get('host'), function() {
    logger.info(
        'Express server listening on %s:%s, %s mode',
        app.get('host'),
        app.get('port'),
        app.get('env')
    );
});

var nodeUniqueId = '{'+app.get('host')+':'+app.get('port')+'}';

var io = require('socket.io').listen(server);

var ships = [];

io.sockets.on('connection', function (socket) {

	socket.on('joinGame', function (data) {
		var ship = new Object();
		ship.id = socket.id;
		ships.push(ship);
		console.log('joinOk: ' + socket.id);
		
		socket.emit('joinOk', {ships: ships}); // TODO: tell about existing players
		
		socket.broadcast.emit('playerListChange', {ships: ships});
    });
	
	socket.on('controlsSend', function (dataObj) {
		//console.log('controlsSend: ' + JSON.stringify(dataObj));
		// TODO Apply controls
		socket.emit('controlsReceive', dataObj);
		socket.broadcast.emit('controlsReceive', dataObj);
	});
	
	socket.on('bodySend', function (dataObj) {
		// TODO Apply body
		socket.broadcast.emit('bodyReceive', dataObj);
	});
	
	socket.on('clientPong', function (startTime) {
		var pingMs = (Date.now() - startTime) / 2;
		//console.log('pingMs: ' + pingMs + 'ms');
		
		socket.get('averagePingMs', function (err, averagePingMs) {
			var averagePingMs = null !== averagePingMs ? averagePingMs : pingMs;
			var newAveragePingMs = (pingMs + 3 * averagePingMs) / 4;
			
			socket.set('averagePingMs', newAveragePingMs, function () {
				//console.log('averagePingMs: ' + averagePingMs + '->' + newAveragePingMs);
			});
		});
		
	});
	
	var timer = setInterval(function() {
		socket.get('averagePingMs', function (err, averagePingMs) {
			socket.emit('clientPing', {startTime: Date.now(), averagePingMs: averagePingMs});
		});
	}, 2000);
	
	socket.on('disconnect', function() {        
		var len = 0;

		for (var i = 0, len = ships.length; i < len; ++i) {
			var ship = ships[i];

			if (ship.id == socket.id) {
				console.log('disconnect: ' + ship.id);
				ships.splice(i, 1);
				break;
			}
		}
		
		socket.broadcast.emit('playerListChange', {ships: ships});
	});

});

//requireJs([
//    'socket.io',
//    'PhaserWrapper',
//    'BasicGame'
//], function (io, Phaser, BasicGame) {
//
//    console.log('requireJs callback');
//
//    //	Create your Phaser game and inject it into the game div.
//    //	We did it in a window.onload event, but you can do it anywhere (requireJS load, anonymous function, jQuery dom ready, - whatever floats your boat)
//    //	We're using a game size of 1024 x 768 here, but you can use whatever you feel makes sense for your game of course.
//    var game = new Phaser.Game(1024, 768, Phaser.AUTO, 'game');
//
//    //	Add the States your game has.
//    //	You don't have to do this in the html, it could be done in your Boot state too, but for simplicity I'll keep it here.
//    game.state.add('Boot', BasicGame.Boot);
//    game.state.add('Preloader', BasicGame.Preloader);
//    game.state.add('MainMenu', BasicGame.MainMenu);
//    game.state.add('Game', BasicGame.Game);
//
//    //	Now start the Boot state.
//    game.state.start('Boot');
//
//});
