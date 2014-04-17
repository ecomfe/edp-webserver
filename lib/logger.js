/***************************************************************************
 * 
 * Copyright (c) 2014 Baidu.com, Inc. All Rights Reserved
 * $Id$ 
 * 
 **************************************************************************/
 
 
 
/**
 * lib/logger.js ~ 2014/04/12 21:33:53
 * @author leeight(liyubei@baidu.com)
 * @version $Revision$ 
 * @description 
 *  
 **/
var chalk = require( 'chalk' );
var connect = require( 'connect' );

module.exports = function( config ) {
    var prefix = 'edp ' + chalk.green( 'INFO' ) + ' ';
    if ( typeof config.logger === 'function' ) {
        return connect.logger(function( tokens, req, res ){
            var log = config.logger( tokens, req, res );
            if ( log ) {
                return prefix + log;
            }
        });
    }
    else {
        var tiny = prefix + chalk.yellow( ':method' ) + ' :url :status :res[content-length] - :response-time ms';
        return connect.logger( tiny );
    }
};




















/* vim: set ts=4 sw=4 sts=4 tw=100: */
