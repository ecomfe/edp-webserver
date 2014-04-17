/***************************************************************************
 *
 * Copyright (c) 2014 Baidu.com, Inc. All Rights Reserved
 * $Id$
 *
 **************************************************************************/



/**
 * lib/handlers/file.js ~ 2014/02/15 22:20:11
 * @author leeight(liyubei@baidu.com)
 * @version $Revision$
 * @description
 *
 **/
var fs = require( 'fs' );
var path = require( 'path' );
var mimeType = require( '../mime-types' );

/**
 * 读取文件
 *
 * @param {string=} file 文件名
 * @return {Function}
 */
module.exports = exports = function file ( file ) {
    return function ( context ) {
        var conf = context.conf;
        var docRoot  = conf.documentRoot;
        var pathname = context.request.pathname;
        var filePath = file || docRoot + pathname;

        context.stop();
        fs.stat(filePath, function(error, stats){
            var toStart = true;
            if (!error) {
                if (stats.isDirectory()) {
                    if (!filePath.match(/\/$/)) {
                        context.status = 302;
                        var loc = path.relative(docRoot, filePath);
                        context.header[ 'location' ] = '/' + loc + '/';
                    }
                    else if ( conf.directoryIndexes ) {
                        var listDirectory = require( './list-directory' );
                        listDirectory(filePath)(context);
                        toStart = false;
                    }
                }
                else {
                    var content = fs.readFileSync( filePath );
                    var extname = path.extname( pathname ).slice( 1 ).toLowerCase();
                    var contentType = mimeType[ extname ] || mimeType.html;

                    context.header[ 'content-type' ] = contentType;
                    context.content = content;
                }
            }
            else {
                context.status = 404;
            }
            toStart && context.start();
        });
    };
};





















/* vim: set ts=4 sw=4 sts=4 tw=100: */
