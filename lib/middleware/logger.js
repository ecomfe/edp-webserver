/**
 * @file lib/middleware/logger.js
 * @author leeight(liyubei@baidu.com)
 */

var chalk = require('edp-core').chalk;

module.exports = function (config) {
    var prefix = 'edp ' + chalk.green('INFO') + ' ';
    var tiny = prefix + chalk.yellow('%method') + ' %url %status (%time)';
    var options = {
        format: tiny
    };
    return require('connect-logger')(options);
};
