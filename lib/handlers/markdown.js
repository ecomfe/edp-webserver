/***************************************************************************
 *
 * Copyright (c) 2014 Baidu.com, Inc. All Rights Reserved
 * $Id$
 *
 **************************************************************************/


/**
 * lib/handlers/markdown.js ~ 2014/6/29 22:03:35
 * @author leeight(liyubei@baidu.com)
 * @version $Revision$
 * @description
 *
 **/
var fs = require( 'fs' );
var markdown = require( 'markdown' ).markdown;

/**
 * markdown
 * 转markdown并输出
 *
 * @param {string=} encoding 源编码方式
 * @todo 多样式支持
 * @return {Function}
 */
module.exports = exports = function ( encoding ) {
    encoding = encoding || 'utf8';

    return function ( context ) {
       
        var docRoot  = context.conf.documentRoot;
        var pathname = context.request.pathname;
        var file = docRoot + pathname;

        if ( fs.existsSync( file ) ) {
            var content = fs.readFileSync(file, encoding);
            var title = file.split(/\/|\\/).pop();
            
            context.content = [
                '<html>',
                    '<head>',
                        '<meta charset="'+ encoding +'">',
                        '<title>'+ title +'</title>',
                        '<link rel="stylesheet" href="https://raw.githubusercontent.com/jasonm23/markdown-css-themes/gh-pages/avenir-white.css">',
                    '</head>',
                '<body>',
                    markdown.toHTML(content),
                '</body>',
            '</html>'
            ].join('');

            context.status = 200;
            context.start();
        }
        else {
            context.status = 404;
            context.start();

        }
    };
};

/* vim: set ts=4 sw=4 sts=4 tw=100: */
