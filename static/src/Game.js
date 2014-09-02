
BasicGame.Game = function (game) {

	//	When a State is added to Phaser it automatically has the following properties set on it, even if they already exist:

    var self = this;
	
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
	
	self.cursors;
	self.io;
	self.socket;

    //	You can use any of these from any function within this State.
    //	But do consider them as being 'reserved words', i.e. don't create a property for your own game called "world" or you'll over-write the world reference.

};

var windSpeed = 64;
var sailStep = 5;
var sailShift = -5;
var sailMaxTurnAngle = 60;
var waterColorLight = '#1F96C1';
var waterColorDark = '#25A1C6';
var waterBitmapSize = 196;
var epsilonDegrees = 0.001;

Ship = function (id, game, x, y) {
	x = x || 0;
	y = y || 0;
	
	this.id = id;
	
	this.game = game;
	
	this.shipBody = game.add.sprite(x, y, 'shipTemporary');
	this.shipBody.anchor.setTo(0.5, 0.5);
	this.shipBody.scale.x = this.shipBody.scale.y = 0.1;
	
	this.sailState = 1;
	this.sailStateDelta = 0;
	
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
};

Ship.prototype.update = function (cursors) {
	var shipVector = rotationToVector(this.shipBody.rotation);
	var windVector = getWindVector(this.shipBody.body.position);
	var sailVector = rotationToVector(this.sail1.rotation);
	
	if (typeof cursors !== 'undefined') {
		if (cursors.left.isDown) {
			this.shipBody.angle -= 1;
		} else if (cursors.right.isDown) {
			this.shipBody.angle += 1;
		}

		if (cursors.up.isDown && this.sailState < 1 && this.sailStateDelta == 0) {
			this.sailStateDelta = 0.25;
		} else if (cursors.down.isDown && this.sailState > 0 && this.sailStateDelta == 0) {
			this.sailStateDelta = -0.25;
		} else {
			this.sailStateDelta = 0;
		}
		
		this.sailState += this.sailStateDelta;
		
		this.sail1.scale.x = 0.07 * this.sailState;
		this.sail2.scale.x = 0.09 * this.sailState;
		
		this.currentSpeed = this.sailState * windSailPressureProjected(shipVector, sailVector, windVector);
	}

	if (this.currentSpeed != 0) {
		this.game.physics.arcade.velocityFromRotation(this.shipBody.rotation, this.currentSpeed, this.shipBody.body.velocity);
	}
	
	this.sail1.x = this.shipBody.x + Math.cos(this.shipBody.rotation) * (sailStep + sailShift);
	this.sail1.y = this.shipBody.y + Math.sin(this.shipBody.rotation) * (sailStep + sailShift);
	
	this.sail1.rotation = sailRotation(shipVector, windVector);
	
	this.sail2.x = this.shipBody.x + Math.cos(this.shipBody.rotation) * (-sailStep + sailShift);
	this.sail2.y = this.shipBody.y + Math.sin(this.shipBody.rotation) * (-sailStep + sailShift);
	
	this.sail2.rotation = sailRotation(shipVector, windVector);
};

var windRotation = function (positionPoint) {
	var windVector = rotate(new Phaser.Point(-positionPoint.x, -positionPoint.y), Math.PI / 2);

	return vectorToRotation(windVector);
};

var getWindVector = function (positionPoint) {
	return rotationToVector(windRotation(positionPoint))
		.multiply(windSpeed, windSpeed);
};

var rotationToVector = function (rotation) {
	return new Phaser.Point(Math.cos(rotation), Math.sin(rotation));
};

var vectorToRotation = function (vector, asDegrees) {
	return new Phaser.Point(0, 0).angle(vector, asDegrees);
};

var normalizeRotation = function (rotation) {
	var result = rotation;
	
	while (Math.abs(result) > 180 + epsilonDegrees) {
		result -= result / Math.abs(result) * 360;
	}
		
	return result;
};

var angle = function (a, b, asDegrees) {
	if (typeof asDegrees === 'undefined') {
		asDegrees = false;
	}
	
	var result = 0;
	
	if (!a.isZero() && !b.isZero()) {
		result = vectorToRotation(b, 'asDegrees') - vectorToRotation(a, 'asDegrees');
		
		result = normalizeRotation(result);
	}
	
	if (asDegrees) {
		return result;
	} else {
		return Phaser.Math.degToRad(result);
	}
};

var rotate = function (point, angle) {
	return new Phaser.Point(
		point.x * Math.cos(angle) - point.y * Math.sin(angle),
		point.x * Math.sin(angle) + point.y * Math.cos(angle)
	);
};

var windSailCase = function (shipVector, windVector) {
	var shipWindAngle = angle(shipVector, windVector, 'asDegrees');
	
	var result = 'rear';
	
	if (Math.abs(shipWindAngle) > (180 - sailMaxTurnAngle) + epsilonDegrees) {
		result = 'front';
	} else if (Math.abs(shipWindAngle) > sailMaxTurnAngle + epsilonDegrees) {
		result = 'side';
	}
	
	return result;
};

