/***************************************************************************
 *
 * Copyright (c) 2014 Baidu.com, Inc. All Rights Reserved
 * $Id$
 *
 **************************************************************************/



/**
 * lib/handlers/livereload.js ~ 2014/02/15 21:47:58
 * @author leeight(liyubei@baidu.com)
 * @version $Revision$
 * @description
 *
 **/
/**
 * LiveReload 支持
 *
 * @param {Object=} options 参数
 * @param {string=} options.ip LiveReload服务器的IP地址
 * @param {number=} options.port LiveReload服务器的端口号
 * @param {string=} options.encoding 文件编码
 * @return {Function}
 */
module.exports = exports = function livereload(options) {
    var defaults = {
        port: 8898,
        ip: require('../util/ip'),
        encoding: 'utf8'
    };

    options = require('../util/extend')(
        defaults,
        options || {}
    );

    var injectCode = require('util').format(
        '<script src="http://%s:%d/livereload.js"></script>',
        options.ip,
        options.port
    );

    return function (context) {
        if (!/^text\/html/i.test(context.header['content-type'])) {
            return;
        }

        context.stop();

        var content = context.content.toString(options.encoding);
        content = content.replace(/<\/body>/i, injectCode + '</body>');

        context.content = content;
        context.start();
    };
};
