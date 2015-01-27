/*global define */

define(['PhaserWrapper', 'Ship', 'GameLogic', 'GameEvent', 'TimedQueue'], function (Phaser, Ship, GameLogic, GameEvent, TimedQueue) {
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

                preload: function () {

                    var self = this;

                    var dataURI = 'data:image/jpeg;base64,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';

                    var data = new Image();
                    data.src = dataURI;
                    self.game.cache.addImage('fakeImage', dataURI, data);

                },

                create: function () {

                    var self = this;

                    self.timer = null;

                    self.eventQueue = [];

                    self.timedQueue = new TimedQueue();

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

                        socket.on('clientPong', function (startTime) {
                            var pingMs = (self.game.time.time - startTime) / 2;
                            //console.log('pingMs: ' + pingMs + 'ms');

                            socket.get('averagePingMs', function (err, averagePingMs) {
                                averagePingMs = null !== averagePingMs ? averagePingMs : pingMs;
                                var newAveragePingMs = (pingMs + 7 * averagePingMs) / 8;

                                socket.set('averagePingMs', newAveragePingMs, function () {
                                    //console.log('averagePingMs: ' + averagePingMs + '->' + newAveragePingMs);
                                });
                            });

                        });

                        self.timer = setInterval(function() {
                            socket.get('averagePingMs', function (err, averagePingMs) {
                                socket.emit('clientPing', {startTime: self.game.time.time, averagePingMs: averagePingMs});
                            });
                        }, 500);

                        socket.on('disconnect', function() {
                            var event = new GameEvent('disconnect', {socket: socket});
                            self.eventQueue.push(event);
                        });

                    });

                    self.game.world.setBounds(-GameLogic.worldSize/2, -GameLogic.worldSize/2, GameLogic.worldSize, GameLogic.worldSize);

                    self.game.physics.startSystem(Phaser.Physics.ARCADE);
                    self.game.physics.arcade.setBoundsToWorld();

                    self.game.time.advancedTiming = true;

                    self.bodySendTime = self.game.time.time;

                },

                update: function () {

                    var self = this;

                    var event;

                    self.ships.forEach(function (ship) {
                        ship.update();

                        if (self.game.time.time > self.bodySendTime + 1000) {
                            self.bodySendTime = self.game.time.time;

                            var event = new GameEvent('bodyReceive');
                            self.timedQueue.push(self.game.time.time, event);
                        }
                    });

                    while ('undefined' !== typeof (event = self.eventQueue.pop())) {
                        //console.log('eventQueue pop: ' + JSON.stringify(event));

                        switch (event.type) {
                            case 'joinGame':
                                var callback = GameLogic.returnCreateClientInitiatedEventCallback(event, self.game.time.time);
                                callback();

                                self.timedQueue.push(event.data.ts, event);

                                break;

                            case 'controlsSend':
                                GameLogic.forElementWithId(
                                    self.ships,
                                    event.data.socket.id,
                                    GameLogic.returnCreateClientInitiatedEventCallback(event, self.game.time.time)
                                );

                                self.timedQueue.push(event.data.ts, event);
                                break;

                            case 'disconnect':
                                GameLogic.forElementWithId(self.ships, event.data.socket.id, GameLogic.returnDisconnectCallback(self.ships, event));
                                break;

                            default:
                                break;
                        }
                    }

                    var events = self.timedQueue.get(self.game.time.time);

                    events.forEach(function (event) {
                        switch (event.type) {
                            case 'bodyReceive':
                                console.log('Client ' + event.type + ' est @ ' + GameLogic.timestampShortened(self.game.time.time + GameLogic.clientPhysicsDelayMs));

                                self.io.sockets.emit(
                                    'bodyReceive',
                                    {ships: self.ships.map(Ship.getInfo), ts: self.game.time.time + GameLogic.clientPhysicsDelayMs}
                                );

                                break;

                            case 'controlsSend':
                                GameLogic.forElementWithId(self.ships, event.data.socket.id, GameLogic.returnControlsApplyCallback(event));

                                delete (event.data.socket);
                                event.data.ts += GameLogic.clientPhysicsDelayMs;

                                self.io.sockets.emit(
                                    'controlsReceive',
                                    event.data
                                );

                                break;

                            case 'joinGame':
                                var ship = new Ship(event.data.socket.id, self.game, -GameLogic.worldSize/4, GameLogic.worldSize/4);
                                self.ships.push(ship);
                                console.log('joinOk: ' + event.data.socket.id);

                                event.data.ts += GameLogic.clientPhysicsDelayMs;

                                var shipsInfo = self.ships.map(Ship.getInfo);
                                event.data.socket.emit('joinOk', {ships: shipsInfo, ts: event.data.ts});
                                event.data.socket.broadcast.emit('playerListChange', {ships: shipsInfo, ts: event.data.ts});

                                break;

                            default:
                                break;
                        }
                    });
                }

            };

            return BasicGameServer;
        }
    };
});

