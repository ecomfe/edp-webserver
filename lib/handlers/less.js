/***************************************************************************
 *
 * Copyright (c) 2014 Baidu.com, Inc. All Rights Reserved
 * $Id$
 *
 **************************************************************************/



/**
 * lib/handlers/less.js ~ 2014/02/15 22:08:31
 * @author leeight(liyubei@baidu.com)
 * @version $Revision$
 * @description
 *
 **/

/**
 * 处理less输出
 *
 * @param {Object=} compileOptions less编译参数
 * @param {string=} encoding 源编码方式
 * @return {Function}
 */
module.exports = exports = function less( compileOptions, encoding ) {
    encoding = encoding || 'utf8';
    return function ( context ) {
        var docRoot  = context.conf.documentRoot;
        var pathname = context.request.pathname;

        var compileAndWriteLess = require( '../util/compile-and-write-less' );
        compileAndWriteLess(
            compileOptions,
            docRoot,
            pathname,
            context.content.toString( encoding ),
            context
        );
    };
};





















/* vim: set ts=4 sw=4 sts=4 tw=100: */
