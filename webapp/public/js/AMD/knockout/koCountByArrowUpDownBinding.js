/**
 * Adds functionality to textfields -> when arrow up/down key is pressed while
 * a textfield is focussed that contains a numberic value, its value will be counted up/down and the change event triggered.
 *
 * Example:
 *   <input type="text" data-bind="countByArrowUpDown: true, textInput: someObservable">
 */
define(['knockout', 'jquery', 'jquery-mousewheel'], function(ko, $) {

    'use strict';

    var NUMBER_REGEX = /^-?[0-9]+?$/,
        UP = 38,
        DOWN = 40,
        KEY_HANDLER = function (e) {
            var val = e.target.value,
                numVal = NUMBER_REGEX.test(''+val) ? parseInt(val) : null,
                keyCode = e.keyCode,
                mousewheelDelta = e.deltaY || 0,
                countUp = keyCode === UP || mousewheelDelta > 0,
                countDown = keyCode === DOWN || mousewheelDelta < 0;

            // console.log('e.deltax: %s, e.deltay: %s, e.deltaFactor: %s', e.deltaX, e.deltaY, e.deltaFactor);

            if ((countUp || countDown) && !isNaN(numVal)) {
                numVal += countUp ? 1 : countDown ? -1 : 0;
                e.preventDefault();
                $(e.target).val(numVal).trigger('change');
            }
        };

    ko.bindingHandlers.countByArrowUpDown = {
        init: function (element, valueAccessor) {
            $(element).on("keydown mousewheel", KEY_HANDLER);
            // console.warn('keyhandler handler bound');
            ko.utils.domNodeDisposal.addDisposeCallback(element, function () {
                $(element).off('keydown mousewheel', KEY_HANDLER);
                // console.warn('keyhandler handler unbound');
            });
        }
    };

});