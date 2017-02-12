/**
 * Stepedit plugin
 *
 * Add or remove steps
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

        var newButton = util.makeDomElement( '<button id="impressionist-stepedit-new" title="New step">&#x2b1c;</button>' );

        util.triggerEvent(toolbar, "impressionist:toolbar:appendChild", { group: group, element: newButton });
        myWidgets["new"] = newButton;

        newButton.addEventListener("click", function (event) {
            newStep();
        });
    };

    // Get the step after this one. Returns undefined if this is already the last step.
    var getNextStep = function( thisStep ) {
        var i = getNextStepIndex(thisStep);
        if ( i == 0 ) {
            return undefined;
        }
        else {
            return steps[i+1];
        }
    };

    // Get index for next step in steps array. If thisStep is already the last step, returns 0.
    var getNextStepIndex = function( thisStep ) {
        for( var i = 0; i < steps.length; i++ ) {
            if ( steps[i] == thisStep ) {
                if ( i == steps.length - 1 ) {
                    return -1;
                }
                else {
                    return i+1;
                }
            }
        }
    };

    // Add new step after this one.
    // Copy all attributes of current step (including CSS classes, etc...). For position, copy camera coordinates.
    var newStep = function() {
        var newStep = document.createElement("DIV");
        // Copy attributes of current step
        for (var i = 0; i < activeStep.attributes.length; i++) {
            var attrName = activeStep.attributes[i].name;
            newStep.setAttribute( attrName, activeStep.getAttribute(attrName) );
        }
        // Copy coordinates from camera
        cameraWidgetNames.forEach( function(namePair){
            newStep.setAttribute(namePair[1], cameraWidgets[namePair[0]].input.value);
        });
        newStep.id = generateStepId();
        newStep.innerHTML = generateStepContent();

        // Actually insert the element
        var nextElement = getNextStep(activeStep);
        if ( nextElement ) {
            canvas.insertBefore( newStep, nextElement );
        }
        else {
            canvas.appendChild( newStep );
        }
        impress().goto(newStep.id);
    };

    // Generate a new step.id of the form "step-N", where N is one larger than the currently largest N
    var generateStepId = function() {
        var highest = 1;
        var re = new RegExp('step-(\d+)');
        steps.forEach( function(step) {
            var res = step.id.match(re);
            if (res) {
                var num = parseInt(res[1]);
                if ( num > highest ) highest = num;
            }
        });
        return "step-" + highest;
    };

    // Add some unique content to the new step, purely as a visual aid and placeholder for user
    var generateStepContent = function() {
        var currentNum = getNextStepIndex(activeStep) + 1;
        var totalNum = steps.length;
        return "<p>Step " + currentNum + " of " + totalNum + "</p>";
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
        activeStep = root.querySelector(".step.active");
    });

})(document, window);

