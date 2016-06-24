/**
 * @file postcss处理器
 * @author Justineo(guyiling@baidu.com)
 **/

/**
 * 处理postcss输出
 *
 * @param {Object=} processOptions 需要使用的postcss插件
 * @param {string=} encoding 源编码方式
 * @return {Function}
 */
module.exports = exports = function postcss(processOptions, encoding) {
    encoding = encoding || 'utf8';
    return function (context) {
        var docRoot  = context.conf.documentRoot;
        var pathname = context.request.pathname;

        var processAndWriteCSS = require('../util/process-and-write-css');
        processAndWriteCSS(
            processOptions,
            docRoot,
            pathname,
            context.content.toString(encoding),
            context
        );
    };
};
