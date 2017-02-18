define(['knockout', 'underscore', 'util', 'LOG', 'AMD/VisualConfig', 'AMD/file/JsonSanitizer'],
    function(ko, _, util, LOG, VisualConfig, JsonSanitizer) {

    'use strict';

    var instance;

    /**
     * @constructor
     */
    function LayoutHolder() {
        var self = this,
            visualConfig = VisualConfig.getInstance(),
            _json = ko.observable();

        this.json = ko.computed({
            read: _json,
            write: function(newJson) {
                visualConfig.zoomReset();
                _json(newJson);
            }
        });

        /**
         * Returns a copy of the complete layout JSON with the Control objects unwrap,
         * i.e. the returned JSON contains the original TouchOSC-compatible structure, ready for export.
         * (!) No sanitizing for export is done here! It MUST be done before conversion to XML.
         */
        this.getJsonForExport = function() {
            var json = self.json.peek(),
                jsonCopy = json && JSON.parse(JSON.stringify(json));

            if (jsonCopy) {
                _.each(jsonCopy.layout.tabpage, function(tabPage) {
                    _.each(tabPage.control, function(controlJson, i) {
                        tabPage.control[i] = controlJson.props; // unwrap the pure control properties
                    });
                });

                JsonSanitizer.sanitizeJsonForExport(jsonCopy);
            }

            return jsonCopy || null;
        };

        this.hasLayout = ko.computed(function() {
            return !!self.json();
        });

        this.layout = ko.computed(function() {
            return self.json() && self.json().layout;
        });

        this.tabPages = ko.computed(function() {
            var layout = self.layout();
            return layout && layout.tabpage;
        });

        this.forEachControl = function(callback) {
            var json = self.json.peek();
            _.chain(json && json.layout && json.layout.tabpage).pluck('control').flatten().each(callback);
        };

        this.forEachTabPage = function(callback) {
            var json = self.json.peek();
            _.each(json && json.layout && json.layout.tabpage, callback);
        };

        this.needsRedraw = ko.observable(true).extend({notify: 'always'});
        this.triggerRedraw = function() {
            self.needsRedraw(false);
            self.needsRedraw(true);
        };
    }

    return {
        getInstance: function() {
            if (!instance) {
                instance = new LayoutHolder();
            }
            return instance;
        }
    };

});