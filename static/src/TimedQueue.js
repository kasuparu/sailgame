/*global define */

define([], function () {
    /**
     * @constructor
     */
    var TimedQueue = function () {
        this.queue = {};
    };

    /**
     *
     * @param {Number} timestamp
     * @param {object} eventObject
     * @returns {boolean}
     */
    TimedQueue.prototype.push = function (timestamp, eventObject) {
        var index = timestamp + '';

        if (!index) {
            return false;
        }

        if (!this.queue.hasOwnProperty(index)) {
            this.queue[index] = [];
        }

        this.queue[index].push(eventObject);

        return true;
    };

    /**
     *
     * @param {Number} timestamp
     * @returns {Array}
     */
    TimedQueue.prototype.get = function (timestamp) {
        var self = this;
        var result = [];

        for (var index in self.queue) {
            if (self.queue.hasOwnProperty(index)) {
                var indexNum = parseFloat(index);

                if (self.queue.hasOwnProperty(index) && !isNaN(indexNum) && indexNum <= timestamp) {
                    Array.prototype.push.apply(result, self.queue[index]);
                    delete self.queue[index];
                }
            }
        }

        return result;
    };

    return TimedQueue;
});
