/*global io */
/*global Phaser */
/*global BasicGame */
/*global GameLogic */
/*global Ship */
/*global GuiVectors */
/*global GuiMinimap */
/*global GameEvent */
/*global Controls */

BasicGame.Game = function (game) {

	//	When a State is added to Phaser it automatically has the following properties set on it, even if they already exist:

    //var self = this;
	
	// Phaser game variables
	/*
	self.game;		//	a reference to the currently running game
    self.add;		//	used to add sprites, text, groups, etc
    self.camera;	//	a reference to the game camera
    self.cache;		//	the game cache
    self.input;		//	the global input manager (you can access self.input.keyboard, self.input.mouse, as well from it)
    self.load;		//	for preloading assets
    self.math;		//	lots of useful common math operations
    self.sound;		//	the sound manager - add a sound, play one, set-up markers, etc
    self.stage;		//	the game stage
    self.time;		//	the clock
    self.tweens;	//	the tween manager
    self.world;		//	the game world
    self.particles;	//	the particle manager
    self.physics;	//	the physics manager
    self.rnd;		//	the repeatable random number generator
	*/
	//	You can use any of these from any function within this State.
    //	But do consider them as being 'reserved words', i.e. don't create a property for your own game called "world" or you'll over-write the world reference.
	
	// Game logic variables
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

BasicGame.Game.prototype = {

	create: function () {

		var self = this;
		
		self.eventQueue = [];
		
		self.ships = [];
		
		self.io = io;
		self.socket = self.io.connect();
		self.averagePingMs = 10;
		
		self.socket.on('connect', function () {
			self.socket.emit('joinGame');
		});
		
		self.socket.on('clientPing', function (data) {
			self.averagePingMs = 'undefined' !== typeof data.averagePingMs && null !== data.averagePingMs ? data.averagePingMs : self.averagePingMs;
			self.socket.emit('clientPong', data.startTime);
		});
		
		self.socket.on('joinOk', function (data) {
			self.playerShipId = self.socket.socket.sessionid;
			console.log('joinOk: ' + self.playerShipId + ' players: ' + data.ships.length);

            GameLogic.syncShipsWithServer(self.ships, data.ships, self.game, Ship);
			console.log('players: ' + self.ships.length);

            GameLogic.forElementWithId(self.ships, self.playerShipId, function (playerShip) {
				console.log('player ship added: ' + playerShip.id);
				self.game.camera.follow(playerShip.shipBody);
				self.game.camera.focusOnXY(-GameLogic.worldSize/4, GameLogic.worldSize/4);
			});
		});
		
		self.socket.on('controlsReceive', function (data) {
			var event = new GameEvent('controlsReceive', data);
			self.eventQueue.push(event);
		});
		
		self.socket.on('bodyReceive', function (data) {
			var event = new GameEvent('bodyReceive', data);
			self.eventQueue.push(event);
		});
		
		self.socket.on('playerListChange', function (data) {
			var event = new GameEvent('playerListChange', data);
			self.eventQueue.push(event);
		});
		
		self.socket.on('error', function (data) {
			console.log(data || 'error');
			alert('Socket error');
            location.reload(true);
		});
		
		self.game.world.setBounds(-GameLogic.worldSize/2, -GameLogic.worldSize/2, GameLogic.worldSize, GameLogic.worldSize);
		
		var waterBitmap = self.game.add.bitmapData(GameLogic.waterBitmapSize, GameLogic.waterBitmapSize);

		var waterGradient = waterBitmap.context.createLinearGradient(0, 0, GameLogic.waterBitmapSize - 1, GameLogic.waterBitmapSize - 1);
		waterGradient.addColorStop(0, GameLogic.waterColorLight);
		waterGradient.addColorStop(0.25, GameLogic.waterColorDark);
		waterGradient.addColorStop(0.5, GameLogic.waterColorLight);
		waterGradient.addColorStop(0.75, GameLogic.waterColorDark);
		waterGradient.addColorStop(1, GameLogic.waterColorLight);
		waterBitmap.context.fillStyle = waterGradient;
		waterBitmap.context.fillRect(0, 0, GameLogic.waterBitmapSize - 1, GameLogic.waterBitmapSize - 1);

		self.water = self.game.add.tileSprite(-GameLogic.worldSize/2, -GameLogic.worldSize/2, GameLogic.worldSize, GameLogic.worldSize, waterBitmap);
		
		self.guiVectors = new GuiVectors(
            self.game, GameLogic.guiCircleRadius,
            768 - GameLogic.guiCircleRadius,
            GameLogic.guiCircleRadius
        );

        self.guiMinimap = new GuiMinimap(
            self.game,
            1024 - GameLogic.guiMinimapRectangleSize,
            768 - GameLogic.guiMinimapRectangleSize,
            GameLogic.guiMinimapRectangleSize
        );
		
		self.cursors = self.game.input.keyboard.createCursorKeys();
		self.controls = new Controls();
		
		//timer = self.game.time.create(false);
		//timer.start();
		self.game.time.advancedTiming = true;
		
		self.bodySendTime = self.game.time.now;
	},

	update: function () {

		var self = this;
		
		var previousControls = new Controls(self.controls);
		self.controls.update(self.cursors, previousControls, self.eventQueue);
		
		self.ships.forEach(function (ship) {
			ship.update();
		});

        GameLogic.forElementWithId(self.ships, self.playerShipId, function (playerShip) {
			if (self.game.time.now > self.bodySendTime + 250) {
				self.bodySendTime = self.game.time.now;
				
				var event = new GameEvent(
					'bodySend',
					{
						'x': playerShip.shipBody.x,
						'y': playerShip.shipBody.y,
						'rotation': playerShip.shipBody.rotation,
						'currentSpeed': playerShip.currentSpeed
					}
				);
				
				self.eventQueue.push(event);
			}
		});

        var event;
		
		while ('undefined' !== typeof (event = self.eventQueue.pop())) {
			//console.log('eventQueue pop: ' + JSON.stringify(event));
			
			switch (event.type) {
				case 'controlsSend':
					event.data.id = self.playerShipId;
					self.socket.emit('controlsSend', event.data);
					break;
				
				case 'controlsReceive':
                    GameLogic.forElementWithId(self.ships, event.data.id, GameLogic.returnControlsReceiveCallback(event));
					break;
				
				case 'bodySend':
					event.data.id = self.playerShipId;
					self.socket.emit('bodySend', event.data);
					break;
				
				case 'bodyReceive':
                    GameLogic.forElementWithId(self.ships, event.data.id, GameLogic.returnBodyReceiveCallback(event, self));
					break;
					
				case 'playerListChange':
					console.log('playerListChange: ' + event.data + ' players: ' + event.data.ships.length);
                    GameLogic.syncShipsWithServer(self.ships, event.data.ships, self.game, Ship);
					break;

                default:
                    break;
			}
		}
	},
	
	render: function () {
		var self = this;
		
		var debugObj = {};
		
		debugObj.fps = self.game.time.fps;
		debugObj.averagePingMs = self.averagePingMs;
		debugObj.players = self.ships.length + ' (' + self.ships.map(function (v) {return v.id;}).join(', ') + ')';

        GameLogic.forElementWithId(self.ships, self.playerShipId, function (playerShip) {
			var shipVector = GameLogic.rotationToVector(playerShip.shipBody.rotation);
			var windVector = GameLogic.getWindVector(playerShip.shipBody.body.position);
			var sailVector = GameLogic.rotationToVector(playerShip.sail1.rotation);
			
			debugObj.position = playerShip.shipBody.body.position;
			debugObj.sailState = playerShip.sailState;
			debugObj.windSailPressureProjected = GameLogic.windSailPressureProjected(shipVector, sailVector, windVector);
			
			self.guiVectors.render(self.game.camera.x, self.game.camera.y, shipVector, windVector, sailVector);
            self.guiMinimap.render(self.game.camera.x, self.game.camera.y, self.ships, self.playerShipId);
		});
		
		var count = 0;
		
		for (var debugKey in debugObj) {
			if (debugObj.hasOwnProperty(debugKey)) {
                self.game.debug.text(debugKey + ': ' + debugObj[debugKey], 32, ++count * 16);
            }
		}
	},

	quitGame: function (/*pointer*/) {

		var self = this;
		
		//	Here you should destroy anything you no longer need.
		//	Stop music, delete sprites, purge caches, free resources, all that good stuff.

		//	Then let's go back to the main menu.
		self.state.start('MainMenu');

	}

};
