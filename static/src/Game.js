/*global BasicGame */
/*global Phaser */
/*global io */

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

var GameLogic = {
	windSpeed: 64,
	sailStep: 5,
	sailShift: -5,
	sailMaxTurnAngle: 60,
	epsilonDegrees: 0.001,
	waterColorLight: '#1F96C1',
	waterColorDark: '#25A1C6',
	waterBitmapSize: 196,
	worldSize: 10000
};

var Ship = function (id, game, x, y) {
	x = x || 0;
	y = y || 0;
	
	this.id = id;
	
	this.game = game;
	
	this.shipBody = game.add.sprite(x, y, 'shipTemporary');
	this.shipBody.anchor.setTo(0.5, 0.5);
	this.shipBody.scale.x = this.shipBody.scale.y = 0.1;
	
	this.sailState = 1;
	
	
	this.sail1 = game.add.sprite(x, y, 'sailTemporary');
	this.sail1.anchor.setTo(0.5, 0.5);
	this.sail1.scale.x = 0.07 * this.sailState;
	this.sail1.scale.y = 0.07;
	
	this.sail2 = game.add.sprite(x, y, 'sailTemporary');
	this.sail2.anchor.setTo(0.5, 0.5);
	this.sail2.scale.x = 0.09 * this.sailState;
	this.sail2.scale.y = 0.09;
	
	this.game.physics.enable(this.shipBody, Phaser.Physics.ARCADE);
	this.shipBody.body.drag.set(0.5);
	this.shipBody.body.maxVelocity.setTo(200, 200);
	this.shipBody.body.collideWorldBounds = true;
	
	this.currentSpeed = 0;
	
	this.shipBody.bringToTop();
	this.sail1.bringToTop();
	this.sail2.bringToTop();
	
	this.controls = new Controls();
};

Ship.prototype.update = function () {
	var shipVector = GameLogic.rotationToVector(this.shipBody.rotation);
	var windVector = GameLogic.getWindVector(this.shipBody.body.position);
	var sailVector = GameLogic.rotationToVector(this.sail1.rotation);
	
	this.sailState = this.controls.sailState;
	this.shipBody.angle += this.controls.steering;
	
	this.sail1.scale.x = 0.07 * this.sailState;
	this.sail2.scale.x = 0.09 * this.sailState;
	
	this.currentSpeed = this.sailState * GameLogic.windSailPressureProjected(shipVector, sailVector, windVector);

	if (this.currentSpeed !== 0) {
		this.game.physics.arcade.velocityFromRotation(this.shipBody.rotation, this.currentSpeed, this.shipBody.body.velocity);
	}
	
	this.sail1.x = this.shipBody.x + Math.cos(this.shipBody.rotation) * (GameLogic.sailStep + GameLogic.sailShift);
	this.sail1.y = this.shipBody.y + Math.sin(this.shipBody.rotation) * (GameLogic.sailStep + GameLogic.sailShift);
	
	this.sail1.rotation = GameLogic.sailRotation(shipVector, windVector);
	
	this.sail2.x = this.shipBody.x + Math.cos(this.shipBody.rotation) * (-GameLogic.sailStep + GameLogic.sailShift);
	this.sail2.y = this.shipBody.y + Math.sin(this.shipBody.rotation) * (-GameLogic.sailStep + GameLogic.sailShift);
	
	this.sail2.rotation = GameLogic.sailRotation(shipVector, windVector);
};

var GameEvent = function (type, data) {
	this.type = type;
	this.data = data;
};

var Controls = function (object) {
	if ('undefined' !== typeof object) {
		this.sailState = object.sailState;
		this.steering = object.steering;
	} else {
		this.sailState = 1;
		this.steering = 0;
	}
};

Controls.prototype.update = function (cursors, targetControls, eventQueue) {
	if (typeof cursors !== 'undefined') {
		if (cursors.left.isDown) {
			// this.shipBody.angle -= 1;
			this.steering = -1;
		} else if (cursors.right.isDown) {
			//this.shipBody.angle += 1;
			this.steering = 1;
		} else {
			this.steering = 0;
		}

		if (cursors.up.isDown && this.sailState < 1) {
			this.sailState += 0.25;
		} else if (cursors.down.isDown && this.sailState > 0) {
			this.sailState -= 0.25;
		}
	}
	
	//console.log(this.steering + ' ' + this.sailState);
	
	if ('undefined' !== typeof targetControls) {
		if (this.sailState !== targetControls.sailState || this.steering !== targetControls.steering) {
			var event = new GameEvent(
				'controlsSend',
				{
					'steering': this.steering,
					'sailState': this.sailState,
					'ts': Date.now()
				}
			);
			
			eventQueue.push(event);
			//console.log('eventQueue push: ' + JSON.stringify(event));
			// TODO set timer to average ping (roundtrip / 2) to apply controls
		}
	}
};

