module.exports = function (grunt, cfg) {
    'use strict';

    return {
        options: {
            logConcurrentOutput: true
        },
        serverAndWatchers: [
            'watch:less',
            'watch:lessImports',
            'watch:mixinsAddedOrRemoved',
            'watch:livereload',
            'exec:server'
        ],

        watchers: [
            'watch:less',
            'watch:lessImports',
            'watch:mixinsAddedOrRemoved',
            'watch:livereload'
        ],

        startServerAndBuild: [
            'exec:server',
            'buildThenShutdownServer'
        ]
    };

};
