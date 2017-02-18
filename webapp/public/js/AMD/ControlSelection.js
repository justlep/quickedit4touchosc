define(['knockout', 'underscore', 'util', 'LOG', 'AMD/control/ControlSupport', 'koToggleableExtender'],
    function(ko, _, util, LOG, ControlSupport) {

    'use strict';

    var instance;

    /**
     * @constructor
     */
    function ControlSelection() {
        var self = this,
            flatControlsList = function(controlOrControls, checkForEmptyLabels) {
                var flatList = _.flatten([controlOrControls]),
                    isValidControlsList = _.every(flatList, ControlSupport.isControl);

                util.assert(isValidControlsList, 'Invalid controlOrControls for ControlSelection: {}', controlOrControls);

                return (checkForEmptyLabels && self.ignoreLabels.peek()) ? _.reject(flatList, ControlSupport.isLabel) : flatList;
            };


        this.ignoreLabels = ko.observable(true).extend({toggleable: true});
        this.ignoreLabels.subscribe(function(ignoreLabels) {
            if (ignoreLabels) {
                var controls = self.controls.peek(),
                    sizeBefore = controls.length,
                    filteredControls = _.reject(controls, ControlSupport.isLabel);

                if (filteredControls.length !== sizeBefore) {
                    self.controls(filteredControls);
                }
            }
        });

        this.controls = ko.observableArray().extend({deferred: true});
        this.isLocked = ko.observable(false).extend({toggleable: true});

        this.reset = function() {
            if (self.controls.peek().length) {
                self.controls.removeAll();
                LOG.debug('ControlSelection cleared');
            } else {
                LOG.debug('ControlSelection was empty already');
            }
            self.isLocked.toggleOff();
        };

        this.select = function(controlOrControls) {
            if (self.isLocked()) {
                // LOG.warn('Cant selected. ControlSelection is locked.');
                return;
            }
            var controlsToAdd = flatControlsList(controlOrControls, true), // consider empty labels
                controls = self.controls.peek(),
                hasAddableControls = _.some(controlsToAdd, function(control) {
                    return controls.indexOf(control) < 0;
                });

            if (hasAddableControls) {
                self.controls( _.union(controls, controlsToAdd) );
            }
        };

        this.unselect = function(controlOrControls) {
            if (self.isLocked()) {
                // LOG.warn('Cant unselect. ControlSelection is locked.');
                return;
            }
            var controlsToRemove = flatControlsList(controlOrControls),
                removableControls = _.intersection(self.controls.peek(), controlsToRemove);

            if (removableControls.length) {
                self.controls.removeAll(removableControls);
            }
        };

        this.toggleSelected = function(controlOrControls) {
            if (self.isLocked()) {
                // LOG.warn('Cant toggle selected. ControlSelection is locked.');
                return;
            }
            var controlsToToggle = flatControlsList(controlOrControls),
                controls = self.controls.peek(),
                selectedAndUnselected = _.partition(controlsToToggle, function(control) {
                    return controls.indexOf(control) >= 0;
                });

            _.each(selectedAndUnselected[0], self.unselect);
            _.each(selectedAndUnselected[1], self.select);
        };

        this.setAllowedControls = function(allowedControls) {
            var disallowedControls = _.difference(self.controls.peek(), allowedControls);
            if (disallowedControls.length) {
                self.unselect(disallowedControls);
            }
        };

        this.isControlSelected = function(control) {
            return self.controls().indexOf(control) >= 0;
        };

        this.forEachControl = function(callback) {
            _.each(self.controls(), callback);
        };
    }

    return {
        getInstance: function() {
            if (!instance) {
                instance = new ControlSelection();
            }
            return instance;
        }
    };

});