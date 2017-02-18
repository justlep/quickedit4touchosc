/**
 * An extender to numeric observables, adding to it a `validIntOrNull` computed observable
 * which becomes null if the value is invalid, otherwise the checked number.
 *
 * Usage:
 *    ko.observable().extend({validIntOrNull: true})
 *    ko.observable().extend({validIntOrNull: {min: 0}})
 *    ko.observable().extend({validIntOrNull: {max: 0}})
 *    ko.observable().extend({validIntOrNull: {min: -100, max: 100}})
 */
define(['knockout'], function(ko) {
    'use strict';

    ko.extenders.validIntOrNull = (function() {
        var NUMBER_REGEX = /^-?[0-9]+?$/,
            checkMinMax = function(v, min, max) {
                return v >= min && v <= max;
            },
            checkMin = function (v, min, __max) {
                return v >= min;
            },
            checkMax = function (v, __min, max) {
                return v <= max;
            };

        return function(target, opts) {
            var hasMin = opts && typeof opts.min === 'number',
                hasMax = opts && typeof opts.max === 'number',
                checkerFn = (hasMin && hasMax) ? checkMinMax : hasMin ? checkMin : hasMax ? checkMax : null;

            target.validIntOrNull = ko.computed(function() {
                var v = target(),
                    num = NUMBER_REGEX.test(''+v) && parseInt(v, 10),
                    isValid = (typeof num === 'number') && (!checkerFn || checkerFn(num, opts.min, opts.max));

                return isValid ? num : isValid;
            });

            return target;
        };
    })();

});