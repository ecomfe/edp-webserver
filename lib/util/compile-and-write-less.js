/***************************************************************************
 *
 * Copyright (c) 2014 Baidu.com, Inc. All Rights Reserved
 * $Id$
 *
 **************************************************************************/



/**
 * lib/util/compile-and-write-less.js ~ 2014/02/15 22:01:45
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
 * @param {Object} error less错误对象
 * @param {Object} context 请求环境对象
 */
function handleError(error, context) {
    context.status = 500;
    edp.log.error(''
        + error.message
        + ' Line: ' + error.line
        + ' Column: ' + error.column
        + ' Extract: ' + error.extract
    );
    context.start();
}

/**
 * 处理成功的情况
 *
 * @param {string} css 编译生成的css
 * @param {Object} context 请求环境对象
 */
function handleResult(css, context) {
    context.header['content-type'] = mimeType.css;
    context.content = css;
    context.start();
}

/**
 * 获取依赖文件
 *
 * @param  {Object} node 当前less节点
 * @param  {Object} deps 依赖文件
 */
function walkTree(node, deps) {
    for (var i = 0, l = node.rules.length; i < l; i++) {
        var rule = node.rules[i];
        var file = rule.importedFilename;
        if (file && !deps[file]) {
            deps[file] = true;
            if (rule.root) {
                walkTree(rule.root, deps);
            }
        }
    }
}



/**
 * 编译并输出less
 *
 * @inner
 * @param {Object} compileOptions less编译参数
 * @param {string} docRoot 文档根目录
 * @param {string} pathname 请求路径
 * @param {string} content less内容
 * @param {Object} context 请求环境对象
 */
module.exports = exports = function compileAndWriteLess(compileOptions, docRoot, pathname, content, context) {
    var filePath = path.join(docRoot, pathname.replace('.css', '.less'));
    var css = filecache.check(filePath);
    if (css) {
        edp.log.info('Read From Cache: ' + pathname);
        context.header['content-type'] = mimeType.css;
        context.content = css;
        return;
    }

    context.stop();

    var includePaths = context.conf.lessIncludePaths || [];
    if (fs.existsSync(path.join(docRoot, 'dep'))) {
        includePaths.push(path.join(docRoot, 'dep'));
    }

    var importPath = docRoot + path.dirname(pathname).replace(/\/$/, '');
    var paths = [ importPath ];
    includePaths.forEach(
        function(p) {
            paths.push(path.resolve(docRoot, p));
        }
    );

    var less = context.conf.less || require('less');

    try {
        var options = require('../util/extend')(
            {},
            {
                filename: filePath,
                paths: paths,
                relativeUrls: true
            },
            compileOptions
        );

        if (less.version[0] >= 2) { // 2.0.0 and above
            less.render(content, options)
            .then(function (output) {
                filecache.set(filePath, output.imports, output.css);
                handleResult(output.css, context);
            }, function (error) {
                handleError(error, context);
            });
        }
        else {
            var parser = new(less.Parser)(options);
            parser.parse(
                content,
                function (error, tree) {
                    if (error) {
                        handleError(error, context);
                    }
                    else {
                        var css = tree.toCSS();
                        var deps = {};
                        walkTree(tree, deps);
                        filecache.set(filePath, Object.keys(deps), css);
                        handleResult(css, context);
                    }
                }
            );
        }
    }
    catch (ex) {
        edp.log.error(ex.message);
        context.status = 500;
        context.start();
    }
};






















/* vim: set ts=4 sw=4 sts=4 tw=100: */
