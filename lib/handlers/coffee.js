/***************************************************************************
 *
 * Copyright (c) 2014 Baidu.com, Inc. All Rights Reserved
 * $Id$
 *
 **************************************************************************/



/**
 * lib/handlers/coffee.js ~ 2014/02/15 21:39:52
 * @author leeight(liyubei@baidu.com)
 * @version $Revision$
 * @description
 *
 **/
var mimeType = require( '../mime-types' );

/**
 * 处理 coffee-script 输出
 *
 * @param {string} encoding 源编码方式
 * @return {Function}
 */
module.exports = exports = function coffee( encoding ) {
    encoding = encoding || 'utf8';
    return function ( context ) {
        var docRoot  = context.conf.documentRoot;
        var pathname = context.request.pathname;
        var file = docRoot + pathname;

        if ( 'source' in context.request.query ) {
            context.header[ 'content-type' ] = mimeType.js;
            context.content = fs.readFileSync( file, encoding );
        }
        else {
            var compileAndWriteCoffee = require( '../util/compile-and-write-coffee' );
            compileAndWriteCoffee(
                docRoot,
                pathname,
                context.content.toString( encoding ),
                context
            );
        }
    };
};





















/* vim: set ts=4 sw=4 sts=4 tw=100: */
