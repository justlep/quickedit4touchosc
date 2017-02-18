define(['knockout', 'util', 'koToggleableExtender'], function(ko, util) {
    'use strict';

    var instance = null,
        MIN_ZOOM = 0.05,
        FINER_ZOOM_THRESHOLD = 0.25;

    /**
     * @constructor
     */
    function VisualConfig() {
        var self = this;

        this.markEmptyLabels = ko.observable(true).extend({toggleable: true});

        this.isTooltipEnabled = ko.observable(true);

        this.zoom = ko.observable(1);

        this.zoomIn = function() {
            var zoom = self.zoom(),
                step = (zoom < FINER_ZOOM_THRESHOLD) ? 0.05 : 0.25,
                newZoom = Math.min(2, zoom + step);

            self.zoom(util.round10(newZoom, 2));
        };
        this.zoomOut = function() {
            var zoom = self.zoom(),
                step = (zoom <= FINER_ZOOM_THRESHOLD) ? 0.05 : 0.25,
                newZoom = Math.max(MIN_ZOOM, zoom - step);

            self.zoom(util.round10(newZoom, 2));
        };
        this.zoomReset = function() {
            self.zoom(1);
        };
    }

    return {
        getInstance: function() {
            if (!instance) {
                instance = new VisualConfig();
            }
            return instance;
        }
    }

});