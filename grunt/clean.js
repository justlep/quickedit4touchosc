module.exports = function (grunt, options) {

    'use strict';

    return {
        buildAndBundle: ['docs/*', '!docs/README.md', 'webapp/public/js/bundle.js']
    };
};
