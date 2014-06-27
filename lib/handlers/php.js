/***************************************************************************
 *
 * Copyright (c) 2014 Baidu.com, Inc. All Rights Reserved
 * $Id$
 *
 **************************************************************************/



/**
 * php.handler.js ~ 2014/02/28 12:07:51
 * @author leeight(liyubei@baidu.com)
 * @version $Revision$
 * @description
 *
 **/
var edp = require( 'edp-core' );

/* jshint camelcase: false */

/**
 * edp-webserver处理php
 *
 * 在`edp-webserver-config.js`中配置：
 * ```javascript
 * {
 *     location: /^.*$/,
 *     handler: [
 *         // 或者直接将php-cgi添加到环境变量中
 *         php('/usr/local/php/bin/php-cgi')
 *     ]
 * }
 * ```
 * 调试状态下请打开`php.ini`的`error_reporting`。
 *
 * @param {string=} opt_handler php-cgi可执行文件路径
 * @param {string=} opt_suffix 后缀名.
 * @param {function(Object):string=} opt_forwardPathName url转化的函数.
 */
module.exports = exports = function(opt_handler, opt_suffix, opt_forwardPathName) {

    var handler = opt_handler || 'php-cgi';
    // var suffix = opt_suffix || 'php';

    return function(context) {

        var request = context.request;
        var targetURL = request.url;
        var targetPathName = request.pathname;
        var targetSearch = request.search;

        // url改换
        if ( opt_forwardPathName ) {

            var changed = opt_forwardPathName(context);

            if (changed) {

                targetPathName = changed.pathname || targetPathName;
                targetSearch = changed.search || targetSearch;

                targetURL = request.headers.host + targetPathName + targetSearch;

                edp.log.info(
                    'PHP try forwarding request' + (request.url)
                    + ' to ' + (targetURL)
                );
            }
        }

        if (!/\.php($|\?)/.test(targetURL)) {
            return;
        }

        // 挂起
        context.stop();

        edp.log.info(
            'PHP request:' + (targetURL) + ' | ' + (targetPathName)
        );

        var path = require('path');
        var docRoot = context.conf.documentRoot;
        var request = context.request;
        var scriptName = targetPathName;
        var scriptFileName = path.normalize(
            docRoot + targetPathName
        );
        var query = null;
        if (targetSearch) {
            query = require('url').parse(targetSearch).query;
        }

        // @see: http://www.cgi101.com/book/ch3/text.html
        var host = (request.headers.host || '').split(':');
        var env = {
            PATH: process.env.PATH,
            GATEWAY_INTERFACE: 'CGI/1.1',
            SERVER_PROTOCOL: 'HTTP/1.1',
            SERVER_ROOT: docRoot,
            DOCUMENT_ROOT: docRoot,
            SERVER_NAME: host[0],
            SERVER_PORT: host[1] || 80,
            REDIRECT_STATUS: 200,
            SCRIPT_NAME: scriptName, //docroot上的文件
            REQUEST_URI: targetURL,
            SCRIPT_FILENAME: scriptFileName, //物理文件
            REQUEST_METHOD: request.method,
            QUERY_STRING: query || '',
            TRANSFER_ENCODING: 'Chunked'
        };

        // expose request headers
        for (var header in request.headers) {
            var name = 'HTTP_' + header.toUpperCase().replace(/-/g, '_');
            env[name] = request.headers[header];
        }

        // if ('content-length' in request.headers || request.method === 'POST' || request.method === 'PUT') {
        //     env.CONTENT_LENGTH = getContentLength(request);
        //     console.log(env.CONTENT_LENGTH);
        // }

        if ('content-type' in request.headers) {
            env.CONTENT_TYPE = request.headers['content-type'];
        }

        var child = require('child_process').spawn(
            handler,
            [],
            { env: env }
        );

        var bodyBuffer = [];
        var isBodyData = false;
        var headers = {};
        var line = [];

        child.on( 'exit', done );

        child.on('error', function () {
            edp.log.error('php error [' + [].slice.call(arguments) + ']');
        });

        child.stderr
            .on( 'end', function (chunk) {
                chunk && edp.log.error('php error:\n' + chunk.toString('utf8') + '\n');
            })
            .on( 'data', function (chunk) {
                chunk && edp.log.error('php error:\n' + chunk.toString('utf8') + '\n');
            });

        child.stdout
            .on( 'end', done )
            .on( 'data', function( buf ) {

                for (var i = 0; i < buf.length; i++) {
                    // 如果是主体数据内容
                    if (isBodyData) {
                        return bodyBuffer.push(buf);
                    }

                    // 取出header
                    var c = buf[i];
                    if (c == 0xA) { // 如果是\n，则一行读取完毕
                        if (!line.length) { // 如果读取到一个空行
                            isBodyData = true;
                            bodyBuffer.push( buf.slice(i + 1) );
                            return;
                        }

                        var s = line.join('');
                        line = [];
                        var idx = s.indexOf(':');

                        headers[s.slice(0, idx)] = s.slice(idx + 1).trim();
                    } else if (c != 0xD) { //如果不是\n，也不是\r，说明一行还未读取结束
                        line.push(String.fromCharCode(c));
                    }
                }
            }
        );

        // 将php解析后的结果填充到context中
        function done( code ) {

            if (code === undefined) {
                return;
            }

            for(var i in headers) {
                if (headers.hasOwnProperty(i)) {
                    context.header[i] = headers[i];
                }
            }

            context.content = bodyBuffer.join('');

            // 如果code非零，也不一定不能运行
            // if (code) {
            //     context.status = 500;
            // }

            // 标志php成功返回
            context.phpOK = true;
            context.start();
        }
    };
};




/* vim: set ts=4 sw=4 sts=4 tw=100: */
