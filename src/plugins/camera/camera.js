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
    var coordinates = {};
    coordinates["camera"] = {rotate:{x:0,y:0,z:0},translate:{x:0,y:0,z:0,order:"xyz"},scale:1};
    coordinates["step"] = {rotate:{x:0,y:0,z:0},translate:{x:0,y:0,z:0,order:"xyz"},scale:1};
    var cameraWidgets = {};
    var stepWidgets = {};
    var widgetNames = ['x', 'y', 'z', 'scale', 'rotateX', 'rotateY', 'rotateZ', 'order'];
    var activeStep;
    var util = impressionist().util;
    var css3 = impressionist().css3;

    // Generally impress.js & impressionist don't use object oriented JavaScript, but
    // this is definitively sliding in that direction...

    // Helper function to set the right path in coordinates[*], given a name from widgetNames
    var setCoordinate = function( cameraOrStep, name, value ) {
        if ( name.length == 1 ) { // x, y, z
            coordinates[cameraOrStep].translate[name] = value;
        }
        else if ( name == "scale" ) {
            coordinates[cameraOrStep].scale = value;
        }
        else if ( name == "order" ) {
            coordinates[cameraOrStep].rotate.order = value;
        }
        else {
            var xyz = name.substr(-1).toLowerCase();
            coordinates[cameraOrStep].rotate[xyz] = value;
        }
    };
    // Helper function to get the right path in coordinates[*] object, given a name from widgetNames
    var getCoordinate = function( cameraOrStep, name ) {
        if ( name.length == 1 ) { // x, y, z
            return coordinates[cameraOrStep].translate[name];
        }
        else if ( name == "scale" ) {
            return coordinates[cameraOrStep].scale;
        }
        else if ( name == "order" ) {
            return coordinates[cameraOrStep].rotate.order;
        }
        else {
            var xyz = name.substr(-1).toLowerCase();
            return coordinates[cameraOrStep].rotate[xyz];
        }
    };

    // Move canvas (aka the camera) to match the coordinates["camera"]
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

        // compute target state of the canvas based on given step
        var target = {
            rotate: {
                x: -coordinates["camera"].rotate.x,
                y: -coordinates["camera"].rotate.y,
                z: -coordinates["camera"].rotate.z,
                order: coordinates["camera"].rotate.order
            },
            translate: {
                x: -coordinates["camera"].translate.x,
                y: -coordinates["camera"].translate.y,
                z: -coordinates["camera"].translate.z
            },
            scale: 1 / coordinates["camera"].scale
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

    var updateStepPosition = function () {
        // First we want to persist the new coordinates to the dom element of the active step.
        activeStep.setAttribute("data-x", coordinates["step"].translate.x);
        activeStep.setAttribute("data-y", coordinates["step"].translate.y);
        activeStep.setAttribute("data-z", coordinates["step"].translate.z);
        activeStep.setAttribute("data-rotate-x", coordinates["step"].rotate.x);
        activeStep.setAttribute("data-rotate-y", coordinates["step"].rotate.y);
        activeStep.setAttribute("data-rotate-z", coordinates["step"].rotate.z);
        activeStep.setAttribute("data-rotate-order", coordinates["step"].rotate.order);
        activeStep.setAttribute("data-scale", coordinates["step"].scale);

        // Then set the 3D CSS to match. This actually moves the step.
        css3.css(activeStep, {
                 position: "absolute",
                 transform: "translate(-50%,-50%)" +
                             css3.translate(coordinates["step"].translate) +
                             css3.rotate(coordinates["step"].rotate) +
                             css3.scale(coordinates["step"].scale),
                 transformStyle: "preserve-3d"
        });
    };

    // Set event listeners for widgets.x.input/plus/minus widgets.
    var setListeners = function( widgets, name, cameraOrStep ){
        if (name == "order") return; // The last widget is non-numeric, separate listeners set explicitly.

        widgets[name].input.addEventListener( "input", function( event ) {
            setCoordinate( cameraOrStep, name, util.toNumber( event.target.value, name=="scale"?1:0 ) );
            updateCanvasPosition();
            updateStepPosition();
        });
        widgets[name].minus.addEventListener( "click", function( event ) {
            setCoordinate( cameraOrStep, name, Math.round(getCoordinate(cameraOrStep, name)-1) );
            // But scale cannot be < 1
            if( name == "scale" && getCoordinate( name ) < 1 )
                setCoordinate( cameraOrStep, name, 1 );
            updateWidgets();
            updateCanvasPosition();
            updateStepPosition();
        });
        widgets[name].plus.addEventListener( "click", function( event ) {
            setCoordinate( cameraOrStep, name, Math.round(getCoordinate(cameraOrStep, name)+1) );
            updateWidgets();
            updateCanvasPosition();
            updateStepPosition();
        });
    };

    // order widget has its own listeners, as it's not a numeric field
    var setOrderListeners = function( widgets, cameraOrStep ) {
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
            setCoordinate( cameraOrStep, name, value );
            updateCanvasPosition();
            updateStepPosition();
        });
        widgets[name].minus.addEventListener( "click", function( event ) {
            var current = getCoordinate(cameraOrStep, name);
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
            setCoordinate( cameraOrStep, name, value );
            updateWidgets();
            updateCanvasPosition();
            updateStepPosition();
        });
        widgets[name].plus.addEventListener( "click", function( event ) {
            var current = getCoordinate(cameraOrStep, name);
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
            setCoordinate( cameraOrStep, name, value );
            updateWidgets();
            updateCanvasPosition();
            updateStepPosition();
        });
    };

    var createControls = function(cameraOrStep, group, widgets) {
        // Set the text of the tab for this group of widgets
        util.triggerEvent(toolbar, "impressionist:toolbar:groupTitle", { group: group, title: util.capitalize(cameraOrStep) } )

        widgetNames.forEach( function(name){
            var r = name == "rotateX" ? "rotate: " : "";
            var label = name.substr(0,6)=="rotate" ? name.substr(-1).toLowerCase() : name;
            var element = util.makeDomElement( '<span>' + r + label + 
                                          ':<input id="impressionist-' + cameraOrStep + '-' + name + 
                                          '" class="impressionist-' + cameraOrStep + ' impressionist-' + cameraOrStep + '-input" type="text" />' +
                                          '<button id="impressionist-' + cameraOrStep + '-' + name + '-minus" ' +
                                          'class="impressionist-' + cameraOrStep + ' impressionist-' + cameraOrStep + '-minus">-</button>' + 
                                          '<button id="impressionist-' + cameraOrStep + '-' + name + '-plus" ' +
                                          'class="impressionist-' + cameraOrStep + ' impressionist-' + cameraOrStep + '-plus">+</button> </span>' );
            util.triggerEvent(toolbar, "impressionist:toolbar:appendChild", { group : group, element : element } );

            var input = element.firstElementChild;
            var minus = input.nextSibling;
            var plus  = minus.nextSibling;
            widgets[name] = { minus : minus, input : input, plus : plus };
            setListeners( widgets, name, cameraOrStep );
        });
        setOrderListeners( widgets, cameraOrStep );
    };

    // Update the coordinates objects from the currently activeStep.
    // IOW this assumes that the canvas positioning in fact matches the attributes of the activeStep
    // which is at least true for example immediately after impress:stepenter event.
    var getActiveStepCoordinates = function(activeStep) {
        var stepData = activeStep.dataset;
        coordinates["camera"] = {
            rotate: {
                x: util.toNumber(stepData.rotateX),
                y: util.toNumber(stepData.rotateY),
                z: util.toNumber(stepData.rotateZ, util.toNumber(stepData.rotate)),
                order: util.toOrder(stepData.rotateOrder)
            },
            translate: {
                x: util.toNumber(stepData.x),
                y: util.toNumber(stepData.y),
                z: util.toNumber(stepData.z)
            },
            scale: util.toNumber(stepData.scale, 1)
        };

        coordinates["step"] = {
            rotate: {
                x: util.toNumber(stepData.rotateX),
                y: util.toNumber(stepData.rotateY),
                z: util.toNumber(stepData.rotateZ, util.toNumber(stepData.rotate)),
                order: util.toOrder(stepData.rotateOrder)
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
            cameraWidgets[name].input.value = getCoordinate("camera", name);
            stepWidgets[name].input.value = getCoordinate("step", name);
        });
    };

    // API for other plugins to move the camera position ///////////////////////////////////////////
    var gc = impressionist().gc;
    gc.addEventListener(document, "impressionist:camera:setCoordinates", function (event) {
        var moveTo = event.detail;
        widgetNames.forEach( function( name ) {
            if ( moveTo[name] === undefined ) return; // continue, but in JS forEach is a function
            if ( name == "order" ) {
                // TODO: Could do input sanitization here, but for now we actually trust the plugins that will use this so...
                setCoordinate( "camera", name, moveTo[name] );
            }
            else {
                setCoordinate( "camera", name, util.toNumber( moveTo[name], getCoordinate("camera", name) ) );
            }
        });
        updateWidgets();
        updateCanvasPosition();
        updateStepPosition();
    });

    // impressionist and impress.js events ///////////////////////////////////////////////////////

    gc.addEventListener(document, "impressionist:toolbar:init", function (event) {
        toolbar = event.detail.toolbar;

        createControls( "camera", 0, cameraWidgets );
        util.triggerEvent( toolbar, "impressionist:camera:init", { "widgets" : cameraWidgets } );
        createControls( "step", 1, stepWidgets );
        util.triggerEvent( toolbar, "impressionist:stepMove:init", { "widgets" : stepWidgets } );

        activeStep = document.querySelector("#impress .step.active");
        getActiveStepCoordinates(activeStep);
        updateWidgets();
    });

    // If user moves to another step with impress().prev() / .next() or .goto(), then the canvas
    // will be set according to that step. We update our widgets to reflect reality.
    // From here, user can again zoom out or pan away as he prefers.
    gc.addEventListener(document, "impress:stepenter", function (event) {
        activeStep = event.target;
        getActiveStepCoordinates(activeStep);
        updateWidgets();
    });

    // impress.js also resets the css coordinates when a window is resized event. Wait a second,
    // then update widgets to match reality.
    gc.addEventListener(window, "resize", function () {
        window.setTimeout( function(){
            getActiveStepCoordinates(activeStep);
            updateWidgets();
        }, 1000 );
    });
    
})(document, window);

