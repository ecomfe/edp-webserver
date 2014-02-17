/***************************************************************************
 * 
 * Copyright (c) 2014 Baidu.com, Inc. All Rights Reserved
 * $Id$ 
 * 
 **************************************************************************/
 
 
 
/**
 * lib/handlers/home.js ~ 2014/02/15 22:17:02
 * @author leeight(liyubei@baidu.com)
 * @version $Revision$ 
 * @description 
 *  
 **/
var fs = require( 'fs' );
var path = require( 'path' );
var mimeType = require( '../mime-types' );

/**
 * 主索引页
 * 
 * @param {string|Array} file 索引页文件名
 * @return {Function}
 */
module.exports = exports = function home ( file ) {
    return function ( context ) {
        var docRoot  = context.conf.documentRoot;
        var pathname = context.request.pathname;

        var files;
        if ( file instanceof Array ) {
            files = file;
        }
        else if ( typeof file == 'string' ) {
            files = [ file ];
        }

        var isExist = false;
        var dir = docRoot + pathname;
        if ( file ) {
            for ( var i = 0; i < files.length; i++ ) {
                var filePath = dir + files[ i ];
                if ( fs.existsSync( filePath ) ) {
                    var content = fs.readFileSync( filePath );
                    var extname = path.extname( filePath ).slice( 1 );
                    context.content = content;
                    context.header[ 'content-type' ] = mimeType[ extname ] || mimeType.html;
                    isExist = true;
                    break;
                }
            }
        }

        if (!isExist) {
            if (context.conf.directoryIndexes
                && fs.existsSync(dir)
            ) {
                var listDirectory = require( './list-directory' );
                listDirectory(dir)(context);
            }
            else {
                context.status = 404;
            }
        }
    };
};





















/* vim: set ts=4 sw=4 sts=4 tw=100: */
