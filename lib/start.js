/**
 * @file 开发时web调试服务器启动功能
 * @author otakustay[otakustay@live.com],
 *         errorrik[errorrik@gmail.com],
 *         ostream[ostream.song@gmail.com],
 *         firede[firede@firede.us]
 *         sekiyika[px.pengxing@gmail.com]
 */
var fs = require('fs');
var path = require('path');
var http = require('http');
var https = require('https');

var http2 = require('http2');
var connect = require('connect');
var edp = require('edp-core');
var launcher = require( 'edp-browser-launcher2' );

/**
 * 服务器配置
 *
 * @inner
 */
var serverConfig;

/**
 * 启动webserver
 *
 * @param {Object} config 启动所需配置模块
 * @return {*} .
 */
module.exports = function (config) {
    config = config || require('./config');
    serverConfig = config;

    var port = config.port || 80;
    var protocol = config.protocol || 'http';
    var navigator = config.navigator;
    var documentRoot = config.documentRoot;
    var injectResource = config.injectResource || config.injectRes;
    injectResource && injectResource(require('./resource'));

    var app = connect();

    // 采用connect连接各个中间件
    var defaults = require('./middleware/defaults');
    defaults.attachTo(app, serverConfig);

    var server;
    if (protocol === 'https') {
        server = https.createServer(
            serverConfig.tlsOptions,
            app
        ).listen(port);
    }
    else if (protocol === 'http2') {
        server = http2.createServer({
            key: fs.readFileSync(path.join(__dirname, '/localhost.key')),
            cert: fs.readFileSync(path.join(__dirname, '/localhost.crt'))
        }, app).listen(port);
    }
    else {
        server = http.createServer(app).listen(port);
    }

    var accessUrl = ((protocol === 'http') ? protocol : 'https')
        + '://'
        + require('./util/ip')
        + (port === 80 ? '' : ':' + port);

    edp.log.info('EDP WebServer start, %s', accessUrl);
    edp.log.info('root = [%s], listen = [%s] ', documentRoot, port);

    if (navigator) {
        launcher.detect(function(available) {
            if (available && available.length) {
                var browsers = [];

                while (available.length) {
                    var browser = available.shift();
                    browsers.push(browser.name);
                }

                if (typeof navigator !== 'string' || browsers.indexOf(navigator) < 0) {
                    if (~browsers.indexOf('chrome')) {
                        navigator = 'chrome';
                    } else {
                        navigator = browsers[0];
                    }
                }

                launcher(function(err, launch) {
                    if (err) {
                        return console.error(err);
                    }

                    launch(accessUrl, navigator, function(err, instance) {
                        if (err) {
                            return console.error(err);
                        }

                        edp.log.info('Instance started with PID: %s', instance.pid);
                    });
                });
            } else {
                return console.error('Not found available browser')
            }
        });
    }

    return server;
};
