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
    var waitForRefresh = false;
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
    };

    // Helper functions ///////////////////////////////////////////////////////////////////////////

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
        newStep.innerHTML = generateStepContent(steps.length+1);

        // Actually insert the element
        var nextElement = getNextStep(activeStep);
        if ( nextElement ) {
            canvas.insertBefore( newStep, nextElement );
        }
        else {
            canvas.appendChild( newStep );
        }
        waitForRefresh = true;
        impress().goto(newStep.id, 1);
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

        waitForRefresh = true;
        if (nextIndex >= 0) {
            impress().goto(nextIndex);
        }
        else {
            // If we were already on the last step, we don't wrap around to first step, rather just stay on the last
            impress().goto(steps.length-2);
        }
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
        waitForRefresh = false;
    });

})(document, window);

