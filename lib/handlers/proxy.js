/**
 * @file handlers/proxy.js
 * @author leeight(liyubei@baidu.com)
 */

var edp = require('edp-core');
var chalk = edp.chalk;
var http = require('http');
var https = require('https');

/**
 * http代理
 *
 * @param {string} hostname 主机名，可为域名或ip
 * @param {number=} port 端口，默认80
 * @param {Object=} requestHeaders 额外的request header参数
 * @return {Function}
 */
module.exports = exports = function proxy(hostname, port, requestHeaders) {
    return function (context) {
        var request = context.request;
        var proxyMap = context.conf.proxyMap;
        if (!hostname && !proxyMap) {
            // 没有响应不友好，根本看不出来啥问题
            context.content = ''
                + '<h1>Not Found</h1>' + '<p>The requested URL '
                + request.pathname
                + ' was not found on this server.</p>';
            return;
        }
        else if (!hostname) {
            var host = request.headers.host;
            if (proxyMap[host]) {
                var matched = proxyMap[host].split(':');
                hostname = matched[0];
                port = matched[1] || port;
            }
            else {
                edp.log.warn('Can not find matched host for %s', chalk.red(host));
                return;
            }
        }

        // http or https
        var agent = /^https:/.test(hostname) ? https : http;

        // 设置默认端口
        port = port || (agent === https ? 443 : 80);

        var index = hostname.indexOf('://');
        if (index !== -1) {
            hostname = hostname.substring(index + 3);
        }
        else if (parseInt(port, 10) === 443) {
            // 如果hostname没有https或者http开头，则如果port是443，使用https
            agent = https;
        }

        context.stop();

        // build request options
        var targetHost = hostname + (port ? ':' + port : '');
        var reqHeaders = request.headers;

        if (typeof context.conf.overrideProxyRequestHeader === 'function') {
            // modify the request host to target host
            context.conf.overrideProxyRequestHeader(reqHeaders);
        }
        else if (typeof requestHeaders === 'object') {
            reqHeaders = edp.util.extend(reqHeaders, requestHeaders);
        }

        var reqOptions = {
            hostname: hostname,
            port: port,
            method: request.method,
            path: request.url,
            headers: reqHeaders
        };


        // create request object
        var start = Date.now();
        var req = agent.request(reqOptions, function (res) {
            var content = [];
            res.on('data', function (chunk) {
                content.push(chunk);
            });

            res.on('end', function () {
                edp.log.info(chalk.yellow('PROXY') + ' %s to %s - - %s ms', chalk.green(request.url),
                    chalk.green(targetHost + request.url), Date.now() - start);

                context.content = Buffer.concat(content);
                context.header = res.headers;
                if (!res.headers.connection) {
                    context.header.connection = 'close';
                }
                if (typeof context.conf.overrideProxyResponseHeader === 'function') {
                    context.conf.overrideProxyResponseHeader(context.header);
                }
                context.status = res.statusCode;
                context.start();
            });
        });

        req.on('error', function (err) {
            edp.log.error(chalk.yellow('PROXY') + ' %s to %s - - %s ms', chalk.green(request.url),
                chalk.green(targetHost + request.url), Date.now() - start);

            context.status = 500;
            context.content = '';
            context.start();
        });

        // send request data
        var buffer = context.request.bodyBuffer;
        buffer && req.write(buffer);
        req.end();
    };
};
