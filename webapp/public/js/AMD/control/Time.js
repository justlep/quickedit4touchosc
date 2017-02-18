define(['underscore', 'util', 'AMD/control/Control', 'AMD/midi/MidiOpts'], function(_, util, Control, MidiOpts) {

    'use strict';

    return Control.createSubclass('Time', ['timeh', 'timev'], MidiOpts.TIME, {
        _init: function(json) {
            this._super(json);
        },
        getFixText: function() {
            return this.props._seconds ? '11:33:55' : '11:33';
        }
    });

});