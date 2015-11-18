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
 */

var fs = require('fs');
var path = require('path');
var edp = require('edp-core');
var qs = require('querystring');
var extend = edp.util.extend;


function processFontSync(context, options) {
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

    if (!params.fontName || !params.fontType || !params.encode) {
        responseData.status = 1;
        responseData.statusInfo = 'missing font fields: fontName or fontType or encode!';
        return;
    }

    // 当前只支持base64格式解析
    if (params.encode !== 'base64') {
        responseData.status = 2;
        responseData.statusInfo = 'unsupported font data format:' + params.encode + '!';
        return;
    }

    // 获取本地font目录
    var fontPath = options.fontPath || path.dirname(context.request.pathname).slice(1);
    fontPath = path.resolve(context.conf.documentRoot, fontPath);

    var result = {};
    params.fontType.split(',').forEach(function (type) {
        if (params[type]) {
            var filePath = path.resolve(fontPath, params.fontName + '.' + type);
            try {
                fs.writeFileSync(filePath, new Buffer(params[type], 'base64'));
                result[type] = true;
                edp.log.info('>> Sync font data to: ' + edp.chalk.yellow.bold(filePath));
            }
            catch (exp) {
                result[type] = false;
                edp.log.error('>> Error syncing font data to: ' + edp.chalk.yellow.bold(filePath)
                    + '\n' + exp.message);
            }
        }
    });
    responseData.status = 0;
    responseData.data = result;
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
        if (method === 'POST' || method === 'PUT') {
            context.content = {
                status: 0
            };
            processFontSync(context, options);
            context.header['content-type'] = 'text/html';
            context.content = JSON.stringify(context.content);
        }
        // 非post的http请求交给file handler 处理
        else {
            fileHandler(context);
        }
    };
}


module.exports = fontsync;





















/* vim: set ts=4 sw=4 sts=4 tw=100: */
