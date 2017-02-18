define(['underscore', 'util', 'AMD/control/Control', 'AMD/midi/MidiOpts'], function(_, util, Control, MidiOpts) {

    'use strict';

    return Control.createSubclass('Label', ['labelh', 'labelv'], MidiOpts.LABEL, {
        _init: function(json) {
            this._super(json);
        },
        /** @override */
        colorCodes: {
            red: '#FF281C',
            green: '#75CC26',
            blue: '#00C4A8',
            yellow: '#FFED00',
            purple: '#AA7FAA',
            gray: '#B2B2B2',
            orange: '#F9A01C',
            brown: '#826647',
            pink: '#FF05F2'
        }
    });

});