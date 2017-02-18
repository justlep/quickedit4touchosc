define(['underscore', 'util', 'LOG', 'AMD/midi/MessageTypes'], function(_, util, LOG, MessageTypes) {

    'use strict';

    var NOTE_NAMES = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];

    /**
     * Returns the note name for a given note index
     * @param noteValue (Number) 0==C-2, 24==C0, 127==G8
     * @returns (String) note name, e.g. C#3
     */
    function getNoteName(noteValue) {
        var octave =  Math.floor((noteValue - 24) / 12);
        return NOTE_NAMES[noteValue % 12] + octave;
    }

    /**
     * Returns the note name for a given note index
     * @param noteValue (Number) 0==C-2, 24==C0, 127==G8
     * @returns (String) note name, e.g. "49: C2#"
     */
    function getDetailedNoteName(noteValue) {
        var octave =  Math.floor((noteValue - 24) / 12),
            noteName = NOTE_NAMES[noteValue % 12].replace(/^(.)/, '$1' + octave);

        return noteValue + ' (' + noteName + ')';
    }

    function midiJsonToString(midiObj, showNoteName) {
        var msgType = midiObj && MessageTypes.byId[midiObj._type];
        if (!msgType) {
            return '- none -';
        }
        var parts = [],
            shortName = msgType.shortName,
            data1 = midiObj._data1,
            data1OrNoteName = (showNoteName && msgType === MessageTypes.NOTE) ? getDetailedNoteName(data1) : data1;

        if (msgType.hasFixData1) {
            parts.push(shortName);
        } else {
            parts.push(msgType.shortName + ' ' + data1OrNoteName);
        }
        if (!msgType.hasFixData2f && !msgType.hasFixData2t) {
            parts.push('[' + midiObj._data2f + '-' + midiObj._data2t + ']');
        }

        if (!msgType.hasFixChannel) {
            parts.push(' [Ch' + midiObj._channel+']');
        }

        return parts.join(' ');
    }

    return {
        getNoteName: getNoteName,
        getDetailedNoteName: getDetailedNoteName,
        NOTE_NAMES: NOTE_NAMES,
        midiJsonToString: midiJsonToString,
        MessageTypes: MessageTypes
    };

});