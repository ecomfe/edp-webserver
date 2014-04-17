/***************************************************************************
 *
 * Copyright (c) 2014 Baidu.com, Inc. All Rights Reserved
 * $Id$
 *
 **************************************************************************/



/**
 * lib/handlers/add-request-header.js ~ 2014/02/16 20:54:00
 * @author leeight(liyubei@baidu.com)
 * @version $Revision$
 * @description
 *
 **/

/**
 * 配合Proxy Handler使用，添加一些自定义的Request Header.
 * @param {Object} headers Request Headers.
 */
module.exports = exports = function addRequestHeader(headers) {
    return function( context ) {
        context.stop();

        var request = context.request;
        var reqHeaders = request.headers;
        for (var key in headers) {
            if ( headers.hasOwnProperty( key ) ) {
                reqHeaders[ key.toLowerCase() ] = headers[key];
            }
        }

        context.start();
    };
};




















/* vim: set ts=4 sw=4 sts=4 tw=100: */
