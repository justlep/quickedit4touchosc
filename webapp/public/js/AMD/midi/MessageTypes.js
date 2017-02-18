define(['knockout', 'underscore', 'util', 'LOG'], function(ko, _, util, LOG) {

    'use strict';

    var MessageTypes = {all: [], basic: [], byId: {}},
        FIX_CHANNEL_DATA1_DATA2 = {
            channelMax: 1,
            data1Max: 0,
            data2fMax: 0,
            data2tMin: 127
        },
        POS_NUMBER_REGEX = /^\d+$/,
        SYSEX_REGEX = /^([0-9a-f]{2}?)+$/i;

    /**
     * @constructor
     */
    function MessageType(id, name, shortName, propsOverrides) {
        util.assertNumberInRange(id, 0, 9, 'Invalid id for MessageType "{}"', name);
        util.assertNonEmptyString(name, 'Invalid name for MessageType {}', id);
        util.assertNonEmptyString(shortName, 'Invalid shortName for MessageType {}', id);
        util.assertObjectOrEmpty(propsOverrides, 'Invalid propsOverrides for MessageType "{}": {}', name, propsOverrides);
        this.id = id;
        this.name = name;
        this.shortName = shortName;
        this.channelMin = 1;
        this.channelMax = 16;
        this.data1Min = 0;
        this.data1Max = 127;
        this.data2fMin = 0;
        this.data2fMax = 127;
        this.data2tMin = 0;
        this.data2tMax = 127;
        this.sysex = false;
        this.data1IsNote = false;
        this.data1IsCC = false;
        _.extend(this, propsOverrides);

        this.channelOptions = _.range(1, 1 + this.channelMax);
        this.hasFixChannel = this.channelOptions.length === 1;
        this.hasFixData1 = this.data1Min === this.data1Max;
        this.hasFixData2f = this.data2fMin === this.data2fMax;
        this.hasFixData2t = this.data2tMin === this.data2tMax;
        this.hasSysex = this.sysex === true;
        this.hasData2Range = !this.hasFixData2f && !this.hasFixData2t;
    }

    MessageType.prototype = {
        isValidChannel: function(val) {
            return (typeof val === 'number') && POS_NUMBER_REGEX.test(''+val) && val >= this.channelMin && val <= this.channelMax;
        },
        isValidData1: function(val) {
            return (typeof val === 'number') && POS_NUMBER_REGEX.test(''+val) && val >= this.data1Min && val <= this.data1Max;
        },
        isValidData2f: function(val) {
            return (typeof val === 'number') && POS_NUMBER_REGEX.test(''+val) && val >= this.data2fMin && val <= this.data2fMax;
        },
        isValidData2t: function(val) {
            return (typeof val === 'number') && POS_NUMBER_REGEX.test(''+val) && val >= this.data2tMin && val <= this.data2tMax;
        },
        isValidSysex: function(val) {
            return (!this.sysex && val === '') || (this.sysex && SYSEX_REGEX.test(val));
        },
        _createValidMidiObject: function(channel, data1, data2f, data2t, sysex, varName) {
            var isValid = this.isValidChannel(channel) && this.isValidData1(data1) &&
                          this.isValidData2f(data2f) && this.isValidData2t(data2t) && this.isValidSysex(sysex),
                midiObj = null;

            // LOG.warn('channel: %s, data1: %s, data2f: %s, data2t: %s, sysex: %s, varName: %s, isValid: %s',
            //          channel, data1, data2f, data2t, sysex, varName, isValid);

            if (isValid) {
                midiObj = {};
                midiObj._type = this.id;
                midiObj._channel = channel;
                midiObj._data1 = data1;
                midiObj._data2f = data2f;
                midiObj._data2t = data2t;
                midiObj._sysex = sysex;
                if (varName) {
                    midiObj._var = varName;
                }
            }
            return midiObj;
        },
        createValidControlMidiObject: function(varName, channel, data1, data2f, data2t, sysex) {
            // LOG.warn('createValidControlMidiObject: %o', arguments);
            util.assertNonEmptyString(varName, 'Invalid varName for createValidControlMidiObject');
            return this._createValidMidiObject(channel, data1, data2f, data2t, sysex, varName);
        },
        noteOptions: _.range(0, 128),
        data2Label: 'Range (data2)'
    };

    /** @static */
    MessageType.create = function(id, name, shortName, propsOverrides) {
        var msgType = new MessageType(id, name, shortName, propsOverrides);
        MessageTypes.all.push(msgType);
        MessageTypes.byId[id] = msgType;
        return msgType;
    };

    /** @static */
    MessageType.createBasic = function(id, name, shortName, propsOverrides) {
        var msgType = MessageType.create(id, name, shortName, propsOverrides);
        MessageTypes.basic.push(msgType);
        return msgType;
    };

    MessageTypes.CC = MessageType.createBasic(0, 'Control Change', 'CC', {data1IsCC: true});
    MessageTypes.NOTE = MessageType.createBasic(1, 'Note', 'Note', {data1IsNote: true, data2Label: 'Velocity'});
    MessageTypes.PROGRAM_CHANGE = MessageType.createBasic(2, 'Program Change', 'PrChg', {data1Max: 0});
    MessageTypes.POLY_PRESSURE = MessageType.createBasic(6, 'Poly Pressure', 'PPres', {data1IsNote: true});
    MessageTypes.CHANNEL_PRESSURE = MessageType.createBasic(7, 'Channel Pressure', 'ChPres', {data1Max: 0});
    MessageTypes.PITCHBEND = MessageType.createBasic(8, 'PitchBend', 'PBend', {data1Max: 0, data2tMax: 16383});
    MessageTypes.START = MessageType.create(3, 'Start', 'Start', FIX_CHANNEL_DATA1_DATA2);
    MessageTypes.STOP = MessageType.create(4, 'Stop', 'Stop', FIX_CHANNEL_DATA1_DATA2);
    MessageTypes.CONTINUE = MessageType.create(5, 'Continue', 'Continue', FIX_CHANNEL_DATA1_DATA2);
    MessageTypes.SYSEX = MessageType.create(9, 'Sysex', 'Sysex', _.extend({}, FIX_CHANNEL_DATA1_DATA2, {sysex: true}));

    // LOG.dev('MessageTypes.all: %o', JSON.stringify(MessageTypes.all, null, 2));
    // LOG.dev('MessageTypes.basic: %o', JSON.stringify(MessageTypes.basic, null, 2));

    // (!) Redundant, but to keep in mind special treatment of MessageType options in Midi-Multi-Editing
    // Assuming that non-basic MessageTypes (Start, Stop, Continue, Sysex) are not sensible for MultiEdit
    // even if selected controls would support all message types.
    MessageTypes.forMidiMultiEdit = MessageTypes.basic;

    return MessageTypes;

});