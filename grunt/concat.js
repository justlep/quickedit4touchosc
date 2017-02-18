module.exports = function (grunt, options) {

    'use strict';

    return {
        options: {
            separator: ';\n\n',
            footer: '\n'
        },
        requirejsAndConfig: {
            dest: 'webapp/public/js/requirejsAndConfig.js',
            src: [
                'webapp/public/js/lib/requirejs/require.min.js',
                'webapp/public/js/require.config.js'
            ],
            nonull: true
        }
    };
};
