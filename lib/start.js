/**
 * @file 开发时web调试服务器启动功能
 * @author otakustay[otakustay@live.com], 
 *         errorrik[errorrik@gmail.com],
 *         ostream[ostream.song@gmail.com],
 *         firede[firede@firede.us]
 *         sekiyika[px.pengxing@gmail.com]
 */
var edp = require( 'edp-core' );

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


    var connect = require( 'connect' );
    var http = require( 'http' );

    var app = connect();

    // 采用connect连接各个中间件
    app.use(connect.logger())
        .use(connect.timeout(5000))
        .use(require('./route')(serverConfig))
        .use(require('./handler')(serverConfig));


    http.createServer(app).listen(port);

    var accessUrl = 'http://'
        + require( './util/ip' )
        + ( port === 80 ? '' : ':' + port );

    edp.log.info(
        'EDP WebServer start, %s', accessUrl);
    edp.log.info(
        'root = [%s], listen = [%s] ', documentRoot, port);
};

