define(['knockout', 'util', 'LOG', 'underscore', 'AMD/control/ControlSupport', 'koToggleableExtender'],
    function(ko, util, LOG, _, ControlSupport) {
    "use strict";

    var instance = null;

    /**
     * @constructor
     */
    function ControlFilter() {
        var self = this,
            SUPPORTED_BASE_TYPE_NAMES = ControlSupport.REGISTERED_BASE_TYPE_NAMES,
            filtersByBaseTypeName = _.reduce(SUPPORTED_BASE_TYPE_NAMES, function(map, baseTypeName) {
                map[baseTypeName] = {
                    isVisible: ko.observable(true).extend({toggleable: true}),
                    count: ko.observable(0),
                    controlType: baseTypeName
                };
                return map;
            }, {});

        this.ALL_COLORS = ControlSupport.ALL_COLORS;

        this.allowedColors = _.reduce(this.ALL_COLORS, function(map, color) {
                                 map[color] = ko.observable(false).extend({toggleable: true});
                                 return map;
                             }, {});

        this.isCountFilterEnabled = ko.observable(true);
        this.isVisible = ko.observable(false).extend({toggleable: true});
        this.isOpen = ko.observable(true).extend({toggleable: true});

        this.resetColors = function() {
            _.invoke(self.allowedColors, 'toggleOn');
        };

        /**
         * Click-handler for a single color, toggling a single color on/off.
         * If SHIFT is pressed during click, the color is solo'ed and another shift-click on the same color
         * will toggle ALL colors on again.
         *
         * @param colorName (String)
         * @param e (Event) the click event
         */
        this.colorClick = function(colorName, e) {
            var clickedColorObs = self.allowedColors[colorName];
            if (e.shiftKey) {
                var isTheOnlyAllowedColor = clickedColorObs() && (1 === _.reduce(self.allowedColors, function(count, color) {
                                                                     return color() ? (count + 1) : count;
                                                                  }, 0));
                _.each(self.allowedColors, function(_colorObs) {
                    _colorObs(isTheOnlyAllowedColor || (_colorObs === clickedColorObs));
                });
            } else {
                clickedColorObs.toggle();
            }
        };

        this.hideAll = function() {
            _.invoke(filtersByBaseTypeName, 'isVisible', false);
        };

        this.reset = function() {
            _.invoke(filtersByBaseTypeName, 'isVisible', true);
            self.resetColors();
        };

        this.showAllButLabels = function() {
            _.each(filtersByBaseTypeName, function(obj, baseTypeName) {
                obj.isVisible(!(/label/i).test(baseTypeName));
            });
        };

        this.isControlVisible = function(control) {
            var mapObj = control && filtersByBaseTypeName[control.BASE_TYPE_NAME],
                isAllowedType = mapObj && mapObj.isVisible(),
                color = control.props._color,
                isAllowedColor = mapObj && (!color || !self.allowedColors[color] || self.allowedColors[color]());

            return !!(isAllowedType && isAllowedColor);
        };

        this.updateCounts = function(baseTypeName2countMap) {
            util.assertObject(baseTypeName2countMap, 'Invalid baseTypeName2countMap object for ControlFilter.updateCounts');
            var baseNames = _.union(SUPPORTED_BASE_TYPE_NAMES, _.keys(baseTypeName2countMap));

            _.each(baseNames, function(baseName) {
                if (filtersByBaseTypeName[baseName]) {
                    filtersByBaseTypeName[baseName].count(baseTypeName2countMap[baseName] || 0);
                } else {
                    LOG.warn('Yet unsupported baseName: "%s"', baseName);
                    alert('Unsupported control baseName: "' + baseName + '"');
                }
            });
        };

        this.getCountById = function(baseTypeName) {
            return filtersByBaseTypeName[baseTypeName] ? filtersByBaseTypeName[baseTypeName].count() : 0;
        };

        this.soloType = function(mapObjToSolo) {
            _.each(filtersByBaseTypeName, function(obj) {
                obj.isVisible(obj === mapObjToSolo);
            });
        };

        this.options = ko.pureComputed(function() {
            var nonZeroOnly = self.isCountFilterEnabled(),
                filteredBaseTypeNames = nonZeroOnly ? _.filter(SUPPORTED_BASE_TYPE_NAMES, function(baseTypeName) {
                    return filtersByBaseTypeName[baseTypeName].count();
                }) : SUPPORTED_BASE_TYPE_NAMES;

            return _.map(filteredBaseTypeNames, function(typeId) {
                return filtersByBaseTypeName[typeId];
            });
        });

        this.reset();
        this.updateCounts({});
    }


    return {
        getInstance: function() {
            if (!instance) {
                instance = new ControlFilter();
            }
            return instance;
        }
    };

});