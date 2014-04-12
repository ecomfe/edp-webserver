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

module.exports = function( config ) {
    if ( typeof config.logger === 'function' ) {
        return config.logger;
    }
    else {
        var tiny = 'edp ' + chalk.green( 'INFO' ) +
            ' ' + chalk.yellow( ':method' ) + ' :url :status :res[content-length] - :response-time ms';
        return require( 'connect' ).logger( tiny );
    }
};




















/* vim: set ts=4 sw=4 sts=4 tw=100: */
