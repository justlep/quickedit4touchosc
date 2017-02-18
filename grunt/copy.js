module.exports = function (grunt, options) {

    'use strict';

    return {
        publicToBuild: {
            expand: true,
            cwd:  'webapp/public',
            dest: 'docs/resources/',
            src:  [
                'css/**',
                '!css/spritesheet-generated.css',
                'demo/**',
                'fontello/**',
                'images/**',
                'js/bundle.js',
                'js/requirejsAndConfig.js',
                'js/lib/**',
                '!js/lib/knockout/src/**/*',
                '!js/lib/knockout/build/**/*',
                '!js/lib/zipjs/WebContent/tests/**/*'
            ]
        }
   };
};
