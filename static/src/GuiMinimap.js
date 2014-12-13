/*global define */

define(function () {
    /**
     * @param {Phaser.Game} game
     * @param {number} guiAnchorX - pixels
     * @param {number} guiAnchorY - pixels
     * @param {number} guiMinimapRectangleSize - pixels
     * @constructor
     */
    var GuiMinimap = function (game, guiAnchorX, guiAnchorY, guiMinimapRectangleSize) {
        var self = this;

        self.game = game;

        self.guiMinimapRectangle = new Phaser.Rectangle(0, 0, 0, 0);

        self.guiAnchorX = guiAnchorX;
        self.guiAnchorY = guiAnchorY;

        self.guiMinimapRectangleSize = guiMinimapRectangleSize;

        self.coordToMini = function (realX, realY) {
            return {
                x: self.guiMinimapRectangleSize * (realX / self.game.world.width + 1 / 2),
                y: self.guiMinimapRectangleSize * (realY / self.game.world.height + 1 / 2)
            };
        };
    };

    /**
     * @param {number} cameraX - pixels
     * @param {number} cameraY - pixels
     * @param {Array} ships
     * @param {string|number} playerShipId
     */
    GuiMinimap.prototype.render = function (cameraX, cameraY, ships, playerShipId) {
        var self = this;

        self.guiMinimapRectangle.setTo(
            self.guiAnchorX + cameraX,
            self.guiAnchorY + cameraY,
            self.guiMinimapRectangleSize,
            self.guiMinimapRectangleSize
        );

        self.game.debug.geom(this.guiMinimapRectangle, 'rgba(0,0,0,0.7)');

        ships.forEach(function (ship) {
            var coords = self.coordToMini(ship.shipBody.body.position.x, ship.shipBody.body.position.y);
            var color = ship.id !== playerShipId ? 'rgba(255,20,20,0.7)' : 'rgba(20,255,20,0.7)';

            self.game.debug.pixel(self.guiAnchorX + coords.x, self.guiAnchorY + coords.y, color);
        });
    };

    return GuiMinimap;
});

