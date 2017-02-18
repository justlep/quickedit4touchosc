define([], function() {

    'use strict';

    return {
        getDimensions: function(svgElem) {
            return {
                width: svgElem.width.baseVal.value,
                height: svgElem.height.baseVal.value
            };
        },

        getDividerPath: function(numX, numY, xStart, yStart, width, height) {
            var x = xStart,
                y = yStart,
                xDist = (width / numX).toFixed(2),
                yDist = (height / numY).toFixed(2),
                parts = [];

            if (numX > 1) {
                parts.push('M ' + x + ' ' + y);
                for (var i = 1; i < numX; i++) {
                    parts.push('m '+ xDist + ' 0');
                    parts.push('l 0 ' + ((i % 2) ? height : -height));
                }
            }

            if (numY > 1) {
                parts.push('M ' + x + ' ' + y);
                for (var j = 1; j < numY; j++) {
                    parts.push('m 0 ' + yDist);
                    parts.push('l ' + ((j % 2) ? width : -width) + ' 0');
                }
            }

            return (parts.length) ? parts.join(' ') : '';
        }
    }

});