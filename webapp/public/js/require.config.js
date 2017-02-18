
'use strict';

// jquery is globally available as 'jQuery'
define('jquery-private', [], function(){
    return window.jQuery;
});

// knockout is globally available as 'ko'
define('knockout-private', [], function(){
    return window.ko;
});

// knockout is globally available as 'ko'
define('zip-global', [], function(){
    return window.zip;
});

// pseudo-console if console is not present by default (IE with DevTools disabled)
define('console', [], function() {
    var nop = function(){};
    return (typeof window.console !== 'undefined') ? window.console : {
        log: nop,
        info: nop,
        debug: nop,
        error: nop
    };
});

require.config({
    baseUrl: (typeof jQuery === 'undefined') ? 'resources/js/' :
                                $('script[src*="requirejsAndConfig.js"]:first').attr('src').replace(/^(.+?\/js\/).*$/, '$1'),
    paths: {
        'jquery-mousewheel': 'lib/jquery-mousewheel/jquery.mousewheel.min',
        underscore: 'lib/underscore/underscore-min',
        util: 'AMD/util/util',
        svgUtil: 'AMD/util/svgUtil',
        sha1: 'lib/sha1/sha1.min',
        knockoutFastForeach: 'lib/knockout-fast-foreach/dist/knockout-fast-foreach.min',
        LOG: 'AMD/util/Logger',
        koToggleableExtender: 'AMD/knockout/koToggleableExtender',
        jsonXmlUtil: 'lib/xmljson/jsonXmlUtil',
        X2JS: 'lib/x2js/xml2json.min' // https://github.com/abdmob/x2js
    },
    shim: {
        underscore: {
            exports: '_'
        },
        koToggleableExtender: ['knockout'],
        'jquery-mousewheel': ['jquery']
    },
    map: {
        '*': {
            // use another jquery version in the module than the global one.
            jquery: 'jquery-private',
            knockout: 'knockout-private',
            zip: 'zip-global'
        }
    }
});


jQuery(function() {
    $('.js-module[data-module-name]').each(function() {
        var ctx = this,
            moduleName = $(this).data('module-name');

        ctx.className = ctx.className.replace('js-module', 'js-module--loaded');

        if (moduleName) {
            require([moduleName], function(module) {
                module.init(ctx);
            });
        }
    });
});