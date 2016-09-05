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
    document.addEventListener("impress:init", function( event ){
        triggerEvent( x, "impress:navigation-ui:hideStep", {} );
        triggerEvent( y, "impress:navigation-ui:hideStep", {} );
        triggerEvent( z, "impress:navigation-ui:hideStep", {} );
    }, false);

})(document, window);


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


/**
 * Camera-controls plugin
 *
 * Buttons to navigate the camera
 *
 * Copyright 2016 Henrik Ingo (@henrikingo)
 * Released under the MIT license.
 */
(function ( document, window ) {
    'use strict';
    var toolbar;
    var cameraCoordinates;
    var myWidgets = {};

    // Functions for zooming and panning the canvas //////////////////////////////////////////////

    // Create widgets and add them to the impressionist toolbar //////////////////////////////////
    var toNumber = function (numeric, fallback) {
        return isNaN(numeric) ? (fallback || 0) : Number(numeric);
    };

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

    var addCameraControls = function() {
        myWidgets.xy = makeDomElement( '<button id="impressionist-cameracontrols-xy" title="Pan camera left-right, up-down">+</button>' );
        myWidgets.z  = makeDomElement( '<button id="impressionist-cameracontrols-z" title="Zoom in-out = up-down, rotate = left-right">Z</button>' );
        myWidgets.rotateXY = makeDomElement( '<button id="impressionist-cameracontrols-rotate" title="Rotate camera left-right, up-down">O</button>' );

        triggerEvent(toolbar, "impressionist:toolbar:appendChild", { group : 0, element : myWidgets.xy } );
        triggerEvent(toolbar, "impressionist:toolbar:appendChild", { group : 0, element : myWidgets.z } );
        triggerEvent(toolbar, "impressionist:toolbar:appendChild", { group : 0, element : myWidgets.rotateXY } );

        var initDrag = function(event) {
            var drag = {};
            drag.start = {};
            drag.start.x = event.clientX;
            drag.start.y = event.clientY;
            drag.current = {};
            drag.current.x = event.clientX;
            drag.current.y = event.clientY;
            return drag;
        };
        var stopDrag = function() {
            myWidgets.xy.drag = false;
            myWidgets.z.drag = false;
            myWidgets.rotateXY.drag = false;
        };
        
        myWidgets.xy.addEventListener( "mousedown", function( event ) {
            myWidgets.xy.drag = initDrag(event);
            updateCameraCoordinatesFiber(); // start fiber
        });
        myWidgets.z.addEventListener( "mousedown", function( event ) {
            myWidgets.z.drag = initDrag(event);
            updateCameraCoordinatesFiber(); // start fiber
        });
        myWidgets.rotateXY.addEventListener( "mousedown", function( event ) {
            myWidgets.rotateXY.drag = initDrag(event);
            updateCameraCoordinatesFiber(); // start fiber
        });
        
        document.addEventListener( "mouseup", function( event ) {
            stopDrag();
        });
        document.addEventListener( "mouseleave", function( event ) {
            stopDrag();
        });
        
        document.addEventListener( "mousemove", function( event ) {
            if( myWidgets.xy.drag ) {
                myWidgets.xy.drag.current.x = event.clientX;
                myWidgets.xy.drag.current.y = event.clientY;
            }
            if( myWidgets.z.drag ) {
                myWidgets.z.drag.current.x = event.clientX;
                myWidgets.z.drag.current.y = event.clientY;
            }
            if( myWidgets.rotateXY.drag ) {
                myWidgets.rotateXY.drag.current.x = event.clientX;
                myWidgets.rotateXY.drag.current.y = event.clientY;
            }
        });
        
        var updateCameraCoordinatesFiber = function(){
            var diff = { x:0, y:0, z:0, rotateX:0, rotateY:0, rotateZ:0 };
            var isDragging = false;
            if( myWidgets.xy.drag ) {
                diff.x = myWidgets.xy.drag.current.x - myWidgets.xy.drag.start.x;
                diff.y = myWidgets.xy.drag.current.y - myWidgets.xy.drag.start.y;
                isDragging = true;
            }
            if( myWidgets.z.drag ) {
                diff.z = myWidgets.z.drag.current.y - myWidgets.z.drag.start.y;
                diff.rotateZ = myWidgets.z.drag.current.x - myWidgets.z.drag.start.x;
                isDragging = true;
            }
            if( myWidgets.rotateXY.drag ) {
                diff.rotateX = myWidgets.rotateXY.drag.current.y - myWidgets.rotateXY.drag.start.y;
                diff.rotateY = myWidgets.rotateXY.drag.current.x - myWidgets.rotateXY.drag.start.x;
                isDragging = true;
            }

            if( isDragging ) {
                diff = snapToGrid(diff);
                diff = coordinateTransformation(diff);
                var moveTo = {};
                var scale = toNumber(cameraCoordinates.scale.input.value, 1);
                moveTo.x = Number(cameraCoordinates.x.input.value) + diff.x * scale;
                moveTo.y = Number(cameraCoordinates.y.input.value) + diff.y * scale;
                moveTo.z = Number(cameraCoordinates.z.input.value) + diff.z * scale;
                moveTo.scale = Number(cameraCoordinates.scale.input.value) + diff.scale;
                moveTo.rotateX = Number(cameraCoordinates.rotateX.input.value) + diff.rotateX/10;
                moveTo.rotateY = Number(cameraCoordinates.rotateY.input.value) - diff.rotateY/10;
                moveTo.rotateZ = Number(cameraCoordinates.rotateZ.input.value) - diff.rotateZ/10;
                triggerEvent(toolbar, "impressionist:camera:setCoordinates", moveTo );
                setTimeout( updateCameraCoordinatesFiber, 100 );
            }
        };
        
        // Ignore small values in diff values.
        // For example, if the movement is 88 degrees in some direction, this should correct it to 
        // 90 degrees. Helper for updateCameraCoordinatesFiber().
        var snapToGrid = function(diff) {
            // To start, simply ignore any values < 5 pixels.
            // This creates 
            // - a 10x10 px square whithin which there won't be any movement
            // - outside of that, 10 px corridoors in each 90 degree direction, 
            //   within which small deviations from 90 degree angles are ignored.
            for( var k in diff ) {
                diff[k] = Math.abs(diff[k]) > 5 ? diff[k] : 0;
            }
            // For the z widget, attach it to full 90 degrees in the closest direction.
            // This means you can only zoom or rotate, not both at the same time.
            // Once a direction is chosen, lock that until dragStop() event.
            if( myWidgets.z.drag && myWidgets.z.drag.setzero ) {
                diff[myWidgets.z.drag.setzero] = 0;
            }
            else {
                if( Math.abs(diff.z) > Math.abs(diff.rotateZ) ) {
                    diff.rotateZ = 0;
                    myWidgets.z.drag.setzero = "rotateZ";
                }
                else if ( Math.abs(diff.z) < Math.abs(diff.rotateZ) ) {
                    diff.z = 0;
                    myWidgets.z.drag.setzero = "z";
                }
            }
            return diff;
        };
    };
    
    // Wait for camera plugin to initialize first
    
    document.addEventListener("impressionist:camera:init", function (event) {
        cameraCoordinates = event.detail.widgets;
        toolbar = document.getElementById("impressionist-toolbar");
        addCameraControls();
    }, false);



    // 3d coordinate transformations
    //
    // Without this, the controls work, but they will just modify the camera
    // window coordinates directly. If the camera was rotated, this no longer makes
    // sense. For example, setting rotate: z: to 180, would turn everything
    // upside down. Now, if you pull the "+" (xy) control up, you will
    // actually see the camera panning down.
    //
    // It's time for some serious math, so I've hid these here at the end.
    // We want the controls to move the camera relative to the current viewport/camera position,
    // not the origin of the xyz coordinates. These functions modify the diff object so that
    // the movements are according to current viewport.
    
    var coordinateTransformation = function(diff){
        var deg = function(rad) {
          return rad * (180 / Math.PI);
        };

        var rad = function(deg) {
          return deg * (Math.PI / 180);
        };
        
        var newDiff = {};

        var rotateX = toNumber( cameraCoordinates.rotateX.input.value );
        var rotateY = toNumber( cameraCoordinates.rotateY.input.value );
        var rotateZ = toNumber( cameraCoordinates.rotateZ.input.value );

        // Based on http://www.math.tau.ac.il/~dcor/Graphics/cg-slides/geom3d.pdf but omitting the use of matrix calculus.
        // I get quite nauseous by this level of math, so basically the below was done by a combination of
        // cargo culting and trial-and error. If you're a real mathematician and are reading this thinking that there's
        // a shorter and more elegant equivalent form to these formulas, then by all means tell me. (henrik.ingo@avoinelama.fi).
        newDiff.x = diff.x * Math.cos( rad(rotateZ) ) * Math.cos( rad(rotateY) )
                  - diff.y * Math.sin( rad(rotateZ) ) * Math.cos( rad(rotateY) )
                  + diff.z * Math.sin( rad(rotateY) );

        newDiff.y = diff.y * ( Math.cos( rad(rotateZ) ) * Math.cos( rad(rotateX) ) 
                             - Math.sin( rad(rotateX) ) * Math.sin( rad(rotateY) ) * Math.sin( rad(rotateZ) ) )
                  + diff.x * ( Math.sin( rad(rotateZ) ) * Math.cos( rad(rotateX) ) 
                             + Math.sin( rad(rotateY) ) * Math.sin( rad(rotateX) ) * Math.cos( rad(rotateZ) ) )
                  - diff.z *   Math.sin( rad(rotateX) ) * Math.cos( rad(rotateY) );

        newDiff.z = diff.z *   Math.cos( rad(rotateX) ) * Math.cos( rad(rotateY) )
                  + diff.y * ( Math.sin( rad(rotateY) ) * Math.sin( rad(rotateZ) ) * Math.cos( rad(rotateX) )
                             + Math.sin( rad(rotateX) ) * Math.cos( rad(rotateZ) ) )
                  + diff.x * ( Math.sin( rad(rotateZ) ) * Math.sin( rad(rotateX) ) 
                             - Math.sin( rad(rotateY) ) * Math.cos( rad(rotateZ) ) * Math.cos( rad(rotateX) ) );

        newDiff.rotateX = diff.rotateX;
        newDiff.rotateY = diff.rotateY;
        newDiff.rotateZ = diff.rotateZ;
        newDiff.scale = diff.scale;
        return newDiff;
    };
    







    
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

