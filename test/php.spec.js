/***************************************************************************
 * 
 * Copyright (c) 2014 Baidu.com, Inc. All Rights Reserved
 * $Id$ 
 * 
 **************************************************************************/
 
 
 
/**
 * php.spec.js ~ 2014/02/25 21:35:29
 * @author leeight(liyubei@baidu.com)
 * @version $Revision$ 
 * @description 
 * 测试一下php handler
 **/
var path = require( 'path' );

var base = require( './base' );
var handler = require( '../lib/handlers/php' );

var zit = function() {
    return (process.env.USER === 'leeight' ? it : xit);
}

describe('php', function(){
    zit()('default', function(){
        var context = base.getContext();
        context.request.pathname = '/hello.php';
        context.request.url = '/hello.php?a=b';
        context.request.headers = {
            'host': 'www.baidu.com'
        };

        spyOn( context, 'start' ).andCallFake( function(){
            runs(function(){
                expect( context.start ).toHaveBeenCalled();
                expect( context.start.callCount ).toBe( 1 );
                expect( context.content.indexOf( '<title>phpinfo()</title>' ) ).not.toBe( -1 );
                expect( context.content.indexOf( '</html>' ) ).not.toBe( -1 );
            });
        } );

        handler()( context );

        waitsFor(function(){ return context.start.callCount === 1 }, 'x', 1000)
    });
});























/* vim: set ts=4 sw=4 sts=4 tw=100: */
