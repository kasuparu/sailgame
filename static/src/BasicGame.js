/*global define */

define(function () {
    function BasicGame() {
        /* Here we've just got some global level vars that persist regardless of State swaps */
        this.score = 0;

        /* If the music in your game needs to play through-out a few State swaps, then you could reference it here */
        this.music = null;

        /* Your game can check BasicGame.orientated in internal loops to know if it should pause or not */
        this.orientated = false;
    }

    BasicGame.prototype = {
        constructor: BasicGame
    };

    return BasicGame;
});
