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
    var coordinates = {rotate:{x:0,y:0,z:0},translate:{x:0,y:0,z:0,order:"xyz"},scale:1};
    var widgets = {};
    var widgetNames = ['x', 'y', 'z', 'scale', 'rotateX', 'rotateY', 'rotateZ', 'order'];
    var activeStep;
    var util = impressionist().util;
    var css3 = impressionist().util;

    // Functions for zooming and panning the canvas //////////////////////////////////////////////


    // Get user input values and move/scale canvas accordingly
    var updateCanvasPosition = function() {
        var root = document.getElementById("impress");
        var rootData = root.dataset;
        var config = {
                width: util.toNumber( rootData.width, 1024 ),
                height: util.toNumber( rootData.height, 768 ),
                maxScale: util.toNumber( rootData.maxScale, 1 ),
                minScale: util.toNumber( rootData.minScale, 0 ),
                perspective: util.toNumber( rootData.perspective, 1000 )
        };
        var canvas = root.firstChild;
        var activeStep = document.querySelector("div#impress div.step.active");
        var stepData = activeStep.dataset;

        // compute target state of the canvas based on given step
        var target = {
            rotate: {
                x: -coordinates.rotate.x,
                y: -coordinates.rotate.y,
                z: -coordinates.rotate.z,
                order: coordinates.rotate.order
            },
            translate: {
                x: -coordinates.translate.x,
                y: -coordinates.translate.y,
                z: -coordinates.translate.z
            },
            scale: 1 / coordinates.scale
        };

        var windowScale = css3.computeWindowScale(config);
        var targetScale = target.scale * windowScale;

        css3.css(root, {
            // to keep the perspective look similar for different scales
            // we need to 'scale' the perspective, too
            transform: css3.perspective( config.perspective / targetScale ) + css3.scale( targetScale ),
            transitionDuration: "0ms",
            transitionDelay: "0ms"
        });
        css3.css(canvas, {
            transform: css3.rotate(target.rotate, true) + css3.translate(target.translate),
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

    // Helper function to set the right path in `coordinates` object, given a name from widgetNames
    var setCoordinate = function( name, value ) {
        if ( name.length == 1 ) { // x, y, z
            coordinates.translate[name] = value;
        }
        else if ( name == "scale" ) {
            coordinates.scale = value;
        }
        else if ( name == "order" ) {
            coordinates.rotate.order = value;
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
        else if ( name == "order" ) {
            return coordinates.rotate.order;
        }
        else {
            var xyz = name.substr(-1).toLowerCase();
            return coordinates.rotate[xyz];
        }
    };

    // Set event listeners for widgets.x.input/plus/minus widgets.
    var setListeners = function( widgets, name ){
        if (name == "order") return; // The last widget is non-numeric, separate listeners set explicitly.

        widgets[name].input.addEventListener( "input", function( event ) {
            setCoordinate( name, util.toNumber( event.target.value, name=="scale"?1:0 ) );
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
            var element = util.makeDomElement( '<span>' + r + label + 
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
        // order widget has its own listeners, as it's not a numeric field
        var name = "order";
        widgets[name].input.addEventListener( "input", function( event ) {
            var v = event.target.value.toString().toLowerCase();
            var value = "";
            for (var i = 0; i < Math.min(v.length, 3); i++){
                if( v[i] != "x" && v[i] != "y" && v[i] != "z" ){
                    continue;
                }
                value += v[i];
            }
            event.target.value = value;
            setCoordinate( name, value );
            updateCanvasPosition();
        });
        widgets[name].minus.addEventListener( "click", function( event ) {
            var current = getCoordinate(name);
            var value = "";
            if( current.length < 3 ) {
                var available = "xyz";
                for( var i=0; i < current.length; i++ ) {
                    // Remove the letters already in the text field from available
                    available = available.split(current[i]).join("");
                }
                value = current + available[0];
            }
            else {
                // shift the order string so that 1st letter becomes last, second first, third second.
                value = current[1] + current[2] + current[0];
            }
            setCoordinate( name, value );
            updateWidgets();
            updateCanvasPosition();
        });
        widgets[name].plus.addEventListener( "click", function( event ) {
            var current = getCoordinate(name);
            var value = "";
            if( current.length < 3 ) {
                var available = "xyz";
                for( var i=0; i < current.length; i++ ) {
                    // Remove the letters already in the text field from available
                    available = available.split(current[i]).join("");
                }
                value = available[0] + current;
            }
            else {
                // shift the order string so that 1st letter becomes last, second first, third second.
                value =  current[2] + current[0] + current[1];
            }
            setCoordinate( name, value );
            updateWidgets();
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
                x: util.toNumber(stepData.rotateX),
                y: util.toNumber(stepData.rotateY),
                z: util.toNumber(stepData.rotateZ, util.toNumber(stepData.rotate)),
                order: "xyz" // TODO: Not supported in impress.js yet, so all existing steps have this order for now
            },
            translate: {
                x: util.toNumber(stepData.x),
                y: util.toNumber(stepData.y),
                z: util.toNumber(stepData.z)
            },
            scale: util.toNumber(stepData.scale, 1)
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
            if ( moveTo[name] === undefined ) return; // continue, but in JS forEach is a function
            if ( name == "order" ) {
                // TODO: Could do input sanitization here, but for now we actually trust the plugins that will use this so...
                setCoordinate( name, moveTo[name] );
            }
            else {
                setCoordinate( name, util.toNumber( moveTo[name], getCoordinate(name) ) );
            }
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