GameLogic.windRotation = function (positionPoint) {
	var windVector = GameLogic.rotate(new Phaser.Point(-positionPoint.x, -positionPoint.y), Math.PI / 2);

	return GameLogic.vectorToRotation(windVector);
};

GameLogic.getWindVector = function (positionPoint) {
	return GameLogic.rotationToVector(GameLogic.windRotation(positionPoint))
		.multiply(GameLogic.windSpeed, GameLogic.windSpeed);
};

GameLogic.rotationToVector = function (rotation) {
	return new Phaser.Point(Math.cos(rotation), Math.sin(rotation));
};

GameLogic.vectorToRotation = function (vector, asDegrees) {
	return new Phaser.Point(0, 0).angle(vector, asDegrees);
};

GameLogic.normalizeRotation = function (rotation) {
	var result = rotation;
	
	while (Math.abs(result) > 180 + GameLogic.epsilonDegrees) {
		result -= result / Math.abs(result) * 360;
	}
		
	return result;
};

GameLogic.angle = function (a, b, asDegrees) {
	if (typeof asDegrees === 'undefined') {
		asDegrees = false;
	}
	
	var result = 0;
	
	if (!a.isZero() && !b.isZero()) {
		result = GameLogic.vectorToRotation(b, 'asDegrees') - GameLogic.vectorToRotation(a, 'asDegrees');
		
		result = GameLogic.normalizeRotation(result);
	}
	
	if (asDegrees) {
		return result;
	} else {
		return Phaser.Math.degToRad(result);
	}
};

GameLogic.rotate = function (point, angle) {
	return new Phaser.Point(
		point.x * Math.cos(angle) - point.y * Math.sin(angle),
		point.x * Math.sin(angle) + point.y * Math.cos(angle)
	);
};

GameLogic.windSailCase = function (shipVector, windVector) {
	var shipWindAngle = GameLogic.angle(shipVector, windVector, 'asDegrees');
	
	var result = 'rear';
	
	if (Math.abs(shipWindAngle) > (180 - GameLogic.sailMaxTurnAngle) + GameLogic.epsilonDegrees) {
		result = 'front';
	} else if (Math.abs(shipWindAngle) > GameLogic.sailMaxTurnAngle + GameLogic.epsilonDegrees) {
		result = 'side';
	}
	
	return result;
};

GameLogic.sailRotation = function (shipVector, windVector, asDegrees) {
	var shipWindAngle = GameLogic.angle(shipVector, windVector, 'asDegrees');
	
	var result = GameLogic.vectorToRotation(windVector, 'asDegrees');
	
	var windCase = GameLogic.windSailCase(shipVector, windVector);
	
	switch (windCase) {
		case 'front':
			result = GameLogic.vectorToRotation(shipVector, 'asDegrees') -
                (180 - GameLogic.sailMaxTurnAngle) * shipWindAngle / Math.abs(shipWindAngle);
			break;
		case 'side':
			result = result - 90 * shipWindAngle / Math.abs(shipWindAngle);
			break;
	}
	
	result = GameLogic.normalizeRotation(result);
	
	var sailWindAngle = GameLogic.normalizeRotation(result - GameLogic.vectorToRotation(windVector, 'asDegrees'));
	
	if (Math.abs(sailWindAngle) > 90 + GameLogic.epsilonDegrees) {
		result = result + 180;
	}
	
	result = GameLogic.normalizeRotation(result);
	
	if (asDegrees) {
		return result;
	} else {
		return Phaser.Math.degToRad(result);
	}
};

GameLogic.windSailPressureNormalized = function (sailVector, windVector) {
	var sailWindAngle = GameLogic.angle(sailVector, windVector);
	
	var cos = Math.cos(sailWindAngle);
	
	return (Math.pow(cos * cos, 3) + 0.4 * Math.pow(1 - cos * cos, 2)) * windVector.getMagnitude();
};

GameLogic.windSailPressureProjected = function (shipVector, sailVector, windVector) {
	var shipSailAngle = GameLogic.angle(shipVector, sailVector);
	
	return Math.cos(shipSailAngle) * GameLogic.windSailPressureNormalized(sailVector, windVector);
};

GameLogic.forElementWithId = function (array, id, callback) {
	for (var i = 0, len = array.length; i < len; ++i) {
		var element = array[i];

		if (element.id === id) {
			callback(element, i);
			
			break;
		}
	}
};

