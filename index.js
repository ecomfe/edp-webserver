/**
 * @file 开发时web调试服务器启动功能
 * @author otakustay[otakustay@live.com], 
 *         errorrik[errorrik@gmail.com],
 *         ostream[ostream.song@gmail.com],
 *         firede[firede@firede.us]
 */

exports.start = require( './lib/start' );

exports.getDefaultConfig = function () {
    return require( './lib/config' );
};