var sailRotation = function (shipVector, windVector, asDegrees) {
	var shipWindAngle = angle(shipVector, windVector, 'asDegrees');
	
	var result = vectorToRotation(windVector, 'asDegrees');
	
	var windCase = windSailCase(shipVector, windVector);
	
	switch (windCase) {
		case 'front':
			result = vectorToRotation(shipVector, 'asDegrees') - (180 - sailMaxTurnAngle) * shipWindAngle / Math.abs(shipWindAngle);
			break;
		case 'side':
			result = result - 90 * shipWindAngle / Math.abs(shipWindAngle);
			break;
	}
	
	result = normalizeRotation(result);
	
	var sailWindAngle = normalizeRotation(result - vectorToRotation(windVector, 'asDegrees'));
	
	if (Math.abs(sailWindAngle) > 90 + epsilonDegrees) {
		result = result + 180;
	}
	
	result = normalizeRotation(result);
	
	if (asDegrees) {
		return result;
	} else {
		return Phaser.Math.degToRad(result);
	}
};

var windSailPressureNormalized = function (sailVector, windVector) {
	var sailWindAngle = angle(sailVector, windVector);
	
	var cos = Math.cos(sailWindAngle);
	
	return (Math.pow(cos * cos, 3) + 0.4 * Math.pow(1 - cos * cos, 2)) * windVector.getMagnitude();
};

var windSailPressureProjected = function (shipVector, sailVector, windVector) {
	var shipSailAngle = angle(shipVector, sailVector);
	
	return Math.cos(shipSailAngle) * windSailPressureNormalized(sailVector, windVector);
};

Gui = function (game, x, y) {
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

Gui.prototype.render = function (x, y, shipVector, windVector, sailVector, socket) {
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
		
		self.io = io;
		self.socket = self.io.connect();
		
		self.socket.on('clientPing', function (data) {
			self.socket.emit('clientPong', data);
		});
		
		var worldSize = 10000;
		
		self.game.world.setBounds(-worldSize/2, -worldSize/2, worldSize, worldSize);
		
		var waterBitmap = self.game.add.bitmapData(waterBitmapSize, waterBitmapSize);

		var waterGradient = waterBitmap.context.createLinearGradient(0, 0, waterBitmapSize - 1, waterBitmapSize - 1);
		waterGradient.addColorStop(0, waterColorLight);
		waterGradient.addColorStop(0.25, waterColorDark);
		waterGradient.addColorStop(0.5, waterColorLight);
		waterGradient.addColorStop(0.75, waterColorDark);
		waterGradient.addColorStop(1, waterColorLight);
		waterBitmap.context.fillStyle = waterGradient;
		waterBitmap.context.fillRect(0, 0, waterBitmapSize - 1, waterBitmapSize - 1);

		water = self.game.add.tileSprite(-worldSize/2, -worldSize/2, worldSize, worldSize, waterBitmap);
		
		playerShip = new Ship(0, self.game, -worldSize/4, worldSize/4);
		
		self.game.camera.follow(playerShip.shipBody);
		self.game.camera.focusOnXY(-worldSize/4, worldSize/4);
		
		//otherShip = new Ship(1, self.game, 200, 0);
		
		gui = new Gui(self.game, 50, 768 - 50);
		
		self.cursors = self.game.input.keyboard.createCursorKeys();
	},

	update: function () {

		var self = this;
		
		playerShip.update(self.cursors);
		//otherShip.update(self.cursors);
		
		if (false) {
			// TODO Check for socket overflow
			// TODO Avoid emitting if disconnected (messages do stack up)
			
			self.socket.emit('clientData', {
				'x': playerShip.shipBody.x,
				'y': playerShip.shipBody.y,
				'rotation': playerShip.shipBody.rotation,
				'currentSpeed': playerShip.currentSpeed
			}, function () {
				// empty callback to count ackPackets
			});
		}
		
	},
	
	render: function () {
		var self = this;
		
		var shipVector = rotationToVector(playerShip.shipBody.rotation);
		var windVector = getWindVector(playerShip.shipBody.body.position);
		var sailVector = rotationToVector(playerShip.sail1.rotation);
		
		var debugObj = {
			'position': playerShip.shipBody.body.position,
			//'velocity': playerShip.body.velocity,
			//'shipAngle': playerShip.shipBody.rotation / Math.PI * 180,
			//'windAngle': windRotation(playerShip.shipBody.body.position) / Math.PI * 180,
			//'shipWindAngle': angle(shipVector, windVector, 'asDegrees'),
			//'sailAngle': playerShip.sail1.rotation / Math.PI * 180,
			//'shipSailAngle': angle(shipVector, sailVector, 'asDegrees'),
			//'sailWindAngle': angle(sailVector, windVector, 'asDegrees'),
			'sailState': playerShip.sailState,
			//'windSailPressureNormalized': windSailPressureNormalized(sailVector, windVector),
			'windSailPressureProjected': windSailPressureProjected(shipVector, sailVector, windVector),
			//'velocity': playerShip.shipBody.body.velocity,
			//'windCase': windSailCase(shipVector, windVector),
			//'socketConnected': 'undefined' !== typeof self.socket ? !self.socket.disconnected : false,
			//'socketAckPackets': 'undefined' !== typeof self.socket ? self.socket.ackPackets : 0
		};
		
		var count = 0;
		
		for (var debugKey in debugObj) {
			self.game.debug.text(debugKey + ': ' + debugObj[debugKey], 32, ++count * 16);
		}
		
		//self.game.debug.spriteInfo(playerSail1, 32, 700);
		//self.game.debug.spriteInfo(playerSail2, 700, 700);
		
		gui.render(self.game.camera.x, self.game.camera.y, shipVector, windVector, sailVector, self.socket);
	},

	quitGame: function (pointer) {

		var self = this;
		
		//	Here you should destroy anything you no longer need.
		//	Stop music, delete sprites, purge caches, free resources, all that good stuff.

		//	Then let's go back to the main menu.
		self.state.start('MainMenu');

	}

};
