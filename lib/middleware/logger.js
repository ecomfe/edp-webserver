/**
 * @file lib/middleware/logger.js ~ 2014/04/12 21:33:53
 * @author leeight(liyubei@baidu.com)
 */
var chalk = require('chalk');

module.exports = function (config) {
    var prefix = 'edp ' + chalk.green('INFO') + ' ';
    var tiny = prefix + chalk.yellow('%method') + ' %url %status (%time)';
    var options = {
        format: tiny
    };
    return require('connect-logger')(options);
};




















/* vim: set ts=4 sw=4 sts=4 tw=100: */
