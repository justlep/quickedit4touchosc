module.exports = function (grunt, options) {
    'use strict';
    return {
        less: {
            files: ['webapp/public/less/**/*.less', '!webapp/public/less/**/imports/**/*.less'],
            tasks: ['newer:less']
        },
        lessImports: {
            files: ['webapp/public/less/**/imports/**/*.less'],
            tasks: ['less']
        },
        mixinsAddedOrRemoved: {
            files: ['webapp/views/mixins/**/*.jade'],
            tasks: ['generateMixinsInclude'],
            options: {
                event: ['added', 'deleted']
            }
        },
        livereload: {
            files: [
                'webapp/views/**/*.j*',
                'webapp/public/css/**/*.css',
                'webapp/public/images/**',
                'webapp/public/js/**',
                '!webapp/public/js/lib'
            ],
            tasks: [],
            options: {
                livereload: {
                    host: 'localhost',
                    port: options.pkg.config.livereloadPort
                }
            }
        }
    };
};