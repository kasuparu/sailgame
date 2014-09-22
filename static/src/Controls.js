/*global GameEvent */

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