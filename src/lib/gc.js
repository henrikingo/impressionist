/**
 * Garbage collection utility
 *
 * Impressionist features that add their own elements to the DOM of a presentation, can register
 * those elements with the garbage collector. The garbage collector will then remove them when
 * the document is saved, so that there's no trace of impressionist left in the document.
 *
 * Henrik Ingo (c) 2016
 * MIT License
 */
(function ( document, window ) {
    'use strict';

    var elementList = [];
    var eventListenerList = [];

    if( impressionist().gc === undefined ){
        impressionist().gc = {}
    }

    impressionist().gc.pushElement = function ( element ) {
        elementList.push(element);
    };

    // Convenience wrapper that combines DOM appendChild with gc.pushElement
    impressionist().gc.appendChild = function ( parent, element ) {
        parent.appendChild(element);
        impressionist().gc.pushElement(element);
    };

    impressionist().gc.pushEventListener = function ( target, type, listenerFunction ) {
        eventListenerList.push( {target:target, type:type, listener:listenerFunction} );
    };

    // Convenience wrapper that combines DOM addEventListener with gc.pushEventListener
    impressionist().gc.addEventListener = function ( target, type, listenerFunction ) {
        target.addEventListener( type, listenerFunction );
        impressionist().gc.pushEventListener( target, type, listenerFunction );
    };

    impressionist().gc.removeAll = function () {
        tinymceCssHack();
        for ( var i in elementList ) {
            elementList[i].parentElement.removeChild(elementList[i]);
        }
        elementList = [];
        for ( var i in eventListenerList ) {
            var target   = eventListenerList[i].target;
            var type     = eventListenerList[i].type;
            var listener = eventListenerList[i].listener;
            target.removeEventListener(type, listener);
        }
    };

    // These css are added by tinymce asynchronously, and it doesn't provide a callback
    // api where I could do this when they're added. So we just capture them here, right before
    // we're going to call removeChild() on them.
    var tinymceCssHack = function () {
        var css1 = "skins/lightgray/skin.min.css";
        var css2 = "skins/lightgray/content.inline.min.css";
        var links = document.head.querySelectorAll("link");
        for (var i = 0; i < links.length; i++){
            var l = links[i];
            if( l.href.substring( l.href.length - css1.length ) == css1 || 
                l.href.substring( l.href.length - css2.length ) == css2 ){
                impressionist().gc.pushElement(l);
            }
        }

        var style = document.getElementById("mceDefaultStyles");
        impressionist().gc.pushElement(style);
    };

})(document, window);