GameLogic.syncShipsWithServer = function (selfShips, serverShips, game) {
	var shipsToDelete = selfShips.slice();

    var removeElement = function (shipToDelete, index) {
        console.log('keeping ship ' + shipToDelete.id);
        shipsToDelete.splice(index, 1);
    };

    var found = false;

    var shipFoundCallback = function (foundShip) {
        found = true;

        // If found, remove from shipsToDelete
        GameLogic.forElementWithId(shipsToDelete, foundShip.id, removeElement);
    };

	for (var i = 0, len = serverShips.length; i < len; ++i) {
        found = false;

		// Find ship with this id in selfShips
        GameLogic.forElementWithId(selfShips, serverShips[i].id, shipFoundCallback);
		
		// If not found, add ship
		if (!found) {
			// TODO apply body params
			var ship = new Ship(serverShips[i].id, game, -GameLogic.worldSize/4, GameLogic.worldSize/4);
					
			selfShips.push(ship);
			console.log('adding ship ' + ship.id);

            GameLogic.forElementWithId(shipsToDelete, ship.id, removeElement);
		}
	}
	
	// Delete all shipsToDelete left
	shipsToDelete.forEach(function (shipToDelete) {
        GameLogic.forElementWithId(selfShips, shipToDelete.id, function (ship, index) {
			console.log('removing ship ' + ship.id);
			selfShips.splice(index, 1);
		});
	});
};

GameLogic.returnControlsReceiveCallback = function (event) {
    return function (ship) {
        ship.controls.steering = event.data.steering;
        ship.controls.sailState = event.data.sailState;
    };
};

GameLogic.returnBodyReceiveCallback = function (event, basicGameGame) {
    return function (ship) {
        // TODO Apply to playerShip too when server physics are available
        if (ship.id !== basicGameGame.playerShipId) {
            ship.shipBody.x = event.data.x;
            ship.shipBody.x = event.data.x;
            ship.shipBody.rotation = event.data.rotation;
            ship.currentSpeed = event.data.currentSpeed;
        }
    };
};

var Gui = function (game, x, y) {
	this.game = game;
	
	this.guiCornerLeft = new Phaser.Rectangle(0, 0, 0, 0);
	this.guiCircleLeft = new Phaser.Circle(0, 0, 1);
	
	this.guiWindLine = new Phaser.Line(0, 0, 0, 0);
	this.guiShipLine = new Phaser.Line(0, 0, 0, 0);
	this.guiSailLine = new Phaser.Line(0, 0, 0, 0);
	
	this.x = x;
	this.y = y;
	
	this.guiCircleDiameter = 100;
	this.shipVectorScale = 40;
	this.windVectorScale = 0.75;
	this.sailVectorScale = 40;
};

Gui.prototype.render = function (x, y, shipVector, windVector, sailVector) {
	this.guiCornerLeft.setTo(
		this.x + x - this.guiCircleDiameter/2,
		this.y + y,
		this.guiCircleDiameter/2,
		this.guiCircleDiameter/2
	);
	
	this.guiCircleLeft.setTo(
		this.x + x,
		this.y + y,
		this.guiCircleDiameter
	);
	
	this.guiShipLine.setTo(
		this.x + x,
		this.y + y,
		this.x + x + shipVector.normalize().x * this.shipVectorScale,
		this.y + y + shipVector.normalize().y * this.shipVectorScale
	);
	
	this.guiWindLine.setTo(
		this.x + x,
		this.y + y,
		this.x + x + windVector.x * this.windVectorScale,
		this.y + y + windVector.y * this.windVectorScale
	);
	
	this.guiSailLine.setTo(
		this.x + x,
		this.y + y,
		this.x + x + sailVector.x * this.sailVectorScale,
		this.y + y + sailVector.y * this.sailVectorScale
	);
	
	this.game.debug.geom(this.guiCornerLeft, 'rgba(0,0,0,1)');
	this.game.debug.geom(this.guiCircleLeft, 'rgba(0,0,0,1)');
	
	this.game.debug.geom(this.guiShipLine, 'rgba(0,255,0,1)');
	this.game.debug.geom(this.guiSailLine, 'rgba(255,255,255,0.5)');
	this.game.debug.geom(this.guiWindLine, 'rgba(128,128,255,1)');
	
	this.game.debug.pixel(this.x, this.y, 'rgba(255,255,255,1)');
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

            GameLogic.syncShipsWithServer(self.ships, data.ships, self.game);
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
		
		self.gui = new Gui(self.game, 50, 768 - 50);
		
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
                    GameLogic.syncShipsWithServer(self.ships, event.data.ships, self.game);
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
			
			self.gui.render(self.game.camera.x, self.game.camera.y, shipVector, windVector, sailVector);
		});
		
		var count = 0;
		
		for (var debugKey in debugObj) {
			if (debugObj.hasOwnProperty(debugKey)) {
                self.game.debug.text(debugKey + ': ' + debugObj[debugKey], 32, ++count * 16);
            }
		}
	},

	quitGame: function (pointer) {

		var self = this;
		
		//	Here you should destroy anything you no longer need.
		//	Stop music, delete sprites, purge caches, free resources, all that good stuff.

		//	Then let's go back to the main menu.
		self.state.start('MainMenu');

	}

};
