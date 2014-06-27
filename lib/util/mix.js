/**
 * 混合对象
 * 
 * @param {...Object} source 要混合的对象
 * @return {Object} 混合后的对象
 */
module.exports = function () {
    var o = {};
    var ext = require( './extend' );
    var src = Array.prototype.slice.call( arguments );
    return ext.apply( this, [o].concat( src ) );
};
