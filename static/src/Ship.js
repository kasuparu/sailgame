/*global define */

define(['Phaser', 'GameLogic', 'Controls'], function (Phaser, GameLogic, Controls) {
    var Ship = function (id, game, x, y) {
        x = x || 0;
        y = y || 0;

        this.id = id;

        this.game = game;

        if (game.cache.checkImageKey('shipTemporary')) {
            this.shipBody = game.add.sprite(x, y, 'shipTemporary');
        } else {
            this.shipBody = game.add.sprite(x, y, 'fakeImage');
        }

        this.shipBody.anchor.setTo(0.5, 0.5);
        this.shipBody.scale.x = this.shipBody.scale.y = 0.1;

        this.sailState = 1;

        if (game.cache.checkImageKey('sailTemporary')) {
            this.sail1 = game.add.sprite(x, y, 'sailTemporary');
            this.sail2 = game.add.sprite(x, y, 'sailTemporary');
        } else {
            this.sail1 = game.add.sprite(x, y, 'fakeImage');
            this.sail2 = game.add.sprite(x, y, 'fakeImage');
        }

        this.sail1.anchor.setTo(0.5, 0.5);
        this.sail1.scale.x = 0.07 * this.sailState;
        this.sail1.scale.y = 0.07;

        this.sail2.anchor.setTo(0.5, 0.5);
        this.sail2.scale.x = 0.09 * this.sailState;
        this.sail2.scale.y = 0.09;

        this.game.physics.enable(this.shipBody, Phaser.Physics.ARCADE);
        this.shipBody.body.drag.set(0.5);
        this.shipBody.body.maxVelocity.setTo(200, 200);
        this.shipBody.body.collideWorldBounds = true;

        if (!game.cache.checkImageKey('shipTemporary')) {
            this.shipBody.body.setSize(0, 0, 43, 15);
        }

        this.currentSpeed = 0;

        this.shipBody.bringToTop();
        this.sail1.bringToTop();
        this.sail2.bringToTop();

        this.controls = new Controls();
    };

    Ship.prototype.update = function () {
        this.updatePhysics();
        this.updateElements();
    };

    Ship.prototype.updatePhysics = function () {
        var shipVector = GameLogic.rotationToVector(this.shipBody.rotation);
        var windVector = GameLogic.getWindVector(this.shipBody.body.position);
        var sailVector = GameLogic.rotationToVector(this.sail1.rotation);

        var deltaRotation = GameLogic.normalizeRotation(
            Phaser.Math.radToDeg(this.controls.targetRotation - this.shipBody.rotation)
        );

        if (Math.abs(deltaRotation) > GameLogic.epsilonDegrees) {
            this.shipBody.rotation += GameLogic.sign(deltaRotation) *
            GameLogic.currentTurnRate(this.currentSpeed) * this.game.time.elapsed;
        }

        this.currentSpeed = GameLogic.nextCurrentSpeed(
            this.currentSpeed,
            this.controls.sailState * GameLogic.windSailPressureProjected(shipVector, sailVector, windVector),
            this.game.time.elapsed
        );


        console.log(this.shipBody.rotation + ' ' + parseInt(this.currentSpeed) + ' ' + parseInt(this.shipBody.body.velocity.x));
        console.log(this.shipBody.position.x + ' ' + this.shipBody.body.x + ' ' + this.shipBody.body.position.x);

        //this.checkWorldBounds();
    };

    Ship.prototype.checkWorldBoundsError = function () {
        if (
            Math.abs(this.shipBody.position.x) > GameLogic.worldSize/2 ||
            Math.abs(this.shipBody.position.y) > GameLogic.worldSize/2
        ) {
            console.log('world bounds error');
        }
    };

    Ship.prototype.updateElements = function () {
        var shipVector = GameLogic.rotationToVector(this.shipBody.rotation);
        var windVector = GameLogic.getWindVector(this.shipBody.body.position);

        this.sailState = this.controls.sailState;

        this.sail1.scale.x = 0.07 * this.sailState;
        this.sail2.scale.x = 0.09 * this.sailState;

        this.sail1.x = this.shipBody.x + Math.cos(this.shipBody.rotation) * (GameLogic.sailStep + GameLogic.sailShift);
        this.sail1.y = this.shipBody.y + Math.sin(this.shipBody.rotation) * (GameLogic.sailStep + GameLogic.sailShift);

        this.sail1.rotation = GameLogic.sailRotation(shipVector, windVector);

        this.sail2.x = this.shipBody.x + Math.cos(this.shipBody.rotation) * (-GameLogic.sailStep + GameLogic.sailShift);
        this.sail2.y = this.shipBody.y + Math.sin(this.shipBody.rotation) * (-GameLogic.sailStep + GameLogic.sailShift);

        this.sail2.rotation = GameLogic.sailRotation(shipVector, windVector);
    };

    Ship.getInfo = function (ship) {
        return {
            id: ship.id,
            'x': ship.shipBody.body.x,
            'y': ship.shipBody.body.y,
            'rotation': ship.shipBody.rotation,
            'currentSpeed': ship.currentSpeed,
            'velocity': {'x': ship.shipBody.body.velocity.x, 'y': ship.shipBody.body.velocity.y},
            'targetRotation': ship.targetRotation,
            'sailState': ship.sailState,
            'ts': Date.now()
        };
    };

    Ship.prototype.setControls = function (targetRotation, sailState) {
        this.controls.targetRotation = targetRotation;
        this.controls.sailState = sailState;
    };

    Ship.prototype.setInfo = function (data) {
        this.shipBody.body.x = data.x;
        this.shipBody.body.y = data.y;
        this.shipBody.rotation = data.rotation;
        this.currentSpeed = data.currentSpeed;
        this.shipBody.body.velocity = new Phaser.Point(data.velocity.x, data.velocity.y);
        this.setControls(data.targetRotation, data.sailState);

        //console.log(this.shipBody.position);

        this.checkWorldBoundsError();
    };

    return Ship;
});


