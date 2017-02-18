/*jshint -W030 */
define(['underscore', 'LOG'], function(_, LOG) {

    'use strict';

    var util = {},
        idsCounter = 0,
        startTimesById = {},
        /**
         * Throws an error;
         * To be called from within one of the static assert* methods.
         * @param assertionArgs (Arguments) the original arguments from the assert*-call
         * @param [optionalMessageOffset] (Number) optional offset of the actual error message
         *                                         within the assertionArgs (default: 1)
         */
        throwError = function(assertionArgs, optionalMessageOffset) {
            var messageOffset = optionalMessageOffset || 1,
                messageAndArgumentsArray = Array.prototype.slice.call(assertionArgs, messageOffset),
                emptySafeMessageAndArgsArray = (messageAndArgumentsArray.length) ?
                    messageAndArgumentsArray : ['Assertion failed'],
                errorMessage = util.formatString.apply(null, emptySafeMessageAndArgsArray);

            LOG.error(errorMessage);
            throw errorMessage;
        },
        /**
         * Origin: https://developer.mozilla.org/de/docs/Web/JavaScript/Reference/Global_Objects/Math/round
         * Decimal adjustment of a number.
         *
         * @param (String)  type  The type of adjustment.
         * @param (Number)  value The number.
         * @param (Integer) exp   The exponent (the 10 logarithm of the adjustment base), e.g. -2 for 2 digits precision
         * @returns (Number) The adjusted value.
         */
        decimalAdjust = function(type, value, exp) {
            // If the exp is undefined or zero...
            if (typeof exp === 'undefined' || +exp === 0) {
                return Math[type](value);
            }
            value = +value;
            exp = +exp;
            // If the value is not a number or the exp is not an integer...
            if (isNaN(value) || !(typeof exp === 'number' && exp % 1 === 0)) {
                return NaN;
            }
            // Shift
            value = value.toString().split('e');
            value = Math[type](+(value[0] + 'e' + (value[1] ? (+value[1] - exp) : -exp)));
            // Shift back
            value = value.toString().split('e');
            return +(value[0] + 'e' + (value[1] ? (+value[1] + exp) : exp));
        };


    util = {

        /** @static */
        NOP: function(){},

        /** @static */
        nextId: function() {
            return ++idsCounter;
        },

        /**
         * Returns a given String with placeholders replaced.
         * Contained placeholders '{}' will be replaced with additional parameters in the respective order.
         * @param s (mixed) what to print
         * @params (mixed*) (optional) any number of values replacing the placeholders in s
         * @static
         */
        formatString: function(s) {
            var out = '' + s;
            for (var i = 1, len = arguments.length; i < len; ++i) {
                out = out.replace('{}', arguments[i]);
            }
            return out;
        },

        /**
         * Base64-decodes a string with fallback to original if failed
         * @param s (String)
         * @returns (String) the decoded string or the original if an error occurred during decode
         */
        decodeBase64: function(s) {
            var out;
            try {
                out = atob(s || '');
                // fixed non-utf8-compatible base64 encoding of touch osc editor
                // out = decodeURIComponent(escape(out));
            } catch (e) {
                out = s;
            }
            return out || '';
        },

        /** @static */
        assert: function(expr) {
            expr || throwError(arguments);
        },
        /** @static */
        assertDefined: function(expr) {
            (typeof expr !== 'undefined') || throwError(arguments);
        },
        /** @static */
        assertBoolean: function(expr) {
            (typeof expr === 'boolean') || throwError(arguments);
        },
        /** @static */
        assertBooleanOrUndefined: function(expr) {
            (typeof expr === 'boolean' || typeof expr === 'undefined') || throwError(arguments);
        },
        /** @static */
        assertString: function(expr) {
            (typeof expr === 'string') || throwError(arguments);
        },
        /** @static */
        assertNonEmptyString: function(expr) {
            (typeof (!!expr && expr) === 'string') || throwError(arguments);
        },
        /** @static */
        assertStringOrEmpty: function(expr) {
            (!expr || typeof expr === 'string') || throwError(arguments);
        },
        /** @static */
        assertNumber: function(expr) {
            (typeof expr === 'number') || throwError(arguments);
        },
        /** @static */
        assertNumberInRange: function(expr, min, max) {
            (typeof expr === 'number' && expr >= min && expr <= max) || throwError(arguments, 3);
        },
        /** @static */
        assertNumberInRangeOrEmpty: function(expr, min, max) {
            (!expr || (typeof expr === 'number' && expr >= min && expr <= max)) || throwError(arguments, 3);
        },
        /** @static */
        assertFunction: function(expr) {
            (typeof expr === 'function') || throwError(arguments);
        },
        /** @static */
        assertFunctionOrEmpty: function(expr) {
            (!expr || (typeof expr === 'function')) || throwError(arguments);
        },
        /** @static */
        assertObject: function(expr) {
            (expr && typeof expr === 'object') || throwError(arguments);
        },
        /** @static */
        assertObjectOrEmpty: function(expr) {
            (!expr || (typeof expr === 'object')) || throwError(arguments);
        },
        /** @static */
        assertArray: function(expr) {
            (expr && expr instanceof Array) || throwError(arguments);
        },
        /** @static */
        assertNonEmptyArray: function(expr) {
            (expr && expr instanceof Array && expr.length) || throwError(arguments);
        },
        /** @static */
        assertArrayOrEmpty: function(expr) {
            (!expr || expr instanceof Array) || throwError(arguments);
        },
        assertElement: function(expr) {
            (expr && _.isElement(expr)) || throwError(arguments);
        },
        assertObjectHasProperties: function(obj, propertyNames) {
            this.assertObject(obj, arguments[2] || 'Given obj parameter is not an object');
            (propertyNames||[]).forEach(function(propName) {
                if (typeof obj[propName] === 'undefined') {
                    LOG.warn(arguments[2] || 'Given object is invalid');
                    throwError([obj, 'Missing property: "{}"']);
                }
            });
        },

        /**
         * @param num (Number)
         * @param min (Number)
         * @param max (Number)
         * @returns {boolean} true if num is a number and within min and max
         */
        isNumberInRange: function(num, min, max) {
            return !isNaN(num) && num >= min && num <= max;
        },

        /**
         * @static
         * Copies all properties of source objects to a given target object.
         * @param target (Object)
         * @param sources (*Object) one or more objects whose properties are to be copied to the target
         * @returns (Object) the target
         */
        extend: function(target, /*...*/sources) {
            return _.extend.apply(_, arguments);
        },

        /**
         * @static
         * Memorizes the current time under a given id.
         * A subsequent call of {@link #stopTimer} will then return the time difference in millis.
         * @param id (Number) some id
         */
        startTimer: function(id) {
            this.assert(!!id, 'invalid id for util.startTime: ', id);
            startTimesById[''+id] = +new Date();
        },

        /**
         * Returns a new class (constructor) by prototype-inheritance from a given one.
         * As lengthy prototype chains may have performance impacts, this implementation only supports ONE level of inheritance,
         * throwing an error if tried otherwise.
         * @param superClass (function) constructor to be inherited from
         * @param proto (object) the derived class' prototype
         *            - _init (function) constructor of the new class (can call this._super(..) to invoke parent constructor)
         *            - any number of properties and methods
         * @static
         */
        extendClass: function(superClass, proto /* additionalProtos */) {
            this.assertFunction(superClass, 'Expected a constructor function for lep.util.extendClass superClass');
            this.assert(!superClass.prototype || !superClass.prototype._super, 'util.extendClass does not support long prototype chains');

            var Fn = function(){};
            Fn.prototype = superClass.prototype;

            var newConstructorFn = proto._init,
                newClass = function() {
                    newConstructorFn.apply(this, arguments);
                },
                newPrototype = this.extend(new Fn(), proto);

            for (var i = 2; i < arguments.length; i++) {
                _.extend(newPrototype, arguments[i]);
            }

            delete newPrototype._init;
            newPrototype._super = function() {
                superClass.apply(this, arguments);
            };
            newClass.prototype = newPrototype;
            return newClass;
        },

        /**
         * Pads the given object with leading zeros until its string representation is at least `digits` long.
         * @param numOrStr (number|String)
         * @param digits (number) intended total digits incl leading zeroes
         * @returns {string}
         */
        paddLeft: function(numOrStr, digits, paddChar) {
            var s = '' + numOrStr;
            for (var i=digits-s.length, _paddChar = paddChar || '0'; i>0; i--) {
                s = _paddChar + s;
            }
            return s;
        },

        /**
         * @static
         * Returns the time in milliseconds that passed between now
         * and the last call of {@link #startTimer} for a given id.
         * @param id (Number) some id
         * @return (Number) time in millis; -1 if timerStart wasn't called for that id before
         */
        stopTimer: function(id) {
            var now = +new Date();
            return now - (startTimesById[''+id] || (now + 1));
        },

        /**
         * Rounds the given number to a given number of decimals (mathematically correct, unlike Math.round)
         * See https://developer.mozilla.org/de/docs/Web/JavaScript/Reference/Global_Objects/Math/round)
         * @param value (Number)
         * @param [digits] (Number)
         * @returns (Number)
         */
        round10: function(value, decimals) {
            return decimalAdjust('round', value, -(decimals||0));
        }
    };

    return util;
});