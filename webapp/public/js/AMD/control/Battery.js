define(['underscore', 'util', 'AMD/control/Control', 'AMD/midi/MidiOpts'], function(_, util, Control, MidiOpts) {

    'use strict';

    return Control.createSubclass('Battery', ['batteryh', 'batteryv'], MidiOpts.BATTERY, {
        _init: function(json) {
            this._super(json);
        },
        getFixText: function() {
            return '100%';
        }
    });

});