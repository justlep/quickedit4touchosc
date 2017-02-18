/**
 * Module for initially registering all supported control classes.
 * Provides basic lookup for typeId to corresponding class.
 */
define(['underscore', 'util', 'LOG', 'AMD/control/Control', 'AMD/control/Label', 'AMD/control/TabPageControlAdapter',
    'AMD/control/Battery', 'AMD/control/Encoder', 'AMD/control/Fader', 'AMD/control/LED', 'AMD/control/MultiFader',
    'AMD/control/MultiPush', 'AMD/control/MultiToggle', 'AMD/control/MultiXY', 'AMD/control/Push', 'AMD/control/Rotary',
    'AMD/control/Time', 'AMD/control/Toggle', 'AMD/control/XY'],
    function(_, util, LOG, Control, Label, TabPageControlAdapter) {

    'use strict';

    /**
     * Returns the appropriate Control subclass supporting the given typeId.
     * @param typeId (String)
     */
    function getClassByTypeId(typeId) {
        return Control.REGISTERED_CLASSES_BY_TYPE_ID[typeId];
    }

    function createControlByJson(controlJson) {
        var typeId = controlJson._type,
            ControlClass = getClassByTypeId(typeId);

        if (!ControlClass) {
            throw 'No matching control subclass for Control JSON: ' + JSON.stringify(controlJson, null, 2);
        }
        return new ControlClass(controlJson);
    }

    function createControlAdapterByTabPageJson(json) {
        util.assertObject(json, 'Invalid json for createControlAdapterByTabPageJson');
        return new TabPageControlAdapter(json);
    }

    return {
        getClassByTypeId: getClassByTypeId,
        createControlByJson: createControlByJson,
        createControlAdapterByTabPageJson: createControlAdapterByTabPageJson,
        REGISTERED_CLASSES_BY_TYPE_ID: Control.REGISTERED_CLASSES_BY_TYPE_ID,
        REGISTERED_CLASSES: Control.REGISTERED_CLASSES,
        REGISTERED_BASE_TYPE_NAMES: _.chain(Control.REGISTERED_CLASSES).map(function(controlClass) {
            return controlClass.prototype.BASE_TYPE_NAME;
        }).value().sort(),
        isControl: function(obj) {
            return (obj instanceof Control);
        },
        isTabPageControlAdapter: function(obj) {
            return obj instanceof TabPageControlAdapter;
        },
        isLabel: function(obj) {
            return (obj instanceof Label);
        },
        ALL_COLORS: ['red', 'green', 'blue', 'yellow','purple', 'gray', 'orange', 'brown', 'pink']
    };

});
    
