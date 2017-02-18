define(['knockout', 'jquery', 'util', 'svgUtil', 'AMD/Dimensions', 'AMD/VisualConfig'],
    function(ko, $, util, svgUtil, Dimensions, VisualConfig) {

    'use strict';

    ko.bindingHandlers.faderHandle = {
        update: function(element, valueAccessor , allBindings, viewModel, bindingContext) {
            var isLandscape = Dimensions.getInstance().isLandscape(),
                isDivider = valueAccessor(),
                control = bindingContext.$data,
                isCentered = control.props._centered,
                isInverted = control.props._inverted,
                num = control.props._number,
                dim = svgUtil.getDimensions(element.parentNode.parentNode),
                pWidth = dim.width,
                pHeight = dim.height,
                x, y, width, height, path='';

            if (isDivider && !util.isNumberInRange(num, 2, 10000)) {
                return;
            }

            if (control.isVertical) {
                x = 0.1 * pWidth;
                width = 0.8 * pWidth;
                height = 0.1 * pHeight;
                if (isLandscape) {
                    y = pHeight * (isCentered ? 0.45 : isInverted ? 0.85 : 0.05);
                } else {
                    y = pHeight * (isCentered ? 0.45 : isInverted ? 0.05 : 0.85);
                }
                path = isDivider && svgUtil.getDividerPath(num, 1, x, y, width, height);
            } else {
                x = pWidth * (isCentered ? 0.45 : isInverted ? 0.85 : 0.05);
                y = pHeight * 0.1;
                height = 0.8 * pHeight;
                width = 0.1 * pWidth;
                path = isDivider && svgUtil.getDividerPath(1, num, x, y, width, height);
            }

            if (isDivider) {
                element.setAttribute('d', path);
            } else {
                element.setAttribute('x', x);
                element.setAttribute('y', y);
                element.setAttribute('width', width);
                element.setAttribute('height', height);
            }
        }
    };

});