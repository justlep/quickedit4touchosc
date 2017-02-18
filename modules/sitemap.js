
const glob = require('glob'),
      path = require('path'),
      fs = require('fs'),
      _ = require('underscore'),
      pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '../package.json'))),
      BASE_URL = `http://localhost:${pkg.config.port}`,
      GLOB_CWD = path.join(__dirname, '../webapp');

/**
 * Returns a more extended version of the sitemap.
 * @return Promise, resolving with an object of following structure:
 *    {
 *      urls: String[],
 *      paths: String[],
 *      urlsByPath: {String: String[]}
 *    }
 */
function getExtendedMap() {
    return new Promise((resolve, reject) => {
        getSimpleMap().then(simpleMap => {

            var paths = [],
                urlsByPath = {};

            simpleMap.urls.forEach(url => {
                var match = url.match(/(.*\/|^)([^\/]+)$/),
                    path = match[1] || '/',
                    file = match[2];

                if (!urlsByPath[path]) {
                    urlsByPath[path] = [];
                    paths.push(path);
                }
                urlsByPath[path].push(file);
            });

            paths.sort((a,b) => {
                return a.localeCompare(b);
            });

            resolve(_.extend({}, simpleMap, {
                paths: paths,
                urlsByPath: urlsByPath
            }));

        }, reject);
    });
}

/**
 * Returns a simple sitemap
 * @return Promise, resolving with an object of following structure:
 *    {
 *      urls: String[]
 *    }
 */
function getSimpleMap() {
    var map = {
            baseUrl: BASE_URL,
            urls: []
        };

    return new Promise((resolve, reject) => {
        glob('views/**/*.jade', {
            ignore: ['views/layout/**', 'views/error*', 'views/**/_*', 'views/mixins/**'],
            nodir: true,
            cwd: GLOB_CWD
        }, (err, files) => {
            if (!err) {
                map.urls = files.map(file => {
                    return file.replace(/^views\/(.*?)(?:\.jade)?$/, '$1.html');
                });
                resolve(map);
            } else {
                console.error(err);
                reject(err);
            }
        });
    });
}

function getUrl(relativeOrAbsoluteUrl, renderToFile) {
    var renderToFileParam = renderToFile ? `?${pkg.config.renderToFileUrlParam}` : '';

    if (/^https?:/.test(relativeOrAbsoluteUrl)) {
        return relativeOrAbsoluteUrl + renderToFileParam;
    }

    return `http://localhost:${pkg.config.port}/${relativeOrAbsoluteUrl.replace(/^\//,'')}${renderToFileParam}`;
}

module.exports = {
    getExtendedMap: getExtendedMap,
    getSimpleMap: getSimpleMap,
    getUrl: getUrl
};