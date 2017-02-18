define(['knockout', 'LOG', 'util', 'underscore', 'jquery', 'AMD/ControlFilter', 'AMD/VisualConfig', 'AMD/LayoutHolder',
        'AMD/ControlSelection'],
    function(ko, LOG, util, _, $, ControlFilter, VisualConfig, LayoutHolder, ControlSelection) {

    'use strict';

    /**
     * @constructor
     */
    function VisualMode() {

        var self = this,
            controlFilter = ControlFilter.getInstance(),
            layoutHolder = LayoutHolder.getInstance(),
            controlSelection = ControlSelection.getInstance(),
            isSelecting = false,
            isSelectionLocked = false,
            selectionStartX = 0,
            selectionStartY = 0,
            scrollPos = (function() {
                var pos = {left: 0, top: 0},
                    usePageOffset = (window.pageXOffset !== undefined),
                    scrollNode = !usePageOffset && (document.documentElement || document.body.parentNode || document.body);
                $(window).on('scroll', function() {
                    pos.left = usePageOffset ? window.pageXOffset : scrollNode.scrollLeft;
                    pos.top = usePageOffset ? window.pageYOffset : scrollNode.scrollTop;
                });
                return pos;
            })(),
            HANDLER = {
                RECT_MOUSEOVER: function(e) {
                    var control = self.config.isTooltipEnabled() && ko.dataFor(e.target);
                    if (control && control && control.typeName) {
                        self.controlTooltip(control);
                    }
                },
                RECT_MOUSEOUT: function() {
                    self.controlTooltip(null);
                },
                SVG_MOUSEDOWN_OR_MOVE: function(_e) {
                    var isMousedown = _e.type.indexOf('move') < 0,
                        isTouch = _e.originalEvent.touches,
                        e = isTouch ? _e.originalEvent.touches[0] : _e,
                        isTouchOnTab = isMousedown && (''+e.target.className.baseVal).indexOf('svg__tab') >= 0,
                        mouseX = e.pageX + (isTouch ? scrollPos.left : 0),
                        mouseY = e.pageY + (isTouch ? scrollPos.top : 0);

                    if (!isTouchOnTab) {
                        _e.preventDefault();
                    } else {
                        LOG.dev('Touch on Tab -> returning');
                        return;
                    }

                    if (self.config.isTooltipEnabled() && self.controlTooltip()) {
                        $('#controlTooltip').css({
                            left: (e.clientX + 40) + 'px',
                            top: (e.clientY - 80) + 'px'
                        });
                    }

                    if (isSelectionLocked) {
                        return;
                    }

                    if (isMousedown) {
                        isSelecting = true;
                        selectionStartX = mouseX;
                        selectionStartY = mouseY;
                        // LOG.dev('selectionStartX: %s, selectionStartY: %s', selectionStartX, selectionStartY);
                    } else if (!isSelecting) {
                        return false;
                    }

                    var xLeft = Math.min(selectionStartX, mouseX),
                        xRight = Math.max(selectionStartX, mouseX),
                        yTop = Math.min(selectionStartY, mouseY),
                        yBottom = Math.max(selectionStartY, mouseY);

                    // LOG.warn(e.type, xLeft, xRight, yTop, yBottom);

                    $(this).find('.svg__selectable').each(function() {
                        var scrollX = window.pageXOffset || document.documentElement.scrollLeft || document.body.scrollLeft || 0,
                            scrollY = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0,
                            bounds = this.parentNode.getBoundingClientRect(),
                            x1 = bounds.left + scrollX,
                            x2 = bounds.right + scrollX,
                            y1 = bounds.top + scrollY,
                            y2 = bounds.bottom + scrollY,
                            isXContained = (x1 <= xLeft && x2 >= xLeft || x1 <= xRight && x2 >= xRight
                                            || x1 >= xLeft && x2 <= xRight || x1 <= xLeft && x2 >= xRight),
                            isYContained = (y1 <= yTop && y2 >= yTop || y1 <= yBottom && y2 >= yBottom
                                            || y1 >= yTop && y2 <= yBottom || y1 <= yTop && y2 >= yBottom),
                            control = ko.dataFor(this);

                        if (isXContained && isYContained) {
                            if (isMousedown && e.ctrlKey) {
                                controlSelection.toggleSelected(control);
                            } else {
                                controlSelection.select(control);
                            }
                        } else if (!e.ctrlKey) {
                            controlSelection.unselect(control);
                        }
                    });

                    return false;
                },
                BODY_MOUSEUP: function() {
                    isSelecting = false;
                }
            },
            _initOnce = function() {
                controlSelection.isLocked.subscribe(function(isLocked) {
                    isSelectionLocked = isLocked;
                });
                $(document.body).on('mouseover', '.svg__root *', HANDLER.RECT_MOUSEOVER);
                $(document.body).on('mouseout',  '.svg__root *', HANDLER.RECT_MOUSEOUT);
                $(document.body).on('mousedown touchstart', '.svg__root', HANDLER.SVG_MOUSEDOWN_OR_MOVE);
                $(document.body).on('mousemove touchmove', '.svg__root', HANDLER.SVG_MOUSEDOWN_OR_MOVE);
                $(document.body).on('mouseup touchend',  HANDLER.BODY_MOUSEUP);
            };

        this.config = VisualConfig.getInstance();

        this.controlTooltip = ko.observable();

        this.isEnabled = ko.computed(function() {
            return !!layoutHolder.json();
        });

        // TODO make this an index permanently, not a page object
        this.currentTabPage = ko.observable(0);

        layoutHolder.tabPages.subscribe(function(pages) {
            self.currentTabPage(pages && pages.length ? pages[0] : null);
        });

        this.visibleControlsInCurrentTab = ko.pureComputed(function() {
            var currentTabPage = self.currentTabPage(),
                filteredControls = currentTabPage && _.filter(currentTabPage.control, controlFilter.isControlVisible);

            controlSelection.setAllowedControls(filteredControls || []);

            return filteredControls;
        });

        _initOnce();
    }

    return VisualMode;

});