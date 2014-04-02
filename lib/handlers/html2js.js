/***************************************************************************
 *
 * Copyright (c) 2014 Baidu.com, Inc. All Rights Reserved
 * $Id$
 *
 **************************************************************************/



/**
 * lib/handlers/html2js.js ~ 2014/02/15 22:03:35
 * @author leeight(liyubei@baidu.com)
 * @version $Revision$
 * @description
 *
 **/
var fs = require( 'fs' );
var html2js = require( 'html2js' );

/**
 * html2js
 * 转html2js并输出
 *
 * @param {Object=} compileOptions 编译参数
 * @param {string=} compileOptions.mode format|compress|default
 * @param {boolean=} compileOptions.wrap wrap with define
 * @param {string=} encoding 源编码方式
 * @return {Function}
 */
module.exports = exports = function ( compileOptions, encoding ) {
    encoding = encoding || 'utf8';

    return function ( context ) {
        var docRoot  = context.conf.documentRoot;
        var pathname = context.request.pathname;
        var file = docRoot + pathname.replace( /\.js$/, '' );

        if ( fs.existsSync( file ) ) {

            context.content = html2js(
                fs.readFileSync( file, encoding ),
                require( '../util/extend' )(
                    {},
                    {
                        mode: 'format',
                        wrap: true
                    },
                    compileOptions
                )
            );

            context.start();

        }
        else {

            context.status = 404;
            context.start();

        }
    };
};





















/* vim: set ts=4 sw=4 sts=4 tw=100: */
