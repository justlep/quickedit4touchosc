define(['underscore', 'util', 'AMD/control/Control', 'AMD/midi/MidiOpts'], function(_, util, Control, MidiOpts) {

    'use strict';

    return Control.createSubclass('Push', ['push'], MidiOpts.PUSH, {
        _init: function(json) {
            this._super(json);
        }
    });

});