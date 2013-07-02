/**
 * 对象属性拷贝
 * 
 * @param {Object} target 目标对象
 * @param {...Object} source 源对象
 * @return {Object} 返回目标对象
 */
module.exports = function (target) {
    for ( var i = 1; i < arguments.length; i++ ) {
        var src = arguments[ i ];
        if ( src == null ) {
            continue;
        }
        for ( var key in src ) {
            if ( src.hasOwnProperty( key ) ) {
                target[ key ] = src[ key ];
            }
        }
    }
    return target;
};
