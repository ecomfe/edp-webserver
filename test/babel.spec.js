/***************************************************************************
 *
 * Copyright (c) 2015 Baidu.com, Inc. All Rights Reserved
 * $Id$
 *
 **************************************************************************/



/**
 * babel.spec.js ~ 2015/05/25 ‏‎16:31:58
 * @author Guoyao Wu(wuguoyao@baidu.com)
 * @version $Revision$
 * @description
 * 测试一下babel handler
 **/
var path = require('path');
var fs = require('fs');

var base = require('./base');
var handler = require('../lib/handlers/babel');

describe('babel', function () {
    it('default', function () {
        var context = base.getContext();
        context.request.pathname = '/babel.es6';
        context.content = fs.readFileSync(path.join(__dirname, 'babel.es6'), 'utf-8');

        handler({
            loose: 'all',
            modules: 'amd',
            compact: false,
            ast: false,
            blacklist: ['strict'],
            optional: ['runtime']
        })(context);

        expect(context.content.indexOf('define(')).toBeGreaterThan(-1);
    });
});
