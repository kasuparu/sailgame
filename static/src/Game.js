
BasicGame.Game = function (game) {

	//	When a State is added to Phaser it automatically has the following properties set on it, even if they already exist:

    this.game;		//	a reference to the currently running game
    this.add;		//	used to add sprites, text, groups, etc
    this.camera;	//	a reference to the game camera
    this.cache;		//	the game cache
    this.input;		//	the global input manager (you can access this.input.keyboard, this.input.mouse, as well from it)
    this.load;		//	for preloading assets
    this.math;		//	lots of useful common math operations
    this.sound;		//	the sound manager - add a sound, play one, set-up markers, etc
    this.stage;		//	the game stage
    this.time;		//	the clock
    this.tweens;	//	the tween manager
    this.world;		//	the game world
    this.particles;	//	the particle manager
    this.physics;	//	the physics manager
    this.rnd;		//	the repeatable random number generator

    //	You can use any of these from any function within this State.
    //	But do consider them as being 'reserved words', i.e. don't create a property for your own game called "world" or you'll over-write the world reference.

};

var currentSpeed = 0;
var cursors;

BasicGame.Game.prototype = {

	create: function () {

		var worldSize  = 10000;
		
		this.game.world.setBounds(-worldSize/2, -worldSize/2, worldSize, worldSize);
		
		var waterBitmapSize = 128;
		var waterBitmap = this.game.add.bitmapData(waterBitmapSize, waterBitmapSize);

		var waterGradient = waterBitmap.context.createLinearGradient(0, 0, waterBitmapSize, waterBitmapSize);
		waterGradient.addColorStop(0, "#0296A1");
		waterGradient.addColorStop(1, "#014347");
		waterBitmap.context.fillStyle = waterGradient;
		waterBitmap.context.fillRect(0, 0, waterBitmapSize, waterBitmapSize);

		water = this.game.add.tileSprite(-worldSize/2, -worldSize/2, worldSize, worldSize, waterBitmap);
		
		playerShip = this.game.add.sprite(0, 0, 'shipTemporary');
		playerShip.anchor.setTo(0.5, 0.5);
		playerShip.scale.x = playerShip.scale.y = 0.1;
		
		this.game.physics.enable(playerShip, Phaser.Physics.ARCADE);
		playerShip.body.drag.set(0.4);
		playerShip.body.maxVelocity.setTo(200, 200);
		playerShip.body.collideWorldBounds = true;
		
		this.game.camera.follow(playerShip);
		this.game.camera.focusOnXY(0, 0);
		
		cursors = this.game.input.keyboard.createCursorKeys();
	},

	update: function () {

		if (cursors.left.isDown) {
			playerShip.angle -= 1;
		} else if (cursors.right.isDown) {
			playerShip.angle += 1;
		}

		if (cursors.up.isDown) {
			currentSpeed += 1;
		} else if (cursors.down.isDown) {
			currentSpeed -= 1;
		}

		if (currentSpeed != 0) {
			this.game.physics.arcade.velocityFromRotation(playerShip.rotation, currentSpeed, playerShip.body.velocity);
		}

	},
	
	render: function () {
		this.game.debug.text('currentSpeed: ' + playerShip.body.velocity, 32, 32);
	},

	quitGame: function (pointer) {

		//	Here you should destroy anything you no longer need.
		//	Stop music, delete sprites, purge caches, free resources, all that good stuff.

		//	Then let's go back to the main menu.
		this.state.start('MainMenu');

	}

};
