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
        var proxyMap  = context.conf.proxyMap;
        var origin = request.headers.origin;
        var protocol = origin
            ? origin.slice(0, origin.indexOf('://'))
            : 'http';
        var host = request.headers.host;
        var path = request.url;
        var url = protocol + '://' + host + path;
        var hit = false;

        /**
         * 循环访问代理规则
         *
         * @param  {Object} proxyMap proxyMap的配置，或者是数组结构的proxyMap的子配置
         * @return {boolean}         是否已经找到对应代理规则
         *
         * @example
         * 无优先级：
         *     var proxyMap = {
         *         '127.0.0.1:8080': '172.x.x.x:8964',
         *         'http://127.0.0.1:8080': 'https://172.x.x.x:8964',
         *         '/static/i': '',
         *         '/\/adrc\/data/': '/data'
         *     };
         *
         * 有优先级：
         *     var proxyMap = [
         *         {'/static/i': ''},
         *         {'127.0.0.1:8080': '172.x.x.x:8964'}
         *     ];
         */
        function walkInRules(proxyMap) {
            for (var rule in proxyMap) {
                var pattern = rule;
                if (/^\/.+\/i?$/.test(pattern)) {
                    // 其他flag没有意义，检查i就可以了
                    var flags = /\/i$/.test(pattern) ? 'i' : '';
                    pattern = new RegExp(pattern.replace(/^\/|\/i?$/g, ''), flags);
                }

                if ((pattern instanceof RegExp && pattern.test(url))
                    || (typeof pattern === 'string' && url.indexOf(pattern) !== -1)
                ) {
                    // 使用整个url来进行替换，包括协议
                    url = url.replace(pattern, proxyMap[rule]);

                    // 提取代理协议、主机名、端口、路径
                    var matched = url.match(/(?:(https?):\/\/)?([^\/:]+)(?::(\d+))?(.*$)/);
                    protocol = matched[1] || protocol;
                    hostname = matched[2];
                    port = matched[3] || 80;
                    path = matched[4] || '';
                    hit = true;
                    break;
                }
            }
            return hit;
        }

        if (!hostname && !proxyMap) {
            // 没有响应不友好，根本看不出来啥问题
            context.content = ''
                + '<h1>Not Found</h1>'
                + '<p>'
                    + 'The requested URL ' + request.pathname + ' was not found on this server.'
                + '</p>';
            return;
        }
        else if (!hostname) {
            // 数组结构可定制优先级
            if (Object.prototype.toString.call(proxyMap).indexOf('Array') !== -1) {
                proxyMap.some(function (item, key) {
                    return walkInRules(item);
                });
            }
            else {
                walkInRules(proxyMap);
            }

            if (!hit) {
                edp.log.warn('Can not find matched url for %s', chalk.red(url));
                return;
            }
        }
        else {
            // 传入了hostname
            var index = hostname.indexOf('://');
            if (index !== -1) {
                protocol = hostname.slice(0, index);
                hostname = hostname.slice(index + 3);
            }
            url = protocol + '://' + hostname + (port ? ':' + port : '') + path;
        }

        // http or https
        var agent = ((port === 443 || protocol === 'https') ? https : http);

        context.stop();

        // build request options
        var reqHeaders = request.headers;

        if (typeof context.conf.overrideProxyRequestHeader === 'function') {
            // modify the request host to target host
            context.conf.overrideProxyRequestHeader(reqHeaders);
        }
        else if (typeof requestHeaders === 'object') {
            reqHeaders = edp.util.extend(reqHeaders, requestHeaders);
        }

        /* eslint-disable fecs-key-spacing */
        var reqOptions = {
            hostname   : hostname,
            port       : port || 80,
            method     : request.method,
            path       : path,
            headers    : reqHeaders
        };
        /* eslint-enable fecs-key-spacing */

        // create request object
        var start = Date.now();
        var req = agent.request(reqOptions, function (res) {
            var content = [];
            res.on('data', function (chunk) {
                content.push(chunk);
            });

            res.on('end', function () {
                edp.log.info(chalk.yellow('PROXY') + ' %s to %s - - %s ms', chalk.green(request.url),
                    chalk.green(url), Date.now() - start);

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
                chalk.green(url), Date.now() - start);

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
