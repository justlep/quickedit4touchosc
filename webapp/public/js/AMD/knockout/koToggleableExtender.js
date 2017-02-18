/**
 * Extender enabling to toggle an Observable between boolean states via .toggle(), .toggleOn() or .toggleOff().
 * (!) The initial value of the target will NOT be changed, hence will be interpreted truthy/falsy on first toggle.
 *
 * Example:
 *    var myObs = ko.observable().extend({toggleable: true});
 *    myObs.toggle();     // inverts the current status (->true)
 *    myObs.toggleOn();   // set the observable `true`
 *    myObs.toggleOff();  // set the observable `false`
 */
define(['knockout'], function(ko) {

    'use strict';

    ko.extenders.toggleable = function(target, options) {

        target.toggleOn = function() {
            target(true)
        };

        target.toggleOff = function() {
            target(false);
        };

        target.toggle = function() {
            target(!target());
        };

    };

});