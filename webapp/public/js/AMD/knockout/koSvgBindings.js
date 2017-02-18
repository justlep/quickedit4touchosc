define(['knockout', 'util', 'svgUtil', 'LOG', 'AMD/Dimensions', 'AMD/LayoutHolder'],
    function(ko, util, svgUtil, LOG, Dimensions, LayoutHolder) {

    'use strict';

    var TABS_AREA_HEIGHT = 40,
        TABS_AREA_RIGHT_MARGIN = 50,
        dimensions = Dimensions.getInstance(),
        layoutHolder = LayoutHolder.getInstance();


    ko.bindingHandlers.svgRoot = {
        update: function(elem) {
            // LOG.warn('update svgRoot');
            var scaled = dimensions.scaled();
            elem.setAttribute('viewBox', util.formatString('0 0 {} {}', dimensions.layoutWidth(), dimensions.layoutHeight()));
            elem.setAttribute('width', scaled.width);
            elem.setAttribute('height', scaled.height);
            if (dimensions.isLandscape()) {
                elem.style.transform = util.formatString('rotate(-90deg) translate(0, {}px)', -scaled.width);
            }
        }
    };

    ko.bindingHandlers.svgTabsArea = {
        update: function(elem) {
            // LOG.warn('update svgTabsArea');
            var width = (dimensions.isLandscape() ? dimensions.layoutHeight() : dimensions.layoutWidth()) - TABS_AREA_RIGHT_MARGIN;
            elem.setAttribute('y', 0);
            elem.setAttribute('width', width);
            elem.setAttribute('height', TABS_AREA_HEIGHT);
        }
    };

    ko.bindingHandlers.svgTabsAreaGroup = {
        update: function(elem) {
            // LOG.warn('update svgTabsAreaGroup');
            if (dimensions.isLandscape()) {
                elem.style.transform = util.formatString('rotate(90deg) translate(0, {}px)', -dimensions.layoutWidth());
            }
        }
    };


    ko.bindingHandlers.svgTab = {
        update: function(elem, valueAccessor , allBindings, viewModel, bindingContext) {
            var allTabsCount = layoutHolder.tabPages().length,
                tabIndex = allTabsCount && bindingContext.$index();

            if (allTabsCount && typeof tabIndex === 'number') {
                elem.setAttribute('height', TABS_AREA_HEIGHT);
                elem.setAttribute('width', (100 / allTabsCount) + '%');
                elem.setAttribute('x', ((100/allTabsCount) * tabIndex) + '%');
            }
        }
    };

    ko.bindingHandlers.svgControlsArea = {
        update: function(elem) {
            // LOG.warn('update svgControlsArea');
            if (!dimensions.isLandscape()) {
                elem.setAttribute('transform', util.formatString('translate(0 {})', TABS_AREA_HEIGHT));
            }
        }
    };

    ko.bindingHandlers.svgContainer = {
        update: function(elem) {
            // LOG.warn('update svgSvgContainer');
            var isLandscape = dimensions.isLandscape(),
                scaled = dimensions.scaled();

            elem.style.width = (isLandscape ? scaled.height : scaled.width) + 'px';
            elem.style.height = (isLandscape ? scaled.width : scaled.height) + 'px';
        }
    };

    ko.bindingHandlers.svgLabel = {
        update: function(elem, valueAccessor , allBindings, viewModel, bindingContext) {
            var control = viewModel,
                isLandscape = dimensions.isLandscape.peek(),
                isLabelV = (control.isVertical),
                textNeedsRotation = (!isLandscape && isLabelV) || (isLandscape && isLabelV),
                wrappingSvg,
                effectiveWidth,
                effectiveHeight;

            // LOG.dev('isLabelV: %s, isLabelH: %s, isLandscape: %s', isLabelV, isLabelH, isLandscape);

            if (textNeedsRotation) {
                wrappingSvg = $(elem).closest('.svg__controlWrap')[0];
                util.assert(wrappingSvg, 'Couldnt find parent .svg__controlWrap element for {}', elem);
                effectiveWidth = wrappingSvg.width.baseVal.value;
                effectiveHeight = wrappingSvg.height.baseVal.value;

                elem.setAttribute('transform', util.formatString('rotate(90,{},{})', effectiveWidth/2, effectiveHeight/2));
            }
        }
    };

    ko.bindingHandlers.multiDivider = {
        update: function (elem, valueAccessor, allBindings, viewModel, bindingContext) {
            var control = viewModel,
                props = control.props,
                dim = svgUtil.getDimensions(elem.parentNode.parentNode);

            elem.setAttribute('d', svgUtil.getDividerPath(props._number_x, props._number_y, 0, 0, dim.width, dim.height));
        }
    };
});