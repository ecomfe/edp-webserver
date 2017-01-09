/**
 * @file 内建资源处理方法集合
 * @author otakustay[otakustay@live.com],
 *         errorrik[errorrik@gmail.com],
 *         ostream[ostream.song@gmail.com],
 *         firede[firede@firede.us],
 *         junmer[junmer@foxmail.com],
 *         leeight[leeight@gmail.com]
 */
var path = require('path');
var zlib = require('zlib');
var filterHttp2DeprecatedHeaders = require('./util/filter-http2-deprecated-headers');

var mimeType = require('./mime-types');

exports.write = function () {
    return function (context) {
        var response = context.response;
        var request  = context.request;
        var header   = context.header;
        var extname  = path.extname(request.pathname).slice(1);

        if (response.finished) {
            return;
        }

        var headers = Object.keys(header).map(function (s) {
            return s.toLowerCase();
        });

        if (context.status === 200
            && headers.indexOf('content-type') < 0) {
            header['content-type'] = mimeType[extname] || mimeType.html;
        }

        // 这里要先设置header的content-type和content-encoding，connect的compress才会起作用
        var preSetHeaders = ['content-encoding', 'content-type'];
        preSetHeaders.forEach(function (name) {
            if (header[name]) {
                response.setHeader(name, header[name]);
            }
        });

        // 如果headerSents不为空，表示response已经结束了
        if (!response.headerSents) {
            if (context.conf.protocol === 'http2' && context.header) {
                filterHttp2DeprecatedHeaders(context.header);
            }
            var encoding = response.getHeader('content-encoding') || 'identity';
            if (encoding === 'identity') {
                var match = /\b(gzip|deflate)\b/i.exec(request.headers['accept-encoding'] || '');
                encoding = match ? match[1].toLowerCase() : null;
                if (zlib[encoding]) {
                    // encoding == gzip || deflate
                    zlib[encoding](context.content, function (err, ziped) {
                        context.header['content-encoding'] = encoding;
                        context.header['content-length'] = ziped.length;

                        response.writeHead(context.status, context.header);
                        response.write(ziped);
                        context.end();
                    });
                    return;
                }
            }

            if (
                context.content
                && !('content-length' in context.header)
                && !('transfer-encoding') in context.header
            ) {
                context.header['content-length'] = Buffer.byteLength(context.content);
            }
            response.removeHeader('Transfer-Encoding');
            response.writeHead(context.status, context.header);
            context.content && response.write(context.content);
            context.end();
        }
    };
};


exports.addRequestHeader = require('./handlers/add-request-header');
exports.listDirectory = require('./handlers/list-directory');
exports.file = require('./handlers/file');
exports.home = require('./handlers/home');

/**
 * 设置content-type头
 *
 * @param {string=} contentType contentType
 * @return {Function} .
 */
exports.contentType = function (contentType) {
    return function (context) {
        if (contentType) {
            context.header['content-type'] = contentType;
        }
    };
};

/**
 * 设置头
 *
 * @param {Object} header response头
 * @return {Function} .
 */
exports.header = function (header) {
    return function (context) {
        context.header = require('./util/mix')(context.header, header);
    };
};

/**
 * 输出json
 *
 * @param {JSON} data json数据
 * @return {Function} .
 */
exports.json = function (data) {
    return function (context) {
        context.header['content-type'] = mimeType.json;
        if (data) {
            context.content = JSON.stringify(data);
        }
    };
};

/**
 * 输出jsonp
 *
 * @param {JSON} data json数据
 * @param {string} callbackKey 回调函数的参数名
 * @return {Function} .
 */
exports.jsonp = function (data, callbackKey) {
    callbackKey = callbackKey || 'callback';

    return function (context) {
        var qs     = require('querystring');
        var query  = qs.parse(context.request.search);

        context.header['content-type'] = mimeType.js;
        var fnName  = query[callbackKey];
        var content = data ? JSON.stringify(data) : context.content;
        context.content = fnName + '(' + content + ');';
    };
};

/**
 * 输出请求信息
 *
 * @return {Function} .
 */
exports.dumpRequest = function () {
    return function (context) {
        var request = context.request;
        var result = {
            url: request.url,
            method: request.method,
            httpVersion: request.httpVersion,
            protocol: request.protocol,
            host: request.host,
            auth: request.auth,
            hostname: request.hostname,
            port: request.port,
            search: request.search,
            hash: request.hash,
            headers: request.headers,
            query: request.query,
            body: request.bodyBuffer.toString('utf8')
        };

        context.header['content-type'] = mimeType.json;
        context.content = JSON.stringify(result, null, '    ');
    };
};

/**
 * 推迟输出
 *
 * @param {number} time 推迟输出时间，单位ms
 * @return {Function} .
 */
exports.delay = function (time) {
    return function (context) {
        context.stop();
        setTimeout(
            function () {
                context.start();
            },
            time
       );
    };
};

/**
 * 输出内容
 *
 * @param {string} content 要输出的内容
 * @return {Function} .
 */
exports.content = function (content) {
    return function (context) {
        context.content = content;
    };
};

/**
 * 输出重定向
 *
 * @param {string} location 重定向地址
 * @param {boolean} permanent 是否永久重定向
 * @return {Function} .
 */
exports.redirect = function (location, permanent) {
    return function (context) {
        context.status = permanent ? 301 : 302;
        context.header.location = location;
    };
};

/**
 * 输出空内容
 *
 * @return {Function} .
 */
exports.empty = function () {
    return exports.content('');
};

exports.php = require('./handlers/php');

exports.less = require('./handlers/less');
exports.autoless = require('./handlers/autoless');
exports.postcss = require('./handlers/postcss');

exports.coffee = require('./handlers/coffee');
exports.autocoffee = require('./handlers/autocoffee');

exports.proxyNoneExists = require('./handlers/proxy-none-exists');
exports.proxy = require('./handlers/proxy');
exports.pass = require('./handlers/pass');

exports.html2js = require('./handlers/html2js');

exports.autocss = require('./handlers/autocss');

exports.stylus = require('./handlers/stylus');
exports.autostylus = require('./handlers/autostylus');

exports.livereload = require('./handlers/livereload');

exports.markdown = require('./handlers/markdown');

exports.babel = require('./handlers/babel');

exports.fontsync = require('./handlers/fontsync');

exports.contentRange = require('./handlers/content-range');
