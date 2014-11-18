/*global define */

define(['PhaserWrapper'], function () {
    return {
        getServiceClass: function (io) {
            var BasicGameServer = function (game) {
                this.io = io;
            };

            BasicGameServer.prototype = {

                create: function () {



                },

                update: function () {


                }

            };

            return BasicGameServer;
        }
    };
});

