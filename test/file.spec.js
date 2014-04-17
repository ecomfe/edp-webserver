/***************************************************************************
 * 
 * Copyright (c) 2014 Baidu.com, Inc. All Rights Reserved
 * $Id$ 
 * 
 **************************************************************************/
 
 
 
/**
 * file.spec.js ~ 2014/02/25 21:35:29
 * @author leeight(liyubei@baidu.com)
 * @version $Revision$ 
 * @description 
 * 测试一下file handler
 **/
var path = require( 'path' );

var base = require( './base' );
var handler = require( '../lib/handlers/file' );

describe('file', function(){
    it('default', function(){
        var context = base.getContext();
        context.request.pathname = '/index.html';

        spyOn( context, 'start' ).andCallFake( function(){
            runs(function(){
                expect( context.start ).toHaveBeenCalled();
                expect( context.start.callCount ).toBe( 1 );
                expect( context.content.length ).toBe( 2101 );
            });
        } );

        var file = path.join( __dirname, '../lib/handlers/file.js' );
        handler( file )( context );

        waitsFor(function(){ return context.start.callCount === 1 }, 'x', 1000)
    });
});























/* vim: set ts=4 sw=4 sts=4 tw=100: */
