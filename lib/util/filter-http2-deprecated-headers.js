/**
 * @file 过滤掉http2不支持的headers
 * @author sekiyika (px.pengxing@gmail.com)
 */

/**
 * 在http2中废弃的http头
 *
 * @type {Array.<string>}
 */
var deprecatedHeaders = [
    'connection',
    'host',
    'keep-alive',
    'proxy-connection',
    'te',
    'transfer-encoding',
    'upgrade'
];

/**
 * 过滤掉http2不支持的headers，该函数是有副作用的函数
 *
 * @param {Object} headers 需要过来的头
 * @return {Object}
 */
module.exports = function filterHttp2DeprecatedHeaders(headers) {
    if (!headers || typeof headers !== 'object') {
        return {};
    }

    var key;
    for (var i = 0; i < deprecatedHeaders.length; i++) {
        key = deprecatedHeaders[i];
        if (headers[key]) {
            delete headers[key];
        }
    }

    return headers;
};

