/**
 * Helper functions to create CSS3 strings
 * 
 * Henrik Ingo (c) 2016
 * MIT License
 *
 * Mostly copied from impress.js, same license.
 */
(function ( document, window ) {
    'use strict';

    if( impressionist().css3 === undefined ){
        impressionist().css3 = {}
    }

    // `translate` builds a translate transform string for given data.
    impressionist().css3.translate = function ( t ) {
        return " translate3d(" + t.x + "px," + t.y + "px," + t.z + "px) ";
    };
    
    // `rotate` builds a rotate transform string for given data.
    // By default the rotations are in X Y Z order that can be reverted by passing `true`
    // as second parameter.
    impressionist().css3.rotate = function ( r, revert ) {
        var order = r.order ? r.order : "xyz";
        var css = "";
        var axes = order.split("");
        if ( revert ) {
            axes = axes.reverse();
        }

        for ( var i in axes ) {
            css += " rotate" + axes[i].toUpperCase() + "(" + r[axes[i]] + "deg)"
        }
        return css;
    };
    
    // `scale` builds a scale transform string for given data.
    impressionist().css3.scale = function ( s ) {
        return " scale(" + s + ") ";
    };

    // `perspective` builds a perspective transform string for given data.
    impressionist().css3.perspective = function ( p ) {
        return " perspective(" + p + "px) ";
    };

    // `css` function applies the styles given in `props` object to the element
    // given as `el`. It runs all property names through `pfx` function to make
    // sure proper prefixed version of the property is used.
    impressionist().css3.css = function ( el, props ) {
        var key, pkey;
        for ( key in props ) {
            if ( props.hasOwnProperty(key) ) {
                pkey = key;
                if ( pkey !== null ) {
                    el.style[pkey] = props[key];
                }
            }
        }
        return el;
    };

    impressionist().css3.computeWindowScale = function ( config ) {
        var hScale = window.innerHeight / config.height,
            wScale = window.innerWidth / config.width,
            scale = hScale > wScale ? wScale : hScale;
        if (config.maxScale && scale > config.maxScale) {
            scale = config.maxScale;
        }
        if (config.minScale && scale < config.minScale) {
            scale = config.minScale;
        }
        return scale;
    };
    
})(document, window);
