/*global global */
/*global define */

define(['jsdom', 'canvas'], function (jsdom, canvas) {
    // https://gist.github.com/crisu83/5857c4a638e57308be4f#file-phaser-js
    // this is an ingenius hack that allows us to run Phaser without a browser
    // ... and yes, it took some time to figure out how to do this
    var document = jsdom.jsdom(null);
    var window = document.parentWindow;
    var Phaser;

    // expose a few things to all the modules
    global.document = document;
    global.window = window;
    global.canvas = canvas;
    global.Image = canvas.Image;
    global.window.CanvasRenderingContext2D = 'foo'; // let Phaser think that we have a canvas
    global.window.Element = undefined;
    global.navigator = {userAgent: 'Custom'}; // could be anything

    // fake the xml http request object because Phaser.Loader uses it
    global.XMLHttpRequest = function() {};

    // load an expose PIXI in order to finally load Phaser
    global.PIXI = require('../../phaser/build/custom/pixi');
    global.Phaser = Phaser = require('../../phaser/build/custom/phaser-arcade-physics.min');

    return Phaser;
});
