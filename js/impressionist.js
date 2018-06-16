/**
 * Impressionist.js - A visual editor for impress.js
 *
 * This is the main JS file for the browser / renderer process side of Impressionist. By running
 * `node build.js` this is concatenated with all the `src/plugins/*` into `js/impressionist.js`,
 * which is the file actually used in a browser / Electron renderer process.
 *
 * This file simply exposes a global function `impressionist()`, which returns an object that is
 * the impressionist api. This is exactly analogous to how `impress()` returns the impress api.
 *
 * Currently this file doesn't include any core functionality or interesting api. The only
 * functions you can actually call in the api are common utility functions like 
 * `impressionist().util.toNumber()`.
 *
 * Henrik Ingo (c) 2016
 * MIT License
 */
(function ( document, window ) {
    'use strict';
    
    // Populated by separate library plugins, see src/lib/*
    var impressionistApi = {};

    window.impressionist = function(){
        return impressionistApi;
    };

})(document, window);

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
    var id = Math.random();

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
        
        var mceElements = document.querySelectorAll(".mce-content-body")
        for ( var i = 0; i < mceElements.length; i++ ) {
            mceElements[i].classList.remove("mce-content-body");
            mceElements[i].classList.remove("mce-edit-focus");
            mceElements[i].removeAttribute("contenteditable");
            mceElements[i].removeAttribute("spellcheck");
        }
        var mceElements = document.querySelectorAll("br")
        for ( var i = 0; i < mceElements.length; i++ ) {
            if ( mceElements[i].getAttribute("data-mce-bogus") == "1" ) {
                mceElements[i].parentElement.removeChild(mceElements[i]);
            }
        }
        var mceElements = document.querySelectorAll(".mce-widget")
        for ( var i = 0; i < mceElements.length; i++ ) {
            mceElements[i].parentElement.removeChild(mceElements[i]);
        }
        var mceElements = document.querySelectorAll(".mce-container")
        for ( var i = 0; i < mceElements.length; i++ ) {
            mceElements[i].parentElement.removeChild(mceElements[i]);
        }
        document.body.removeAttribute("spellcheck");

        var style = document.getElementById("mceDefaultStyles");
        impressionist().gc.pushElement(style);
    };

})(document, window);

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
        // Set the named coordinate for both, if the lock widget is checked, otherwise only for cameraOrStep
        // By default, just update the one supplied
        var todo = [cameraOrStep];
        if (cameraStepLocked()) {
            // If lock is checked, update both
            todo = ["camera", "step"];
        };

        for (var i=0; i < todo.length; i++) {
            if ( name.length == 1 ) { // x, y, z
                coordinates[todo[i]].translate[name] = value;
            }
            else if ( name == "scale" ) {
                coordinates[todo[i]].scale = value;
            }
            else if ( name == "order" ) {
                coordinates[todo[i]].rotate.order = value;
            }
            else {
                var xyz = name.substr(-1).toLowerCase();
                coordinates[todo[i]].rotate[xyz] = value;
            }
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
    var updateCanvasPosition = function(transitionDuration, oldScale) {
        var duration = transitionDuration || 0;
        var delay = (duration / 2);

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
        var zoomin = target.scale >= oldScale; // Copied from impress.js, elaborate commentary over there.

        css3.css(root, {
            // to keep the perspective look similar for different scales
            // we need to 'scale' the perspective, too
            transform: css3.perspective( config.perspective / targetScale ) + css3.scale( targetScale ),
            transitionDuration: duration + "ms",
            transitionDelay: (zoomin ? delay : 0) + "ms"
        });
        css3.css(canvas, {
            transform: css3.rotate(target.rotate, true) + css3.translate(target.translate),
            transitionDuration: duration + "ms",
            transitionDelay: (zoomin ? 0 : delay) + "ms"
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
            if( name == "scale" && getCoordinate( cameraOrStep, name ) < 1 )
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

    // The lock listener does 2 things
    // 1. Force the checkboxes on the camera and step tab to be in sync. If one is checked, the other is too.
    // 2. Update widgets on Camera tab to match the coordinates of the current step
    var setLockListener = function( widgets, cameraOrStep ) {
        widgets["lock"].input.addEventListener( "click", function( event ) {
            // Sync both checkboxes to the value that was set with this click
            var value = event.target.checked;
            cameraWidgets["lock"].input.checked = value;
            stepWidgets["lock"].input.checked = value;
            // Update widgets with values from current step
            if ( value == true ) {
                activeStep = document.querySelector("#impress .step.active");
                // Need to save the old scale value to be used for a nice zoom delay.
                // (As impress.js does. Most of camera.js moves around with controls, but here we
                // want to animate the transition so that user doesn't suddenly jump to a weird place.)
                var oldScale = getCoordinate( "camera", "scale" );
                getActiveStepCoordinates(activeStep);
                updateWidgets();
                updateCanvasPosition(1000, oldScale);
            }
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

        // Add a checkbox to control whether the + O Z cameracontrols will control camera, step or both
        var span = util.makeDomElement( '<span class="nocut">lock:' +
                                        '<input type="checkbox" id="impressionist-' + cameraOrStep + '-cameracontrols" ' +
                                        'title="Lock Step coordinates to Camera?" />' +
                                        '</span>' );
        util.triggerEvent(toolbar, "impressionist:toolbar:appendChild", { group: group, element: span });
        widgets["lock"] = { input : span.firstElementChild };
        setLockListener( widgets, cameraOrStep );
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

    // Get active toolbar tab between "camera" and "step". If neither "camera" or "step" is active, return "camera"
    var getActiveTab = function() {
        var selectedTab = document.querySelector("#impressionist-toolbar-titles button.selected");
        if (selectedTab.innerHTML == "Step") {
            return "step";
        }
        return "camera";
    };

    // Returns true if the lock checkbox is checked, otherwise false
    var cameraStepLocked = function() {
        // cameraWidgets["lock"] and stepWidgets["lock"] are always in sync, doesn't matter which one we check
        if (cameraWidgets["lock"].input.checked) {
            return true;
        }
        else {
            return false;
        }
    };

    // API for other plugins to move the camera position ///////////////////////////////////////////
    var gc = impressionist().gc;
    gc.addEventListener(document, "impressionist:camera:setCoordinates", function (event) {
        var moveTo = event.detail;
        var activeTab = getActiveTab();
        widgetNames.forEach( function( name ) {
            if ( moveTo[name] === undefined ) return; // continue, but in JS forEach is a function
            if ( name == "order" ) {
                setCoordinate( activeTab, name, util.toOrder(moveTo[name], getCoordinate("camera", name) ) );
            }
            else {
                setCoordinate( activeTab, name, util.toNumber( moveTo[name], getCoordinate("camera", name) ) );
            }
        });
        updateWidgets();
        updateCanvasPosition();
        updateStepPosition();
    });

    // impressionist and impress.js events ///////////////////////////////////////////////////////

    gc.addEventListener(document, "impressionist:toolbar:init", function (event) {
        toolbar = event.detail.toolbar;

        createControls( "camera", 1, cameraWidgets );
        util.triggerEvent( toolbar, "impressionist:camera:init", { "widgets" : cameraWidgets } );
        createControls( "step", 2, stepWidgets );
        util.triggerEvent( toolbar, "impressionist:stepmove:init", { "widgets" : stepWidgets } );

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
    var cameraControls;
    var coordWidgets = {};
    var myWidgets = {};
    var rotationAxisLock = {x:false, y:false, z:false};
    var util = impressionist().util;
    var gc = impressionist().gc;

    // Functions for zooming and panning the canvas //////////////////////////////////////////////

    // Create widgets and add them to the cameracontrols div //////////////////////////////////
    var round = function(coord) {
        var keys = ["x", "y", "z", "rotateX", "rotateY", "rotateZ"];
        for (var i in keys ) {
            coord[keys[i]] = Math.round( coord[ keys[i] ] );
        }
        return coord;
    };

    // Get "camera" or "step" depending on which is the active tab.
    // If neither is active, return the first tab ("camera").
    var getActiveTab = function() {
        var selectedTab = document.querySelector("#impressionist-toolbar-titles button.selected");
        if (selectedTab.innerHTML.toLowerCase() == "step") {
            return "step";
        }
        return "camera";
    };
    // Return an order to use, depending on which of camera or step tab is active
    var getActiveOrder = function() {
        var activeTab = getActiveTab();
        if (activeTab) {
            return coordWidgets[activeTab]["order"].input.value;
        }
        return coordWidgets["camera"]["order"].input.value;
    };

    // This function actually creates and adds the controls
    var addCameraControls = function() {
        myWidgets.xy = util.makeDomElement( '<button id="impressionist-cameracontrols-xy" title="Pan camera left-right, up-down">+</button>' );
        myWidgets.z  = util.makeDomElement( '<button id="impressionist-cameracontrols-z" title="Zoom in-out = up-down, rotate = left-right">Z</button>' );
        myWidgets.rotateXY = util.makeDomElement( '<button id="impressionist-cameracontrols-rotate" title="Rotate camera left-right, up-down">O</button>' );

        cameraControls = util.makeDomElement( '<div id="impressionist-cameracontrols"></div>' );
        cameraControls.appendChild(myWidgets.xy);
        cameraControls.appendChild(myWidgets.z);
        cameraControls.appendChild(myWidgets.rotateXY);
        gc.appendChild(document.body, cameraControls);

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
        
        gc.addEventListener( document, "mouseup", function( event ) {
            stopDrag();
        });
        gc.addEventListener( document, "mouseleave", function( event ) {
            stopDrag();
        });
        
        gc.addEventListener( document, "mousemove", function( event ) {
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
            var activeWidgets = coordWidgets[getActiveTab()];

            // Now we're all set to calculate the actual diff caused by dragging one of the controls
            var diff = { x:0, y:0, z:0, rotateX:0, rotateY:0, rotateZ:0 };
            diff.order = getActiveOrder();
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
                var scale = util.toNumber(activeWidgets.scale.input.value, 1);
                moveTo.x = Number(activeWidgets.x.input.value) + diff.x * scale;
                moveTo.y = Number(activeWidgets.y.input.value) + diff.y * scale;
                moveTo.z = Number(activeWidgets.z.input.value) + diff.z * scale;
                moveTo.scale = scale + util.toNumber(diff.scale);
                moveTo.rotateX = Number(activeWidgets.rotateX.input.value) - diff.rotateX/10;
                moveTo.rotateY = Number(activeWidgets.rotateY.input.value) + diff.rotateY/10;
                moveTo.rotateZ = Number(activeWidgets.rotateZ.input.value) - diff.rotateZ/10;
                moveTo.order = diff.order; // Order is not a diff, just set the new value
                moveTo = round(moveTo);
                util.triggerEvent(document, "impressionist:camera:setCoordinates", moveTo );
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
                if ( k == "order" ) continue;
                diff[k] = Math.abs(diff[k]) > 5 ? diff[k] : 0;
            }
            // For the z and o widgets, attach to full 90 degrees in the closest direction.
            // This means you can only zoom or rotate in one direction, not both at the same time.
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
            if( myWidgets.rotateXY.drag && myWidgets.rotateXY.drag.setzero ) {
                diff[myWidgets.rotateXY.drag.setzero] = 0;
            }
            else {
                if( Math.abs(diff.rotateX) > Math.abs(diff.rotateY) ) {
                    diff.rotateY = 0;
                    myWidgets.rotateXY.drag.setzero = "rotateY";
                }
                else if ( Math.abs(diff.rotateX) < Math.abs(diff.rotateY) ) {
                    diff.rotateX = 0;
                    myWidgets.rotateXY.drag.setzero = "rotateX";
                }
            }
            return diff;
        };
    };
    
    // Reset rotationAxisLock when entering a new step, or when order field was manually edited
    var resetRotationAxisLock = function () {
        rotationAxisLock = {x:false, y:false, z:false};
    };
    
    // Reset rotationAxisLock whenever entering a new step
    gc.addEventListener(document, "impress:stepenter", function (event) {
        resetRotationAxisLock();
    });
    
    // Wait for camera plugin to initialize first
    
    gc.addEventListener(document, "impressionist:camera:init", function (event) {
        coordWidgets["camera"] = event.detail.widgets;
        // Reset rotationAxisLock if the order field was manually edited
        coordWidgets["camera"].order.input.addEventListener("input", function (event) {
            resetRotationAxisLock();
        });
        coordWidgets["camera"].order.plus.addEventListener("click", function (event) {
            resetRotationAxisLock();
        });
        coordWidgets["camera"].order.minus.addEventListener("click", function (event) {
            resetRotationAxisLock();
        });

        addCameraControls();
        impressionist().util.triggerEvent( cameraControls, "impressionist:cameracontrols:init" );
    });

    gc.addEventListener(document, "impressionist:stepmove:init", function (event) {
        coordWidgets["step"] = event.detail.widgets;
        // Reset rotationAxisLock if the order field was manually edited
        coordWidgets["step"].order.input.addEventListener("input", function (event) {
            resetRotationAxisLock();
        });
        coordWidgets["step"].order.plus.addEventListener("click", function (event) {
            resetRotationAxisLock();
        });
        coordWidgets["step"].order.minus.addEventListener("click", function (event) {
            resetRotationAxisLock();
        });
    });

    // 3d coordinate transformations
    //
    // Without this, the controls work, but they will just modify the camera
    // coordinates directly. If the camera was rotated, this no longer makes
    // sense. For example, setting rotate: z: to 180, would turn everything
    // upside down. Now, if you pull the "+" (xy) control up, you will
    // actually see the camera panning down.
    //
    // We want the controls to move the camera relative to the current viewport/camera position,
    // not the origin of the xyz coordinates. These functions modify the diff object so that
    // the movements are according to current viewport.
    //
    // For the x/y/z translations, we simply modify the diff vector to account for all the possible
    // rotations that might be in place. 
    //
    // Based on http://www.math.tau.ac.il/~dcor/Graphics/cg-slides/geom3d.pdf 
    // and https://24ways.org/2010/intro-to-css-3d-transforms/
    //
    // For adjusting rotations, a different strategy is needed.
    // It turns out that for rotations order matters, and whatever is the first rotation, will
    // just work without modification. For the following ones, we could try some sin()*cos()
    // multiplication magic, but in some edge cases (in particular, rotateY(90) with the default
    // order=xyz) two axes can collapse into one, so we lose a dimension and no amount of sin()*cos()
    // is able to do anything about that. So instead with rotations the strategy is just to move
    // the axis currently being rotated to be last. This is trivial if the current rotation around
    // that axis is 0. If it is non-zero, we can not do anything, but leave the order as it is
    // and just rotate anyway. This can often look odd to the user. Sorry.
    var coordinateTransformation = function(diff){
        var deg = function(rad) {
          return rad * (180 / Math.PI);
        };

        var rad = function(deg) {
          return deg * (Math.PI / 180);
        };
        
        var newDiff = {};

        var xyz = diff.order; // Note: This is the old value, not a diff. The only place to change it is this method.
        
        var cameraWidgets = coordWidgets["camera"];
        var angle = {
            x: util.toNumber(cameraWidgets.rotateX.input.value),
            y: util.toNumber(cameraWidgets.rotateY.input.value),
            z: util.toNumber(cameraWidgets.rotateZ.input.value)
        };

        var computeRotate = {
            x: function(angle, v){
                var vv = [];
                vv[0] = v[0];
                vv[1] = v[1] * Math.cos( rad(angle) ) - v[2] * Math.sin( rad(angle) );
                vv[2] = v[2] * Math.cos( rad(angle) ) + v[1] * Math.sin( rad(angle) );
                return vv;
            },
            y: function(angle, v){
                var vv = [];
                vv[0] = v[0] * Math.cos( rad(angle) ) + v[2] * Math.sin( rad(angle) );
                vv[1] = v[1];
                vv[2] = v[2] * Math.cos( rad(angle) ) - v[0] * Math.sin( rad(angle) );
                return vv;
            },
            z: function(angle, v){
                var vv = [];
                vv[0] = v[0] * Math.cos( rad(angle) ) - v[1] * Math.sin( rad(angle) );
                vv[1] = v[1] * Math.cos( rad(angle) ) + v[0] * Math.sin( rad(angle) );
                vv[2] = v[2];
                return vv;
            }
        };

        // Transform the [x, y, z] translation vector moving the camera to account for the current rotations.
        // Note that for the camera. aka the canvas, impress.js applies the rotation in the reverse order
        var v = [ diff.x, diff.y, diff.z ];
        for ( var i = xyz.length-1; i >= 0; i-- ) {
            v = computeRotate[xyz[i]](angle[xyz[i]], v);
        }
        newDiff.x = v[0];
        newDiff.y = v[1];
        newDiff.z = v[2];

        // Rotations
        // Capture current rotations from activeWidgets
        var activeWidgets = coordWidgets[getActiveTab()];
        var currentRotations = {};
        for ( var i = 0; i < xyz.length; i++ ) {
            // iterate over rotateX/Y/Z in the order they appear in "order"
            var rotateStr = "rotate" + xyz[i].toUpperCase();
            currentRotations[xyz[i]] = util.toNumber( activeWidgets[rotateStr].input.value );
        }

        // Controls only allow 1 axis at a time to be rotating. Find out which one, if any.
        var axis = "";
        if ( diff.rotateX ) axis = "x";
        if ( diff.rotateY ) axis = "y";
        if ( diff.rotateZ ) axis = "z";

        // See if we can move that axis last in the order field
        if ( Math.abs( currentRotations[axis] ) < 1 && !rotationAxisLock[axis] ) {
            // Move that axis last in the order
            newDiff.order = diff.order.split(axis).join("") + axis;
        }
        // However, we only ever move the axis once. Changing the axis (direction) of rotation
        // once it has started is confusing to the user. So now that we're moving along this axis,
        // it cannot be moved in the order anymore.
        rotationAxisLock[axis] = true;

        newDiff.rotateX = diff.rotateX;
        newDiff.rotateY = diff.rotateY;
        newDiff.rotateZ = diff.rotateZ;
        newDiff.scale = diff.scale;
        return newDiff;
    };

})(document, window);


/**
 * Electron IPC
 *
 * This is the renderer side of some Electron IPC calls.
 *
 * Copyright 2016 Henrik Ingo (@henrikingo)
 * Released under the MIT license.
 */
(function ( document, window ) {
    'use strict';

    // Return the entire document when requested
    if( window.require ){
        var getDocumentElement = function (event, filename) {
            // Remove DOM elements added by impressionist itself (toolbars, tinymce)
            impressionist().gc.removeAll();
            impress().tear();
            trimLastChild();

            ipc.send('impressionist-return-documentElement', {
                filename: filename,
                documentElement: document.documentElement.outerHTML
            });

            // Aaannd then we reload impress and put the impressionist bits right back to where they were
            impress().init();
            var script = impressionist().util.loadJavaScript(
                process.resourcesPath + "/../../../../js/impressionist.js", function(){
                    impressionist().gc.pushElement(script); // The circle of life :-)
                    impressionist().util.triggerEvent(document, "impressionist:init", {}) 
                });
        };
        var ipc = require('electron').ipcRenderer;
        // Each call to getDocumentElement will end with re-adding impressionist.js script element
        // Thus causing a fresh copy of getDocumentElement itself to be registered as listener
        ipc.once('impressionist-get-documentElement', getDocumentElement);
    }

    /**
    * Trim Newlines from the lastChild of body
    *
    * For reasons I don't know, Google Chrome, and therefore Electron as well, adds 1-2 newlines
    * to the end of the body of any html page it opens. You can see this by simply typing in the
    * javascript console of a simple test page:
    *
    *      document.documentElement.innerHTML.toString()
    *
    * or
    *
    *      document.body.lastChild.nodeValue
    *
    * This is a bit annoying if we're gonna open and save a html document in Electron. For each time
    * we'd open and save a particular file, it would add newlines to the end of itself, causing the
    * file to grow indefinitively.
    *
    * To avoid this, we trim extra newlines from the end of the file.
    */
    var trimLastChild = function() {
        while ( true ) {
            var end = document.body.lastChild;
            if (end.nodeType != 3) break;
            end = end.nodeValue;
            if ( end.slice(-3) != "\n\n\n" ) break;
            // Trim one newline from the end
            document.body.lastChild.nodeValue = end.slice(0,-1);
        }
    };

})(document, window);

/**
 * Load impressionist.css
 *
 * Copyright 2016 Henrik Ingo (@henrikingo)
 * Released under the MIT license.
 */
(function ( document, window ) {
    'use strict';
    // Just load it ASAP. No need to wait for impressionist:init
    var link = impressionist().util.loadCss(process.resourcesPath + "/../../../../css/impressionist.css");
    impressionist().gc.pushElement(link);

})(document, window);

/**
 * Stepedit plugin
 *
 * Add, remove and reorder steps
 *
 * Copyright 2017 Henrik Ingo (@henrikingo)
 * Released under the MIT license.
 */
(function ( document, window ) {
    'use strict';
    var root;
    var canvas;
    var toolbar;
    var steps = [];
    var activeStep;
    var waitForRefresh = false;
    var reorderDialog = null;
    var reorderSelect = null;
    var reorderOldSelectedOptions = [];
    var group = 0;
    var myWidgets = {};
    var cameraWidgets = {};
    var cameraWidgetNames = [['x', 'data-x'],
                             ['y', 'data-y'],
                             ['z', 'data-z'],
                             ['scale', 'data-scale'],
                             ['rotateX', 'data-rotate-x'],
                             ['rotateY', 'data-rotate-y'],
                             ['rotateZ', 'data-rotate-z'],
                             ['order', 'data-rotate-order']];
    var util = impressionist().util;


    var createWidgets = function() {
        // Set the text of the tab for this group of widgets
        util.triggerEvent(toolbar, "impressionist:toolbar:groupTitle", { group: group, title: "Outline" } )

        // Add button for new step
        var newButton = util.makeDomElement( '<button id="impressionist-stepedit-new" title="New step">&#x2b1c;</button>' );
        util.triggerEvent(toolbar, "impressionist:toolbar:appendChild", { group: group, element: newButton });
        myWidgets["new"] = newButton;
        newButton.addEventListener("click", function (event) {
            if ( !waitForRefresh ) {
                newStep();
            }
        });

        // Add button to delete step
        var deleteButton = util.makeDomElement( '<button id="impressionist-stepedit-delete" title="Delete step">X</button>' );
        util.triggerEvent(toolbar, "impressionist:toolbar:appendChild", { group: group, element: deleteButton });
        myWidgets["delete"] = deleteButton;
        deleteButton.addEventListener("click", function (event) {
            if ( !waitForRefresh ) {
                deleteStep();
            }
        });

        // Add empty space
        var space = util.makeDomElement( '<span class="impressionist-toolbar-space"> </span>' )
        util.triggerEvent(toolbar, "impressionist:toolbar:appendChild", { group: group, element: space });

        // Add button to reorder steps
        var reorderButton = util.makeDomElement( '<button id="impressionist-stepedit-reorder" title="Reorder steps">&#x2195;</button>' );
        util.triggerEvent(toolbar, "impressionist:toolbar:appendChild", { group: group, element: reorderButton });
        myWidgets["reorder"] = reorderButton;
        reorderButton.addEventListener("click", function (event) {
            if ( reorderDialog ) {
                hideReorderDialog();
            }
            else {
                showReorderDialog();
            }
        });
    };

    // Helper functions ///////////////////////////////////////////////////////////////////////////

    var refresh = function( nextStep, slow ) {
        if (nextStep === undefined) {
            if ( activeStep ) {
                nextStep = activeStep.id;
            }
            else {
                nextStep = 1;
            }
        }

        waitForRefresh = true;
        if ( slow ) {
            // Use whatever data-transition-duration is set in the presentation #impress div
            impress().goto(nextStep);
        }
        else {
            // Fast refresh (no zoom or translate or rotate happening)
            impress().goto(nextStep, 1);
        }
    };

    // Get the step after this one. Returns undefined if this is already the last step.
    var getNextStep = function( thisStep ) {
        var i = getNextStepIndex(thisStep);
        if ( i == 0 ) {
            return undefined;
        }
        else {
            return steps[i];
        }
    };

    // Get index for next step in steps array. If thisStep is already the last step, returns 0.
    var getNextStepIndex = function( thisStep ) {
        for( var i = 0; i < steps.length; i++ ) {
            if ( steps[i] == thisStep ) {
                if ( i == steps.length - 1 ) {
                    return 0;
                }
                else {
                    return i+1;
                }
            }
        }
    };

    // Get the step before this one. Returns undefined if this is already the first step.
    var getPrevStep = function( thisStep ) {
        var i = getPrevStepIndex(thisStep);
        if ( i == -1 ) {
            return undefined;
        }
        else {
            return steps[i];
        }
    };

    // Get index for previous step in steps array. If thisStep is already the first step, returns -1.
    var getPrevStepIndex = function( thisStep ) {
        for( var i = steps.length; i >= 0; i-- ) {
            if ( steps[i] == thisStep ) {
                return i-1;
            }
        }
    };

    // Generate a new step.id of the form "step-N", where N is one larger than the currently largest N
    var generateStepId = function() {
        var highest = 0;
        var re = /step-(\d+)/;
        steps.forEach( function(step) {
            var res = step.id.match(re);
            if (res) {
                var num = parseInt(res[1]);
                if ( num > highest ) highest = num;
            }
        });
        var newId = highest + 1;
        return "step-" + newId;
    };

    // Add some unique content to the new step, purely as a visual aid and placeholder for user
    //
    // :param: totalNum is what steps.length will be after the addition/deletion is complete.
    // We cannot read steps.length at the moment this function is called, because it is out of date but not yet updated.
    var generateStepContent = function(totalNum) {
        var currentNum = getNextStepIndex(activeStep) + 1;
        return "<p>Step " + currentNum + " of " + totalNum + "</p>";
    };

    // Add, Delete etc... actions /////////////////////////////////////////////////////////////////

    // Add new step after this one.
    // Copy all attributes of current step (including CSS classes, etc...). For position, copy camera coordinates.
    var newStep = function() {
        var newStepElement = document.createElement("DIV");
        // Copy attributes of current step
        for (var i = 0; i < activeStep.attributes.length; i++) {
            var attrName = activeStep.attributes[i].name;
            newStepElement.setAttribute( attrName, activeStep.getAttribute(attrName) );
        }
        // Copy coordinates from camera
        cameraWidgetNames.forEach( function(namePair){
            newStepElement.setAttribute(namePair[1], cameraWidgets[namePair[0]].input.value);
        });
        newStepElement.id = generateStepId();
        newStepElement.innerHTML = generateStepContent(steps.length+1);

        // Actually insert the element
        var nextElement = getNextStep(activeStep);
        if ( nextElement ) {
            canvas.insertBefore( newStepElement, nextElement );
        }
        else {
            canvas.appendChild( newStepElement );
        }
        refresh(newStepElement.id);
        // Let others know that there's a new step
        util.triggerEvent( newStepElement, "impressionist:stepedit:newStep", {} );
    };

    // Delete step
    var deleteStep = function() {
        // There cannot be zero steps. If this is the last step, just empty it.
        if ( steps.length == 1 ) {
            activeStep.innerHTML = generateStepContent(steps.length);
            return;
        }
        // After deleting, we want to land on the following step
        // Minus one, because we're deleting this slide
        var nextIndex = getNextStepIndex(activeStep)-1;
        // Now delete
        activeStep.parentElement.removeChild(activeStep);

        if (nextIndex >= 0) {
            refresh(nextIndex, true);
        }
        else {
            // If we were already on the last step, we don't wrap around to first step, rather just stay on the last
            refresh(steps.length-2, true);
        }
    };


    // Reorder dialog
    var showReorderDialog = function() {
        reorderOldSelectedOptions = [];

        var size = steps.length < 16 ? steps.length : 16;
        reorderDialog = util.makeDomElement( '<div id="impressionist-stepedit-reorder-dialog">\n' +
                                             '  <p><strong>Reorder steps</strong></p>\n' +
                                             '  <table>\n' +
                                             '    <tr><td>\n' +
                                             '      <select id="impressionist-stepedit-reorder-select" multiple="true" size="' + size + '">\n' +
                                             '      </select>\n' +
                                             '    </td><td>\n' +
                                             '      <button>^</button><br />\n' +
                                             '      <button>v</button>\n' +
                                             '    </td></tr>\n' +
                                             '  </table>\n' +
                                             '</div>' );
        reorderSelect = reorderDialog.querySelector('#impressionist-stepedit-reorder-select');
        reorderSetSteps();
        var buttons = reorderDialog.querySelectorAll('button');
        var up = buttons[0],
            down = buttons[1];

        // Event handlers
        up.addEventListener("click", function (event) {
            saveOldSelectedOptions();
            for (var i = 0; i < reorderSelect.selectedOptions.length; i++){
                var id = reorderSelect.selectedOptions[i].value;
                var step = document.getElementById(id);
                var ret = moveUp( step );
                if ( ret === false ) {
                    // Already at the top
                    break;
                }
            }
            refresh();
        });
        // When moving down, move the last element first. Makes a difference when multiple selected.
        down.addEventListener("click", function (event) {
            saveOldSelectedOptions();
            for (var i = reorderSelect.selectedOptions.length - 1; i >= 0; i--){
                var id = reorderSelect.selectedOptions[i].value;
                var step = document.getElementById(id);
                var ret = moveDown( step );
                if ( ret === false ) {
                    // Already at the bottom
                    break;
                }
            }
            refresh();
        });
        document.body.appendChild(reorderDialog);
    };

    // Helpers for reorderDialog
    var hideReorderDialog = function() {
        reorderDialog.parentElement.removeChild(reorderDialog);
        reorderDialog = null;
    };

    // Select the options in the reorder dialog whose value (i.e. step ids) is given in the list
    var reorderSelectOptions = function( toBeSelected ) {
        if ( ! Array.isArray(toBeSelected) ) {
            toBeSelected = [ toBeSelected ];
        }
        for ( var i = 0; i < reorderSelect.options.length; i++ ) {
            if ( toBeSelected.indexOf( reorderSelect.options[i].value ) != -1 ) {
                reorderSelect.options[i].selected = true;
            }
        }
    };

    var saveOldSelectedOptions = function () {
        reorderOldSelectedOptions = [];
        for (var i = 0; i < reorderSelect.selectedOptions.length; i++){
            reorderOldSelectedOptions.push(reorderSelect.selectedOptions[i].value);
        }
    }

    var reorderSetSteps = function () {
        if ( reorderSelect ) {
            var selectHTML = "";
            for( var i = 0; i < steps.length; i++) {
                var s = steps[i];
                selectHTML += '<option value="' + s.id + '">' + s.id + '</option>\n';
            }
            reorderSelect.innerHTML = selectHTML;
            reorderSelectOptions( reorderOldSelectedOptions );
        }
    };

    var moveUp = function( step ) {
        var parent = step.parentElement;
        var previous = getPrevStep(step);
        if ( previous ) {
            parent.insertBefore( step, previous );
        }
        else {
            // Returning false signifies that we cannot move the step, because it is already first
            return false;
        }
        // Need to refresh our internal list, so that getNextStep/getPrevStep work when this is called in a loop
        steps = root.querySelectorAll(".step");
    };

    var moveDown = function( step ) {
        var parent = step.parentElement;
        var next = getNextStep(step);
        if ( !next ) {;
            // Returning false signifies that we cannot move the step, because it is already first
            return false;
        }
        next = next.nextSibling;
        if ( next ) {
            parent.insertBefore( step, next );
        }
        else {
            parent.appendChild( step );
        };
        // Need to refresh our internal list, so that getNextStep/getPrevStep work when this is called in a loop
        steps = root.querySelectorAll(".step");
    };
    // impressionist and impress.js events ///////////////////////////////////////////////////////
    var gc = impressionist().gc;

    gc.addEventListener(document, "impressionist:init", function (event) {
        root = document.getElementById("impress");
        canvas = root.firstChild;
        steps = root.querySelectorAll(".step");
        activeStep = root.querySelector(".step.active");
    });

    gc.addEventListener(document, "impressionist:toolbar:init", function (event) {
        toolbar = event.target;
        createWidgets();
        util.triggerEvent(toolbar, "impressionist:stepedit:init", { "widgets" : myWidgets } );
    });

    gc.addEventListener(document, "impressionist:camera:init", function (event) {
        cameraWidgets = event.detail.widgets;
    });

    // Keeping the state: Refresh list of steps and activeStep on each move
    gc.addEventListener(document, "impress:steprefresh", function (event) {
        steps = root.querySelectorAll(".step");
        reorderSetSteps();
        activeStep = root.querySelector(".step.active");
        waitForRefresh = false;
    });

})(document, window);


/**
 * Tinymce integration
 *
 * Initialize tinyMCE editor after impressionist:init. Note that tinyMCE itself is in node_modules.
 *
 * Copyright 2016 Henrik Ingo (@henrikingo)
 * Released under the MIT license.
 */
(function ( document, window ) {
    'use strict';
    var toolbar;
    var script;
    var gc = impressionist().gc;

    var tinymceOnInitDone = false;

    var tinymceOnInit = function(event) {
        disableKeyPropagation(event.target.targetElm);

        // Send an event to tell other plugins that TinyMCE has now initialized at least one editor
        // window.
        if ( !tinymceOnInitDone ) {
            tinymceOnInitDone = true;
            // TODO: This is now done as the first editor instance completed init.
            // Someone might expect that we would only trigger this event once all editors did init.
            // That would be complex, and nobody needs that now, so I didn't do that.
            impressionist().util.triggerEvent( document, "impressionist:tinymce:init", { script : script, toolbar : toolbar } );
        }
    };

    // When user types text into TinyMCE, we don't want that to trigger impress.js events.
    // Note that the form plugin in impress.js does this exact same thing, but it has already
    // been executed at this point, so we have to do this ourselves specifically for TinyMCE.
    // Example: When user type's 'p' into a slide, we must not launch the presenter console!
    var disableKeyPropagation = function(div) {
        gc.addEventListener( div, "keydown", function( event ) {
            event.stopPropagation();
        } );
        gc.addEventListener( div, "keyup", function( event ) {
            event.stopPropagation();
        } );
    };

    var tinymceOptionsTemplate = {
        setup: function(editor) { editor.on('init', tinymceOnInit); },
        inline: true,
        theme: 'modern',
        width: 780,
        height: 550,
        menubar: false,
        statusbar: false,
        fixed_toolbar_container: '#tinymce-toolbar',
        toolbar: 'styleselect fontselect fontsizeselect forecolor | ' +
                    'cut copy paste | undo redo | ' +
                    'bold italic underline strikethrough | ' +
                    'alignleft aligncenter alignright alignjustify | ' +
                    'bullist numlist outdent indent | ' +
                    'link image table code',
        fontsize_formats: '8pt 12pt 16pt 20pt 24pt 30pt 36pt 48pt 72pt 96pt',
        plugins: [
        'advlist autolink link image lists charmap print preview hr anchor pagebreak spellchecker',
        'searchreplace wordcount visualblocks visualchars code fullscreen insertdatetime media nonbreaking',
        'save table contextmenu directionality emoticons template paste textcolor'
        ]
    };

    var tinymceInit = function() {
        var tinymceOptions = Object.assign( {}, tinymceOptionsTemplate );
        tinymceOptions.selector = '.step';
        window.tinymce.init(tinymceOptions);
    };


    gc.addEventListener(document, "impressionist:init", function (event) {
        var html = '<div id="tinymce-toolbar"></div>';
        toolbar = impressionist().util.makeDomElement(html);
        gc.appendChild(document.body, toolbar);
        script = impressionist().util.loadJavaScript(process.resourcesPath + "/../../../tinymce/tinymce.js", tinymceInit);
        impressionist().gc.pushElement(script);
    });

    gc.addEventListener(document, "impressionist:stepedit:newStep", function (event) {
        var tinymceOptions = Object.assign( {}, tinymceOptionsTemplate );
        tinymceOptions.target = event.target;
        window.tinymce.init(tinymceOptions);
    });

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
    // If groups are given titles, they are rendered as tabs, with the title as the tab name.
    var groupTitles = [];
    var groupTitlesDiv = document.createElement("DIV");
    groupTitlesDiv.id = "impressionist-toolbar-titles";
    toolbar.appendChild(groupTitlesDiv);
    // Toolbar widgets that belong together, are added to a group in the toolbar. Groups are rendered in index order.
    var groups = [];
    var groupDiv = document.createElement("DIV");
    groupDiv.id = "impressionist-toolbar-groups";
    toolbar.appendChild(groupDiv);
    var gc = impressionist().gc;

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
            if ( groupTitles.length > 0 && currentTab != index ) {
                groups[index].style.display = "none";
            }
            var nextIndex = getNextGroupIndex(index);
            if ( nextIndex === undefined ){
                groupDiv.appendChild(groups[index]);
            }
            else{
                groupDiv.insertBefore(groups[index], groups[nextIndex]);
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

    /**
     * Event listener for the buttons that make a tab visible (generator function)
     */
    var currentTab = 0;
    var showTabGenerator = function(index){
        return function(e){
            // Hide currentTab
            if ( currentTab !== undefined ) {
                groups[currentTab].style.display = "none";
                groupDiv.classList.remove("selected-group-" + currentTab);
                if (groupTitles[currentTab]) {
                    groupTitles[currentTab].classList.remove("selected");
                }
            }
            // For this tab, show it or if it was already showing, leave it hidden (toggle)
            if ( index != currentTab ) {
                groupDiv.style.display = "block";
                groups[index].style.display = "inline";
                if (groupTitles[index]) {
                    groupTitles[index].classList.add("selected");
                }
                groupDiv.classList.add("selected-group-" + index);
                currentTab = index;
            }
            else {
                groupDiv.style.display = "none";
                currentTab = undefined;
            }
        };
    };

    // API
    // Other plugins can add and remove buttons by sending them as events.
    // In return, toolbar plugin will trigger events when widget was added.
    /**
     * Give a name to a group.
     *
     * The name is used as the title for the tab that the group is rendered as.
     *
     * :param: e.detail.group   integer specifying which group the title is for
     * :param: e.detail.title   the title to be used for the group
     */
    toolbar.addEventListener("impressionist:toolbar:groupTitle", function( e ){
        var index = e.detail.group;
        var isNew = groupTitles[index] === undefined;
        if ( isNew ){
            // Create the corresponding tab title
            var nextIndex = getNextGroupIndex(index);
            groupTitles[index] = document.createElement("button");
            groupTitles[index].id = "impressionist-toolbar-group-" + index + "-title";
            if ( nextIndex === undefined ){
                groupTitlesDiv.appendChild(groupTitles[index]);
            }
            else{
                groupTitlesDiv.insertBefore(groupTitles[index], groupTitles[nextIndex]);
            }
            groupTitles[index].addEventListener("click", showTabGenerator(index));

            // Tab zero happens to be the default
            if ( index == 0 && !currentTab ) {
                groupTitles[0].classList.add("selected");
            }
        }
        groupTitles[index].innerHTML = e.detail.title;
    });

    /**
     * Append a widget inside toolbar span element identified by given group index.
     *
     * Note: When groupTitles are given, the toolbar groups become tabs. In this case group #0
     * is the one shown initially.
     *
     * :param: e.detail.group    integer specifying the span element where widget will be placed
     * :param: e.detail.element  a dom element to add to the toolbar
     */
    toolbar.addEventListener("impressionist:toolbar:appendChild", function( e ){
        var index = e.detail.group;
        var group = getGroupElement(index);
        group.appendChild(e.detail.element);

        // Tab zero happens to be the default
        if ( index == 0 && !currentTab ) {
            groupDiv.classList.add("selected-group-0");
        }
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

    /**
     * Insert the html element that is this toolbar
     *
     * Do this after adding the tinymce toolbar so that this is below tinymce when both are visible.
     */
    gc.addEventListener(document, "impressionist:tinymce:init", function (event) {
        gc.appendChild(document.body, toolbar);
        impressionist().util.triggerEvent( toolbar, "impressionist:toolbar:init", { toolbar : toolbar } );
    });

})(document, window);

