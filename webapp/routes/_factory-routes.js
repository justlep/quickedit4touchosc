const glob = require('glob'),
      sitemap = require('./../../modules/sitemap');

module.exports = function(router) {

    router.get('/*', (req, res, next) => {
        var path = req.path || '/';

        if (path === '/') {
            return res.redirect('_sitemap.html');
        }

        // turn URLs without file extension into *.html requests
        if (!/\.[a-zA-Z]{2,4}$/.test(path)) {
            return res.redirect(path + '.html');
        }

        next();
    });

    /**
     * Scans for all jade templates and generates a link list to their respective URLs.
     * Jade-includes (_*.jade) are ignored.
     */
    router.get('/_sitemap.html', (req, res, next) => {
        sitemap.getExtendedMap().then(map => {
            res.locals.sitemap = map;
            next();
        }, (err) => {
            console.error(err);
            next(err);
        });
    });

    router.all('/__shutdown__.html', (req, res, next) => {
        console.warn('Server shutdown requested');
        res.send('OK');
        process.nextTick(() => {
            console.warn('Shutting down server');
            process.exit(0);
        });
    });

    return router;
};