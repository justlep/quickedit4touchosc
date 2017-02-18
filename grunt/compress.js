module.exports = function (grunt, opts) {

    'use strict';

    return {
        build: {
            options: {
                mode: 'zip',
                level: 1,
                pretty: true,
                archive: function() {
                    var version = opts.pkg.version,
                        formattedDate = grunt.template.today("yyyy-mm-dd__HH-MM");

                    return 'docs/build__' + formattedDate + '__v' + version + '.zip';
                }
            },
            files: [{
                expand: 'true',
                cwd: '.',
                src: ['docs/**/*', '!docs/**/*.zip']
            }]
        }
    };
};
