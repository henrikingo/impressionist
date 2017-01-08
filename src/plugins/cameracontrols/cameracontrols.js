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
    var rotationAxisLock = {x:false, y:false, z:false};
    var util = impressionist().util;
    var gc = impressionist().gc;

    // Functions for zooming and panning the canvas //////////////////////////////////////////////

    // Create widgets and add them to the impressionist toolbar //////////////////////////////////
    var round = function(coord) {
        var keys = ["x", "y", "z", "rotateX", "rotateY", "rotateZ"];
        for (var i in keys ) {
            coord[keys[i]] = Math.round( coord[ keys[i] ] );
        }
        return coord;
    };

    var addCameraControls = function() {
        util.triggerEvent(toolbar, "impressionist:toolbar:groupTitle", { group: 0, title: "Camera" } )
        myWidgets.xy = util.makeDomElement( '<button id="impressionist-cameracontrols-xy" title="Pan camera left-right, up-down">+</button>' );
        myWidgets.z  = util.makeDomElement( '<button id="impressionist-cameracontrols-z" title="Zoom in-out = up-down, rotate = left-right">Z</button>' );
        myWidgets.rotateXY = util.makeDomElement( '<button id="impressionist-cameracontrols-rotate" title="Rotate camera left-right, up-down">O</button>' );

        util.triggerEvent(toolbar, "impressionist:toolbar:appendChild", { group : 0, element : myWidgets.xy } );
        util.triggerEvent(toolbar, "impressionist:toolbar:appendChild", { group : 0, element : myWidgets.z } );
        util.triggerEvent(toolbar, "impressionist:toolbar:appendChild", { group : 0, element : myWidgets.rotateXY } );

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
            var diff = { x:0, y:0, z:0, rotateX:0, rotateY:0, rotateZ:0 };
            diff.order = cameraCoordinates.order.input.value;
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
                var scale = util.toNumber(cameraCoordinates.scale.input.value, 1);
                moveTo.x = Number(cameraCoordinates.x.input.value) + diff.x * scale;
                moveTo.y = Number(cameraCoordinates.y.input.value) + diff.y * scale;
                moveTo.z = Number(cameraCoordinates.z.input.value) + diff.z * scale;
                moveTo.scale = scale + util.toNumber(diff.scale);
                moveTo.rotateX = Number(cameraCoordinates.rotateX.input.value) - diff.rotateX/10;
                moveTo.rotateY = Number(cameraCoordinates.rotateY.input.value) + diff.rotateY/10;
                moveTo.rotateZ = Number(cameraCoordinates.rotateZ.input.value) - diff.rotateZ/10;
                moveTo.order = diff.order; // Order is not a diff, just set the new value
                moveTo = round(moveTo);
                util.triggerEvent(toolbar, "impressionist:camera:setCoordinates", moveTo );
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
        cameraCoordinates = event.detail.widgets;
        // Reset rotationAxisLock if the order field was manually edited
        cameraCoordinates.order.input.addEventListener("input", function (event) {
            resetRotationAxisLock();
        });
        cameraCoordinates.order.plus.addEventListener("click", function (event) {
            resetRotationAxisLock();
        });
        cameraCoordinates.order.minus.addEventListener("click", function (event) {
            resetRotationAxisLock();
        });

        toolbar = document.getElementById("impressionist-toolbar");
        addCameraControls();
    }, false);

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
        
        var angle = {
            x: util.toNumber(cameraCoordinates.rotateX.input.value),
            y: util.toNumber(cameraCoordinates.rotateY.input.value),
            z: util.toNumber(cameraCoordinates.rotateZ.input.value)
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
        // Capture current rotations from cameraCoordinates
        var currentRotations = {};
        for ( var i = 0; i < xyz.length; i++ ) {
            // iterate over rotateX/Y/Z in the order they appear in "order"
            var rotateStr = "rotate" + xyz[i].toUpperCase();
            currentRotations[xyz[i]] = util.toNumber( cameraCoordinates[rotateStr].input.value );
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

