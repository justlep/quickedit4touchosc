define(['knockout'], function(ko) {

    'use strict';

    ko.bindingHandlers.focusAfterRender = {
        init: function(element, valueAccessor /*, allBindings, viewModel, bindingContext*/) {
            var opts = valueAccessor() || {select: false};
            setTimeout(function() {
                if (element && element.parentNode) {
                    if (typeof element.focus === 'function') {
                        element.focus();
                    }
                    if (opts.select && typeof element.select === 'function') {
                        element.select();
                    }
                }
            }, 50);
        }
    };

});