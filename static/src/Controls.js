/*global GameEvent */
/*global GameLogic */
/*global Phaser */

var Controls = function (object) {
    if ('undefined' !== typeof object) {
        this.sailState = object.sailState;
        this.steering = object.steering;

        this.rotation = object.rotation;
    } else {
        this.sailState = 1;
        this.steering = 0;

        this.rotation = 0;
    }

    this.line = new Phaser.Line(0, 0, 0, 0);
    this.drawLine = false;
};

Controls.prototype.update = function (cursors, targetControls, eventQueue, activePointer, ship, game) {
    if (typeof cursors !== 'undefined') {
        if (cursors.left.isDown) {
            this.steering = -1;
        } else if (cursors.right.isDown) {
            this.steering = 1;
        } else {
            this.steering = 0;
        }
    }

    if ('undefined' !== typeof activePointer && 'undefined' !== typeof ship) {
        if (activePointer.isDown) {
            var activePointerPoint = new Phaser.Point(activePointer.worldX, activePointer.worldY);

            console.log(ship.shipBody.position.angle(activePointerPoint));
            console.log(ship.shipBody.position.distance(activePointerPoint));


            this.sailState = ship.shipBody.position.distance(activePointerPoint) / 200;
            this.sailState = this.sailState > 1 ? 1 : this.sailState;
            this.sailState = this.sailState < 0.2 ? 0 : this.sailState;

            // TODO set rotation

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

Controls.prototype.render = function (game) {
   if (this.drawLine && 'undefined' !== typeof game) {
       game.debug.geom(this.line, 'rgba(0,255,0,0.7)');
   }
};