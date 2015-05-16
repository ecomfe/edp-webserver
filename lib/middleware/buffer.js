/**
 * @file lib/middleware/buffer.js ~ 2014/04/12 21:31:58
 * @author leeight(liyubei@baidu.com)
 */

module.exports = function (config) {
    return function (req, resp, next) {
        var bodyBuffer = [];

        req.on('data', function (chunk) {
            bodyBuffer.push(chunk);
        });

        req.on('end', function () {
            if (bodyBuffer.length > 0) {
                req.bodyBuffer = Buffer.concat(bodyBuffer);
            }
            next();
        });
    };
};




















/* vim: set ts=4 sw=4 sts=4 tw=100: */
