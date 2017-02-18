define(['underscore', 'util', 'AMD/control/Control', 'AMD/midi/MidiOpts'], function(_, util, Control, MidiOpts) {

    'use strict';

    Control.createSubclass('Fader', ['faderh', 'faderv'], MidiOpts.FADER, {
        _init: function(json) {
            this._super(json);
        }
    });

});