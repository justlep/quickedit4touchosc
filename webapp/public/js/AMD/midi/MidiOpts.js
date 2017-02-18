define(['underscore', 'AMD/midi/MessageTypes'], function(_, MessageTypes) {

    'use strict';

    var ALL = 'all_message_types',
        BASIC = 'basic_message_types',
        TABPAGE = 'tabpage_types',
        multiPushValueVarsFn = function() {
            var controlProps = this.props;
            return _.chain(_.range(1, controlProps._number_x * controlProps._number_y + 1)).map(function(n) {
                return 'x' + n;
            }).value();
        },

        multiPushColorVarsFn = function() {
            var controlProps = this.props;
            return _.chain(_.range(1, controlProps._number_x * controlProps._number_y + 1)).map(function(n) {
                return 'c' + n;
            }).value().concat('c');
        },

        multiXYValueVars = _.chain(_.range(1,6)).map(function(n) {
            return ['x'+n, 'y'+n];
        }).flatten().value(),

        multiXYTouchVars = _.chain(_.range(1,6)).map(function(n) {
            return 'z' + n;
        }).value(),

        multiFaderValueVarsFn = function() {
            var controlProps = this.props;
            return _.chain(_.range(1, controlProps._number + 1)).map(function(n) {
                return 'x' + n;
            }).value();
        },

        multiFaderColorVarsFn = function() {
            var controlProps = this.props;
            return _.chain(_.range(1, controlProps._number + 1)).map(function(n) {
                return 'c' + n;
            }).value().concat('c');
        },

        makeGetter = function(v) {
            return function() {
                return v;
            }
        };

    /**
     * Instances of this class are merged into the prototypes of classes generated by {@link Control.createSubclass}.
     *
     * @param valueVars (String|String[])
     * @param valueAllTypes (String) one of {@link ALL} | {@link BASIC} | {@link TABPAGE}  or null
     * @param touchVars (String|String[])
     * @param touchAllTypes (String) one of {@link ALL} | {@link BASIC}  or null
     * @param colorVars (String|String[])
     * @param colorAllTypes (String) one of {@link ALL} | {@link BASIC}  or null
     * @constructor
     */
    function MidiOpts(valueVars, valueAllTypes, touchVars, touchAllTypes, colorVars, colorAllTypes) {
        this.getValueVars = (typeof valueVars === 'function') ? valueVars : makeGetter(_.flatten(valueVars));
        this.getTouchVars = (typeof touchVars === 'function') ? touchVars : makeGetter(_.flatten(touchVars));
        this.getColorVars = (typeof colorVars === 'function') ? colorVars : makeGetter(_.flatten(colorVars));
        this.valueTypes = (valueAllTypes === ALL) ? MessageTypes.all :
                          (valueAllTypes === BASIC) ? MessageTypes.basic :
                          (valueAllTypes === TABPAGE) ? _.union(MessageTypes.basic, [MessageTypes.SYSEX]) : [];
        this.touchTypes = (touchAllTypes === ALL) ? MessageTypes.all :
                          (touchAllTypes === BASIC) ? MessageTypes.basic : [];
        this.colorTypes = (colorAllTypes === ALL) ? MessageTypes.all :
                          (colorAllTypes === BASIC) ? MessageTypes.basic : [];
    }

    MidiOpts.prototype = {
        updateMidiOpts: function() {
            this.valueVars = this.getValueVars();
            this.touchVars = this.getTouchVars();
            this.colorVars = this.getColorVars();
        }
    };

    _.extend(MidiOpts, {
        LED:   new MidiOpts('x', BASIC, null, null, 'c', BASIC),
        LABEL: new MidiOpts('x', BASIC, null, null, 'c', BASIC),
        PUSH:  new MidiOpts('x', ALL, 'z', ALL, 'c', BASIC),
        TOGGLE: new MidiOpts('x', ALL, 'z', ALL, 'c', BASIC),
        XY: new MidiOpts(['x','y'], BASIC, 'z', ALL, 'c', BASIC),
        FADER: new MidiOpts('x', BASIC, 'z', ALL, 'c', BASIC),
        ROTARY: new MidiOpts('x', BASIC, 'z', ALL, 'c', BASIC),
        ENCODER: new MidiOpts('x', BASIC, 'z', ALL, 'c', BASIC),
        BATTERY: new MidiOpts(null, null, null, null, 'c', BASIC),
        TIME: new MidiOpts(null, null, null, null, 'c', BASIC),
        MULTIPUSH: new MidiOpts(multiPushValueVarsFn, ALL, 'z', ALL, multiPushColorVarsFn, BASIC),
        MULTITOGGLE: new MidiOpts(multiPushValueVarsFn, ALL, 'z', ALL, multiPushColorVarsFn, BASIC),
        MULTIXY: new MidiOpts(multiXYValueVars, BASIC, multiXYTouchVars, ALL, 'c', BASIC),
        MULTIFADER: new MidiOpts(multiFaderValueVarsFn, BASIC, 'z', ALL, multiFaderColorVarsFn, BASIC),
        TABPAGE_CONTROL_ADAPTER: new MidiOpts('x', TABPAGE, null, null, null, null)
    });

    return MidiOpts;

});