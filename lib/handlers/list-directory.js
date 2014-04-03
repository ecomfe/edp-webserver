/***************************************************************************
 *
 * Copyright (c) 2014 Baidu.com, Inc. All Rights Reserved
 * $Id$
 *
 **************************************************************************/



/**
 * lib/handlers/list-directory.js ~ 2014/02/15 22:22:16
 * @author leeight(liyubei@baidu.com)
 * @version $Revision$
 * @description
 *
 **/
var fs = require( 'fs' );
var path = require( 'path' );
var mimeType = require( '../mime-types' );

/**
 * 列出文件夹内文件
 *
 * @param {string=} dir 文件夹路径
 * @return {Function}
 */
module.exports = exports = function listDirectory (dir) {
    return function (context) {
        var docRoot  = context.conf.documentRoot;
        var pathname = context.request.pathname;
        var dirPath = dir || docRoot + pathname;

        context.stop();
        fs.readdir(dirPath, function(err, files) {
            var list = [];
            files.forEach(function(file) {
                var stat = fs.statSync(path.join(dirPath, file));
                list.push({
                    'name': stat.isDirectory() ? file + '/' :  file,
                    'url': encodeURIComponent(file)
                            + (stat.isDirectory() ? '/' : ''),
                    'size': stat.size,
                    'mtime': stat.mtime
                });
            });

            var tplStr = fs.readFileSync(
                path.join( __dirname, '..', 'dirlist.tpl' ),
                'utf8'
            );
            var tpl = require( 'handlebars' ).compile( tplStr );
            var html = tpl({
                'files' : list
            });
            context.status = 200;
            context.header[ 'content-type' ] = mimeType.html;
            context.content = html;
            context.start();
        });
    };
};























/* vim: set ts=4 sw=4 sts=4 tw=100: */
