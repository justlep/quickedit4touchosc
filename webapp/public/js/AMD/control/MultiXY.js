define(['underscore', 'util', 'AMD/control/Control', 'AMD/midi/MidiOpts'], function(_, util, Control, MidiOpts) {

    'use strict';

    return Control.createSubclass('MultiXY', ['multixy'], MidiOpts.MULTIXY, {
        _init: function(json) {
            this._super(json);
        }
    });

});