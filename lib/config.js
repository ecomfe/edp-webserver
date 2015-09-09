/**
 * @file WebServer默认配置
 * @author otakustay[otakustay@live.com],
 *         errorrik[errorrik@gmail.com],
 *         ostream[ostream.song@gmail.com],
 *         firede[firede@firede.us]
 */

// 端口
exports.port = 8848;

// server协议，默认是http，可以是https
exports.protocol = 'http';
// 如果protocol是https时，需要tlsOptions
// http://nodejs.org/api/tls.html#tls_tls_createserver_options_secureconnectionlistener
exports.tlsOptions = {
};

// 网站根目录
exports.documentRoot = process.cwd();

// 当路径为目录时，是否显示文件夹内文件列表
exports.directoryIndexes = true;

// less 包含文件存放地址，可以是绝对路径，也可以是相对路径(相对于网站根目录)
exports.lessIncludePaths = [];

// 是否为 coffee-script 自动生成 sourceMap
exports.coffeeSourceMap = true;

/* handlers
 * 支持expressjs的path的写法，可以通过request.parameters来获取url中的参数
 * 如:
 *  {
 *      location: '/lib/:filename',
 *      handler: function(context) {
 *          console.log(context.request.parameters);
 *      }
 *  }
 *
 * 如果访问http://127.0.0.1:8848/lib/config.js
 *  handler将打印出{"filename": "config.js"}
 */
exports.getLocations = function () {
    return [
        {
            location: '/',
            handler: home('index.html')
        },
        {
            location: /^\/redirect-local/,
            handler: redirect('redirect-target', false)
        },
        {
            location: /^\/redirect-remote/,
            handler: redirect('http://www.baidu.com', false)
        },
        {
            location: /^\/redirect-target/,
            handler: content('redirectd!')
        },
        {
            location: '/empty',
            handler: empty()
        },
        {
            location: /^[^\?]+?\.css($|\?)/,
            handler: [
                autocss()
            ]
        },
        {
            location: /^[^\?]+?\.md($|\?)/,
            handler: [
                markdown()
            ]
        },
        {
            location: /^[^\?]+?\.less($|\?)/,
            handler: [
                file(),
                less()
            ]
        },
        {
            location: /^[^\?]+?\.styl($|\?)/,
            handler: [
                file(),
                stylus()
            ]
        },
        {
            key: 'source',
            location: /^[^\?]+?\.js($|\?)/,
            handler: [
                autocoffee()
            ]
        },
        {
            location: /^[^\?]+?\.coffee($|\?)/,
            handler: [
                file(),
                coffee()
            ]
        },
        {
            location: /^.*$/,
            handler: [
                file(),
                proxyNoneExists()
            ]
        }
    ];
};

exports.injectResource = function ( res ) {
    for ( var key in res ) {
        global[ key ] = res[ key ];
    }
};
