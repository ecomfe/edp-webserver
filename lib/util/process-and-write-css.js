/**
 * @file 用PostCSS处理输出CSS
 * @author leeight(liyubei@baidu.com)
 * @version $Revision$
 * @description
 *
 **/
var fs = require('fs');
var path = require('path');
var mimeType = require('../mime-types');

var edp = require('edp-core');
var filecache = require('../util/filecache');

/**
 * 处理出错的情况
 *
 * @param {Error} error 错误对象
 * @param {Object} context 请求环境对象
 */
function handleError(error, context) {
    context.status = 500;
    edp.log.error(error);
    context.start();
}

/**
 * 处理成功的情况
 *
 * @param {string} css 编译生成的CSS
 * @param {Object} context 请求环境对象
 */
function handleResult(css, context) {
    context.header['content-type'] = mimeType.css;
    context.content = css;
    context.start();
}

/**
 * 处理并输出CSS
 *
 * @inner
 * @param {Object} processOptions 处理参数
 * @param {string} docRoot 文档根目录
 * @param {string} pathname 请求路径
 * @param {string} content CSS内容
 * @param {Object} context 请求环境对象
 */
module.exports = exports = function processAndWriteCSS(processOptions, docRoot, pathname, content, context) {
    var filePath = path.join(docRoot, pathname).replace(/(\.\w+)$/, '.postcss$1');
    if (!processOptions.disableCache) {
        var css = filecache.check(filePath);
        if (css) {
            edp.log.info('Read From Cache: ' + pathname);
            context.header['content-type'] = mimeType.css;
            context.content = css;
            return;
        }
    }

    context.stop();

    var postcss = context.conf.postcss || require('postcss');

    try {
        var plugins = processOptions.plugins || [];
        var options = processOptions.options || {};

        postcss(plugins)
            .process(content, options)
            .then(function (result) {
                // inline内容会由插件生成，这里不太好处理
                filecache.set(filePath, [], result.css);
                handleResult(result.css, context);
            }, function (error) {
                handleError(error, context);
            });
    }
    catch (ex) {
        edp.log.error(ex.message);
        context.status = 500;
        context.start();
    }
};
