/***************************************************************************
 *
 * Copyright (c) 2014 Baidu.com, Inc. All Rights Reserved
 * $Id$
 *
 **************************************************************************/



/**
 * lib/handlers/autostylus.js ~ 2014/02/15 21:55:16
 * @author leeight(liyubei@baidu.com)
 * @version $Revision$
 * @description
 *
 **/
var autocss = require( './autocss' );

/**
 * 遇见不存在的css，但是存在同名stylus时
 * 自动编译stylus并输出
 *
 * @param {Function=} compileOptions stylus设置编译参数的函数
 * @param {string=} encoding 源编码方式
 * @return {Function}
 */
module.exports = exports = function autostylus ( compileOptions, encoding ) {
    var compileOptionsMap = compileOptions && {
        'stylus': compileOptions
    };

    return autocss( compileOptionsMap, encoding );
};





















/* vim: set ts=4 sw=4 sts=4 tw=100: */
