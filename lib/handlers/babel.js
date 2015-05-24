/***************************************************************************
 *
 * Copyright (c) 2014 Baidu.com, Inc. All Rights Reserved
 * $Id$
 *
 **************************************************************************/



/**
 * lib/handlers/babel.js ~ 2014/02/15 22:20:11
 * @author otakustay(otakustay@icloud.com)
 * @version $Revision$
 * @description
 *
 **/
module.exports = exports = function babel(babelOptions, options) {
    return function (context) {
        if (context.status !== 200) {
            return;
        }

        options = options || {};

        var code = context.content;

        // 如果有`define(`则认为本来就是一个AMD或UMD模块了，所以不转，除非配置了`forceTransform`
        if (code.indexOf('define(') >= 0 && !options.forceTransform) {
            return;
        }

        babelOptions = babelOptions || {};
        babelOptions.sourceMaps = true;

        var babelResult = require('babel').transform(code, babelOptions);

        context.map = babelOptions.map;
        context.content = babelResult.code;
    };
};
