define(['knockout', 'underscore', 'util', 'LOG', 'AMD/LayoutHolder',
        'AMD/control/ControlSupport', 'AMD/edit/ControlEditor', 'AMD/edit/PropertyEditor'],
    function(ko, _, util, LOG, LayoutHolder, ControlSupport, ControlEditor, PropertyEditor) {

    'use strict';

    var instance,
        UNUSUAL_CHAR_REGEX = /[^\-+a-z0-9\/_\. \:#<>öäüß]/i;

    /**
     * @constructor
     */
    function SuspiciousProperty(propName, controlOrTabPageAdapter) {
        util.assertNonEmptyString(propName, 'Invalid propName for SuspiciousProperty');
        util.assertObject(controlOrTabPageAdapter, 'Invalid property name');

        var propValue = controlOrTabPageAdapter.props[propName],
            isTabPageControlAdapter = ControlSupport.isTabPageControlAdapter(controlOrTabPageAdapter);

        this.isTabPageControlAdapter = isTabPageControlAdapter;
        this.controlOrTabPageAdapter = controlOrTabPageAdapter;
        this.typeName = isTabPageControlAdapter ? 'Tab Page' : controlOrTabPageAdapter.typeName;
        this.propName = propName;
        this.originalValue = propValue;
        this.fixes = this.getFixSuggestionsForString(propValue);
        this.valueToUse = ko.observable(propValue);
        this.isApplied = false;
    }

    SuspiciousProperty.prototype = {
        fixFunctions: [
            function(s) {
                return util.decodeBase64(s);
            },
            function(s) {
                return decodeURIComponent(escape(s));
            },
            function(s) {
                return decodeURIComponent(escape(decodeURIComponent(escape(s))));
            },
            function(s) {
                return decodeURIComponent(escape(util.decodeBase64(s)));
            },
            function(s) {
                return btoa(s);
            }
        ],
        getFixSuggestionsForString: function(s) {
            return _.chain(this.fixFunctions).map(function(fixFn, i) {
                var fixedValue;
                try {
                    fixedValue = fixFn(s);
                } catch (e) {
                    // LOG.warn('Fix function %s failed for "%s"', i, s);
                    fixedValue = s;
                }
                return fixedValue;
            }).unique().without(s).value();
        },
        applySelectedFix: function() {
            var valueToUse = this.valueToUse();
            if (valueToUse !== this.originalValue) {
                this.controlOrTabPageAdapter.props[this.propName] = valueToUse;
                this.controlOrTabPageAdapter.finalizePropertyEdit();
                LOG.dev('Applied fixed value "%s" on property "%s" of %s %o',
                    valueToUse, this.propName, this.typeName, this.controlOrTabPageAdapter);
                this.isApplied = true;
            }
        }
    };

    /**
     * @static
     * @param controlOrTabPageAdapter
     * @param propName
     * @param arr
     */
    SuspiciousProperty.pushIfSuspicious = function(controlOrTabPageAdapter, propName, arr) {
        var propValue = controlOrTabPageAdapter.props[propName],
            isSuspicious = (propValue && UNUSUAL_CHAR_REGEX.test('' + propValue));

        if (isSuspicious) {
            arr.push(new SuspiciousProperty(propName, controlOrTabPageAdapter))
        }
    };

    // TODO add apply

    /**
     * @constructor
     */
    function EncodingCheck() {
        var self = this,
            _allProperties = ko.observableArray();

        this.isAvailable = LayoutHolder.getInstance().hasLayout; // TODO

        // TODO check if useful to have
        this.maxFixColumns = 0;

        this.suspiciousProperties = ko.computed(function() {
            return _.filter(_allProperties(), {isApplied: false});
        });
        this.fixedProperties = ko.computed(function() {
            return _.filter(_allProperties(), {isApplied: true});
        });

        ko.computed(function() {
            var arr = [];

            if (self.isAvailable()) {
                _.each(ControlEditor.getInstance().tabPageControlAdapters(), function(tabPageAdapter) {
                    SuspiciousProperty.pushIfSuspicious(tabPageAdapter, '_name', arr);
                    SuspiciousProperty.pushIfSuspicious(tabPageAdapter, '_osc_cs', arr);
                });
                LayoutHolder.getInstance().forEachControl(function(control) {
                    SuspiciousProperty.pushIfSuspicious(control, '_name', arr);
                    SuspiciousProperty.pushIfSuspicious(control, '_osc_cs', arr);
                    SuspiciousProperty.pushIfSuspicious(control, '_text', arr);
                });
            }

            self.maxFixColumns = _.reduce(arr, function(currentMax, obj) {
                return Math.max(obj.fixes.length, currentMax);
            }, 0);

            _allProperties(arr);
        });

        this.onClick = function(ctx, e) {
            var context = ko.contextFor(e.target),
                stringContext = context && (typeof context.$data === 'string') && context.$data,
                checkObj = context && context.$parent,
                isClickOnFixOrOriginal = stringContext && (checkObj instanceof SuspiciousProperty);

            if (isClickOnFixOrOriginal) {
                // alert(stringContext);
                checkObj.valueToUse(stringContext);
            }
        };

        this.applySelectedFixes = function() {
            _.each(self.suspiciousProperties(), function(suspiciousProperty) {
                suspiciousProperty.applySelectedFix();
            });

            // trigger re-calculation of suspicious & applied prop arrays
            _allProperties.valueHasMutated();

            _.defer(function() {
                PropertyEditor.getInstance().triggerTableRedraw();
            });
        };
    }

    return {
        getInstance: function() {
            if (!instance) {
                instance = new EncodingCheck();
            }
            return instance;
        }
    };

});