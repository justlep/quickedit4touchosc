module.exports = function (grunt, options) {
    'use strict';

    grunt.registerTask('default', [
        'concat',
        'newer:jshint',
        'prepareCss',
        'generateMixinsInclude',
        'concurrent:serverAndWatchers'
    ]);

    grunt.registerTask('startServer', [
        'exec:server'
    ]);

    grunt.registerTask('startWatchers', [
        'concurrent:watchers'
    ]);

    grunt.registerTask('prepareCss', [
        'sprite',
        'less'
    ]);

    grunt.registerTask('build', [
        'concurrent:startServerAndBuild'
    ]);

    grunt.registerTask('buildThenShutdownServer', [
        'waitServer:waitForServerStart',
        'concat',
        'clean:buildAndBundle',
        'prepareCss',
        'jshint',
        'requirejs:bundle',
        'generateMixinsInclude',
        'copy:publicToBuild',
        'generateFiles',
        // 'compress:build',
        'waitServer:shutdownServerAfterBuild'
    ]);

};
