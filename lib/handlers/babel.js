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
var fs = require('fs');
var path = require('path');

module.exports = exports = function babel(babelOptions, options) {
    var babelCache = {};

    return function (context) {
        if (context.status !== 200) {
            return;
        }

        options = options || {};

        var code = context.content;
        var filePath = path.join(context.conf.documentRoot, context.request.pathname);

        if (!code) {
            if (!fs.existsSync(filePath)) {
                return;
            }
            code = fs.readFileSync(filePath, 'utf-8');
            context.content = code;
        }

        // 如果有`define(`则认为本来就是一个AMD或UMD模块了，所以不转，除非配置了`forceTransform`
        if (code && code.toString().indexOf('define(') >= 0 && !options.forceTransform) {
            return;
        }

        babelOptions = babelOptions || {};
        babelOptions.sourceMaps = true;
        context.header['content-type'] = 'text/javascript; charset=utf-8';

        var stat = fs.statSync(filePath);
        var mtime = stat.mtime.getTime();
        var cache = babelCache[filePath];
        !cache && (cache = babelCache[filePath] = {});

        if (!cache.mtime || cache.mtime < mtime) {
            var babelResult = require('babel').transform(code, babelOptions);
            cache.mtime = mtime;
            cache.data = babelResult.code;
            cache.map = babelResult.map;
        }

        context.map = cache.map;
        context.content = cache.data;
    };
};
