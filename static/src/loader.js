// https://gist.github.com/guerrerocarlos/3651490
// Require.js allows us to configure shortcut alias
require.config({
    // The shim config allows us to configure dependencies for
    // scripts that do not call define() to register a module
    shim: {
        'socketio': {
            exports: 'io'
        },
        'Phaser': {
            exports: 'Phaser'
        },
        //'BasicGame': {
        //    exports: 'BasicGame'
        //},
        'BasicGameBoot': {
            deps: [
                'BasicGame'
            ],
            exports: 'BasicGame.Boot'
        },
        'BasicGamePreloader': {
            deps: [
                'BasicGame'
            ],
            exports: 'BasicGamePreloader'
        },
        'BasicGameMainMenu': {
            deps: [
                'BasicGame'
            ],
            exports: 'BasicGameMainMenu'
        },
        'BasicGameGame': {
            deps: [
                'socketio',
                'Phaser',
                'BasicGame',
                'GameLogic',
                'Ship',
                'GuiVectors',
                'GuiMinimap',
                'GameEvent',
                'Controls'
            ],
            exports: 'BasicGameGame'
        },
        'GameLogic': {
            deps: [
                'Phaser'
            ],
            exports: 'GameLogic'
        },
        'Ship': {
            deps: [
                'Phaser',
                'GameLogic',
                'Controls'
            ],
            exports: 'Ship'
        },
        'GuiVectors': {
            deps: [
                'Phaser'
            ],
            exports: 'GuiVectors'
        },
        'GuiMinimap': {
            deps: [
                'Phaser'
            ],
            exports: 'GuiMinimap'
        },
        'GameEvent': {
            exports: 'GameEvent'
        },
        'Controls': {
            deps: [
                'GameEvent',
                'GameLogic',
                'Phaser'
            ],
            exports: 'Controls'
        }
    },
    paths: {
        socketio: '/socket.io/socket.io',
        Phaser: '../phaser/build/phaser.min',
        BasicGame: 'BasicGame',
        BasicGameBoot: 'Boot',
        BasicGamePreloader: 'Preloader',
        BasicGameMainMenu: 'MainMenu',
        BasicGameGame: 'Game'
    }
});

require([
    'socketio',
    'Phaser',
    'BasicGame',
    'BasicGameBoot',
    'BasicGamePreloader',
    'BasicGameMainMenu',
    'BasicGameGame'
], function (io, Phaser, BasicGame) {

    //	Create your Phaser game and inject it into the game div.
    //	We did it in a window.onload event, but you can do it anywhere (requireJS load, anonymous function, jQuery dom ready, - whatever floats your boat)
    //	We're using a game size of 1024 x 768 here, but you can use whatever you feel makes sense for your game of course.
    var game = new Phaser.Game(1024, 768, Phaser.AUTO, 'game');

    //	Add the States your game has.
    //	You don't have to do this in the html, it could be done in your Boot state too, but for simplicity I'll keep it here.
    game.state.add('Boot', BasicGame.Boot);
    game.state.add('Preloader', BasicGame.Preloader);
    game.state.add('MainMenu', BasicGame.MainMenu);
    game.state.add('Game', BasicGame.Game);

    //	Now start the Boot state.
    game.state.start('Boot');

});
