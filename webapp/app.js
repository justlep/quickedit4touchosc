
'use strict';

const path = require('path'),
    fs = require('fs'),
    http = require('http'),
    _ = require('underscore'),
    grunt = require('grunt'),
    pkg = grunt.file.readJSON(path.resolve(__dirname, '../package.json')),
    express = require('express'),
    bodyParser = require('body-parser'),
    autoLoadRoutes = require('expressjs.routes.autoload'),
    RESOURCES_BASE_PATH = path.join(__dirname, 'public'),
    VIEWS_BASE_PATH = path.join(__dirname, 'views'),
    ROUTES_BASE_PATH = path.join(__dirname, 'routes'),
    RESOURCES_BASE_URL = '/resources/',
    LIVE_RELOAD_PORT = pkg.config.livereloadPort,
    RENDER_TO_FILE_URL_PARAM = pkg.config.renderToFileUrlParam,
    ANTI_CACHE_PARAM_VALUE = Date.now().toString(36);

var app = express(),
    morganLogger = require('morgan')('dev', {
        skip: (req, res) => {
            return res.statusCode < 400
        }
    }),
    idsCounter = 0;

_.extend(app.locals, {
    basedir: VIEWS_BASE_PATH,   // needed for Jade to allow includes by absolute paths
    pretty: true,               // tell Jade to render pretty html
    pkg: pkg,
    appStartDate: new Date(),
    isLivereloadEnabled: false,
    livereloadPort: LIVE_RELOAD_PORT,
    nextId: function() {
        return (++idsCounter);
    }
});

// view engine setup
app.set('views', VIEWS_BASE_PATH);
app.set('view engine', 'jade');
app.use(require('compression')());
app.use(RESOURCES_BASE_URL, express.static(RESOURCES_BASE_PATH));
app.use('/favicon.ico', (req, res, next) => {
    res.sendStatus(404);
});
app.use(morganLogger);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

app.use('/', autoLoadRoutes(ROUTES_BASE_PATH, true));

app.use('/', (req, res, next) => {
    var consolidatedPath = (req.path||'').replace(/\.html$/, ''),
        jadeFilename = /\/$/.test(consolidatedPath) ? 'index.jade' : '.jade',
        jadeFilePath = path.join(VIEWS_BASE_PATH, consolidatedPath + jadeFilename),
        jsonFilePath = jadeFilePath.replace(/\.jade$/, '.json');

    if (!grunt.file.exists(jadeFilePath)) {
        return next();
    }
    _.extend(res.locals, {
        renderToFile: req.query[RENDER_TO_FILE_URL_PARAM] !== undefined,
        resourceUrl: function(resourcePathRelativeToPublic, appendAntiCacheHash) {
            var resource = resourcePathRelativeToPublic.replace(/^\//, ''),
                depth = (req.path.replace(/^\//, '').match(/\//g) || []).length,
                relativeRoot = depth ? new Array(depth + 1).join('../') : '',
                completeUrl = `${relativeRoot}resources/${resource}`;

            if (appendAntiCacheHash) {
                completeUrl += (completeUrl.includes('?') ? '&' : '?') + ANTI_CACHE_PARAM_VALUE;
            }

            return completeUrl;
        }
    });

    if (grunt.file.exists(jsonFilePath)) {
        // auto-add to the model the content of a .json file with identical base name as the .jade view
        try {
            _.extend(res.locals, grunt.file.readJSON(jsonFilePath));
        } catch (e) {
            console.error(`Invalid JSON file -> ${jsonFilePath}`, e);
        }
    }

    res.render(jadeFilePath);
});

// error handlers

// 404 and forward to error handler
app.use(function (err, req, res, next) {
    if (err) {
        next(err, req, res);
    } else {
        console.log(`Not found: ${req.path}`);
        var err = new Error('Not Found');
        err.status = 404;
        next(err, req, res);
    }
});

// development error handler
// stacktrace will be printed on dev-environment only
app.use(function (err, req, res, next) {
    var statusCode = err.status || 500;
    console.error(err.stack);
    res.status(statusCode);
    res.render('error', {
        message: err.message,
        error: err,
        statusCode: statusCode
    });
});

const LIVE_RELOAD_CHECK_INTERVAL = 5000;

function checkLivereload() {
    http.get('http://localhost:' + LIVE_RELOAD_PORT, () => {
        if (!app.locals.isLivereloadEnabled) {
            grunt.log.ok('LiveReload is ENABLED');
        }
        app.locals.isLivereloadEnabled = true;
        setTimeout(checkLivereload, LIVE_RELOAD_CHECK_INTERVAL);
    }).on('error', (e) => {
        if (app.locals.isLivereloadEnabled) {
            grunt.log.warn('LiveReload is DISABLED');
        }
        app.locals.isLivereloadEnabled = false;
        setTimeout(checkLivereload, LIVE_RELOAD_CHECK_INTERVAL);
    });
}
checkLivereload();

module.exports = app;
