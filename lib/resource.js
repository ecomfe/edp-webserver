/**
 * @file 内建资源处理方法集合
 * @author otakustay[otakustay@live.com], 
 *         errorrik[errorrik@gmail.com],
 *         ostream[ostream.song@gmail.com],
 *         firede[firede@firede.us]
 */

var fs          = require( 'fs' );
var path        = require( 'path' );
var less        = require( 'less' );
var coffee      = require( 'coffee-script' );
var async       = require( 'async' );
var mimeType    = require( './mime-types' );

require( 'colors' );

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
        log('[REQUEST] '.blue + absPath);
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
            log('[REBUILD] '.yellow + compiledCss);
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

/**
 * 输出
 *
 * @return {Function}
 */
exports.write = function () {
    return function ( context ) {
        var response = context.response;
        var request  = context.request;
        var header   = context.header;
        var extname  = path.extname( request.pathname ).slice( 1 );

        var headers = Object.keys(header).map( function (s) {
            return s.toLowerCase();
        } );
        if ( context.status == 200 && 
            headers.indexOf('content-type') < 0
        ) {
            header[ 'Content-Type' ] = mimeType[ extname ];
        }

        response.writeHeader( context.status, context.header );
        context.content && response.write( context.content );
        context.end();
    };
};

/**
 * 列出文件夹内文件
 *
 * @param {string=} dir 文件夹路径
 * @return {Function}
 */
exports.listDirectory = function(dir) {
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
                    'mtime': stat.mtime,
                });
            });

            var tplStr = fs.readFileSync(
                path.join( __dirname, 'dirlist.tpl' ),
                'utf8'
            );
            var tpl = require( 'handlebars' ).compile( tplStr );
            var html = tpl({
                'files' : list
            });
            context.status = 200;
            context.header[ 'Content-Type' ] = mimeType.html;
            context.content = html;
            context.start();
        });
    };
};

/**
 * 注入Weinre脚本
 * 
 * @param {string} content 文件内容
 * @param {Object} conf 配置
 * @return {string}
 */
function injectWeinreScript( content, conf ) {
    var code = require( 'util' ).format(
        '<script src="http://%s:%s/target/target-script-min.js#%s"></script>',
        conf.weinreHost,
        conf.weinrePort,
        conf.weinreFlag
    );
    var contentStr = content.toString();

    // 直接做字符串替换，简化处理逻辑
    contentStr = contentStr.replace( '</head>', code + '</head>' );
    content = new Buffer( contentStr );

    return content;
}

/**
 * 读取文件
 * 
 * @param {string=} file 文件名
 * @return {Function}
 */
exports.file = function ( file ) {
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
                        context.header[ 'Location' ] = '/' + loc + '/';
                    }
                    else if ( conf.directoryIndexes ) {
                        exports.listDirectory(filePath)(context);
                        toStart = false;
                    }
                }
                else {
                    var content = fs.readFileSync( filePath );
                    var extname = path.extname( pathname ).slice( 1 );
                    var contentType = mimeType[ extname ];

                    if ( conf.weinreEnabled && contentType === 'text/html' ) {
                        content = injectWeinreScript( content, conf );
                    }

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

/**
 * 主索引页
 * 
 * @param {string|Array} file 索引页文件名
 * @return {Function}
 */
exports.home = function ( file ) {
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
                    context.header[ 'Content-Type' ] = mimeType[ extname ];
                    isExist = true;
                    break;
                }
            }
        }

        if (!isExist) {
            if (context.conf.directoryIndexes
                && fs.existsSync(dir)
            ) {
                exports.listDirectory(dir)(context);
            }
            else {
                context.status = 404;
            }
        }
    };
};

/**
 * 设置Content-Type头
 * 
 * @param {string=} contentType contentType
 * @return {Function}
 */
exports.contentType = function ( contentType ) {
    return function ( context ) {
        if ( contentType ) {
            context.header[ 'Content-Type' ] = contentType;
        }
    };
};

/**
 * 设置头
 * 
 * @param {Object} header response头
 * @return {Function}
 */
exports.header = function ( header ) {
    return function ( context ) {
        context.header = require( './util/mix' )( context.header, header );
    };
};

/**
 * 输出json
 * 
 * @param {JSON} data json数据
 * @return {Function}
 */
exports.json = function ( data ) {
    return function ( context ) {
        context.header[ 'Content-Type' ] = mimeType.json;
        if ( data ) {
            context.content = JSON.stringify( data );
        }
    };
};

/**
 * 输出jsonp
 * 
 * @param {JSON} data json数据
 * @param {string} callbackKey 回调函数的参数名
 * @return {Function}
 */
