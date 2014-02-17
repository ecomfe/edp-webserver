/***************************************************************************
 * 
 * Copyright (c) 2014 Baidu.com, Inc. All Rights Reserved
 * $Id$ 
 * 
 **************************************************************************/
 
 
 
/**
 * lib/handlers/tbd.js ~ 2014/02/15 22:24:48
 * @author leeight(liyubei@baidu.com)
 * @version $Revision$ 
 * @description 
 *  
 **/
var async = require( 'async' );

/**
 * SESSION = {
 *   "request_id" : {
 *     "count" : 3,
 *     "buffer_size" : 0,
 *     "buffer" : [
 *       list<string>,
 *       list<string>,
 *       list<string>,
 *       ...
 *     ]
 *   }
 * }
 * @type {Object}
 */
var SESSION = {};

function log(message) {
    var now = new Date();
    console.log('[' + now.getFullYear()
        + '/' + (now.getMonth() + 1)
        + '/' + now.getDay()
        + ' ' + now.getHours()
        + ':' + now.getMinutes()
        + ':' + now.getSeconds()
        + '] ' + message
    );
}

/**
 * return the file list from the request url.
 * @param {string} query the query.
 * @param {string=} optKey the optional key for the query, default
 *   is 'uris'.
 * @return {Array.<string>}
 */
function getFileList(query, optKey) {
    var key = optKey || 'uris';

    if (!query[key] || query[key].length <= 0) {
        return [];
    }

    var uris = decodeURIComponent(query[key]).split(',');

    var requestId = query['request_id'];
    var index = parseInt(query['index'], 10);
    var count = parseInt(query['count'], 10);

    if (( !! requestId) && (index >= 0) && (count > 0)) {
        // the batch request
        if (!SESSION[requestId]) {
            SESSION[requestId] = {
                'count': count,
                'buffer_size': 0,
                'buffer': []
            };
        }

        var cache = SESSION[requestId];
        if (!cache['buffer'][index]) {
            cache['buffer'][index] = uris;
            cache['buffer_size'] += 1;
        }
        if (cache['count'] == cache['buffer_size']) {
            // the buffer is full, concat all of the uris in the buffer, and
            // return the result to the upper level.
            uris = [];
            cache['buffer'].forEach(function (item) {
                uris = uris.concat(item);
            });

            // clear the cache
            delete SESSION[requestId];

            return uris;
        } else {
            return [];
        }
    } else {
        // the normal request
        return uris;
    }
}

/**
 * @param {Array.<string>} files the request url.
 * @param {string=} optCallback the handler for each file.
 *
 * @return {string} the file contents.
 */
function combineFiles(files, docRoot, optCallback) {
    var defaultCallback = function (file, callback) {
        var absPath = path.normalize(path.join(docRoot, file));
        log(chalk.blue('[REQUEST] ') + absPath);
        fs.readFile(absPath, callback);
    };
    var callback = optCallback || defaultCallback;

    var validFiles = files.filter(function (item) {
        return !!item;
    });

    var ee = new(require('events').EventEmitter)();
    async.map(validFiles, callback, function (err, results) {
        if (err) {
            ee.emit('error', err);
        } else {
            ee.emit('success', results.join('\n'));
        }
    });
    return ee;
}

/**
 * lauch the less compiler, and generate the
 * *.css file when necessary.
 * @param {string} lessAbsPath the absolute file path.
 * @param {string} css the compiled css code.
 */
function generateCompiledStyles(lessAbsPath, css) {
    var outOfDate = false;
    var absPath = lessAbsPath;
    var compiledCss = absPath.replace(/\.less$/, '.compiled.css');

    if (!fs.existsSync(compiledCss)) {
        outOfDate = true;
    } else {
        var a = Date.parse(fs.statSync(absPath).mtime),
            b = Date.parse(fs.statSync(compiledCss).mtime);
        if (a > b) {
            // *.less was changed again
            outOfDate = true;
        }
    }

    if (outOfDate) {
        // XXX need toString
        fs.writeFile(compiledCss, css, function (err) {
            if (err) {
                throw err;
            }
            log(chalk.yellow('[REBUILD] ') + compiledCss);
        });
    }
}

/**
 * 把url或者data-uri中的相对路径进行改写。
 * @param {string} code less或者css代码.
 * @param {string} absPath less或者css文件的绝对路径.
 * @param {string} reqPath 请求的文件路径，例如/jn/combine/all.css.
 */
function rewriteResourcePath(code, absPath, reqPath) {
    var urlPattern = /(url|data\-uri)\s*\(\s*(['"]?)([^\)'"]+)(\2)\s*\)/g;
    var dirName = path.dirname(absPath);
    var rewritedCode = code.replace(
        urlPattern,
        function(match, p0, p1, p2, p3) {
            if (p2.indexOf('data:') === 0 ||
                p2[0] == '/' ||
                p2.match(/^https?:\/\//g)
            ) {
                return match;
            }
            var url;
            if (p0 === 'url') {
                var resource = path.relative(
                    reqPath,
                    path.normalize(path.join(dirName, p2))
                );
                url = resource.replace(/\\/g, '/');
            }
            else {
                // 如果是data-uri，那么相对的实际上是文件系统的路径，不是/combine/all.css
                // 例如: src/a.less里面有data-uri("../../../a.gif")，那么图片路径应该是
                // src/../../../a.gif
                var resource = path.relative(
                    '.',
                    path.normalize(path.join(dirName, p2))
                );
                url = resource.replace(/\\/g, '/');
            }
            return p0 + '(' + p1 + url + p3 + ')';
        }
    );
    return rewritedCode;
}





















/* vim: set ts=4 sw=4 sts=4 tw=100: */
