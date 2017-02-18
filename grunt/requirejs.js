module.exports = function (grunt, options) {
    'use strict';

    var EMPTY = 'empty:';

    return {
        bundle: {
            options: {
                xxxoptimize: 'uglify',
                xxxuglify2: {
                    //Example of a specialized config. If you are fine
                    //with the default options, no need to specify
                    //any of these properties.
                    output: {
                        beautify: true
                    },
                    compress: {
                        sequences: false,
                        global_defs: {
                            DEBUG: false
                        }
                    },
                    warnings: true,
                    mangle: false
                },
                paths: {
                    'knockout': EMPTY,
                    'knockout-private': EMPTY,
                    'jquery-private': EMPTY,
                    'zip-global': EMPTY
                },
                baseUrl: './webapp/public/js/',
                mainConfigFile: './webapp/public/js/require.config.js',
                //name: 'path/to/almond', /* assumes a production build using almond, if you don't use almond, you
                // need to set the "includes" or "modules" option instead of name */
                include: ['AMD/QuickEditApp', 'AMD/util/Draggable'],
                //insertRequire: ['AMD/QuickEditApp'],
                out: './webapp/public/js/bundle.js'
            }
        }
    };

};