exports.jsonp = function ( data, callbackKey ) {
    callbackKey = callbackKey || 'callback';

    return function ( context ) {
        var qs     = require( 'querystring' );
        var query  = qs.parse( request.search );
        

        context.header[ 'Content-Type' ] = mimeType.js;
        var fnName  = query[ callbackKey ];
        var content = data ? JSON.stringify( data ) : context.content;
        context.content = fnName + '(' + content + ');';
    };
};

/**
 * 输出请求信息
 * 
 * @return {Function}
 */
exports.dumpRequest = function() {
    return function ( context ) {
        var request = context.request;
        var result = {
            url         : request.url,
            method      : request.method,
            httpVersion : request.httpVersion,
            protocol    : request.protocol,
            host        : request.host,
            auth        : request.auth,
            hostname    : request.hostname,
            port        : request.port,
            search      : request.search,
            hash        : request.hash,
            headers     : request.headers,
            query       : request.query,
            body        : request.bodyBuffer.toString( 'utf8' )
        };

        context.header[ 'Content-Type' ] = mimeType.json;
        context.content = JSON.stringify( result, null, '    ' );
    };
};

/**
 * 推迟输出
 * 
 * @param {number} time 推迟输出时间，单位ms
 * @return {Function}
 */
exports.delay = function ( time ) {
    return function ( context ) {
        context.stop();
        setTimeout(
            function() { 
                context.start();
            },
            time
        );
    };
};

/**
 * 输出内容
 * 
 * @param {string} content 要输出的内容
 * @return {Function}
 */
exports.content = function ( content ) {
    return function ( context ) {
        context.content = content;
    };
};

/**
 * 输出重定向
 * 
 * @param {string} location 重定向地址
 * @param {boolean} permanent 是否永久重定向
 * @return {Function}
 */
exports.redirect = function ( location, permanent ) {
    return function ( context ) {
        context.status = permanent ? 301 : 302;
        context.header[ 'Location' ] = location;
    };
};

/**
 * 输出空内容
 * 
 * @return {Function}
 */
exports.empty = function () {
    return exports.content( '' );
};

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
function compileAndWriteLess( compileOptions, docRoot, pathname, content, context ) {
    context.stop();

    var includePaths = context.conf.lessIncludePaths || [];
    var importPath = docRoot + path.dirname( pathname ).replace( /\/$/, '' );
    var paths = [ importPath ];
    includePaths.forEach( 
        function( p ) {
            paths.push( path.resolve( docRoot, p ) );
        }
    );

    var parser = new( less.Parser )( 
        require( './util/extend' )(
            {}, 
            {
                paths: paths,
                relativeUrls: true
            }, 
            compileOptions 
        )
    );

    try {
        parser.parse( 
            content,
            function ( error, tree ) {
                if ( error ) {
                    context.status = 500;
                }
                else {
                    context.header[ 'Content-Type' ] = mimeType.css;
                    context.content = tree.toCSS();
                }

                context.start();
            }
        );
    } 
    catch ( ex ) {
        context.status = 500;
        context.start();
    }
}

/**
 * 遇见不存在的css，但是存在同名less时
 * 自动编译less并输出
 * 
 * @param {Object=} compileOptions less编译参数
 * @param {string=} encoding 源编码方式
 * @return {Function}
 */
exports.autoless = function ( compileOptions, encoding ) {
    encoding = encoding || 'utf8';

    return function ( context ) {
        var docRoot  = context.conf.documentRoot;
        var pathname = context.request.pathname;
        var file = docRoot + pathname;

        if ( fs.existsSync( file ) ) {
            context.header[ 'Content-Type' ] = mimeType.css;
            context.content = fs.readFileSync( file, encoding );
        }
        else {
            file = file.replace( /\.css$/, '.less' );
            if ( fs.existsSync( file ) ) {
                compileAndWriteLess(
                    compileOptions,
                    docRoot,
                    pathname,
                    fs.readFileSync( file, encoding ),
                    context
                );
            }
            else{
                context.status = 404;
            }
        }
    };
};

/**
 * 处理less输出
 * 
 * @param {Object=} compileOptions less编译参数
 * @param {string=} encoding 源编码方式
 * @return {Function}
 */
exports.less = function ( compileOptions, encoding ) {
    encoding = encoding || 'utf8'
    return function ( context ) {
        var docRoot  = context.conf.documentRoot;
        var pathname = context.request.pathname;

        compileAndWriteLess(
            compileOptions,
            docRoot,
            pathname,
            context.content.toString( encoding ),
            context
        );
    };
};


/**
 * 编译并输出 coffee-script
 * 
 * @inner
 * @param {string} docRoot 文档根目录
 * @param {string} pathname 请求路径
 * @param {string} content lcoffee-script内容
 * @param {Object} context 请求环境对象
 */
function compileAndWriteCoffee( docRoot, pathname, content, context ) {
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
        }

        context.header[ 'Content-Type' ] = mimeType.js;
        context.content = hasSourceMap ? answer.js : answer;
    } 
    catch ( ex ) {
        context.status = 500;
        context.content = ex.message;
    }
    context.start();
}

