define(['knockout', 'LOG', 'util', 'AMD/VisualConfig', 'AMD/LayoutHolder'], function(ko, LOG, util, VisualConfig, LayoutHolder) {

    'use strict';

    var instance,
        DIMENSIONS_BY_MODE = {
            0: {name: 'iphone', w: 320, h: 480},
            1: {name: 'ipad', w: 768, h: 1024},
            2: {name: 'iphone5', w: 320, h: 568},
            3: {name: 'ipadpro', w: 1024, h:1366},
            8: {name: 'ipad', w: 768, h: 1024},
            default: {name: 'unknwon', w:320, h:480}
        };

    /**
     * @constructor
     */
    function Dimensions() {
        var self = this,
            visualConfig = VisualConfig.getInstance(),
            layoutHolder = LayoutHolder.getInstance();

        this.layoutWidth = ko.observable().extend({deferred: true});
        this.layoutHeight = ko.observable().extend({deferred: true});
        this.isLandscape = ko.observable();
        this.scaled = ko.observable().extend({deferred: true});

        ko.computed(function() {
            if (!layoutHolder.layout()) {
                return;
            }

            var layout = layoutHolder.layout(),
                dims = (layout._w && layout._h) ? {name: 'custom', w: layout._w, h: layout._h} :
                                                  (DIMENSIONS_BY_MODE[layout._mode] || DIMENSIONS_BY_MODE.default),
                isLandscape = (layout._orientation === 'vertical'),
                layoutWidth = Math.min(dims.w, dims.h),
                layoutHeight = Math.max(dims.w, dims.h),
                zoom = visualConfig.zoom();

            self.isLandscape(isLandscape);
            self.layoutWidth(layoutWidth);
            self.layoutHeight(layoutHeight);
            self.scaled({
                width: Math.round(layoutWidth * zoom),
                height: Math.round(layoutHeight * zoom)
            });
        });
    }

    return {
        getInstance: function() {
            if (!instance) {
                instance = new Dimensions();
            }
            return instance;
        }
    };

});