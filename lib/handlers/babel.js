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
var localBabel = require('babel-core');

/**
 * es6 to es5
 * @param {Object} babelOptions 转码配置
 * @param {Object} options babel handler配置
 * @param {boolean=} options.forceTransform 是否强制转码
 * @param {Object=} options.babel 外部传入的babel模块
 */
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

        var usedBabelOptions = {};
        Object.keys(babelOptions || {}).forEach(function (key) { usedBabelOptions[key] = babelOptions[key]; });
        // edp-test需要生产独立的sourceMap文件，因此这里打开这一功能
        if (!usedBabelOptions.sourceMaps) {
            usedBabelOptions.sourceMaps = true;
        }
        else if (usedBabelOptions.sourceMaps === 'inline') {
            usedBabelOptions.sourceMaps = 'both';
        }

        // 使用全路径以配合 babel 6.x 查找插件的逻辑
        // 增加 `?raw` 参数以方便 devtool 调试
        usedBabelOptions.filename = filePath.replace(/\.(\w+)$/, '.$1?raw');
        context.header['content-type'] = 'text/javascript; charset=utf-8';

        var stat = null;
        if (fs.existsSync(filePath)) {
            stat = fs.statSync(filePath);
        }
        else {
            var exts = ['.es6', '.es'];
            for (var i = 0; i < exts.length; i ++) {
                var ext = exts[i];
                if (fs.existsSync(filePath.replace(/\.js$/, ext))) {
                    stat = fs.statSync(filePath.replace(/\.js$/, ext));
                    break;
                }
            }
        }

        var mtime = stat ? stat.mtime.getTime() : Number.MAX_VALUE;
        var cache = babelCache[filePath];
        !cache && (cache = babelCache[filePath] = {});

        if (!cache.mtime || cache.mtime < mtime) {
            var babel = options.babel || localBabel;
            var babelResult = babel.transform(code, usedBabelOptions);
            cache.mtime = mtime;
            cache.data = babelResult.code;
            cache.map = babelResult.map;
        }

        context.map = cache.map;
        context.content = cache.data;
    };
};
