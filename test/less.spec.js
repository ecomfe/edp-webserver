/***************************************************************************
 * 
 * Copyright (c) 2014 Baidu.com, Inc. All Rights Reserved
 * $Id$ 
 * 
 **************************************************************************/
 
 
 
/**
 * less.spec.js ~ 2014/03/14 13:29:04
 * @author leeight(liyubei@baidu.com)
 * @version $Revision$ 
 * @description 
 * 测试一下less handler
 **/
var path = require( 'path' );

var base = require( './base' );
var LessHandler = require( '../lib/handlers/less' );

describe('less', function(){
    it('default', function(){
        var context = base.getContext();
        context.request.pathname = '/edp-issue-166.less';
        context.content = require( 'fs' ).readFileSync( 
            path.join( __dirname, 'edp-issue-166.less' ), 'utf-8' );

        spyOn( context, 'start' ).andCallFake( function(){
            runs(function(){
                expect( context.start ).toHaveBeenCalled();
                expect( context.start.callCount ).toBe( 1 );
                expect( context.content.indexOf( '.banner {' ) ).not.toBe( -1 );
                expect( context.content.indexOf( 'background: url("../img/white-sand.png")' ) ).not.toBe( -1 );
            });
        } );

        LessHandler()( context );

        waitsFor(function(){ return context.start.callCount === 1 }, 'x', 1000)
    });
});





















/* vim: set ts=4 sw=4 sts=4 tw=100: */
