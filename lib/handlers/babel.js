/***************************************************************************
 *
 * Copyright (c) 2014 Baidu.com, Inc. All Rights Reserved
 * $Id$
 *
 **************************************************************************/



/**
 * lib/handlers/babel.js ~ 2014/02/15 22:20:11
 * @author otakustay(otakustay@icloud.com)
 * @version $Revision$
 * @description
 *
 **/
module.exports = exports = function babel(babelOptions) {
    return function (context) {
        if (context.status !== 200) {
            return;
        }

        var code = context.content;
        var babelResult = require('babel').transform(code, babelOptions || {});
        context.content = babelResult.code;
    }
};
