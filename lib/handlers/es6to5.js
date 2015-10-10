/**
 * @file es6转es5
 * @author liuming07@baidu.com
 */

'use strict';

module.exports = exports = function () {
    return function (context) {
        var shelljs = require('shelljs');
        var spawn = require('child_process').spawn;
        var path = require('path');
        var edp = require('edp-core');
        var mimeType = require( '../mime-types' );
        var data = '';

        context.stop();
        var requstPath = path.resolve(context.conf.documentRoot, '.' + context.request.url);
        if (shelljs.which('babel')) {
            var child = spawn('babel', [requstPath]);
            child.stdout.setEncoding('UTF-8');
            child.stdout.on('data', function (chunk) {
                data += chunk;
            });

            child.on('exit', function (code) {
                context.status = 200;
                context.header['content-type'] = mimeType.js;
                context.content = !code ? data : '{info: "syntaxError!"}';
                context.start();
            });
        }
        else {
            edp.log.error('please install babel module in global prepare!');
            process.exit(1);
        }
    };
};
