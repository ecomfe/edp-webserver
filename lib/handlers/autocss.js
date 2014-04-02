/***************************************************************************
 *
 * Copyright (c) 2014 Baidu.com, Inc. All Rights Reserved
 * $Id$
 *
 **************************************************************************/



/**
 * lib/handlers/autocss.js ~ 2014/02/15 21:50:55
 * @author leeight(liyubei@baidu.com)
 * @version $Revision$
 * @description
 *
 **/
var fs = require( 'fs' );
var mimeType = require( '../mime-types' );

/**
 * css预处理器列表
 *
 * @type {Array}
 */
var preprocessors = [
    {
        'name': 'less',
        'suffix': '.less',
        'compileAndWrite': require( '../util/compile-and-write-less' )
    },
    {
        'name': 'stylus',
        'suffix': '.styl',
        'compileAndWrite': require( '../util/compile-and-write-stylus' )
    }
];

/**
 * 遇见不存在的css时，查找同名的css预处理器，找到则自动变异输出
 *
 * 配置示例：
 * {
 *   'less': Object, // less的编译参数对象
 *   'stylus': Function // stylus设置编译参数的函数
 * }
 *
 * @param {Object=} compileOptionsMap 编译参数
 * @param {string=} encoding 源编码方式
 * @return {Function}
 */
module.exports = exports = function( compileOptionsMap, encoding ) {
    encoding = encoding || 'utf8';

    return function ( context ) {
        var docRoot  = context.conf.documentRoot;
        var pathname = context.request.pathname;
        var file = docRoot + pathname;

        if ( fs.existsSync( file ) ) {
            context.header[ 'content-type' ] = mimeType.css;
            context.content = fs.readFileSync( file, encoding );
        }
        else {
            var sourceFile;
            var compileAndWriteFn;
            var compileOptions;

            compileOptionsMap = compileOptionsMap || {};

            preprocessors.every(function( preprocessor ) {
                sourceFile = file.replace( /\.css$/, preprocessor.suffix );

                if ( fs.existsSync( sourceFile ) ) {
                    compileAndWriteFn = preprocessor.compileAndWrite;
                    compileOptions = compileOptionsMap[ preprocessor.name ];

                    return false;
                }

                return true;
            });

            if ( typeof compileAndWriteFn === 'function' ) {
                compileAndWriteFn(
                    compileOptions,
                    docRoot,
                    pathname,
                    fs.readFileSync( sourceFile, encoding ),
                    context
                );
            }
            else {
                context.status = 404;
            }
        }
    };
};





















/* vim: set ts=4 sw=4 sts=4 tw=100: */
