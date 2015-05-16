/**
 * @file handler.js ~ 2014-03-07 16:18
 * @author sekiyika (px.pengxing@gmail.com)
 */

var edp = require('edp-core');

var resource = require('../resource');

module.exports = exports = function (serverConfig) {
    return function (req, resp, next) {
        process(req, resp, serverConfig);
    };
};

function process(req, resp, serverConfig) {
    var handlers = req._handlers;
    handlers.push(resource.write());

    // init handler context
    var isWait = false;
    var context = {
        request: req,
        response: resp,
        conf: serverConfig,
        status: 200,
        content: '',
        header: {},
        end: function () {
            resp.end();
        },
        stop: function () {
            isWait = true;
        },
        start: function () {
            isWait = false;
            nextHandler();
        }
    };

    // handle
    var index = -1;
    var length = handlers.length;
    nextHandler();
    function nextHandler() {
        if (isWait) {
            return;
        }

        index++;
        if (index < length) {
            try {
                handlers[index](context);
            }
            catch (ex) {
                edp.log.error(ex.message);
            }
            nextHandler();
        }
    }
}
