/**
 * @file 缓存文件管理，缓存less、stylus等文件内容，为请求做出优化
 * @author mengke01(kekee000@gmail.com)
 */

var fs = require('fs');

var cachedFiles = {};

/**
 * 获取当前文件缓存
 *
 * @return {string}
 */
exports.get = function (filePath) {
    return cachedFiles[filePath] ? cachedFiles[filePath].content : null;
};

/**
 * 检查是否改动，并获取当前文件缓存
 *
 * @param  {string} filePath 路径
 * @return {boolean|string} 成功则返回缓存内容，失败则返回`false`
 */
exports.check = function (filePath) {
    if (!cachedFiles[filePath]) {
        return false;
    }

    var cached = cachedFiles[filePath];
    var lastModified = cached.lastModified;
    var deps = cached.deps;

    // 检查依赖文件改动
    for (var i = 0, l = deps.length; i < l; i++) {
        if (!fs.existsSync(deps[i]) || fs.statSync(deps[i]).mtime - lastModified > 0) {
            return false;
        }
    }

    return cached.content;
};

/**
 * 保存缓存的文件
 *
 * @param  {string} filePath 文件路径
 * @param  {Array} deps     依赖列表
 * @param  {string} content 缓存内容
 */
exports.set = function (filePath, deps, content) {
    deps = deps || [];
    deps.push(filePath);

    // 按照依赖改动时间排序，最新改动的排前面
    var modifiedTimes = {};
    var now = Date.now();
    for (var i = 0, l = deps.length; i < l; i++) {
        var depPath = deps[i];
        if (!fs.existsSync(depPath)) {
            modifiedTimes[depPath] = now;
        }
        else {
            modifiedTimes[depPath] = fs.statSync(deps[i]).mtime;
        }
    }
    deps.sort(function (a, b) {
        return modifiedTimes[b] - modifiedTimes[a];
    });

    cachedFiles[filePath] = {
        lastModified: Date.now(),
        deps: deps,
        content: content
    };
};
