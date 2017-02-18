module.exports = function (grunt, opts) {

    'use strict';

    const sitemap = require('./../modules/sitemap'),
          http = require('http'),
          path = require('path');

    grunt.registerTask('generateFiles', 'Triggers generation of the HTML files',  function() {
        var done = this.async();

        sitemap.getSimpleMap().then(map => {
            var filesCount = map.urls.length;

            map.urls.push('/_sitemap.html');

            Promise.all(map.urls.map(url => {

                return new Promise(function(resolve, reject) {
                    var urlToRequest = sitemap.getUrl(url, true),
                        htmlFileToWrite = path.join(__dirname, '../docs', url.replace(/(\.jade|\.html|\/)$/, '.html'));

                    http.get(urlToRequest, res => {
                        var bodyHtmlParts = [];
                        res.on('data', data => {
                            bodyHtmlParts.push(data);
                        });
                        res.on('end', () => {
                            grunt.file.write(htmlFileToWrite, bodyHtmlParts.join(''), {encoding: 'utf-8'});
                            grunt.log.ok(`HTML written -> ${htmlFileToWrite}`);
                            resolve();
                        })
                    }).on('error', (err) => {
                        grunt.log.warn(`Error while requesting ${url}`, err);
                        reject(err);
                    });
                })

            })).then(() => {
                grunt.log.ok(`Successfully generated ${filesCount} files.`);
                done();
            }, (err) => {
                grunt.fail.warn(err);
                done();
            });
        }, (err) => {
            grunt.fail.warn(err);
            done();
        });

    });

};