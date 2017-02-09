/**
 * Utilities library functions
 *
 * Henrik Ingo (c) 2016
 * MIT License
 *
 * Parts copied from impress.js, same license.
 */
(function ( document, window ) {
    'use strict';

    if( impressionist().util === undefined ){
        impressionist().util = {}
    }

    impressionist().util.capitalize = function( str ) {
        return str[0].toUpperCase() + str.substring(1);
    }

    impressionist().util.toNumber = function (numeric, fallback) {
        return isNaN(numeric) ? (fallback || 0) : Number(numeric);
    };

    impressionist().util.toOrder = function ( order, fallback ) {
        fallback = fallback || "xyz";
        if ( ! order ) return fallback;
        if ( order.length > 3 ) return fallback;
        for ( var i = 0; i < order.length; i++ ) {
            var c = order[i];
            if ( "xyz".indexOf(c) < 0 ) return fallback;
        }
        return order;
    };

    impressionist().util.triggerEvent = function (el, eventName, detail) {
        var event = document.createEvent("CustomEvent");
        event.initCustomEvent(eventName, true, true, detail);
        el.dispatchEvent(event);
    };

    impressionist().util.makeDomElement = function ( html ) {
        var tempDiv = document.createElement("div");
        tempDiv.innerHTML = html;
        return tempDiv.firstChild;
    };
    
    impressionist().util.loadJavaScript = function ( url, callback ) {
        var script = document.createElement("script");
        script.src = url;
        script.type = "text/javascript";
        script.onreadystatechange = callback;
        script.onload = callback;
        document.head.appendChild(script);
        return script;
    };
    
    impressionist().util.loadCss = function ( url, callback ) {
        var link = document.createElement("link");
        link.href = url;
        link.rel = "stylesheet";
        link.type = "text/css";
        link.onreadystatechange = callback;
        link.onload = callback;
        document.head.appendChild(link);
        return link;
    };
    
})(document, window);
