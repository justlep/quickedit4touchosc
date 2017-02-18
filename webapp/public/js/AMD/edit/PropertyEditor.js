define(['knockout', 'underscore', 'util', 'LOG', 'AMD/control/ControlSupport', 'AMD/ControlSelection', 'koToggleableExtender'],
    function(ko, _, util, LOG, ControlSupport, ControlSelection) {

    'use strict';

    var instance,
        SCALE_PROP_INFO = {
            isNumber: true,
            min: -16777216,
            max: 16777216
        },
        PROP_INFOS = {
            _name: {
                isString: true,
                nonempty: true,
                enablePreview: true
            },
            _osc_cs: {
                isString: true,
                OSC_PATH_REGEX: /^\/.*[^\/]$/
            },
            _text: {
                isString: true,
                redrawOnSubmit: true,
                enablePreview: true
            },
            _scalef: SCALE_PROP_INFO,
            _scalet: SCALE_PROP_INFO,
            _size: {
                isNumber: true,
                min: 1,
                max: 50,
                redrawOnSubmit: true
            },
            _color: {
                isColor: true,
                redrawOnSubmit: true
            }
        },
        NUMBER_REGEX = /^-?\d+$/,
        DEFAULT_COUNTER_START = 0,
        DEFAULT_COUNTER_STEP = 1,
        DEFAULT_COUNTER_DIGITS = 1,
        COUNTER_PLACEHOLDER = '%C';

        /**
         * @constructor
         */
        function PropertyEditor() {
            var self = this,
                editedPropName = null,
                editedControl = null,
                selection = ControlSelection.getInstance();

            this.useCounter = ko.observable(false).extend({toggleable: true});
            this.counterStart = ko.observable();
            this.counterStep = ko.observable();
            this.counterStepOptions = _.range(1, 21);
            this.counterDigits = ko.observable();
            this.counterDigitsOptions = _.range(1, 6);

            this.needsCompleteRedraw = ko.observable(true).extend({notify: 'always'});
            this.tableNeedsRedraw = ko.observable(true).extend({notify: 'always'});
            this.triggerTableRedraw = function() {
                self.tableNeedsRedraw(false);
                self.tableNeedsRedraw(true)
            };
            this.newValue = ko.observable();
            this.propInfo = ko.observable();

            this.isVisible = this.propInfo;
            this.isMultiEditMode = ko.observable(false);
            this.isPreviewEnabled = ko.observable(false).extend({toggleable: true});

            this.useCounter.subscribe(function(useit) {
                if (!self.propInfo()) {
                    return;
                }
                var val = '' + self.newValue.peek(),
                    containsPlaceholder = val.indexOf(COUNTER_PLACEHOLDER) >= 0,
                    newVal = (useit && !containsPlaceholder) ? val + COUNTER_PLACEHOLDER :
                             (!useit && containsPlaceholder) ? val.replace(COUNTER_PLACEHOLDER, '') : val;

                if (self.propInfo().isNumber && useit) {
                    newVal = COUNTER_PLACEHOLDER;
                }

                if (newVal !== val) {
                    self.newValue(newVal);
                }
            });

            /**
             * Determines if the counter-calculated value is the one that is assigned to the control (as number),
             * (i.e. not just as a placeholder-replacement which may get padded before etc)
             */
            this.useCounterAsValue = ko.pureComputed(function() {
                return self.propInfo() && self.useCounter() && self.propInfo().isNumber;
            });

            /**
             *
             * @param valueToCheck
             */
            function getCheckedValueOrNull(valueToCheck) {
                var propInfo = self.propInfo(),
                    isValid = false,
                    checkedValue = null;

                if (!propInfo || valueToCheck === null) {
                    return null;
                }

                if (propInfo.isString) {
                    checkedValue = $.trim(valueToCheck);
                    if (editedPropName === '_osc_cs' && checkedValue) {
                        // make sure that nonempty custom osc paths start with a slash (and dont end with one)
                        checkedValue = checkedValue.replace(/^\/*/, '/').replace(/\/*$/, '');
                        isValid = PROP_INFOS._osc_cs.OSC_PATH_REGEX.test(checkedValue);
                    } else {
                        isValid = !!checkedValue || !propInfo.nonempty;
                    }
                    // LOG.warn('string valid: ' + isValid);
                } else if (propInfo.isNumber) {
                    checkedValue = parseInt(valueToCheck, 10);
                    isValid = NUMBER_REGEX.test(valueToCheck) && (typeof checkedValue === 'number' && !isNaN(checkedValue) &&
                        checkedValue >= propInfo.min && checkedValue <= propInfo.max);
                    // LOG.warn('number valid: ' + isValid);
                } else if (propInfo.isColor) {
                    checkedValue = valueToCheck;
                    isValid = self.colorOptions.indexOf(checkedValue) >= 0;
                }

                return isValid ? checkedValue : null;
            }

            /**
             * The actual value that can be written back into the single control object.
             * @return (mixed) null if invalid
             */
            this.submittableValue = ko.computed(function() {
                var newValue = self.newValue(),
                    isCheckable = (editedControl && editedPropName && newValue !== null);

                return isCheckable ? getCheckedValueOrNull(newValue) : null;
            });

            this.submittableValueMap = ko.pureComputed(function() {
                var newValue = '' + self.newValue(),
                    uidToCheckedValueMap = {},
                    useCounter = self.useCounter(),
                    count = useCounter ? (NUMBER_REGEX.test(self.counterStart()) && parseInt(self.counterStart(), 10)) : 0,
                    isCountValid = (typeof count === 'number' && !isNaN(count)),
                    counterIncrement = useCounter ? self.counterStep() : 1,
                    digits = self.counterDigits(),
                    useCounterAsValue = self.useCounterAsValue(),
                    allValid = isCountValid && _.every(selection.controls(), function(control) {
                        if (typeof control.props[editedPropName] !== 'undefined') {
                            var valueToCheck = useCounterAsValue ? count :
                                               useCounter ? newValue.replace(COUNTER_PLACEHOLDER, util.paddLeft(count, digits)) : newValue,
                                checkedValueOrNull = getCheckedValueOrNull(valueToCheck);

                            if (checkedValueOrNull === null) {
                                return false;
                            }
                            uidToCheckedValueMap[control.uid] = checkedValueOrNull;
                            count += counterIncrement;
                        }
                        return true;
                    });

                return (allValid && uidToCheckedValueMap) || null;
            });

            this.editSingleControl = function(control, propName) {
                util.assertString(!!propName && propName, 'Invalid propName for PropertyEditor.editSingleProperty');
                self.reset();

                var controlProps = control && control.props,
                    canEdit = controlProps && typeof controlProps[propName] !== 'undefined',
                    value = canEdit && controlProps[propName],
                    newPropInfo = (canEdit && PROP_INFOS[propName]) || null;

                if (!canEdit) {
                    LOG.warn('Cannot edit property "%s" of control %o', propName, control)
                } else if (typeof value === 'boolean') {
                    controlProps[propName] = !value;
                    self.reset();
                    self.needsCompleteRedraw(true);
                } else if (typeof value === 'string' && propName === '_response') {
                    controlProps._response = (value === 'absolute') ? 'relative' : 'absolute';
                    self.needsCompleteRedraw(true);
                } else if (typeof value === 'string' && propName === '_type' && value.indexOf('rotary') === 0) {
                    control.setType(value === 'rotaryv' ? 'rotaryh' : 'rotaryv');
                    self.needsCompleteRedraw(true);
                } else if (newPropInfo) {
                    self.newValue(control.props[propName]);
                    editedPropName = propName;
                    editedControl = control;
                } else {
                    LOG.debug('PropertyEditor cannot handle property "%s"', propName);
                }

                self.newValue.valueHasMutated();
                self.propInfo(newPropInfo);
            };

            selection.controls.subscribe(function(selectedControls) {
                if (!selectedControls.length) {
                    self.reset();
                }
            });

            /**
             * Tries to determine by the first valid item in the selection
             * whether the Counter will be useful or not, then initializes it
             * (e.g. when the item ends with a number, the counter is enabled, the number replaced with the placeholder)
             */
            function autoSuggestCounterForMultiEdit() {
                _.some(selection.controls(), function(control) {
                    var value = control.props[editedPropName];
                    if (typeof value === 'undefined') {
                        return false;
                    }

                    var propInfo = self.propInfo();

                    if (propInfo.isNumber && (typeof value === 'number')) {
                        self.newValue(value);
                        self.counterStart(value);
                    } else if (propInfo.isString && typeof value === 'string') {
                        if (/^(.*?)(\d*)$/.test(value)) {
                            var stringPart = RegExp.$1,
                                numberPart = RegExp.$2;

                            if (numberPart) {
                                self.useCounter(true);
                                self.counterStart(parseInt(numberPart, 10));
                                self.newValue(stringPart + COUNTER_PLACEHOLDER);
                            } else {
                                self.newValue(stringPart);
                            }
                        } else {
                            self.newValue(value);
                        }
                    }

                    return true;
                });
            }

            this.editMultipleControls = function(propName) {
                util.assertString(!!propName && propName, 'Invalid propName for PropertyEditor.editSingleProperty');
                self.reset();

                var newPropInfo = PROP_INFOS[propName] || null,
                    valueForAll = null;

                if (newPropInfo) {
                    self.isMultiEditMode(true);
                    editedPropName = propName;
                    self.newValue('');
                    self.propInfo(newPropInfo);
                    if (newPropInfo.enablePreview) {
                        self.isPreviewEnabled(true);
                    }
                    autoSuggestCounterForMultiEdit();

                } else {
                    // here come the toggled properties that don't need a visual editor..
                    selection.forEachControl(function(control) {
                        var controlProps = control.props;
                        if (typeof controlProps[propName] === 'boolean') {
                            if (valueForAll === null) {
                                valueForAll = !controlProps[propName];
                            }
                            controlProps[propName] = valueForAll;
                        } else if (propName === '_response' && typeof controlProps[propName] === 'string') {
                            if (valueForAll === null) {
                                valueForAll = (controlProps[propName] === 'absolute') ? 'relative' : 'absolute';
                            }
                            controlProps[propName] = valueForAll;
                        }
                    });

                    if (valueForAll !== null) {
                        self.needsCompleteRedraw(true);
                    }
                }
            };

            this.reset = function() {
                self.propInfo(null);
                editedPropName = null;
                editedControl = null;
                self.counterStart(DEFAULT_COUNTER_START);
                self.counterDigits(DEFAULT_COUNTER_DIGITS);
                self.counterStep(DEFAULT_COUNTER_STEP);
                self.useCounter(false);
                self.isPreviewEnabled(false);
                self.isMultiEditMode(false);
            };

            this.canSubmit = ko.computed(function() {
                if (self.isMultiEditMode()) {
                    return self.submittableValueMap() !== null;
                } else {
                    return self.submittableValue() !== null;
                }
            });

            /**
             * @returns (boolean) true if the PropertyEditor is currently opened in MultiEdit-mode for the property with the given name
             */
            this.isEditedMultiProperty = function(propName) {
                return self.isVisible() && self.isMultiEditMode() && propName === editedPropName;
            };

            /**
             * @returns (boolean) true if the PropertyEditor is currently opened in single-edit-mode for the property with the given name
             */
            this.isEditedControlAndProperty = function(control, propName) {
                return self.isVisible() && control === editedControl && editedPropName === propName;
            };

            this.submit = function() {
                if (!self.canSubmit()) {
                    LOG.warn('Cant submit now');
                    return;
                }

                var propInfo = self.propInfo(),
                    needsCompleteRedraw = propInfo.redrawOnSubmit,
                    tableNeedsRedraw = false,
                    needsColorCodeUpdate = propInfo.isColor;

                if (self.isMultiEditMode()) {
                    var uidToValueMap = self.submittableValueMap();
                    selection.forEachControl(function(control) {
                        var checkedValue = uidToValueMap[control.uid];
                        if (checkedValue !== null) {
                            LOG.debug('Updating property "%s" of control %o with value %o', editedPropName, control, checkedValue);
                            control.props[editedPropName] = checkedValue;
                            if (needsColorCodeUpdate) {
                                control.updateColorCode();
                            } else {
                                tableNeedsRedraw = true;
                            }
                            control.finalizePropertyEdit();
                        }
                    });
                } else {
                    editedControl.props[editedPropName] = self.submittableValue();
                    if (needsColorCodeUpdate) {
                        editedControl.updateColorCode();
                    }
                    editedControl.finalizePropertyEdit();
                }

                if (needsCompleteRedraw) {
                    _.defer(function() {
                        self.needsCompleteRedraw(true);
                    });
                } else if (tableNeedsRedraw) {
                    self.triggerTableRedraw();
                }
                self.reset();
            };

            this.colorOptions = ControlSupport.ALL_COLORS;

            this.setColor = function(newColor) {
                if (newColor) {
                    self.newValue(newColor);
                    _.defer(self.submit);
                }
            };

            this.onKeyup = function(me, e) {
                if (e && event.keyCode === 27) {
                    self.reset();
                }
            };
        }


        return {
            getInstance: function() {
                if (!instance) {
                    instance = new PropertyEditor();
                }
                return instance;
            }
        }
    }
);