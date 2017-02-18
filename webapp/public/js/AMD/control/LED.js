define(['underscore', 'util', 'AMD/control/Control', 'AMD/midi/MidiOpts'], function(_, util, Control, MidiOpts) {

    'use strict';

    return Control.createSubclass('LED', ['led'], MidiOpts.LED, {
        _init: function(json) {
            this._super(json);
        },
        /** @override */
        colorCodes: {
            red: '#ae2a2a',
            green: '#2aae2a',
            blue: '#2424a6',
            yellow: '#afaf16',
            purple: '#6d0a6d',
            gray: '#4f4f4f',
            orange: '#d67c00',
            brown: '#372806',
            pink: '#ff5bff'
        }
    });

});