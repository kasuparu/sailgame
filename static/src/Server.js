/*global define */

define(['PhaserWrapper'], function () {
    return {
        getServiceClass: function (io) {
            var BasicGameServer = function (game) {
                this.io = io;

                // Game logic variables
                //var self = this;
                /*
                 self.cursors;
                 self.io;
                 self.socket;
                 self.averagePingMs;
                 self.controls;
                 self.eventQueue;
                 self.ships;
                 self.playerShipId;
                 self.bodySendTime;
                 */
            };

            BasicGameServer.prototype = {

                create: function () {

                    var self = this;

                    self.timer = null;

                    self.eventQueue = [];

                    self.ships = [];

                    self.io.sockets.on('connection', function (socket) {

                        socket.on('joinGame', function (data) {
                            var ship = {};
                            ship.id = socket.id;
                            self.ships.push(ship);
                            console.log('joinOk: ' + socket.id);

                            socket.emit('joinOk', {ships: self.ships}); // TODO: tell about existing players

                            socket.broadcast.emit('playerListChange', {ships: self.ships});
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
                                averagePingMs = null !== averagePingMs ? averagePingMs : pingMs;
                                var newAveragePingMs = (pingMs + 3 * averagePingMs) / 4;

                                socket.set('averagePingMs', newAveragePingMs, function () {
                                    //console.log('averagePingMs: ' + averagePingMs + '->' + newAveragePingMs);
                                });
                            });

                        });

                        self.timer = setInterval(function() {
                            socket.get('averagePingMs', function (err, averagePingMs) {
                                socket.emit('clientPing', {startTime: Date.now(), averagePingMs: averagePingMs});
                            });
                        }, 2000);

                        socket.on('disconnect', function() {
                            var len = self.ships.length;

                            for (var i = 0; i < len; ++i) {
                                var ship = self.ships[i];

                                if (ship.id == socket.id) {
                                    console.log('disconnect: ' + ship.id);
                                    self.ships.splice(i, 1);
                                    break;
                                }
                            }

                            socket.broadcast.emit('playerListChange', {ships: self.ships});
                        });

                    });

                },

                update: function () {


                }

            };

            return BasicGameServer;
        }
    };
});

