define(['underscore', 'util', 'AMD/control/Control', 'AMD/midi/MidiOpts'], function(_, util, Control, MidiOpts) {

    'use strict';

    return Control.createSubclass('MultiFader', ['multifaderh', 'multifaderv'], MidiOpts.MULTIFADER, {
        _init: function(json) {
            this._super(json);
        }
    });

});