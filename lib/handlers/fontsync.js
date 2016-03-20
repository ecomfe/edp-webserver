/**
 * @file 接收`font.baidu.com`推送的同步字体数据，并保存到相应的目录
 * @author mengke01(kekee000@gmail.com)
 *
 * @description
 * 在`edp-webserver-config.js`中增加配置：
 *      {
 *          location: /\.font(?:$|\?)/,
 *          handler: [
 *              fontsync({
 *                  // fontName: 'fonteditor', // 接收字体的名字
 *                  // fontType: 'ttf,woff', // 接收字体的类型
 *                  // fontPath: 'src/common/css/fonts' // 字体存放目录
 *              })
 *          ]
 *      },
 *
 * 配置`font.baidu.com`编辑器中字体项目的`同步字体`设置
 *
 * 远程地址：http://{host}:{port}/src/common/css/fonts/fonteditor.font
 * 字体名称：fonteditor
 * 字体名称：ttf,woff,svg,eot
 *
 * 启动`edp-webserver`之后，在编辑器中保存的字体会自动同步到项目中指定位置。
 * @see https://github.com/ecomfe/fonteditor/wiki
 *
 * 同步规则如下：
 * 分为GET和POST两种方式：
 * GET使用JSONP，检查是否有更新，有的话则返回同步数据
 * POST使用跳转指定页面进行通知
 *
 * method: GET
 * GET参数:
 *     action: 当前动作，默认为`pull`拉取新数据
 *     callback: jsonp回调函数名
 *     fontName: fonteditor, 字体名称
 *     fontType: ttf, 字体类型
 *     timestamp: 上次更新的timestamp， -1 则为强制更新
 *     encode: 编码格式，默认`base64`
 *
 * 响应: {
 *     "status": 0
 *     "data": {
 *         "fontName": "fonteditor", // 字体名称
 *         "hasNew": 1, // 如果有新数据则标记为1, 同时设置fontType, timestamp, ttf字段
 *         "timestamp": 12345678, // 新纪录时间戳，unix timestamp 精确到毫秒
 *         "fontType": "ttf", // 新纪录类型，默认为ttf字体
 *         "ttf": base64str // 新纪录的base64字体数据
 *     }
 * }
 *
 * method: POST
 * GET参数:
 *     action: 当前动作，默认为`push`推送数据
 * POST参数:
 *     callbackUrl: post回调函数地址，通过302跳转到回调地址，通知编辑器
 *     fontName: 字体名称
 *     fontType: 字体类型，多个类型用`,`隔开
 *     encode: 编码格式，默认`base64`
 *     ttf: 如果fontType包含`ttf`则为ttf格式字体base64数据
 *     woff: 如果fontType包含`woff`则为woff格式字体base64数据
 *     svg: 如果fontType包含`svg`则为svg格式字体base64数据
 *     eot: 如果fontType包含`eot`则为eot格式字体base64数据
 *
 * 响应: {
 *     "status": 0
 *     "data": {
 *         "fontName": "fonteditor", // 字体名称
 *         "timestamp": 12345678, // 新纪录时间戳
 *         "fontType": "ttf" // 新纪录类型
 *     }
 * }
 *
 * 回调地址调用方式：
 * callbackUrl + &data= urlencode( json_encode(data) )
 * 例如回调地址：`proxy.html?callback=xxxxxx`
 * 则回调的数据为：`proxy.html?callback=xxxxxx&data={"status":0,"data":{}}`
 *
 */

var fs = require('fs');
var path = require('path');
var edp = require('edp-core');
var qs = require('querystring');
var extend = edp.util.extend;

var syncFontList = {};

function getRecord(path) {
    return syncFontList[path];
}


function saveRecord(path, data) {
    syncFontList[path] = data;
}

function getFontPath(context, options) {
    // 获取本地font目录
    var fontPath = options.fontPath || path.dirname(context.request.pathname).slice(1);
    fontPath = path.resolve(context.conf.documentRoot, fontPath);
    return fontPath;
}

