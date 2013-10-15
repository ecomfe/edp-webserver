/**
 * @file 开发时web调试服务器启动功能
 * @author otakustay[otakustay@live.com], 
 *         errorrik[errorrik@gmail.com],
 *         ostream[ostream.song@gmail.com],
 *         firede[firede@firede.us]
 */

/**
 * 服务器配置
 * 
 * @inner
 */
var serverConfig;

/**
 * 启动webserver
 *
 * @param {Object} config 启动所需配置模块
 */
module.exports = function ( config ) {
    config = config || require( './config' );
    serverConfig = config;

    var port = config.port || 80;
    var documentRoot = config.documentRoot;
    var injectResource = config.injectResource || config.injectRes;
    injectResource && injectResource( require( './resource' ) );

    var http = require( 'http' );
    var server = http.createServer( httpHandler );
    server.listen( port );

    console.log( 
        'EDP WebServer start, root = [%s], listen = [%s] ', 
        documentRoot, port
    );

    initWeinreSupport( config );
};


/**
 * http server的request 监听函数
 * 
 * @inner
 * @param {http.ServerRequest} request request
 * @param {http.ServerResponse} response response
 */
function httpHandler( request, response ) {
    var url = require( 'url' );
    var extend = require( './util/extend' );
    extend( request, url.parse( request.url, true ) );

    var handler = findHandler( request );
    if ( handler ) {
        var form = new require('multiparty').Form();
        form.parse(
            request,
            function (err, fields, files) {
                request.body = fields;
                require.files = files;
                // init handler context
                var isEnd = false;
                var isWait = false;
                var context = {
                    request  : request,
                    response : response,
                    conf     : serverConfig,
                    status   : 200,
                    content  : '',
                    header   : {},
                    end: function () {
                        isEnd = true;
                        response.end();
                    },
                    stop: function () {
                        isWait = true;
                    },
                    start: function () {
                        isWait = false;
                        nextHandler();
                    }
                };

                // init handlers
                var handlers = [];
                if ( typeof handler == 'function' ) {
                    handlers.push( handler );
                }
                else if ( handler instanceof Array ) {
                    handlers.push.apply( handlers, handler );
                }
                handlers.push( require( './resource' ).write() );

                // handle
                var index = -1;
                var length = handlers.length;
                nextHandler();
                function nextHandler() {
                    if ( isWait ) {
                        return;
                    }

                    index++;
                    if ( index < length ) {
                        handlers[ index ]( context );
                        nextHandler();
                    }
                }
            }
        );
    }
    else {
        response.writeHeader( 404 );
        response.end();
    }
}


/**
 * 获取请求的处理函数
 * 
 * @inner
 * @param {http.ServerRequest} request request
 * @return {function(http.ServerRequest, http.ServerResponse)}
 */
function findHandler( request ) {
    var url = request.url;
    var locations = serverConfig 
        && serverConfig.getLocations
        && serverConfig.getLocations();

    if ( locations instanceof Array ) {
        for ( var i = 0, len = locations.length; i < len; i++ ) {
            var item = locations[ i ];
            var location = item.location;

            // location support:
            // 1. string
            // 2. RegExp which use test
            // 3. function which return true or false
            if ( 
                ( location instanceof RegExp && location.test( url ) )
                || ( typeof location == 'string' && location == url )
                || ( typeof location == 'function' && location( request ) )
            ) {
                return item.handler;
            }
        }
    }

    return null;
}

/**
 * 初始化Weinre支持
 * 
 * @inner
 * @param {Object} config 启动所需配置信息
 */
function initWeinreSupport( config ) {
    if ( config.weinreFlag || config.weinreHost || config.weinreFlag ) {
        config.weinreEnabled = true;

        config.weinreHost = config.weinreHost || getIP();
        config.weinrePort = config.weinrePort || 8080;
        config.weinreFlag = config.weinreFlag || 'anonymous';
        
        console.log( 
            'Inject Weinre script, debug client UI: http://%s:%s/client/#%s',
            config.weinreHost,
            config.weinrePort,
            config.weinreFlag
        );
    }
}



/**
 * 获取本机IP
 * 默认取127.0.0.1之外的第一个IP地址
 * 
 * @inner
 * @return {string}
 */
function getIP() {
    var ifaces = require( 'os' ).networkInterfaces();
    var defultAddress = '127.0.0.1';
    var ip = defultAddress;

    for ( var dev in ifaces ) {
        ifaces[ dev ].forEach(
            function( details ) {
                if (ip === defultAddress && details.family === 'IPv4') {
                    ip = details.address;
                }
            }
        );
    }

    return ip;
}
