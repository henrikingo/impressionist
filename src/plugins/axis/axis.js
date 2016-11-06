/**
 * Axis plugin
 *
 * Draw x, y and z axis to help user navigate as we move the camera around.
 *
 * Copyright 2016 Henrik Ingo (@henrikingo)
 * Released under the MIT license.
 */
(function ( document, window ) {
    'use strict';
    var root;
    
    var triggerEvent = function (el, eventName, detail) {
        var event = document.createEvent("CustomEvent");
        event.initCustomEvent(eventName, true, true, detail);
        el.dispatchEvent(event);
    };

    var makeDomElement = function ( html ) {
        var tempDiv = document.createElement("div");
        tempDiv.innerHTML = html;
        return tempDiv.firstChild;
    };

    root = document.getElementById("impress");

    // Must set data-x/y/z explicitly to zero for presentations that might use relative positioning
    // Use .skip to omit these steps from navigation, and impress:navigation-ui:hideStep to hide them from the select widget.
    var x = makeDomElement( '<div id="impressionist-axis-x" class="step skip impressionist"'
                            + ' data-x="0" data-y="0" data-z="0"></div>' );
    root.appendChild(x);
    var y = makeDomElement( '<div id="impressionist-axis-y" class="step skip impressionist"'
                            + ' data-x="0" data-y="0" data-z="0" data-rotate-z="90"></div>' );
    root.appendChild(y);
    var z = makeDomElement( '<div id="impressionist-axis-z" class="step skip impressionist"'
                            + ' data-x="0" data-y="0" data-z="0" data-rotate-y="90"></div>' );
    root.appendChild(z);

    // Wait until everyone is initialized before trying to communicate API calls
    document.addEventListener("impressionist:init", function( event ){
        triggerEvent( x, "impress:navigation-ui:hideStep", {} );
        triggerEvent( y, "impress:navigation-ui:hideStep", {} );
        triggerEvent( z, "impress:navigation-ui:hideStep", {} );
    }, false);

})(document, window);

