define(['knockout', 'underscore', 'jquery', 'util', 'AMD/edit/ControlEditor'], function(ko, _, $, util, ControlEditor) {
    'use strict';

    var HIGHLIGHT_CLASS = 'svg__selectable--highlight',
        HIGHLIGHTER_CELL_SELECTOR = 'td.controlEditor__highlighterCell',
        HIGHLIGHTER_CELL_ACTIVE_CLASS = 'controlEditor__highlighterCell--active',
        DURATION_DATA_ATTRIB = 'highlight-timing',
        HIGHLIGHT_DURATION = 300,     // highlighting time on individual control
        HIGHLIGHT_DURATION_SHORT = 100, // shorter highlighting time when all controls are highlighted
        HIGHLIGHT_ALL_INTER_DELAY = 100,
        allTimers = [],
        HANDLER = {
            SINGLE_CONTROL: function(e) {
                var control = ko.dataFor(this),
                    jSelectable = $('#svgSelectable_' + control.uid),
                    jTrigger = $(e.target),
                    duration = jTrigger.data(DURATION_DATA_ATTRIB) || HIGHLIGHT_DURATION;

                jSelectable.addClass(HIGHLIGHT_CLASS);
                jTrigger.addClass(HIGHLIGHTER_CELL_ACTIVE_CLASS);
                setTimeout(function () {
                    jSelectable.removeClass(HIGHLIGHT_CLASS);
                    jTrigger.removeClass(HIGHLIGHTER_CELL_ACTIVE_CLASS);
                }, duration);
            },
            ALL_CONTROLS: function() {
                _.each(allTimers, clearTimeout);
                allTimers = [];
                $(HIGHLIGHTER_CELL_SELECTOR).data(DURATION_DATA_ATTRIB, HIGHLIGHT_DURATION_SHORT).each(function(i) {
                    allTimers.push(setTimeout(function() {
                        var jCell = $(HIGHLIGHTER_CELL_SELECTOR).eq(i);
                        if (jCell.length) {
                            jCell.trigger('click').data(DURATION_DATA_ATTRIB, null);
                        } else {
                            _.each(allTimers, clearTimeout);
                        }
                    }, i * HIGHLIGHT_ALL_INTER_DELAY));
                });
            }
        },
        BIND_SINGLE_CONTROL = {
            click: HANDLER.SINGLE_CONTROL
            // ,mouseover: HANDLER.SINGLE_CONTROL
        },
        BIND_ALL_CONTROLS = {
            click: HANDLER.ALL_CONTROLS
        };

    ControlEditor.getInstance().isHighlighterEnabled.subscribe(function(isOn) {
        if (isOn) {
            setTimeout(HANDLER.ALL_CONTROLS, 300);
        }
    });

    ko.bindingHandlers.highlightControl = {
        init: function(element, valueAccessor /*, allBindings, viewModel, bindingContext*/) {
            var jElem = $(element),
                isHighlightAllTrigger = (valueAccessor() === 'ALL'),
                binding = isHighlightAllTrigger ? BIND_ALL_CONTROLS : BIND_SINGLE_CONTROL;

            jElem.on(binding);

            ko.utils.domNodeDisposal.addDisposeCallback(element, function() {
                $(element).off(binding);
            });
        }
    };

});