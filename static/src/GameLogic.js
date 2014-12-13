/*global define */

define(['Phaser'], function (Phaser) {
    /**
     * Singleton containing constants and functions
     *
     * @type {
     *      {
     *          windSpeed: number,
     *          sailStep: number,
     *          sailShift: number,
     *          sailMaxTurnAngle: number,
     *          epsilonDegrees: number,
     *          waterColorLight: string,
     *          waterColorDark: string,
     *          waterBitmapSize: number,
     *          worldSize: number,
     *          guiMinimapRectangleSize: number,
     *          guiCircleRadius: number,
     *          turnRateRadMs: number,
     *          shipInertiaT: number
     *       }
     * }
     */
    var GameLogic = {
        windSpeed: 64,
        sailStep: 5,
        sailShift: -5,
        sailMaxTurnAngle: 60,
        epsilonDegrees: 0.001,
        waterColorLight: '#1F96C1',
        waterColorDark: '#25A1C6',
        waterBitmapSize: 196,
        worldSize: 10000,
        guiMinimapRectangleSize: 100,
        guiCircleRadius: 50,
        turnRateRadMs: 2 * Math.PI / 5 / 1000, // full 360 per 5 sec in radians/ms
        shipInertiaT: 8000,
        disableClientPhysics: false
    };

    /**
     * @param {Phaser.Point} positionPoint
     * @returns {number}
     */
    GameLogic.windRotation = function (positionPoint) {
        var windVector = GameLogic.rotate(new Phaser.Point(-positionPoint.x, -positionPoint.y), Math.PI / 2);

        return GameLogic.vectorToRotation(windVector);
    };

    /**
     * @param {Phaser.Point} positionPoint
     * @returns {Phaser.Point}
     */
    GameLogic.getWindVector = function (positionPoint) {
        return GameLogic.rotationToVector(GameLogic.windRotation(positionPoint))
            .multiply(GameLogic.windSpeed, GameLogic.windSpeed);
    };

    /**
     * @param {number} rotation - in radians
     * @returns {Phaser.Point}
     */
    GameLogic.rotationToVector = function (rotation) {
        return new Phaser.Point(Math.cos(rotation), Math.sin(rotation));
    };

    /**
     * @param {Phaser.Point} vector
     * @param {boolean} [asDegrees]
     * @returns {number}
     */
    GameLogic.vectorToRotation = function (vector, asDegrees) {
        return new Phaser.Point(0, 0).angle(vector, asDegrees);
    };

    /**
     * Makes rotation to be -180 <= x <= 180
     *
     * @param {number} rotation - in degrees
     * @returns {number} - degrees
     */
    GameLogic.normalizeRotation = function (rotation) {
        var result = rotation;

        while (Math.abs(result) > 180 + GameLogic.epsilonDegrees) {
            result -= result / Math.abs(result) * 360;
        }

        return result;
    };

    /**
     * Angle between vectors
     *
     * @param {Phaser.Point} a
     * @param {Phaser.Point} b
     * @param {boolean} [asDegrees=false]
     * @returns {number}
     */
    GameLogic.angle = function (a, b, asDegrees) {
        if (typeof asDegrees === 'undefined') {
            asDegrees = false;
        }

        var result = 0;

        if (!a.isZero() && !b.isZero()) {
            result = GameLogic.vectorToRotation(b, true) - GameLogic.vectorToRotation(a, true);

            result = GameLogic.normalizeRotation(result);
        }

        if (asDegrees) {
            return result;
        } else {
            return Phaser.Math.degToRad(result);
        }
    };

    /**
     * Rotate vector by angle
     *
     * @param {Phaser.Point} point
     * @param {number} angle - in radians
     * @returns {Phaser.Point}
     */
    GameLogic.rotate = function (point, angle) {
        return new Phaser.Point(
            point.x * Math.cos(angle) - point.y * Math.sin(angle),
            point.x * Math.sin(angle) + point.y * Math.cos(angle)
        );
    };

    /**
     * Decides one of 4 ways sail can be turned to wind by angle between them
     * Left and right are the "Side"
     *
     * @param {Phaser.Point} shipVector
     * @param {Phaser.Point} windVector
     * @returns {string}
     */
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

    /**
     * @param {Phaser.Point} shipVector
     * @param {Phaser.Point} windVector
     * @param {boolean} [asDegrees]
     * @returns {number}
     */
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

            default:
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

    /**
     * Synthetic formula to get the result speed of wind pushing sails
     *
     * @param {Phaser.Point} sailVector
     * @param {Phaser.Point} windVector
     * @returns {number}
     */
    GameLogic.windSailPressureNormalized = function (sailVector, windVector) {
        var sailWindAngle = GameLogic.angle(sailVector, windVector);

        var cos = Math.cos(sailWindAngle);

        return (Math.pow(cos * cos, 3) + 0.4 * Math.pow(1 - cos * cos, 2)) * windVector.getMagnitude();
    };

    /**
     * Projects wind speed on ship axis
     *
     * @param {Phaser.Point} shipVector
     * @param {Phaser.Point} sailVector
     * @param {Phaser.Point} windVector
     * @returns {number}
     */
    GameLogic.windSailPressureProjected = function (shipVector, sailVector, windVector) {
        var shipSailAngle = GameLogic.angle(shipVector, sailVector);

        return Math.cos(shipSailAngle) * GameLogic.windSailPressureNormalized(sailVector, windVector);
    };

    /**
     * @param {array} array
     * @param {string|integer} id
     * @param {function} callback
     */
    GameLogic.forElementWithId = function (array, id, callback) {
        for (var i = 0, len = array.length; i < len; ++i) {
            var element = array[i];

            if (element.id === id) {
                callback(element, i);

                break;
            }
        }
    };

    /**
     * @param {array} selfShips
     * @param {array} serverShips
     * @param {Phaser.Game} game
     * @param {function} ShipClass
     */
    GameLogic.syncShipsWithServer = function (selfShips, serverShips, game, ShipClass) {
        var shipsToDelete = selfShips.slice();

        var removeElement = function (shipToDelete, index) {
            shipsToDelete.splice(index, 1);
        };

        var found = false;

        var shipFoundCallback = function (serverShipInfo) {
            return function (foundSelfShip) {
                found = true;

                // If found, remove from shipsToDelete
                GameLogic.forElementWithId(shipsToDelete, foundSelfShip.id, removeElement);

                // Apply ship info
                foundSelfShip.setInfo(serverShipInfo);
            };
        };

        for (var i = 0, len = serverShips.length; i < len; ++i) {
            found = false;

            // Find ship with this id in selfShips
            GameLogic.forElementWithId(selfShips, serverShips[i].id, shipFoundCallback(serverShips[i]));

            // If not found, add ship
            if (!found) {
                var ship = new ShipClass(serverShips[i].id, game, -GameLogic.worldSize/4, GameLogic.worldSize/4);
                ship.setInfo(serverShips[i]);

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

    /**
     * @param {Object} event
     * @returns {function}
     */
    GameLogic.returnControlsApplyCallback = function (event) {
        return function (ship) {
            ship.setControls(event.data.targetRotation, event.data.sailState);
        };
    };

    /**
     * @param {number} currentSpeed
     * @returns {number}
     */
    GameLogic.currentTurnRate = function (currentSpeed) {
        return Math.abs(currentSpeed) / GameLogic.windSpeed * GameLogic.turnRateRadMs * (currentSpeed > 0 ? 1 : 0.5);
    };

    /**
     * @param {number} currentSpeed
     * @param {number} targetSpeed
     * @param {number} elapsed
     * @returns {number}
     */
    GameLogic.nextCurrentSpeed = function (currentSpeed, targetSpeed, elapsed) {
        return currentSpeed/(1 + elapsed/GameLogic.shipInertiaT) +
        targetSpeed/(1 + GameLogic.shipInertiaT/elapsed);
    };

    /**
     * Server only!
     *
     * @param selfShips
     * @param {Object} event
     * @returns {function}
     */
    GameLogic.returnDisconnectCallback = function (selfShips, event) {
        return function (ship, index) {
            console.log('disconnect: ' + ship.id);
            selfShips.splice(index, 1);

            event.data.socket.broadcast.emit('playerListChange', {ships: selfShips});
        };
    };

    /**
     * Client only!
     *
     * @param {Phaser.Game} game
     * @returns {function}
     */
    GameLogic.returnSetCamera = function (game) {
        return function (playerShip) {
            console.log('player ship added: ' + playerShip.id);
            game.camera.follow(playerShip.shipBody);
            game.camera.focusOnXY(-GameLogic.worldSize/4, GameLogic.worldSize/4);
        };
    };

    /**
     * @param {number} x
     * @returns {number}
     */
    GameLogic.sign = function (x) {
        return typeof x === 'number' ? x ? x < 0 ? -1 : 1 : x === x ? 0 : NaN : NaN;
    };

    return GameLogic;
});


