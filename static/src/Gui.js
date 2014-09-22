/*global Phaser */

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