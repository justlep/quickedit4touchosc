define(['underscore', 'util', 'LOG', 'AMD/control/Control', 'AMD/midi/MidiOpts'], function(_, util, LOG, Control, MidiOpts) {

    'use strict';

    var PSEUDO_TYPE = '__TAB_PAGE__',
        MIDI_PROP_PREFIX = '_midi',
        MIDI_PROP_PREFIX_REGEX = /^_midi/,
        ALLOWED_PROPS_REGEX = /^_(?:name|scalef|scalet|osc_cs)$/,
        TabPageControlAdapter = Control.createAdapterClass('TabPage', MidiOpts.TABPAGE_CONTROL_ADAPTER, {
            _init: function(json) {
                var props = _.reduce(json, function(adapterPropsJson, value, key) {
                        var isMidi = MIDI_PROP_PREFIX_REGEX.test(key),
                            isOtherAllowed = !isMidi && ALLOWED_PROPS_REGEX.test(key);

                        if (isMidi) {
                            var midiObj = adapterPropsJson.midi[0];
                            if (!midiObj) {
                                midiObj = {_var: 'x'};
                                adapterPropsJson.midi[0] = midiObj;
                            }
                            midiObj[key.replace(MIDI_PROP_PREFIX_REGEX, '')] = value;
                        } else if (isOtherAllowed) {
                            adapterPropsJson[key] = value;
                        }
                        return adapterPropsJson;
                    }, {midi: [], _type: PSEUDO_TYPE, _osc_cs: ''});

                this._super(props);

                this.originalJson = json;
            },
            /**
             * @Override
             * Transfers the (possibly) changed values from the `props` map back to the original tabpage json object.
             * To be called after properties of the props map have been changed (e.g. by {@link PropertyEditor})
             */
            finalizePropertyEdit: function() {
                util.assert(this.valueVars.length === 1 && this.valueVars[0] === 'x', 'Unexpected MidiOpts');

                var self = this,
                    original = self.originalJson,
                    midiObj = this.props.midi[0];

                _.each(this.props, function(propValue, propName) {
                    if (propName !== 'midi' && ALLOWED_PROPS_REGEX.test(propName)) {
                        LOG.dev('Updating %s=%o', propName, propValue);
                        original[propName] = propValue;
                    }
                });
                if (midiObj) {
                    _.each(midiObj, function(midiVal, midiProp) {
                        original[ MIDI_PROP_PREFIX + midiProp ] = midiVal;
                    });
                } else {
                    _.each(_.keys(original), function(originalKey) {
                        if (MIDI_PROP_PREFIX_REGEX.test(originalKey)) {
                            delete original[originalKey];
                        }
                    });
                }
            }
        });

    return TabPageControlAdapter;
});