function processPush(context, options) {
    var responseData = context.content;
    // 无post的数据
    if (!context.request.bodyBuffer) {
        responseData.status = 1;
        responseData.statusInfo = 'no post data!';
        return;
    }

    var params = qs.parse(String(context.request.bodyBuffer));
    // 优先使用webserver中设置的配置参数
    params = extend(params, options);

    if (!params.fontName || !params.fontType) {
        responseData.status = 1;
        responseData.statusInfo = 'missing font fields: fontName or fontType!';
        return;
    }

    // 获取本地font目录
    var fontPath = getFontPath(context, options);
    var successType = [];
    params.fontType.split(',').forEach(function (type) {
        if (params[type]) {
            var filePath = path.resolve(fontPath, params.fontName + '.' + type);
            try {
                fs.writeFileSync(filePath, new Buffer(params[type], 'base64'));
                successType.push(type);
                edp.log.info('>> Sync font data to: ' + edp.chalk.yellow.bold(filePath));
            }
            catch (exp) {
                edp.log.error('>> Error syncing font data to: ' + edp.chalk.yellow.bold(filePath)
                    + '\n' + exp.message);
            }
        }
    });

    var data = {
        timestamp: Date.now(),
        fontName: params.fontName,
        fontType: successType.join(',')
    };

    // 记录当前同步记录
    saveRecord(path.resolve(fontPath, params.fontName), data);

    // call back 地址
    if (params.callbackUrl) {
        context.callbackUrl = params.callbackUrl;
    }

    responseData.status = 0;
    responseData.data = data;
}

function processPull(context, options) {
    var responseData = context.content;
    var params = extend({}, context.request.query, options);

    if (!params.fontName) {
        responseData.status = 1;
        responseData.statusInfo = 'missing font fields: fontName or fontType!';
        return;
    }


    var timestamp = +params.timestamp || 0;
    var fontType = 'ttf'; // 默认为ttf字形
    var fontPath = getFontPath(context, options);
    var record = getRecord(path.resolve(fontPath, params.fontName)) || {};

    responseData.status = 0;
    responseData.data = {
        fontName: params.fontName
    };
    // 强制更新或者有新的记录
    if (-1 === timestamp || record.timestamp > timestamp) {
        var filePath = path.resolve(fontPath, params.fontName + '.' + fontType);
        if (fs.existsSync(filePath)) {
            responseData.data.hasNew = 1;
            responseData.data.timestamp = record.timestamp || Date.now();
            responseData.data.fontType = fontType;
            responseData.data[fontType] = new Buffer(fs.readFileSync(filePath)).toString('base64');
        }
    }
}

/**
 * 接收`font.baidu.com`推送的同步字体数据，并保存到相应的目录
 *
 * @param {Object} options 推送参数
 * @param {string} options.fontName 字体名称
 * @param {string} options.fontType 接收字体类型，用`,`隔开，例如：`ttf,woff`
 * @param {string} options.encode 数据编码方式，默认`base64`
 * @param {string} options.fontPath font文件保存路径
 *
 * @return {Function}
 */
function fontsync(options) {
    /* globals file */
    var fileHandler = file();

    return function (context) {
        options = options || {};
        var method = context.request.method;
        var action = context.request.query.action;
        context.content = {
            status: 0
        };

        if (action === 'pull') {
            processPull(context, options);
            var callback = context.request.query.callback;
            if (callback) {
                context.content = callback + '(' + JSON.stringify(context.content) + ')';
            }
            else {
                context.header['content-type'] = 'text/html';
                context.content = JSON.stringify(context.content);
            }
        }
        else if (method === 'POST' || method === 'PUT') {
            processPush(context, options);
            // 配置了跳转地址则进行跳转
            if (context.callbackUrl) {
                context.status = 302;
                context.header.location = ''
                    + context.callbackUrl
                    + '&data='
                    + encodeURIComponent(JSON.stringify(context.content));
                context.content = '';
            }
            else {
                context.header['content-type'] = 'text/html';
                context.content = JSON.stringify(context.content);
            }
        }
        // 非post的http请求交给file handler 处理
        else {
            fileHandler(context);
        }
    };
}


module.exports = fontsync;





















/* vim: set ts=4 sw=4 sts=4 tw=100: */
