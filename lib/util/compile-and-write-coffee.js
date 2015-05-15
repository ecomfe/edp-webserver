/***************************************************************************
 *
 * Copyright (c) 2014 Baidu.com, Inc. All Rights Reserved
 * $Id$
 *
 **************************************************************************/



/**
 * lib/util/compile-and-write-coffee.js ~ 2014/02/15 21:43:16
 * @author leeight(liyubei@baidu.com)
 * @version $Revision$
 * @description
 *
 **/
var coffee = require( 'coffee-script' );
var mimeType = require( '../mime-types' );
var edp = require('edp-core');

/**
 * 编译并输出 coffee-script
 *
 * @inner
 * @param {string} docRoot 文档根目录
 * @param {string} pathname 请求路径
 * @param {string} content lcoffee-script内容
 * @param {Object} context 请求环境对象
 */
module.exports = exports = function compileAndWriteCoffee( docRoot, pathname, content, context ) {
    context.stop();

    var file = docRoot + pathname;
    var hasSourceMap = !!context.conf.coffeeSourceMap;

    var options = {
        sourceMap: hasSourceMap
    };

    try {
        if ( hasSourceMap ) {
            options.generatedFile = pathname.replace(/^.+\/([^\/]+)$/g, '$1');
            options.sourceFiles = [
                options.generatedFile
                    .replace( /\.(js|coffee)$/, '.coffee?source' )
            ];
        }

        var answer = coffee.compile(
            content,
            options
        );

        if ( hasSourceMap ) {
            var mapFile = file + '.map';
            fs.writeFile(mapFile, answer.v3SourceMap);
            answer.js += '\n\/\/@ sourceMappingURL='
                + mapFile.replace(/^.+\/([^\/]+)$/g, '$1');
            context.map = mapFile;
        }

        context.header[ 'content-type' ] = mimeType.js;
        context.content = hasSourceMap ? answer.js : answer;
    }
    catch ( ex ) {
        edp.log.error(ex.message);
        context.status = 500;
        context.content = ex.message;
    }
    context.start();
};





















/* vim: set ts=4 sw=4 sts=4 tw=100: */
