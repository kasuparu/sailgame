/*global define */

define(['Phaser', 'GameLogic', 'GameEvent'], function (Phaser, GameLogic, GameEvent) {
    /**
     * @param {Controls} object
     * @constructor
     */
    var Controls = function (object) {
        if ('undefined' !== typeof object) {
            this.sailState = object.sailState;
            this.targetRotation = object.targetRotation;
        } else {
            this.sailState = 1;
            this.targetRotation = 0;
        }

        this.line = new Phaser.Line(0, 0, 0, 0);
        this.drawLine = false;
        this.ts = Date.now();
        this.isDown = false;
    };

    /**
     *
     * @param {object} cursors
     * @param {Controls} previousControls
     * @param {Array} eventQueue
     * @param {Phaser.Pointer} activePointer
     * @param ship
     */
    Controls.prototype.update = function (cursors, previousControls, eventQueue, activePointer, ship) {
        if ('undefined' !== typeof activePointer && 'undefined' !== typeof ship) {
            if (activePointer.isDown) {
                var activePointerPoint = new Phaser.Point(activePointer.worldX, activePointer.worldY);

                this.sailState = ship.shipBody.position.distance(activePointerPoint) / 200;
                this.sailState = this.sailState > 1 ? 1 : this.sailState;
                this.sailState = this.sailState < 0.2 ? 0 : this.sailState;

                this.targetRotation = ship.shipBody.position.angle(activePointerPoint);

                this.line.setTo(
                    ship.shipBody.position.x,
                    ship.shipBody.position.y,
                    activePointerPoint.x,
                    activePointerPoint.y
                );

                this.drawLine = true;
            } else {
                this.drawLine = false;
            }
        }

        if ('undefined' !== typeof activePointer && 'undefined' !== typeof previousControls) {
            if (this.isDown && !activePointer.isDown) {
                this.ts = Date.now();

                var event = new GameEvent(
                    'controlsSend',
                    {
                        'targetRotation': this.targetRotation,
                        'sailState': this.sailState,
                        'ts': this.ts
                    }
                );

                eventQueue.push(event);
                //console.log('eventQueue push: ' + JSON.stringify(event));
            }
        }

        if ('undefined' !== typeof activePointer) {
            this.isDown = activePointer.isDown;
        }
    };

    /**
     * @param {Phaser.Game} game
     */
    Controls.prototype.render = function (game) {
        if (this.drawLine && 'undefined' !== typeof game) {
            game.debug.geom(this.line, 'rgba(20,196,20,0.7)');
        }
    };

    return Controls;
});
