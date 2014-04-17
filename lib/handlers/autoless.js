/***************************************************************************
 *
 * Copyright (c) 2014 Baidu.com, Inc. All Rights Reserved
 * $Id$
 *
 **************************************************************************/



/**
 * lib/handlers/autoless.js ~ 2014/02/15 22:10:55
 * @author leeight(liyubei@baidu.com)
 * @version $Revision$
 * @description
 *
 **/
var autocss = require( './autocss' );

/**
 * 遇见不存在的css，但是存在同名less时
 * 自动编译less并输出
 *
 * @param {Object=} compileOptions less编译参数
 * @param {string=} encoding 源编码方式
 * @return {Function}
 */
module.exports = exports = function autoless( compileOptions, encoding ) {
    var compileOptionsMap = compileOptions && {
        'less': compileOptions
    };

    return autocss( compileOptionsMap, encoding );
};






















/* vim: set ts=4 sw=4 sts=4 tw=100: */
