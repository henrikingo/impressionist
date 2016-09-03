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
    var widgetNames = ['x', 'y', 'z', 'rotateX', 'rotateY', 'rotateZ', 'scale'];
    var activeStep;

    // Functions for zooming and panning the canvas //////////////////////////////////////////////


    // Helper functions to create 3D CSS3 transitions. These are 99% copy pasted from impress.js internals...
    
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

    var computeWindowScale = function ( config ) {
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
    





    // ... from here we have new code/functionality.
    
    // Get user input values and move/scale canvas accordingly
    var updateCanvasPosition = function() {
        var root = document.getElementById("impress");
        var rootData = root.dataset;
        var config = {
                width: toNumber( rootData.width, 1024 ),
                height: toNumber( rootData.height, 768 ),
                maxScale: toNumber( rootData.maxScale, 1 ),
                minScale: toNumber( rootData.minScale, 0 ),
                perspective: toNumber( rootData.perspective, 1000 )
        };
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

        var windowScale = computeWindowScale(config);
        var targetScale = target.scale * windowScale;

        css(root, {
            // to keep the perspective look similar for different scales
            // we need to 'scale' the perspective, too
            transform: perspective( config.perspective / targetScale ) + scale( targetScale ),
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

    // Helper function to set the right path in `coordinates` object, given a name from widgetNames
    var setCoordinate = function( name, value ) {
        if ( name.length == 1 ) { // x, y, z
            coordinates.translate[name] = value;
        }
        else if ( name == "scale" ) {
            coordinates.scale = value;
        }
        else {
            var xyz = name.substr(-1).toLowerCase();
            coordinates.rotate[xyz] = value;
        }
    };
    // Helper function to get the right path in `coordinates` object, given a name from widgetNames
    var getCoordinate = function( name ) {
        if ( name.length == 1 ) { // x, y, z
            return coordinates.translate[name];
        }
        else if ( name == "scale" ) {
            return coordinates.scale;
        }
        else {
            var xyz = name.substr(-1).toLowerCase();
            return coordinates.rotate[xyz];
        }
    };

    // Set event listeners for widgets.x.input/plus/minus widgets.
    var setListeners = function( widgets, name ){
        widgets[name].input.addEventListener( "input", function( event ) {
            setCoordinate( name, toNumber( event.target.value, name=="scale"?1:0 ) );
            updateCanvasPosition();
        });
        widgets[name].minus.addEventListener( "click", function( event ) {
            setCoordinate( name, Math.round(getCoordinate(name)-1) );
            // But scale cannot be < 1
            if( name == "scale" && getCoordinate( name ) < 1 )
                setCoordinate( name, 1 );
            updateWidgets();
            updateCanvasPosition();
        });
        widgets[name].plus.addEventListener( "click", function( event ) {
            setCoordinate( name, Math.round(getCoordinate(name)+1) );
            updateWidgets();
            updateCanvasPosition();
        });
    };

    var addCameraControls = function() {
        widgetNames.forEach( function(name){
            var r = name == "rotateX" ? "rotate: " : "";
            var label = name.substr(0,6)=="rotate" ? name.substr(-1).toLowerCase() : name;
            var element = makeDomElement( '<span>' + r + label + 
                                          ':<input id="impressionist-camera-' + name + 
                                          '" class="impressionist-camera impressionist-camera-input" type="text" />' +
                                          '<button id="impressionist-camera-' + name + '-minus" ' +
                                          'class="impressionist-camera impressionist-camera-minus">-</button>' + 
                                          '<button id="impressionist-camera-' + name + '-plus" ' +
                                          'class="impressionist-camera impressionist-camera-plus">+</button> </span>' );
            triggerEvent(toolbar, "impressionist:toolbar:appendChild", { group : 0, element : element } );
            
            var input = element.firstElementChild;
            var minus = input.nextSibling;
            var plus  = minus.nextSibling;
            widgets[name] = { minus : minus, input : input, plus : plus };
            setListeners( widgets, name );
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
        widgetNames.forEach( function( name ) {
            widgets[name].input.value = getCoordinate(name);
        });
    };

    // API for other plugins to move the camera position ///////////////////////////////////////////
    
    document.addEventListener("impressionist:camera:setCoordinates", function (event) {
        var moveTo = event.detail;
        widgetNames.forEach( function( name ) {
            setCoordinate( name, toNumber( moveTo[name], getCoordinate(name) ) );
        });
        updateWidgets();
        updateCanvasPosition();
    }, false);

    // impress.js events ///////////////////////////////////////////////////////////////////////////
    
    document.addEventListener("impress:init", function (event) {
        toolbar = document.getElementById("impressionist-toolbar");
        addCameraControls( event );
        triggerEvent( toolbar, "impressionist:camera:init", { "widgets" : widgets } );
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

