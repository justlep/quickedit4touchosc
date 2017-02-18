define(['knockout', 'util'], function(ko, util) {

    'use strict';

    ko.bindingHandlers.rotaryHandle = {
        update: function(element, valueAccessor , allBindings, viewModel, bindingContext) {
            var control = bindingContext.$data,
                isArc = !!valueAccessor(),
                isRotaryH = !control.isVertical,
                isCentered = control.props._centered,
                isInverted = control.props._inverted,
                size = control.props._w,
                halfSize = Math.round(size / 2),
                innerRadius = Math.round(size * 0.22),
                outerRadius = Math.round(size * 0.4),
                angle,
                getX = function(angle, radius) {
                    var angleRad = (Math.PI / 180) * angle;
                    return (halfSize + (Math.cos(angleRad) * radius));
                },
                getY = function(angle, radius) {
                    var angleRad = (Math.PI / 180) * angle;
                    return (halfSize + (Math.sin(angleRad) * radius));
                };

            if (isRotaryH) {
                angle = isCentered ? 0 : isInverted ? 135 : 225;
            } else {
                angle = isCentered ? 270 : isInverted ? 45 : 135;
            }

            if (isArc) {
                // M0,25 A25,25,0 1 1 50,0
                var arcWidth = outerRadius - innerRadius,
                    arcRadius = (innerRadius + outerRadius) / 2,
                    startAngle = (isCentered ? angle + 225 : isInverted ? angle + 90 : angle) % 360,
                    endAngle = (isCentered ? angle + 135 : isInverted ? angle : angle + 270) % 360,
                    startX = getX(startAngle, arcRadius),
                    startY = getY(startAngle, arcRadius),
                    endX = getX(endAngle, arcRadius),
                    endY = getY(endAngle, arcRadius),
                    d = util.formatString('M{},{} A{},{},0 1 1 {},{}', startX, startY, arcRadius, arcRadius, endX, endY);

                element.setAttribute('d', d);
                element.setAttribute('stroke-width', arcWidth);

            } else {
                element.setAttribute('x1', getX(angle, innerRadius));
                element.setAttribute('y1', getY(angle, innerRadius));
                element.setAttribute('x2', getX(angle, outerRadius));
                element.setAttribute('y2', getY(angle, outerRadius));
            }
        }
    }


});