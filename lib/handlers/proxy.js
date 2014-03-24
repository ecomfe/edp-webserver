/***************************************************************************
 * 
 * Copyright (c) 2014 Baidu.com, Inc. All Rights Reserved
 * $Id$ 
 * 
 **************************************************************************/
 
 
 
/**
 * handlers/proxy.js ~ 2014/02/15 15:05:38
 * @author leeight(liyubei@baidu.com)
 * @version $Revision$ 
 * @description 
 * 
 **/
var edp = require( 'edp-core' );
var chalk = require( 'chalk' );
var http = require( 'http' );

/**
 * http代理
 * 
 * @param {string} hostname 主机名，可为域名或ip
 * @param {number=} port 端口，默认80
 * @return {Function}
 */
module.exports = exports = function proxy( hostname, port ) {
    return function ( context ) {
        var request = context.request;
        var proxyMap  = context.conf.proxyMap;
        if (!hostname && !proxyMap) {
            return;
        }
        else if (!hostname) {
            var host = request.headers['host'];
            if (proxyMap[host]) {
                var matched = proxyMap[host].split(':');
                hostname = matched[0];
                port = matched[1] || port;
            }
            else {
                edp.log.warn('Can not find matched host for %s', chalk.red(host));
            }
        }

        context.stop();

        // build request options
        var targetHost = hostname + ( port ? ':' + port : '' );
        var reqHeaders = request.headers;

        var reqOptions = {
            host       : hostname,
            port       : port || 80,
            method     : request.method,
            path       : request.url,
            headers    : reqHeaders
        };

        // create request object
        edp.log.info('Forward request %s to %s', chalk.green(request.url),
            chalk.green(targetHost + request.url));

        var req = http.request( reqOptions, function ( res ) {
            var content = [];
            res.on( 'data', function ( chunk ) {
                content.push( chunk );
            } );

            res.on( 'end', function () {
                context.content = Buffer.concat( content );
                context.header = res.headers;
                if ( !res.headers.connection ) {
                    context.header.connection = 'close';
                }
                context.status = res.statusCode;
                context.start();
            } );
        } );

        req.on('error', function (err) {
            edp.log.error('Requesting %s %s', chalk.green(targetHost + request.url),
                err.message);
            context.status = 500;
            context.content = '';
            context.start();
        });

        // send request data
        var buffer = context.request.bodyBuffer;
        buffer && req.write( buffer );
        req.end();
    };
};





















/* vim: set ts=4 sw=4 sts=4 tw=100: */
