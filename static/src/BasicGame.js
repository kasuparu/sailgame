/*global define */

define(['Boot', 'Preloader', 'MainMenu', 'Game'], function (Boot, Preloader, MainMenu, Game) {
    return {
        /* Here we've just got some global level vars that persist regardless of State swaps */
        score: 0,

        /* If the music in your game needs to play through-out a few State swaps, then you could reference it here */
        music: null,

        /* Your game can check BasicGame.orientated in internal loops to know if it should pause or not */
        orientated: false,

        Boot: Boot,
        Preloader: Preloader,
        MainMenu: MainMenu,
        Game: Game
    };
});
