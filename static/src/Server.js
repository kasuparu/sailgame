/*global define */

define(['PhaserWrapper', 'Ship', 'GameLogic', 'GameEvent'], function (Phaser, Ship, GameLogic, GameEvent) {
    return {
        getServiceClass: function (io) {
            var BasicGameServer = function (/* game */) {
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
                            data = data || {};
                            data.socket = socket;
                            var event = new GameEvent('joinGame', data);
                            self.eventQueue.push(event);
                        });

                        socket.on('controlsSend', function (dataObj) {
                            dataObj.socket = socket;
                            var event = new GameEvent('controlsSend', dataObj);
                            self.eventQueue.push(event);
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
                            var event = new GameEvent('disconnect', {socket: socket});
                            self.eventQueue.push(event);
                        });

                    });

                },

                update: function () {

                    var self = this;

                    var event;

                    while ('undefined' !== typeof (event = self.eventQueue.pop())) {
                        //console.log('eventQueue pop: ' + JSON.stringify(event));

                        switch (event.type) {
                            case 'joinGame':
                                var ship = new Ship(event.data.socket.id, self.game, -GameLogic.worldSize/4, GameLogic.worldSize/4);
                                self.ships.push(ship);
                                console.log('joinOk: ' + event.data.socket.id);

                                var shipsInfo = self.ships.map(Ship.getInfo);
                                console.log({ships: shipsInfo});
                                event.data.socket.emit('joinOk', {ships: shipsInfo});
                                event.data.socket.broadcast.emit('playerListChange', {ships: shipsInfo});
                                break;

                            case 'controlsSend':
                                //console.log('controlsSend: ' + JSON.stringify(dataObj));
                                GameLogic.forElementWithId(self.ships, event.data.socket.id, GameLogic.returnControlsReceiveCallback(event));

                                var socket = event.data.socket;
                                delete (event.data.socket); // TODO: Crutch

                                socket.emit('controlsReceive', event.data);
                                socket.broadcast.emit('controlsReceive', event.data);
                                break;

                            case 'disconnect':
                                GameLogic.forElementWithId(self.ships, event.data.socket.id, GameLogic.returnDisconnectCallback(self.ships, event));
                                break;

                            default:
                                break;
                        }
                    }

                }

            };

            return BasicGameServer;
        }
    };
});

