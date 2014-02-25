/***************************************************************************
 * 
 * Copyright (c) 2014 Baidu.com, Inc. All Rights Reserved
 * $Id$ 
 * 
 **************************************************************************/
 
 
 
/**
 * base.js ~ 2014/02/25 21:39:54
 * @author leeight(liyubei@baidu.com)
 * @version $Revision$ 
 * @description 
 *  
 **/
exports.getContext = function() {
    var request = {};
    var response = {};

    var context = {
        request  : request,
        response : response,
        conf     : require( './edp-webserver-config.js' ),
        status   : 200,
        content  : '',
        header   : {},
        end: function () {
            // response.end();
        },
        stop: function () {
            // isWait = true;
        },
        start: function () {
            // isWait = false;
            // nextHandler();
        }
    };

    return context;
}




















/* vim: set ts=4 sw=4 sts=4 tw=100: */
