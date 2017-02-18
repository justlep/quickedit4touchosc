module.exports = function (grunt, options) {
    'use strict';
    return {
        options: {
            jshintrc: './.jshintrc'
        },
        all: [
            'Gruntfile.js',
            'grunt/*.js',
            'webapp/public/js/AMD/**/*.js',
            '!webapp/public/js/AMD/**/*.min.js',
            'webapp/public/js/require.config.js'
        ]
    };
};