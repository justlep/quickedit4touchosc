define(['knockout', 'underscore', 'util', 'LOG', 'AMD/midi/MidiUtil', 'AMD/midi/MessageTypes',
        'AMD/ControlSelection', 'AMD/knockout/koValidIntOrNullExtender', 'koToggleableExtender'],

    function(ko, _, util, LOG, MidiUtil, MessageTypes, ControlSelection) {

    'use strict';

    var instance = null,
        ASPECT = {
            VALUE: 'VALUE',
            TOUCH: 'TOUCH',
            COLOR: 'COLOR'
        },
        MODE_OFF = {},
        createMode = function(aspect, singleVar, singleControl) {
            util.assertObjectOrEmpty(singleControl, 'Invalid singleControl: {}', singleControl);
            util.assertStringOrEmpty(singleVar, 'Invalid singleVar: {}', singleVar);
            /*jshint -W018 */
            util.assert(!singleControl === !singleVar, 'Invalid combination of singleControl and singleVar');
            /*jshint +W018 */
            util.assert(!aspect || ASPECT[aspect], 'Invalid aspect "{}"', aspect);
            util.assert(aspect || singleControl, 'Either aspect or control is required');

            var effectiveAspect = aspect || (
                    (singleControl.valueVars.indexOf(singleVar) >= 0) ? ASPECT.VALUE :
                    (singleControl.touchVars.indexOf(singleVar) >= 0) ? ASPECT.TOUCH :
                    (singleControl.colorVars.indexOf(singleVar) >= 0) ? ASPECT.COLOR : null
                ),
                mode = {
                    singleControl: singleControl,
                    singleVar: singleVar,
                    isSingleEdit: !!singleControl,
                    isMultiEdit: !singleControl,
                    aspect: effectiveAspect,
                    isValue: (effectiveAspect === ASPECT.VALUE),
                    isTouch: (effectiveAspect === ASPECT.TOUCH),
                    isColor: (effectiveAspect === ASPECT.COLOR)
                };

            util.assert(mode.aspect, 'Unable to determine aspect for new MidiEditor EditorMode');
            mode.isMultiEditValue = mode.isMultiEdit && mode.isValue;
            mode.isMultiEditTouch = mode.isMultiEdit && mode.isTouch;
            mode.isMultiEditColor = mode.isMultiEdit && mode.isColor;

            return mode;
        };

    /**
     * @constructor
     */
    function MidiEditor() {
        var self = this,
            _sysex = ko.observable(),
            selection = ControlSelection.getInstance(),
            DEFAULT_MESSAGE_TYPE = MessageTypes.CC;

        this.isPreviewEnabled = ko.observable(false).extend({toggleable: true});
        this.tableNeedsRedraw = ko.observable(true).extend({notify: 'always'});
        this.isNoteNamesEnabled = ko.observable(false).extend({toggleable: true});
        this.triggerTableRedraw = function() {
            self.tableNeedsRedraw(false);
            self.tableNeedsRedraw(true)
        };

        this.canRemoveMidi = ko.observable(false);
        this.isRemoveConfirmed = ko.observable(false).extend({toggleable: true});

        this.mode = ko.observable(MODE_OFF);
        this.mode.subscribe(function(mode) {
            if (!mode.aspect) {
                return;
            }
            var midiObj = mode.singleControl && mode.singleControl.getValueForMidiVar(mode.singleVar),
                messageType = (midiObj && MessageTypes.byId[midiObj._type]) || MessageTypes.CC;

            if (mode.isMultiEdit) {
                self.isPreviewEnabled(true);
            }

            self.isRemoveConfirmed(false);

            if (midiObj) {
                // LOG.dev('midiObj after mode change: %s', JSON.stringify(midiObj));
                self.channel(midiObj._channel);
                self.data1(midiObj._data1);
                self.data2f(midiObj._data2f);
                self.data2t(midiObj._data2t);
                self.sysex(midiObj._sysex || '');
                self.messageType(messageType);
                self.canRemoveMidi(true);
            } else {
                self.resetMidiVars();
                self.canRemoveMidi(mode.isMultiEdit);
            }
        });

        this.defaultMidiChannel = ko.observable(1);
        this.midiChannelOptions = _.range(1, 17);

        this.resetMidiVars = function() {
            self.isRemoveConfirmed(false);
            self.channel(self.defaultMidiChannel());
            self.data1(DEFAULT_MESSAGE_TYPE.data1Min);
            self.data2f(DEFAULT_MESSAGE_TYPE.data2fMin);
            self.data2t(DEFAULT_MESSAGE_TYPE.data2tMax);
            self.sysex('');
            self.messageType(DEFAULT_MESSAGE_TYPE);
            self.includeChannel(true);
            self.includeData1(true);
            self.includeData2f(true);
            self.includeData2t(true);
        };

        this.messageTypeOptions = ko.computed(function() {
            if (!self.mode().aspect) {
                return null;
            }
            var mode = self.mode(),
                control = mode.singleControl,
                typesProperty = mode.isValue ? 'valueTypes' : mode.isTouch ? 'touchTypes' : mode.isColor ? 'colorTypes' : null,
                opts;

            if (mode.isSingleEdit && control) {
                opts = control[typesProperty];
            } else if (mode.isMultiEdit) {
                opts = MessageTypes.forMidiMultiEdit;
                // opts = _.chain(selection.controls()).pluck(typesProperty).unique().flatten().unique().value();
            }
            return opts || [];
        });

        this.isEditedControlVar = function(varName, control) {
            var mode = self.mode();
            return mode.singleControl === control && mode.singleVar === varName;
        };

        this.editSingle = function(varName, control) {
            self.mode(createMode(null, varName, control));
        };
        this.editMultiValue = function() {
            self.mode(createMode(ASPECT.VALUE, null, null));
        };
        this.editMultiTouch = function() {
            self.mode(createMode(ASPECT.TOUCH, null, null));
        };
        this.editMultiColor = function() {
            self.mode(createMode(ASPECT.COLOR, null, null));
        };

        this.messageType = ko.observable();
        this.channel = ko.observable().extend({validIntOrNull: {min:1, max:16}});
        this.data1 = ko.observable().extend({validIntOrNull: true});
        this.data2f = ko.observable().extend({validIntOrNull: true});
        this.data2t = ko.observable().extend({validIntOrNull: true});
        this.sysex = ko.computed({
            read: _sysex,
            write: function(newSysex) {
                _sysex((newSysex||'').replace(/\s/g, '').toUpperCase());
            }
        });

        // include*: whether or not to change that value in multiEdit mode
        this.includeChannel = ko.observable(true).extend({toggleable: true});
        this.includeData1 = ko.observable(true).extend({toggleable: true});
        this.includeData2f = ko.observable(true).extend({toggleable: true});
        this.includeData2t = ko.observable(true).extend({toggleable: true});

        this.includeAll = ko.computed(function() {
            return self.includeChannel() &&
                    self.includeData1() &&
                    self.includeData2f() &&
                    self.includeData2t();
        });

        // auto-adjust current values to valid ones whenever the message type is updated
        this.messageType.subscribe(function(msgType) {
            if (msgType) {
                var mode = self.mode(),
                    channel = self.channel.validIntOrNull() || 0,
                    data1 = self.data1.validIntOrNull() || 0,
                    data2f = self.data2f.validIntOrNull() || 0,
                    data2t = self.data2t.validIntOrNull() || 0;

                self.channel(Math.max(msgType.channelMin, Math.min(channel, msgType.channelMax)));
                self.data1(Math.max(msgType.data1Min, Math.min(data1, msgType.data1Max)));
                self.data2f(Math.max(msgType.data2fMin, Math.min(data2f, msgType.data2fMax)));
                self.data2t(Math.max(msgType.data2tMin, Math.min(data2t, msgType.data2tMax)));

                if (mode.isMultiEdit) {
                    // auto-inc values need to be reset, otherwise submit will be blocked without visible reason
                    if (msgType.hasFixChannel) {
                        self.autoIncChannel(0);
                    }
                    if (msgType.hasFixData1) {
                        self.autoIncData1(0);
                    }
                    if (msgType.hasFixData2f) {
                        self.autoIncData2f(0);
                    }
                    if (msgType.hasFixData2t) {
                        self.autoIncData2t(0);
                    }
                }

                if (!msgType.sysex) {
                    self.sysex('');
                }
            }
        });

        this.isMessageTypeNote = ko.pureComputed(function() {
            return self.messageType() === MessageTypes.NOTE;
        });

        this.autoIncOptions = _.range(-3, 4);
        this.autoIncChannelOptions = _.range(-1, 2);
        this.formatAutoIncOption = function(val) {
            return !val ? 'fix' : (val > 0) ? ('+'+val) : val;
        };
        this.autoIncChannel = ko.observable(false).extend({toggleable: true});
        this.autoIncData1 = ko.observable(false).extend({toggleable: true});
        this.autoIncData2f = ko.observable(false).extend({toggleable: true});
        this.autoIncData2t = ko.observable(false).extend({toggleable: true});

        this.midiOrPreviewString = function(control, midiVar) {
            if (self.isPreviewEnabled()) {
                var valueMap = self.submittableMidiObjectMap(),
                    uuid2MidiMap = valueMap && valueMap[control.uid],
                    midiObj = uuid2MidiMap && uuid2MidiMap[midiVar];
                return midiObj ? MidiUtil.midiJsonToString(midiObj, self.isNoteNamesEnabled()) : '-';
            } else {
                return control.getValueStringForMidiVar(midiVar, self.isNoteNamesEnabled());
            }
        };

        this.reset = function() {
            self.mode(MODE_OFF);
            self.isPreviewEnabled(false);
            self.resetMidiVars();
        };

        /**
         * Map<ControlUid, Map<midiVarName, MidiObject>>
         */
        this.submittableMidiObjectMap = ko.computed(function() {
            var mode = self.mode(),
                messageType = mode && mode.isMultiEdit && self.messageType();

            if (!messageType) {
                return null;
            }

            var map = {},
                channel = self.channel.validIntOrNull(),
                data1 = self.data1.validIntOrNull(),
                data2f = self.data2f.validIntOrNull(),
                data2t = self.data2t.validIntOrNull(),
                sysex = self.sysex(),
                includeAll = self.includeAll(),
                includeData1 = self.includeData1(),
                includeData2f = self.includeData2f(),
                includeData2t = self.includeData2t(),
                includeChannel = self.includeChannel(),
                includeNone = !(includeChannel || includeData1 || includeData2f || includeData2t),
                autoIncChannel = includeChannel ? self.autoIncChannel() : 0,
                autoIncData1 = includeData1 ? self.autoIncData1() : 0,
                autoIncData2f = includeData2f ? self.autoIncData2f() : 0,
                autoIncData2t = includeData2t ? self.autoIncData2t() : 0,
                onlyUpdateExisting = !includeAll;

                if (channel === null || data1 === null || data2f === null || data2t === null || includeNone) {
                return null;
            }

            try {
                _.each(selection.controls(), function(control) {
                    var varNames = control.getMidiVarNamesByAspect(mode.isValue, mode.isTouch, mode.isColor);
                    map[control.uid] = _.reduce(varNames, function(varNameToMidiObjMap, midiVarName) {
                        var existingMidiObj = onlyUpdateExisting && control.getValueForMidiVar(midiVarName),
                            existingMidiObjHasSameType = existingMidiObj && existingMidiObj._type === messageType.id,
                            validMidiObj;

                        // LOG.warn('---> existingMidiObj (midiVar="%s"): %o', midiVarName, existingMidiObj);

                        if (onlyUpdateExisting) {
                            if (!existingMidiObj) {
                                return varNameToMidiObjMap;
                            } else if (existingMidiObjHasSameType) {
                                validMidiObj = messageType.createValidControlMidiObject(midiVarName,
                                    includeChannel ? channel : existingMidiObj._channel,
                                    includeData1 ? data1 : existingMidiObj._data1,
                                    includeData2f ? data2f : existingMidiObj._data2f,
                                    includeData2t ? data2t : existingMidiObj._data2t,
                                    existingMidiObj._sysex || '');
                                // LOG.warn('existing midi obj: %s', JSON.stringify(existingMidiObj));
                                // LOG.warn('validMidiObj obj: %s', JSON.stringify(validMidiObj));
                            } else {
                                // Leave existing midi unchanged if type is different
                                validMidiObj = existingMidiObj;
                            }
                        } else {
                            validMidiObj = messageType.createValidControlMidiObject(midiVarName, channel,
                                data1, data2f,
                                data2t, sysex);
                        }

                        if (!validMidiObj) {
                            throw 'invalid midiObj';
                            // util.formatString('Invalid midiObject for control {}, varName="{}"', control.name, midiVarName);
                        }

                        channel += autoIncChannel;
                        data1 += autoIncData1;
                        data2f += autoIncData2f;
                        data2t += autoIncData2t;

                        varNameToMidiObjMap[midiVarName] = validMidiObj;
                        return varNameToMidiObjMap;
                    }, {});
                });
            } catch (e) {
                // LOG.warn(e);
                map = null;
            }

            return map;
        });

        /**
         * A valid midiObject (if in singleMode and values are valid), otherwise null.
         */
        this.submittableMidiObject = ko.computed(function() {
            var mode = self.mode(),
                messageType = mode.isSingleEdit && self.messageType(),
                midiObj = messageType && messageType.createValidControlMidiObject(
                        mode.singleVar,
                        self.channel.validIntOrNull(),
                        self.data1.validIntOrNull(),
                        self.data2f.validIntOrNull(),
                        self.data2t.validIntOrNull(),
                        self.sysex()
                );

            return midiObj || null;
        });

        this.canSubmit = ko.computed(function() {
            var mode = self.mode();
            return !!(mode.isSingleEdit ? self.submittableMidiObject() : mode.isMultiEdit ? self.submittableMidiObjectMap() : false);
        });

        this.removeMidi = function() {
            if (!self.canRemoveMidi()) {
                return;
            }

            if (!self.isRemoveConfirmed()) {
                self.isRemoveConfirmed(true);
                return;
            }

            var mode = self.mode();

            if (mode.isSingleEdit) {
                mode.singleControl.removeMidiVar(mode.singleVar);
                mode.singleControl.finalizePropertyEdit();
            } else if (mode.isMultiEdit) {
                selection.forEachControl(function (control) {
                    control.removeAllMidiByAspect(mode.isValue, mode.isTouch, mode.isColor);
                    control.finalizePropertyEdit();
                });
            }
            self.triggerTableRedraw();
            self.reset();
        };

        this.submit = function() {
            if (!self.canSubmit()) {
                LOG.dev('Cannot submit MidiEditor now');
                return;
            }

            var tableNeedsRedraw = false,
                mode = self.mode(),
                multiMap = mode.isMultiEdit && self.submittableMidiObjectMap();

            if (multiMap) {
                selection.forEachControl(function(control) {
                    // LOG.warn('uid %s -> midiObj: %o', control.uid, multiMap[control.uid]);
                    _.each(multiMap[control.uid], function(midiObj) {
                        control.setMidi(midiObj);
                        control.finalizePropertyEdit();
                    });
                });
                tableNeedsRedraw = true;
            } else if (mode.isSingleEdit) {
                mode.singleControl.setMidi(self.submittableMidiObject());
                mode.singleControl.finalizePropertyEdit();
                tableNeedsRedraw = true;
            }

            if (tableNeedsRedraw) {
                self.triggerTableRedraw();
            }
            self.reset();
        };
    }

    return {
        getInstance: function() {
            if (!instance) {
                instance = new MidiEditor();
            }
            return instance;
        }
    };

});