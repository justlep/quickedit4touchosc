/**
 * (!) This module must ONLY be required by its
 *     subclass modules OR ControlSupport.js
 */
define(['underscore', 'util', 'LOG', 'AMD/midi/MidiOpts', 'AMD/midi/MidiUtil', 'AMD/control/SvgControlTemplates', 'AMD/midi/MessageTypes'],
    function(_, util, LOG, MidiOpts, MidiUtil, SvgControlTemplates) {

    'use strict';

    var controlsCount = 1,
        ADAPTER_TYPE_PREFIX = '___control_adapter__';

    /**
     * @abstract
     * @constructor
     */
    function Control(json) {
        util.assertString(json && json._type, 'Invalid control json for Control. ', json);
        this.uid = 'ctrl_' + (++controlsCount).toString(36);
        this.typeName = this.BASE_TYPE_NAME + (this.isVertical === null ? '' : this.isVertical === true ? '-V' : '-H');
        this.props = json;
        this.updateColorCode();
        this.updateMidiOpts();
        this.updateIsVertical();
    }

    Control.prototype = {
        BASE_TYPE_NAME: 'Control',
        TYPE_IDS: [],
        isVertical: null,
        setType: function(newType) {
            util.assertString(!!newType && newType, 'Invalid new type %o for control %o', newType, this);
            this.props._type = newType;
            this.updateIsVertical();
        },
        setColor: function(newColor) {
            util.assertString(!!newColor && newColor, 'Invalid new color %o for control %o', newColor, this);
            this.props._color = newColor;
            this.updateColorCode();
        },
        updateIsVertical: function() {
            this.isVertical = (this.TYPE_IDS.length !== 2) ? null : (this.props._type[this.props._type.length-1] === 'v');
        },
        colorCodes: {},
        updateColorCode: function() {
            var color = this.props._color;
            this.colorCode = color ? (this.colorCodes[color] || color) : 'orange';
        },
        /**
         * Overridden by {@link MidiOpts.prototype.updateMidiOpts} during {@link Control.createSubclass}
         */
        updateMidiOpts: function() {
            LOG.error('Control class of %o has NO overridden version of #updateMidiOpts()', this);
            throw 'Unexpected call of Control.prototype.updateMidiOpts()';
        },
        valueVars: null,
        touchVars: null,
        colorVars: null,
        valueTypes: null,
        touchTypes: null,
        colorTypes: null,
        getValueForMidiVar: function(midiVar) {
            return _.findWhere(this.props.midi, {_var: midiVar});
        },
        getValueStringForMidiVar: function(midiVar, showNoteName) {
            var midiObj = _.findWhere(this.props.midi, {_var: midiVar}); // redundant with {@link #getValueForMidiVar}
            return midiObj ? MidiUtil.midiJsonToString(midiObj, showNoteName) : '-';
        },
        setMidi: function(submittableMidiObject) {
            var existingMidiObj = this.getValueForMidiVar(submittableMidiObject._var);
            if (existingMidiObj) {
                _.extend(existingMidiObj, submittableMidiObject);
                LOG.dev('Updated MIDI object %o of control %o', submittableMidiObject, this);
            } else {
                LOG.dev('Added new MIDI object %o to control %o', submittableMidiObject, this);
                this.props.midi.push(JSON.parse(JSON.stringify(submittableMidiObject)));
            }
        },
        removeMidiVar: function(midiVar) {
            var midiObj = this.getValueForMidiVar(midiVar),
                midiObjIndex = midiObj && this.props.midi.indexOf(midiObj);

            if (midiObjIndex >= 0) {
                LOG.dev('Removing MIDI object %o from control %o', midiObj, this);
                this.props.midi.splice(midiObjIndex, 1);
            }
        },
        getMidiVarNamesByAspect: function(forValue, forTouch, forColor) {
            return forValue ? this.valueVars : forTouch ? this.touchVars : forColor ? this.colorVars : null;
        },
        removeAllMidiByAspect: function(forValue, forTouch, forColor) {
            var self = this,
                varNames = this.getMidiVarNamesByAspect(forValue, forTouch, forColor);

            _.each(varNames, function(varName) {
                self.removeMidiVar(varName);
            });
        },
        removeAllValueMidi: function() {
            this.removeAllMidiByAspect(true, false, false);
        },
        removeAllTouchMidi: function() {
            this.removeAllMidiByAspect(false, true, false);
        },
        removeAllColorMidi: function() {
            this.removeAllMidiByAspect(false, false, true);
        },
        /** A method called after new values were written to this control in the course of PropertyEdit */
        finalizePropertyEdit: util.NOP
    };

    Control.REGISTERED_CLASSES = [];
    Control.REGISTERED_CLASSES_BY_TYPE_ID = {};

    /** @static */
    Control.createSubclass = function(baseTypeName, supportedTypeIds, midiOpts, newPrototype) {
        util.assertString(!!baseTypeName && baseTypeName, 'Invalid baseTypeName for Control.createSubclass: {}', baseTypeName);
        util.assertNonEmptyArray(supportedTypeIds, 'Invalid supportedTypeIds for Control.createSubclass', supportedTypeIds);
        util.assert(midiOpts instanceof MidiOpts, 'Invalid midiOpts for Control.createSubclass', midiOpts);
        util.assertObject(newPrototype, 'Missing new prototype for Control.createSubclass');

        var isAdapterClass = baseTypeName.indexOf(ADAPTER_TYPE_PREFIX) === 0,
            svgTemplateId = SvgControlTemplates.getInstance().getTemplateIdForControlType(supportedTypeIds[0]),
                subclass = util.extendClass(Control, newPrototype, midiOpts, {
                BASE_TYPE_NAME: baseTypeName,
                TYPE_IDS: supportedTypeIds,
                svgTemplateId: svgTemplateId
            });

        /** @static */
        subclass.supportsTypeId = function(typeId) {
            return this.prototype.TYPE_IDS.indexOf(typeId) >= 0;
        };

        if (isAdapterClass) {
            LOG.dev('Defined ControlAdapter class, pseudo-type: "%s"', baseTypeName);
        } else {
            Control.REGISTERED_CLASSES.push(subclass);
            for (var i=0; i < supportedTypeIds.length; i++) {
                Control.REGISTERED_CLASSES_BY_TYPE_ID[supportedTypeIds[i]] = subclass;
            }
            LOG.debug('Registered new Control class "%s", svgTemplateId="%s"', baseTypeName, svgTemplateId);
        }

        return subclass;
    };

    /** @static */
    Control.createAdapterClass = function(nameSuffix, midiOpts, newPrototype) {
        var pseudoTypeName = ADAPTER_TYPE_PREFIX + nameSuffix;

        return Control.createSubclass(pseudoTypeName, [pseudoTypeName], midiOpts, newPrototype);
    };

    return Control;

});