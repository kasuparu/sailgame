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
    nodeRequire: require,
    map: {
        '*': {
            'Phaser': 'PhaserWrapper'
        }
    }
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

var io = require('socket.io').listen(server);
io.set('log level', 1);

requireJs([
    /*'socket.io',*/
    'Phaser',
    'BasicGameServer'
], function (/*io, */Phaser, BasicGameServer) {

    //	Create your Phaser game and inject it into the game div.
    //	We did it in a window.onload event, but you can do it anywhere (requireJS load, anonymous function, jQuery dom ready, - whatever floats your boat)
    //	We're using a game size of 1024 x 768 here, but you can use whatever you feel makes sense for your game of course.
    var game = new Phaser.Game(1024, 768, Phaser.HEADLESS, 'game');

    //	Add the States your game has.
    //	You don't have to do this in the html, it could be done in your Boot state too, but for simplicity I'll keep it here.
    game.state.add('Server', BasicGameServer.ServerFactory.getServiceClass(io));

    //	Now start the Boot state.
    game.state.start('Server');

});
