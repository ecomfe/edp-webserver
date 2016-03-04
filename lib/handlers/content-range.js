/**
 * @file content-range 常用作处理媒体文件请求
 *
 * @author junmer
 */

var fs = require('fs');
var path = require('path');
var mimeType = require('../mime-types');
var edp = require('edp-core');

function contentRange() {

    return function (context) {

        context.stop();

        var req = context.request;
        var res = context.response;

        var filePath = path.join(context.conf.documentRoot, req.pathname);
        var stat = fs.statSync(filePath);
        var total = stat.size;

        var extname = path.extname(filePath).slice(1).toLowerCase();
        var contentType = mimeType[extname] || mimeType.mpg;

        if (req.headers.range) {
            var range = req.headers.range;
            var parts = range.replace(/bytes=/, '').split('-');
            var partialstart = parts[0];
            var partialend = parts[1];

            var start = parseInt(partialstart, 10);
            var end = partialend ? parseInt(partialend, 10) : total - 1;
            var chunksize = (end - start) + 1;

            edp.log.info('RANGE: ' + start + ' - ' + end + ' = ' + chunksize);

            var file = fs.createReadStream(filePath, {
                start: start,
                end: end
            });

            res.writeHead(206, {
                'Content-Range': 'bytes ' + start + '-' + end + '/' + total,
                'Accept-Ranges': 'bytes',
                'Content-Length': chunksize,
                'Content-Type': contentType
            });

            file.pipe(res);

        }
        else {

            edp.log.info('ALL: ' + total);

            res.writeHead(200, {
                'Content-Length': total,
                'Content-Type': contentType
            });

            fs.createReadStream(filePath).pipe(res);
        }

    };

}


module.exports = exports = contentRange;
