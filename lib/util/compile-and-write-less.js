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
    var parser = new(less.Parser)(
        require('../util/extend')(
            {},
            {
                filename: docRoot + pathname,
                paths: paths,
                relativeUrls: true
            },
            compileOptions
       )
   );

    try {
        parser.parse(
            content,
            function (error, tree) {
                if (error) {
                    context.status = 500;
                    edp.log.error(''
                        + error.message
                        + ' Line: ' + error.line
                        + ' Column: ' + error.column
                        + ' Extract: ' + error.extract
                   );
                }
                else {
                    context.header[ 'content-type' ] = mimeType.css;
                    context.content = tree.toCSS();
                }

                context.start();
            }
       );
    }
    catch (ex) {
        edp.log.error(ex.message);
        context.status = 500;
        context.start();
    }
};






















/* vim: set ts=4 sw=4 sts=4 tw=100: */
