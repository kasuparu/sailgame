/*global define */

define(['Phaser'], function (Phaser) {
    var GuiVectors = function (game, guiAnchorX, guiAnchorY, guiCircleRadius) {
        this.game = game;

        this.guiCircleLeft = new Phaser.Circle(0, 0, 1);

        this.guiWindLine = new Phaser.Line(0, 0, 0, 0);
        this.guiShipLine = new Phaser.Line(0, 0, 0, 0);
        this.guiSailLine = new Phaser.Line(0, 0, 0, 0);

        this.guiAnchorX = guiAnchorX;
        this.guiAnchorY = guiAnchorY;

        this.guiCircleRadius = guiCircleRadius;
        this.shipVectorScale = guiCircleRadius * 0.8;
        this.windVectorScale = guiCircleRadius * 0.015;
        this.sailVectorScale = guiCircleRadius * 0.8;
    };

    GuiVectors.prototype.render = function (cameraX, cameraY, shipVector, windVector, sailVector) {
        this.guiCircleLeft.setTo(
            this.guiAnchorX + cameraX,
            this.guiAnchorY + cameraY,
            this.guiCircleRadius * 2
        );

        this.guiShipLine.setTo(
            this.guiAnchorX + cameraX,
            this.guiAnchorY + cameraY,
            this.guiAnchorX + cameraX + shipVector.normalize().x * this.shipVectorScale,
            this.guiAnchorY + cameraY + shipVector.normalize().y * this.shipVectorScale
        );

        this.guiWindLine.setTo(
            this.guiAnchorX + cameraX,
            this.guiAnchorY + cameraY,
            this.guiAnchorX + cameraX + windVector.x * this.windVectorScale,
            this.guiAnchorY + cameraY + windVector.y * this.windVectorScale
        );

        this.guiSailLine.setTo(
            this.guiAnchorX + cameraX,
            this.guiAnchorY + cameraY,
            this.guiAnchorX + cameraX + sailVector.x * this.sailVectorScale,
            this.guiAnchorY + cameraY + sailVector.y * this.sailVectorScale
        );

        this.game.debug.geom(this.guiCircleLeft, 'rgba(0,0,0,0.7)');

        this.game.debug.geom(this.guiShipLine, 'rgba(0,255,0,0.7)');
        this.game.debug.geom(this.guiSailLine, 'rgba(255,255,255,0.5)');
        this.game.debug.geom(this.guiWindLine, 'rgba(128,128,255,0.7)');

        this.game.debug.pixel(this.guiAnchorX, this.guiAnchorY, 'rgba(255,255,255,0.7)');
    };

    return GuiVectors;
});