/**
 * 遇见不存在的 js，但是存在同名 coffee-script 时
 * 自动编译 coffee-script 并输出
 * 
 * @param {string} encoding 源编码方式
 * @return {Function}
 */
exports.autocoffee = function ( encoding ) {
    encoding = encoding || 'utf8';

    return function ( context ) {
        var docRoot  = context.conf.documentRoot;
        var pathname = context.request.pathname;
        var file = docRoot + pathname;

        if ( fs.existsSync( file ) ) {
            context.header[ 'Content-Type' ] = mimeType.js;
            context.content = fs.readFileSync( file, encoding );
        }
        else {
            file = file.replace( /\.js$/, '.coffee' );
            if ( fs.existsSync( file ) ) {
                compileAndWriteCoffee(
                    docRoot,
                    pathname,
                    fs.readFileSync( file, encoding ),
                    context
                );
            }
            else {
                context.status = 404;
            }
        }
    };
};

/**
 * 处理 coffee-script 输出
 * 
 * @param {string} encoding 源编码方式
 * @return {Function}
 */
exports.coffee = function ( encoding ) {
    encoding = encoding || 'utf8'
    return function ( context ) {
        var docRoot  = context.conf.documentRoot;
        var pathname = context.request.pathname;
        var file = docRoot + pathname;

        if ( 'source' in context.request.query ) {
            context.header[ 'Content-Type' ] = mimeType.js;
            context.content = fs.readFileSync( file, encoding );          
        }
        else {
            compileAndWriteCoffee(
                docRoot,
                pathname,
                context.content.toString( encoding ),
                context
            );            
        }

    };
};

/**
 * 对本地找不到响应的请求，试图从通过代理发起请求
 *
 * @return {Function}
 */
exports.proxyNoneExists = function() {
    return function(context) {
        if (context.status == 404) {
            exports.proxy()(context);
        }
    };
};

/**
 * http代理
 * 
 * @param {string} hostname 主机名，可为域名或ip
 * @param {number=} port 端口，默认80
 * @return {Function}
 */
exports.proxy = function ( hostname, port ) {
    return function ( context ) {
        var request = context.request;
        var proxyMap  = context.conf.proxyMap;
        if (!hostname && !proxyMap) {
            return;
        }
        else if (!hostname) {
            var host = request.headers['host'];
            if (proxyMap[host]) {
                var matched = proxyMap[host].split(':');
                hostname = matched[0];
                port = matched[1] || port;
            }
            else {
                console.log('Can not find matched host for ' + host.red);
            }
        }

        context.stop();

        // build request options
        var reqHeaders = request.headers;
        var reqOptions = {
            hostname   : hostname,
            port       : port || 80,
            method     : request.method,
            path       : request.url,
            headers    : reqHeaders
        };
        var targetHost = hostname + ( port ? ':' + port : '' );

        // create request object
        log('Forward request ' + (request.url).blue + 
            ' to ' + (targetHost + request.url).blue
        );
        var http = require( 'http' );
        var req = http.request( reqOptions, function ( res ) {
            var content = [];
            res.on( 'data', function ( chunk ) {
                content.push( chunk );
            } );

            res.on( 'end', function () {
                context.content = Buffer.concat( content );
                context.header = res.headers;
                if ( !res.headers.connection ) {
                    context.header.connection = 'close';
                }
                context.status = res.statusCode;
                context.start();
            } );
        } );

        req.on('error', function (err) {
            log('Requesting ' + (targetHost + request.url).blue 
                + ' error: '.red + err.message
            );
            context.status = 500;
            context.content = '';
            context.start();
        });

        // send request data
        var buffer = context.request.bodyBuffer;
        buffer && req.write( buffer );
        req.end();
    };
};

/**
 * html2js
 * 转html2js并输出
 *
 * @param {Object=} compileOptions 编译参数
 * @param {string=} compileOptions.mode format|compress|default
 * @param {boolean=} compileOptions.wrap wrap with define
 * @param {string=} encoding 源编码方式
 * @return {Function}
 */
exports.html2js = function ( compileOptions, encoding ) {
    encoding = encoding || 'utf8';

    return function ( context ) {
        var docRoot  = context.conf.documentRoot;
        var pathname = context.request.pathname;
        var file = docRoot + pathname.replace( /\.js$/, '' );

        if ( fs.existsSync( file ) ) {

            context.content = html2js(
                fs.readFileSync( file, encoding ),
                require( './util/extend' )(
                    {},
                    {
                        mode: 'format',
                        wrap: true
                    },
                    compileOptions
                )
            )

            context.start();

        }
        else {

            context.status = 404;
            context.start();

        }

    };
};
