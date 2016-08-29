/**
 * Camera plugin
 *
 * The camera allows to navigate and view your presentation from an arbitrary angle and scaling.
 *
 * Copyright 2016 Henrik Ingo (@henrikingo)
 * Released under the MIT license.
 */
(function ( document, window ) {
    'use strict';
    var toolbar;
    var coordinates = {rotate:{x:0,y:0,z:0},translate:{x:0,y:0,z:0},scale:1};
    var widgets = {};
    var activeStep;

    // Functions for zooming and panning the canvas //////////////////////////////////////////////

    var toNumber = function (numeric, fallback) {
        return isNaN(numeric) ? (fallback || 0) : Number(numeric);
    };

    // `translate` builds a translate transform string for given data.
    var translate = function ( t ) {
        return " translate3d(" + t.x + "px," + t.y + "px," + t.z + "px) ";
    };
    
    // `rotate` builds a rotate transform string for given data.
    // By default the rotations are in X Y Z order that can be reverted by passing `true`
    // as second parameter.
    var rotate = function ( r, revert ) {
        var rX = " rotateX(" + r.x + "deg) ",
            rY = " rotateY(" + r.y + "deg) ",
            rZ = " rotateZ(" + r.z + "deg) ";
        
        return revert ? rZ+rY+rX : rX+rY+rZ;
    };
    
    // `scale` builds a scale transform string for given data.
    var scale = function ( s ) {
        return " scale(" + s + ") ";
    };

    // `perspective` builds a perspective transform string for given data.
    var perspective = function ( p ) {
        return " perspective(" + p + "px) ";
    };

    // `css` function applies the styles given in `props` object to the element
    // given as `el`. It runs all property names through `pfx` function to make
    // sure proper prefixed version of the property is used.
    var css = function ( el, props ) {
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
    
    // Get user input values and move/scale canvas accordingly
    var updateCanvasPosition = function() {
        var root = document.getElementById("impress");
        var config = { perspective : toNumber( root.dataset.perspective, 1000 ) };
        var canvas = root.firstChild;
        var activeStep = document.querySelector("div#impress div.step.active");
        var stepData = activeStep.dataset;

        // compute target state of the canvas based on given step
        var target = {
            rotate: {
                x: -coordinates.rotate.x,
                y: -coordinates.rotate.y,
                z: -coordinates.rotate.z
            },
            translate: {
                x: -coordinates.translate.x,
                y: -coordinates.translate.y,
                z: -coordinates.translate.z
            },
            scale: 1 / coordinates.scale
        };
        css(root, {
            // to keep the perspective look similar for different scales
            // we need to 'scale' the perspective, too
            transform: perspective( config.perspective / target.scale ) + scale( target.scale ),
            transitionDuration: "0ms",
            transitionDelay: "0ms"
        });
        
        css(canvas, {
            transform: rotate(target.rotate, true) + translate(target.translate),
            transitionDuration: "0ms",
            transitionDelay: "0ms"
        });
    };


    // Create widgets and add them to the impressionist toolbar //////////////////////////////////
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

    var addNavigationControls = function() {
        var x = makeDomElement( '<span>x: <input id="impressionist-zoom-x" type="text" /> </span>' );
        var y = makeDomElement( '<span>y: <input id="impressionist-zoom-y" type="text" /> </span>' );
        var z = makeDomElement( '<span>z: <input id="impressionist-zoom-z" type="text" /> </span>' );
        var scale = makeDomElement( '<span>scale: <input id="impressionist-zoom-scale" type="text" /> </span>' );
        var rotateX = makeDomElement( '<span>rotate-x: <input id="impressionist-zoom-rotate-x" type="text" /> </span>' );
        var rotateY = makeDomElement( '<span>rotate-y: <input id="impressionist-zoom-rotate-y" type="text" /> </span>' );
        var rotateZ = makeDomElement( '<span>rotate-z: <input id="impressionist-zoom-rotate-z" type="text" /> </span>' );

        triggerEvent(toolbar, "impressionist:toolbar:appendChild", { group : 0, element : x } );
        triggerEvent(toolbar, "impressionist:toolbar:appendChild", { group : 0, element : y } );
        triggerEvent(toolbar, "impressionist:toolbar:appendChild", { group : 0, element : z } );
        triggerEvent(toolbar, "impressionist:toolbar:appendChild", { group : 0, element : scale } );
        triggerEvent(toolbar, "impressionist:toolbar:appendChild", { group : 0, element : rotateX } );
        triggerEvent(toolbar, "impressionist:toolbar:appendChild", { group : 0, element : rotateY } );
        triggerEvent(toolbar, "impressionist:toolbar:appendChild", { group : 0, element : rotateZ } );

        widgets.x = x.firstElementChild;
        widgets.y = y.firstElementChild;
        widgets.z = z.firstElementChild;
        widgets.scale = scale.firstElementChild;
        widgets.rotateX = rotateX.firstElementChild;
        widgets.rotateY = rotateY.firstElementChild;
        widgets.rotateZ = rotateZ.firstElementChild;
        
        widgets.x.addEventListener( "input", function( event ) {
            coordinates.translate.x = toNumber( event.target.value);
            updateCanvasPosition();
        });
        widgets.y.addEventListener( "input", function( event ) {
            coordinates.translate.y = toNumber( event.target.value);
            updateCanvasPosition();
        });
        widgets.z.addEventListener( "input", function( event ) {
            coordinates.translate.z = toNumber( event.target.value);
            updateCanvasPosition();
        });
        widgets.scale.addEventListener( "input", function( event ) {
            coordinates.scale = toNumber( event.target.value, 1);
            updateCanvasPosition();
        });
        widgets.rotateX.addEventListener( "input", function( event ) {
            coordinates.rotate.x = toNumber( event.target.value);
            updateCanvasPosition();
        });
        widgets.rotateY.addEventListener( "input", function( event ) {
            coordinates.rotate.y = toNumber( event.target.value);
            updateCanvasPosition();
        });
        widgets.rotateZ.addEventListener( "input", function( event ) {
            coordinates.rotate.z = toNumber( event.target.value);
            updateCanvasPosition();
        });
    };
    
    // Update the coordinates object from the currently activeStep.
    // IOW this assumes that the canvas positioning in fact matches the attributes of the activeStep,
    // which is at least true for example immediately after impress:stepenter event.
    var getActiveStepCoordinates = function(activeStep) {
        var stepData = activeStep.dataset;
        coordinates = {
            rotate: {
                x: toNumber(stepData.rotateX),
                y: toNumber(stepData.rotateY),
                z: toNumber(stepData.rotateZ, toNumber(stepData.rotate))
            },
            translate: {
                x: toNumber(stepData.x),
                y: toNumber(stepData.y),
                z: toNumber(stepData.z)
            },
            scale: toNumber(stepData.scale, 1)
        };
    };

    var updateWidgets = function() {
        widgets.x.value = coordinates.translate.x;
        widgets.y.value = coordinates.translate.y;
        widgets.z.value = coordinates.translate.z;
        widgets.scale.value = coordinates.scale;
        widgets.rotateX.value = coordinates.rotate.x;
        widgets.rotateY.value = coordinates.rotate.y;
        widgets.rotateZ.value = coordinates.rotate.z;
    };

    // impress.js events ///////////////////////////////////////////////////////////////////////////
    
    document.addEventListener("impress:init", function (event) {
        toolbar = document.getElementById("impressionist-toolbar");
        addNavigationControls( event );
    }, false);
    
    // If user moves to another step with impress().prev() / .next() or .goto(), then the canvas
    // will be set according to that step. We update our widgets to reflect reality.
    // From here, user can again zoom out or pan away as he prefers.
    document.addEventListener("impress:stepenter", function (event) {
        activeStep = event.target;
        getActiveStepCoordinates(activeStep);
        updateWidgets();
    }, false);

    // impress.js also resets the css coordinates when a window is resized event. Wait a second,
    // then update widgets to match reality.
    window.addEventListener("resize", function () {
        window.setTimeout( function(){
            getActiveStepCoordinates(activeStep);
            updateWidgets();
        }, 1000 );
    }, false);
    
})(document, window);


/**
 * Impressionist toolbar
 *
 * Copyright 2016 Henrik Ingo (@henrikingo)
 * Released under the MIT license.
 */
(function ( document, window ) {
    'use strict';
    // Add the impressionist toolbar to the document.
    // Note, this is the opposite of the impress.js toolbar: We don't look for a div in the document,
    // we add this toolbar without asking permission. Assumption is that since you're using impressionist, you want this.
    var toolbar = document.createElement("DIV");
    toolbar.id = "impressionist-toolbar";
    document.body.appendChild(toolbar);
    var groups = [];

    /**
     * Get the span element that is a child of toolbar, identified by index.
     *
     * If span element doesn't exist yet, it is created.
     *
     * Note: Because of Run-to-completion, this is not a race condition.
     * https://developer.mozilla.org/en/docs/Web/JavaScript/EventLoop#Run-to-completion
     *
     * :param: index   Method will return the element <span id="impress-toolbar-group-{index}">
     */
    var getGroupElement = function(index){
        var id = "impressionist-toolbar-group-" + index;
        if(!groups[index]){
            groups[index] = document.createElement("span");
            groups[index].id = id;
            var nextIndex = getNextGroupIndex(index);
            if ( nextIndex === undefined ){
                toolbar.appendChild(groups[index]);
            }
            else{
                toolbar.insertBefore(groups[index], groups[nextIndex]);
            }
        }
        return groups[index];
    };
    
    /**
     * Get the span element from groups[] that is immediately after given index.
     *
     * This can be used to find the reference node for an insertBefore() call.
     * If no element exists at a larger index, returns undefined. (In this case,
     * you'd use appendChild() instead.)
     *
     * Note that index needn't itself exist in groups[].
     */
    var getNextGroupIndex = function(index){
        var i = index+1;
        while( ! groups[i] && i < groups.length) {
            i++;
        }
        if( i < groups.length ){
            return i;
        }
    };

    // API
    // Other plugins can add and remove buttons by sending them as events.
    // In return, toolbar plugin will trigger events when button was added.
    /**
     * Append a widget inside toolbar span element identified by given group index.
     *
     * :param: e.detail.group    integer specifying the span element where widget will be placed
     * :param: e.detail.element  a dom element to add to the toolbar
     */
    toolbar.addEventListener("impressionist:toolbar:appendChild", function( e ){
        var group = getGroupElement(e.detail.group);
        group.appendChild(e.detail.element);
    });

    /**
     * Add a widget to toolbar using insertBefore() DOM method.
     *
     * :param: e.detail.before   the reference dom element, before which new element is added
     * :param: e.detail.element  a dom element to add to the toolbar
     */
    toolbar.addEventListener("impressionist:toolbar:insertBefore", function( e ){
        toolbar.insertBefore(e.detail.element, e.detail.before);
    });

    /**
     * Remove the widget in e.detail.remove.
     */
    toolbar.addEventListener("impressionist:toolbar:removeWidget", function( e ){
        toolbar.removeChild(e.detail.remove);
    });

})(document, window);

