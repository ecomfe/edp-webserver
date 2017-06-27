/**
 * Jingyi Node
 * Copyright 2016 Baidu Inc. All rights reserved.
 *
 * @file 更好用的代理handler
 * @author otakustay
 */

var http = require('http');
var https = require('https');
var edp = require('edp-core');
var chalk = edp.chalk;

/**
 * 创建一个更好用的代理处理器
 *
 * 这个处理器只能用在处理器链的最后，因为需要实现完整的chunk -> chunk的传输，必须实时写入response中，也会实时调用response.end()
 *
 * @param {string} hostname 代理的目标地址
 * @param {number} port 代理的目标端口
 * @param {Object} options 其它配置
 * @param {boolean} options.bypassHost 是否需要将edp收到的Host头传递给下游，默认不传递使用targetEndpoint的值作为Host头
 * @return {Function} 代理函数
 */
module.exports = function (hostname, port, options) {
    options = options || {};
    var bypassHost = options.bypassHost || false;

    return function (context) {
        var request = context.request;
        var response = context.response;

        context.stop();

        // http or https
        var agent = request.protocol === 'https' ? https : http;
        var headers = request.headers;
        if (!bypassHost) {
            headers = require('../util/extend')({host: hostname + ':' + port}, headers);
        }
        var requestOptions = {
            hostname: hostname,
            port: port,
            method: request.method,
            path: request.url,
            headers: headers
        };
        if (typeof options.onRequestOptionsCreated === 'function') {
            requestOptions = options.onRequestOptionsCreated(requestOptions);
        }
        var proxyRequest = agent.request(
            requestOptions,
            function (proxyResponse) {
                response.writeHead(proxyResponse.statusCode, proxyResponse.headers);

                proxyResponse.on(
                    'data',
                    function (chunk) {
                        response.write(chunk);
                    }
                );

                proxyResponse.on(
                    'end',
                    function () {
                        response.end();
                        context.start();
                        edp.log.info(
                            chalk.yellow('PROXY') + ' %s to %s',
                            chalk.green(request.url),
                            chalk.green(requestOptions.hostname + ':' + requestOptions.port + requestOptions.path)
                        );
                    }
                );
            }
        );
        proxyRequest.on(
            'error',
            function (ex) {
                edp.log.error(
                    chalk.yellow('PROXY') + ' %s to %s: %s',
                    chalk.green(request.url),
                    chalk.green(requestOptions.hostname + ':' + requestOptions.port + requestOptions.path),
                    chalk.yellow(ex)
                );

                context.status = 503;
                context.content = 'Service unavailable';
                context.start();
            }
        );

        if (request.bodyBuffer) {
            proxyRequest.write(request.bodyBuffer);
        }
        proxyRequest.end();
    };
};
