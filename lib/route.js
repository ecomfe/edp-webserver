/***************************************************************************
*
* Copyright (C) 2014 Baidu.com, Inc. All Rights Reserved
*
***************************************************************************/

/**
 * @file route.js ~ 2014-03-07 11:49
 * @author sekiyika (px.pengxing@gmail.com)
 * @description
 *  Connect Middleware
 *  route.js 作为connect的一个中间件，负责匹配URL，将handlers打在request上
 */


/**
 * @param {Object} config server config的配置文件
 */
module.exports = exports = function(config) {
    var route = new Route(config);
    return function(req, resp, next) {
        route.process(req, resp, next);
    };
};

/**
 * Route
 * @constructor
 *
 * @param {Object} config
 */
function Route(config) {
    this.config = config;

    this.routes = [];

    this.init();
};


/**
 * Route的初始化方法，将config里的内容处理成一个数组
 */
Route.prototype.init = function() {
    var me = this;
    var config = me.config;
    var locations = config && config.getLocations && config.getLocations();

    var path2RegExp = require('path-to-regexp');
    if(locations instanceof Array) {
        locations.forEach(function(item){
            var location = item.location;

            // path为类似于express route的表达式<http://expressjs.com/>
            if(typeof location === 'string') {
                location = path2RegExp(location, null, { sensitive: true });
            }
            if(!location) {
                return;
            }


            var handlers = [];

            (function append(handler) {
                if(typeof handler === 'function') {
                    handlers.push(handler);
                }
                else if(handler instanceof Array) {
                    handler.forEach(append);
                }
                else if(typeof handler === 'string') {
                    handlers.push(require(handler)());
                }
            })(item.handler);

            me.routes.push({
                location: location,
                handlers: handlers
            });

        });

    }
};

/**
 * 处理请求的方法，找到handlers，并将handlers放在req中，等待其他模块处理
 * @param {http.Request} req
 * @param {http.Response} resp
 * @param {function} next
 *
 */
Route.prototype.process = function(req, resp, next) {
    var me = this;

    var route;
    var location;
    var handlers = [];
    for(var i= 0, l = me.routes.length; i < l; i++) {
        route = me.routes[i];
        location = route.location;

        if(location.test(req.url)) {
            handlers.push.apply(handlers, route.handlers);
            break;
        }
    }

    // 将handlers传给处理handlers的模块去做
    req._handlers = handlers;

    // req里没有pathname属性，默认加上一个
    req.pathname = req._parsedUrl && req._parsedUrl.pathname;

    next();
};
