/**
 * Copyright (c) 2014 Baidu.com, Inc. All Rights Reserved
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on
 * an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations under the License.
 *
 * @file lib/middleware/defaults.js
 * @author leeight
 */

var buffer = require('./buffer');
var logger = require('./logger');
var router = require('./router');
var handler = require('./handler');

exports.attachTo = function (app, config) {
    app.use(buffer(config));

    if (config.logger !== false) {
        app.use(config.logger && config.logger(config) || logger(config));
    }

    app.use(router(config));
    app.use(handler(config));
};











/* vim: set ts=4 sw=4 sts=4 tw=120: */
