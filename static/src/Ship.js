/*global GameLogic */
/*global Controls */

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

