define(['knockout', 'jquery', 'util'], function(ko, $, util) {

    'use strict';

    ko.bindingHandlers.dblClick = {
        init: function(element, valueAccessor /*, allBindings, viewModel, bindingContext*/) {
            var handler = valueAccessor();
            util.assertFunction(handler, 'Invalid handler for dblClick binding on element {}', element);
            $(element).on('dblclick', handler);
            ko.utils.domNodeDisposal.addDisposeCallback(element, function() {
                $(element).off('dblclick', handler);
            });        
        }
    };

});