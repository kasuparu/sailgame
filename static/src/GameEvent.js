/*global define */

define(function () {
    return function GameEvent(type, data) {
        this.type = type;
        this.data = data;
    };
});

