define(['underscore', 'util', 'AMD/control/Control', 'AMD/midi/MidiOpts'], function(_, util, Control, MidiOpts) {

    'use strict';

    return Control.createSubclass('MultiPush', ['multipush'], MidiOpts.MULTIPUSH, {
        _init: function(json) {
            this._super(json);
            this.needsGrid = json._number_x > 1 || json._number_y > 1;
        }
    });

});