define(['knockout', 'LOG'], function(ko, LOG) {

    'use strict';

    ko.bindingHandlers.logContext = {
        update: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
            LOG.warn('Context for element %o -> %o', element, bindingContext);
        }
    };

});