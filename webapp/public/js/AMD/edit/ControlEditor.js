define(['knockout', 'util', 'LOG', 'jquery', 'underscore', 'AMD/control/ControlSupport', 'AMD/ControlSelection',
        'AMD/LayoutHolder', 'AMD/edit/PropertyEditor', 'AMD/edit/MidiEditor', 'koToggleableExtender'],
    function(ko, util, LOG, $, _, ControlSupport, ControlSelection, LayoutHolder, PropertyEditor, MidiEditor) {
        'use strict';

    var instance = null,
        BASIC_PROPS = ['_type', '_name', '_color', '_scalef', '_scalet', '_osc_cs'],
        isIgnoredControlProp = function(propName) {
            return propName.length === 2 || propName.charAt(0) !== '_';  // _x, _y, _w, _h ...
        },
        isOscControlProp = function(propName) {
            return propName === '_scalef' || propName === '_scalet' || propName === '_osc_cs';
        },
        isIgnoredPropInTabPageMode = function(propName) {
            return propName === '_type' || propName.charAt(0) !== '_';
        },
        isNonBasicProp = function(propName) {
            return BASIC_PROPS.indexOf(propName) < 0;
        },
        PROP_ORDER = {_type: 2, _name: 1, _color: 3, _scalef: 31, _scalet: 32, _osc_cs: 33},
        propertySorter = function(propName) {
            // LOG.dev('%s -> %s', propName, PROP_ORDER[propName] || 10000);
            return PROP_ORDER[propName] || 10000;
        };

    /**
     * @constructor
     */
    function ControlEditor() {
        var self = this,
            layoutHolder = LayoutHolder.getInstance(),
            controlPropertiesCsv = ko.pureComputed(function() {
                    return _.chain(self.selection.controls())
                            .pluck('props')
                            .map(_.keys)
                            .flatten()
                            .unique()
                            .reject(self.isTabPageMode() ? isIgnoredPropInTabPageMode : isIgnoredControlProp)
                            .reject(self.isNonBasicVisible() ? util.NOP : isNonBasicProp)
                            .reject(self.isOscVisible() ? util.NOP : isOscControlProp)
                            .sortBy(propertySorter)
                            .value().join(',');
                }).extend({rateLimit: 50});

        this.tabPageControlAdapters = ko.computed(function() {
            return _.map(layoutHolder.tabPages(), ControlSupport.createControlAdapterByTabPageJson);
        });

        this.selection = ControlSelection.getInstance();
        this.isVisible = ko.observable(false).extend({toggleable: true});
        this.isOpen = ko.observable(true).extend({toggleable: true});

        this.isOscVisible = ko.observable(false).extend({toggleable: true});
        this.isMidiVisible = ko.observable(true).extend({toggleable: true});
        this.isNonBasicVisible = ko.observable(true).extend({toggleable: true});
        this.isHighlighterEnabled = ko.observable(false).extend({toggleable: true});

        this.isTabPageMode = ko.observable(false).extend({toggleable: true});
        this.isTabPageMode.subscribe(function(tabsOnly) {
            self.selection.reset();
            if (tabsOnly) {
                self.selection.reset();
                _.defer(function() {
                    self.selection.select(self.tabPageControlAdapters());
                    self.selection.isLocked.toggleOn();
                    self.isOpen.toggleOn();
                });
            }
        });

        this.controlProperties = ko.pureComputed(function() {
            return controlPropertiesCsv().split(',');
        }).extend({rateLimit: 30});

        this.propertyEditor = PropertyEditor.getInstance();
        this.propertyEditor.needsCompleteRedraw.subscribe(layoutHolder.triggerRedraw);
        this.tableNeedsRedraw = ko.observable(true).extend({notify: 'always'});
        this.propertyEditor.tableNeedsRedraw.subscribe(this.tableNeedsRedraw);

        this.midiEditor = MidiEditor.getInstance();
        this.midiEditor.tableNeedsRedraw.subscribe(this.tableNeedsRedraw);

        this.onBodyCellClick = function(ctx, e) {
            var target = e.target,
                isTdClick = target && target.nodeName === 'TD';

            if (isTdClick && /controlEditor__unselectCell/.test(target.className)) {
                self.selection.unselect(ko.dataFor(target));

            } else if (!isTdClick && $(target).closest('.controlEditor__midiVal').length) {
                var koContext = ko.contextFor(target),
                    varName = koContext.$data,
                    controlToEdit = koContext.$parent;

                self.midiEditor.editSingle(varName, controlToEdit);

            } else {
                var propName = isTdClick && ko.dataFor(target),
                    isPropClick = (typeof propName === 'string'),
                    control = isPropClick && ko.dataFor(target.parentNode);

                if (control) {
                    self.propertyEditor.editSingleControl(control, propName);
                }
            }

            return true;
        };

        this.reset = function() {
            self.isTabPageMode.toggleOff();
            self.midiEditor.reset();
        };

        this.isEmpty = ko.computed(function() {
            var isEmpty = !self.selection.controls().length;
            // if (isEmpty) {
            // (!) FIXME this will break selections when switching to tabPageMode
            //     self.reset();
            // }
            return isEmpty;
        });

        layoutHolder.layout.subscribe(this.reset);
    }

    return {
        getInstance: function() {
            if (!instance) {
                instance = new ControlEditor();
            }
            return instance;
        }
    };

});