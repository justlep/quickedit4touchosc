/*jslint bitwise: true */
/**
 * Making a module draggable.
 * Example:
 *    <div class="js-module" data-module-name="AMD/util/Draggable">
 */
define(['jquery'], function($) {

    'use strict';

    // if (!$.fn.draggable) {
    //     $.fn.draggable = function(opt) {
    //         var opts = $.extend({handle: ''}, opt),
    //             jHandleOrContainer = opts.handle ? this.find(opts.handle) : this,
    //             jContainer = this,
    //             dragH, dragW, posY, posX,
    //             mouseMoveHandler = function(e) {
    //
    //                 jContainer.offset({
    //                     top: (e.pageY + posY - dragH) >> 0,
    //                     left: (e.pageX + posX - dragW) >> 0
    //                 });
    //             },
    //             mouseUpHandler = function(e) {
    //                 $(document.body).off('mousemove', mouseMoveHandler);
    //             };
    //
    //         jHandleOrContainer.on('mousedown', function(e) {
    //             e.preventDefault();
    //
    //             var jDrag = $(this),
    //                 offs = jDrag.offset();
    //
    //             dragH = jDrag.outerHeight();
    //             dragW = jDrag.outerWidth();
    //             posY = offs.top + dragH - e.pageY;
    //             posX = offs.left + dragW - e.pageX;
    //
    //             $(document.body).on('mousemove', mouseMoveHandler);
    //             $(document.body).one('mouseup', mouseUpHandler);
    //         });
    //
    //         return this;
    //     };
    // }

    return {
        init: function(ctx) {
            var handleSelector = $(ctx).data('handleSelector');
            $(ctx).draggable({
                handle: handleSelector,
                //grid: [3, 3] // speed up dragging by lowering redraws
                distance: 3
            });
        }
    };

});