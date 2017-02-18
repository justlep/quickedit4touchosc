define(['underscore', 'LOG', 'util', 'jquery'], function(_, LOG, util, $) {

    'use strict';

    var NUMERIC_PROPERTIES = {
            MIDI: ['_channel', '_type', '_data1', '_data2', '_data2f', '_data2t'],
            CONTROL: ['_x', '_y', '_w', '_h', '_size', '_scalef', '_scalet', '_number', '_number_x', '_number_y'],
            TABPAGE: ['_scalef', '_scalet', '_midi_channel', '_midi_type', '_midi_data1', '_midi_data2', '_midi_data2f', '_midi_data2t'],
            LAYOUT: ['_version', '_mode', '_w', '_h']
        },
        BOOLEAN_PROPERTIES = {
            CONTROL: ['_inverted_x', '_inverted_y', '_centered', '_inverted', '_background',
                      '_outline', '_local_off', '_norollover', '_ex_mode', '_seconds']
        },
        PUSH_VELO_PROP = '_velocity',
        PUSH_VELO_INVERT_PROP = '_velocity_invert';

    /**
     * Converts an objects properties into numbers if possible.
     */
    function convertPropertiesToNumbers(obj, propNames) {
        _.each(propNames, function(propName) {
            var propValue = obj[propName],
                newValue;

            if (typeof propValue === 'string') {
                newValue = Number(propValue);
                if (typeof newValue === 'number') {
                    obj[propName] = newValue;
                } else {
                    LOG.error('Error converting property "%s" with value "%o" into number.', propName, propValue);
                }
            }
        });
    }

    /**
     * Converts an objects properties into boolean if possible.
     */
    function convertPropertiesToBoolean(obj, propNames) {
        _.each(propNames, function(propName) {
            var propValue = obj[propName];

            if (typeof propValue === 'string') {
                util.assert(propValue === 'true' || propValue === 'false', 'Invalid boolean string in property "{}"', propName);
                obj[propName] = (propValue === 'true');
            }
        });
    }

    /**
     * Base64-decodes the object's property if the condition is true.
     */
    function decodePropertyIf(obj, propName, condition) {
        if (condition && obj[propName]) {
            obj[propName] = util.decodeBase64(obj[propName]);
        }
    }

    function encodeProperty(obj, propName) {
        var val = obj[propName];
        if (val && typeof val === 'string') {
            obj[propName] = btoa(val);
        }
    }

    /**
     * On import: adds '_velocity' and '_velocity_invert' properties to all PUSH controls (value '1' in XML means true)
     * On export: removes the properties if false
     */
    function preparePushVelocityProps(controlObj, forExport) {
        if (controlObj._type !== 'push') {
            return;
        }
        var useVelocity = !!controlObj[PUSH_VELO_PROP],
            useInverseVelocity = useVelocity && !!controlObj[PUSH_VELO_INVERT_PROP];

        if (forExport) {
            if (useVelocity && useInverseVelocity) {
                controlObj[PUSH_VELO_INVERT_PROP] = '1';
            } else {
                delete controlObj[PUSH_VELO_INVERT_PROP];
            }
            if (useVelocity) {
                controlObj[PUSH_VELO_PROP] = '1';
            } else{
                delete controlObj[PUSH_VELO_PROP];
            }
        } else {
            controlObj[PUSH_VELO_PROP] = useVelocity;
            controlObj[PUSH_VELO_INVERT_PROP] = useInverseVelocity;
        }
    }

    function prepareCustomOscProp(controlObj, forExport) {
        var valueNow = $.trim(controlObj._osc_cs || '');

        if (!valueNow) {
            if (forExport) {
                delete controlObj._osc_cs;
            } else {
                controlObj._osc_cs = '';
            }
        }
    }

    /**
     * Converts some properties for easier use in the JSON,
     * like string-to-number/boolean conversion + base64-decoding.
     *
     * @param json (Object)
     * @param opts (Object)
     *           - namesNeedDecoding (Boolean) tells whether _name attributes must be base64-decoded
     *           - textsNeedDecoding (Boolean) tells whether _text attributes must be base64-decoded
     */
    function sanitizeJsonAfterImport(json, opts) {
        if (!json) {
            return;
        }

        util.assertBoolean(opts && opts.namesNeedDecoding, 'Invalid namesNeedDecoding param for sanitizeJson');
        util.assertBoolean(opts && opts.textsNeedDecoding, 'Invalid textsNeedDecoding param for sanitizeJson');

        convertPropertiesToNumbers(json.layout, NUMERIC_PROPERTIES.LAYOUT);

        _.each(json.layout.tabpage, function(tabPage, i) {
            decodePropertyIf(tabPage, '_name', opts.namesNeedDecoding);
            convertPropertiesToNumbers(tabPage, NUMERIC_PROPERTIES.TABPAGE);
            decodePropertyIf(tabPage, '_osc_cs', true);

            if (!tabPage.control) {
                tabPage.control = [];
            }

            _.each(tabPage.control, function(control) {
                decodePropertyIf(control, '_name', opts.namesNeedDecoding);
                decodePropertyIf(control, '_text', opts.textsNeedDecoding);
                decodePropertyIf(control, '_osc_cs', true);
                convertPropertiesToNumbers(control, NUMERIC_PROPERTIES.CONTROL);
                convertPropertiesToBoolean(control, BOOLEAN_PROPERTIES.CONTROL);
                prepareCustomOscProp(control);
                preparePushVelocityProps(control, false);

                if (!control.midi) {
                    control.midi = [];
                }

                _.each(control.midi, function(midi) {
                    convertPropertiesToNumbers(midi, NUMERIC_PROPERTIES.MIDI);
                });
            });
        });

        // post-check
        var jsonStr = JSON.stringify(json),
            booleanStringIndex = jsonStr.indexOf(':"false"');

        booleanStringIndex = (booleanStringIndex > 0) ? booleanStringIndex : jsonStr.indexOf(':"true"');

        if (booleanStringIndex > 0) {
            LOG.warn('Sanitized JSON may still contain unconverted boolean strings near:\n[...] %s',
                jsonStr.substr(booleanStringIndex-20, 30));
        }
    }

    function removeEmptyMidiAndControl(tabPageOrControl) {
        if (tabPageOrControl.midi && !tabPageOrControl.midi.length) {
            delete tabPageOrControl.midi;
        }
        if (tabPageOrControl.control && !tabPageOrControl.control.length) {
            delete tabPageOrControl.control;
        }
    }

    /**
     * Base64-encodes string properties back to base64.
     * @param json (Object)
     */
    function sanitizeJsonForExport(json) {
        if (!json) {
            return;
        }
        _.each(json.layout.tabpage, function(tabPage, i) {
            encodeProperty(tabPage, '_name');
            removeEmptyMidiAndControl(tabPage);
            encodeProperty(tabPage, '_osc_cs');

            _.each(tabPage.control, function(control) {
                encodeProperty(control, '_name');
                encodeProperty(control, '_text');
                prepareCustomOscProp(control, true);
                encodeProperty(control, '_osc_cs');
                preparePushVelocityProps(control, true);
                removeEmptyMidiAndControl(control);
            });
        });
    }

    return {
        sanitizeJsonAfterImport: sanitizeJsonAfterImport,
        sanitizeJsonForExport: sanitizeJsonForExport
    };

});