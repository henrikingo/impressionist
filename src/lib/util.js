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

    impressionist().util.toNumber = function (numeric, fallback) {
        return isNaN(numeric) ? (fallback || 0) : Number(numeric);
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
    };
    
})(document, window);
