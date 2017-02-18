define(['knockout'], function(ko) {
    'use strict';

    var NUMBER_REGEX = /^[0-9]+$/;

    ko.extenders.positiveNumber = function(target) {
        var result = ko.computed({
            read: target,
            write: function(newValue) {
                var current = target(),
                    isValid = NUMBER_REGEX.test('' + newValue),
                    valueToWrite = isValid ? (+newValue) : target.peek();

                if (valueToWrite !== current) {
                    target(valueToWrite);
                } else if (!isValid) {
                    target.notifySubscribers(valueToWrite);
                }
            }
        }).extend({ notify: 'always' });

        result(target());

        return result;
    };

});