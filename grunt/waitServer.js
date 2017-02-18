module.exports = function (grunt, opts) {
    'use strict';

    return {
        options: {
            fail: function () {},
            timeout: 10 * 1000,
            interval: 800,
            print: true
        },

        waitForServerStart: {
            options: {
                isforce: false,
                req: {
                    url: 'http://localhost:' + opts.pkg.config.port,
                    method: 'HEAD'
                }
            }
        },

        shutdownServerAfterBuild: {
            options: {
                isforce: false,
                req: {
                    url: 'http://localhost:' + opts.pkg.config.port + '/__shutdown__.html',
                    method: 'GET'
                }
            }
        }
    };

};