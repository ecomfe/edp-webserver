/**
 * @file route.js
 * @author sekiyika (px.pengxing@gmail.com)
 * @description
 * Connect Middleware
 * route.js 作为connect的一个中间件，负责匹配URL，将handlers打在request上
 */
var url = require('url');
var util = require('util');

var u = require('underscore');
var path2RegExp = require('path-to-regexp');

module.exports = exports = function (config) {
    var route = new Route(config);
    return function (req, resp, next) {
        route.process(req, resp, next);
    };
};

function Route(config) {
    this.config = config;
    this.routes = [];
    this.init();
}


/**
 * Route的初始化方法，将config里的内容处理成一个数组
 */
Route.prototype.init = function () {
    var config = this.config;
    var locations = config && config.getLocations && config.getLocations();
    if (!Array.isArray(locations)) {
        return;
    }

    for (var i = 0; i < locations.length; i++) {
        var item = locations[i];
        var location = item.location;
        var keys = null;

        // path为类似于express route的表达式<http://expressjs.com/>
        if (typeof location === 'string') {
            keys = [];
            location = path2RegExp(location, keys, {sensitive: true});
        }
        if (!location) {
            continue;
        }


        var handlers = [];
        if (typeof item.handler === 'function') {
            handlers = [item.handler];
        }
        else if (Array.isArray(item.handler)) {
            handlers.push.apply(handlers, item.handler);
        }
        else if (typeof item.handler === 'string') {
            handlers.push(require(item.handler)());
        }

        this.routes.push({
            location: location,
            handlers: handlers,
            keys: keys
        });
    }
};

function safeDecodeURIComponent(v) {
    try {
        return decodeURIComponent(v);
    }
    catch (ex) {
        return v;
    }
}

Route.prototype.process = function (req, resp, next) {
    u.extend(req, url.parse(req.url, false));

    req.path = safeDecodeURIComponent(req.path);
    req.pathname = safeDecodeURIComponent(req.pathname);
    req.href = safeDecodeURIComponent(req.href);

    var handlers = [];
    for (var i = 0, l = this.routes.length; i < l; i++) {
        var route = this.routes[i];
        var location = route.location;

        var match = (util.isRegExp(location) && location.test(req.pathname))
                    || (typeof location === 'function' && location(req));
        if (match) {
            if (util.isRegExp(location)
                && Array.isArray(route.keys)
                && route.keys.length > 0) {
                var matches = req.pathname.match(location);
                var params = {};
                for (var j = 0, len = route.keys.length; j < len; j++) {
                    params[route.keys[j].name] = matches[j + 1];
                }
                req.params = params;
            }

            handlers.push.apply(handlers, route.handlers);
            break;
        }
    }

    // 将handlers传给处理handlers的模块去做
    req._handlers = handlers;

    next();
};
