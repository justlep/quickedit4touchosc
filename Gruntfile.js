module.exports = function (grunt) {
    "use strict";

    require('time-grunt')(grunt);

    require('load-grunt-config')(grunt, {
        init: true,
        data: {
            SRC_DIR: '/',
            pkg:    grunt.file.readJSON('package.json')
        }
    });

    grunt.loadTasks('grunt-tasks');
};
