/***************************************************************************
 *
 * Copyright (c) 2014 Baidu.com, Inc. All Rights Reserved
 * $Id$
 *
 **************************************************************************/



/**
 * lib/util/compile-and-write-stylus.js ~ 2014/02/15 21:59:47
 * @author leeight(liyubei@baidu.com)
 * @version $Revision$
 * @description
 *
 **/
var path = require( 'path' );
var mimeType = require( '../mime-types' );
var edp = require('edp-core');

/**
 * 编译并输出stylus
 *
 * @inner
 * @param {Object} compileOptions stylus编译参数
 * @param {string} docRoot 文档根目录
 * @param {string} pathname 请求路径
 * @param {string} content stylus内容
 * @param {Object} context 请求环境对象
 */
module.exports = exports = function compileAndWriteStylus( compileOptions, docRoot, pathname, content, context ) {
    context.stop();

    var includePaths = context.conf.stylusIncludePaths || [];
    var importPath = docRoot + path.dirname( pathname ).replace( /\/$/, '' );
    var paths = [ importPath ];
    includePaths.forEach(
        function( p ) {
            paths.push( path.resolve( docRoot, p ) );
        }
    );

    var stylus = context.conf.stylus || require( 'stylus' );

    stylus(content)
        .set('filename', pathname)
        .set('compress', !!compileOptions.compress)
        .set('paths', paths)
        .use(function( style ) {
            if ('function' === typeof compileOptions.use) {
                compileOptions.use( style );
            }
        })
        .render(function (err, css) {
            if ( err ) {
                context.status = 500;
                context.content = err.toString();
            }
            else {
                context.header[ 'content-type' ] = mimeType.css;
                context.content = css;
            }

            context.start();
        });
};






















/* vim: set ts=4 sw=4 sts=4 tw=100: */
