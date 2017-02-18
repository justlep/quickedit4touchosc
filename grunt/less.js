module.exports = function (grunt, cfg) {
    'use strict';

    var path = require('path'),
        ce = require('cloneextend'),
        LessPluginAutoPrefixer = require('less-plugin-autoprefix'),

        GENERATE_COMPRESSED_CSS = true,
        GENERATE_RAW_CSS = false,

        WEBAPP_BASE_PATH = 'webapp/',

        OPTIONS_BASE = {
            relativeUrls: true,
            strictMath: false, // IMPORTANT! otherwise compiles gridlock css will be invalid
            optimization: 2
        },
        files = grunt.file.expand({
            expand: true,
            cwd: WEBAPP_BASE_PATH
        }, [
            'public/less/**/*.less',
            '!public/less/imports/**/*.less'
        ]),

        lessConfig = {
            options: {
                plugins: [ new LessPluginAutoPrefixer({browsers: ['last 2 version', 'ie 8', 'ie 9']}) ]
            }
        };

    grunt.log.debug('files: ' + JSON.stringify(files));
    grunt.log.debug('Less-Plugins: ' + JSON.stringify(lessConfig.plugins));

    files.forEach(function(lessFilePath, index){
        var taskBaseName    = lessFilePath.replace('.less','').replace('/','_'),
            taskNameCompressed = taskBaseName + '__compressed',
            taskNameRaw = taskBaseName + '__raw',
            filename        = lessFilePath.replace(/(.*?)(\.less)$/,'$1').replace('.less',''),
            cssFileRaw      = (WEBAPP_BASE_PATH + filename+ '.css').replace('/less/', '/css/'),
            cssFileMin      = (WEBAPP_BASE_PATH + filename+ '.min.css').replace('/less/', '/css/'),
            sourceMapFilename = (filename + '.min.css.map'),
            sourceMapPath   = (WEBAPP_BASE_PATH + sourceMapFilename).replace('/less/', '/css/'),
            fileMapCompressed = {},
            fileMapRaw        = {};

        fileMapCompressed[cssFileMin] = WEBAPP_BASE_PATH + lessFilePath;
        fileMapRaw[cssFileRaw]        = WEBAPP_BASE_PATH + lessFilePath;

        if (GENERATE_COMPRESSED_CSS) {
            lessConfig[taskNameCompressed] = {
                options: ce.cloneextend(OPTIONS_BASE, {
                    compress: true,
                    yuicompress: true,
                    dumpLineNumbers: 'all',
                    sourceMap: true,
                    outputSourceFiles: true,
                    sourceMapFilename: sourceMapPath,
                    sourceMapURL: sourceMapFilename.replace(/^.*\//, '') // relative path removed
                }),
                files: fileMapCompressed
            };
        }

        if (GENERATE_RAW_CSS) {
            lessConfig[taskNameRaw] = {
                options: OPTIONS_BASE,
                files: fileMapRaw
            };
        }
    });

    grunt.log.debug('config: ' + JSON.stringify(lessConfig, null, 2));

    return lessConfig;
};
