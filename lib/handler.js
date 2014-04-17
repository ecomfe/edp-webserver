/***************************************************************************
*
* Copyright (C) 2014 Baidu.com, Inc. All Rights Reserved
*
***************************************************************************/

/**
 * @file handler.js ~ 2014-03-07 16:18
 * @author sekiyika (px.pengxing@gmail.com)
 * @description
 *  Connect Middleware
 *   handler.js 挨个处理请求的每个handler
 */

var edp = require('edp-core');

module.exports = exports = function(serverConfig) {
    return function(req, resp, next) {
        process(req, resp, serverConfig);
    };
};

/**
 * 根据route分析出来的handlers依次执行
 * @param {http.Request} req
 * @param {http.Response} resp
 * @param {Object} serverConfig 服务器配置信息
 */
function process(req, resp, serverConfig) {
    var handlers = req._handlers;
    handlers.push(require('./resource').write());

    // init handler context
    var isEnd = false;
    var isWait = false;
    var context = {
        request  : req,
        response : resp,
        conf     : serverConfig,
        status   : 200,
        content  : '',
        header   : {},
        end: function () {
            isEnd = true;
            resp.end();
        },
        stop: function () {
            isWait = true;
        },
        start: function () {
            isWait = false;
            nextHandler();
        }
    };

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
            try {
                handlers[ index ]( context );
            } catch(ex) {
                edp.log.error(ex.message);
            }
            nextHandler();
        }

    }
}
