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
                var id = reorderSelect.selectedOptions[i].id
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
                var id = reorderSelect.selectedOptions[i].id
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
                selectHTML += '<option id="' + s.id + '">' + s.id + '</option>\n';
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

