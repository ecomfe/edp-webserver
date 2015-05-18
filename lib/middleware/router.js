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
        // item.location是用来匹配req.url的
        // item.path是用来匹配req.pathname的
        // 因为最早提供的是item.location参数，因此为了兼容历史的版本，新增了path参数
        // 如果location和path同时存在，优先使用location
        var location = item.location;
        var path = item.path;
        var keys = null;

        // path为类似于express route的表达式<http://expressjs.com/>
        if (typeof location === 'string') {
            keys = [];
            location = path2RegExp(location, keys, {sensitive: true});
        }
        if (!location) {
            if (typeof path === 'string') {
                keys = [];
                path = path2RegExp(path, keys, {sensitive: true});
            }
            if (!path) {
                // location和path都不存在
                continue;
            }
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
            path: path,
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
    u.extend(req, url.parse(req.url, true));

    req.path = safeDecodeURIComponent(req.path);
    req.pathname = safeDecodeURIComponent(req.pathname);
    req.href = safeDecodeURIComponent(req.href);

    var handlers = [];
    for (var i = 0, l = this.routes.length; i < l; i++) {
        var route = this.routes[i];
        var match = this.isMatch(route.location, req.url, route.keys, req)
                    || this.isMatch(route.path, req.pathname, route.keys, req);
        if (match) {
            handlers.push.apply(handlers, route.handlers);
            break;
        }
    }

    // 将handlers传给处理handlers的模块去做
    req._handlers = handlers;

    next();
};

Route.prototype.isMatch = function (pattern, uri, keys, req) {
    if (!pattern) {
        return false;
    }

    var match = (util.isRegExp(pattern) && pattern.test(uri))
                || (typeof pattern === 'function' && pattern(req));
    if (match) {
        if (util.isRegExp(pattern)
            && Array.isArray(keys)
            && keys.length > 0) {
            var matches = uri.match(pattern);
            var params = {};
            for (var j = 0, len = keys.length; j < len; j++) {
                params[keys[j].name] = matches[j + 1];
            }
            req.params = params;
        }
        return true;
    }

    return false;
};
