/**
 * Stepstyles plugin
 *
 * Dialog for selecting class and id for current step.
 *
 * Copyright 2019 Henrik Ingo (@henrikingo)
 * Released under the MIT license.
 */
(function ( document, window ) {
    'use strict';
    var root;
    var canvas;
    var toolbar;
    var activeStep;
    var group = 0;
    var stepId;
    var stepClass;
    var stepClassDialog;
    var stepClassSelect;
    var myWidgets = {};
    var util = impressionist().util;

    var createWidgets = function () {
        // stepId text input
        stepId = util.makeDomElement( '<input type="text" id="impressionist-stepstyles-id" />' );
        var stepIdSpan = util.makeDomElement( '<span> id: </span>' );
        stepIdSpan.appendChild(stepId);
        util.triggerEvent(toolbar, "impressionist:toolbar:appendChild", { group: group, element: stepIdSpan });
        myWidgets['stepId'] = stepId;

        // stepClass field + dialog
        stepClass = util.makeDomElement( '<input type="text" id="impressionist-stepstyles-class" readonly="true" />' );
        var stepClassSpan = util.makeDomElement( '<span> class: </span>\n'
        );
        stepClassSpan.appendChild(stepClass);
        util.triggerEvent(toolbar, "impressionist:toolbar:appendChild", { group: group, element: stepClassSpan });
        myWidgets['stepClass'] = stepClass;
        stepClass.addEventListener("click", function (event) {
            if ( stepClassDialog ) {
                hideStepClassDialog();
            }
            else {
                showStepClassDialog();
            }
        });
    };

//     var selectOptionsHtml = function() {
//         var options = '';
//         var element = document.head.querySelector('meta[name="impressionist-available-step-styles"]');
//         if ( element && element.content) {
//             var availableStepStyles = element.content;
//             for ( var style of availableStepStyles.split(" ") ) {
//                 if ( hideSteps.indexOf( steps[ i ] ) < 0 ) {
//                     options = options + '<option value="' + style + '">' + style + '</option>' + '\n'; // jshint ignore:line
//                 }
//             }
//             return options;
//         }
//         else {
//             return '<option value="">This presentation doesn\'t specify any styles.</option>';
//         }
//     };
// 
    var showStepClassDialog = function() {
        var availableStepStyles = getAvailableStepStyles();
        var size = availableStepStyles.length < 16 ? availableStepStyles.length : 16;
        stepClassDialog = util.makeDomElement( '<div id="impressionist-stepstyles-class-dialog">\n' +
                                             '  <select id="impressionist-stepstyles-class-select" multiple="true" size="' + size + '">\n' +
                                             '  </select>\n' +
                                             '</div>' );
        stepClassSelect = stepClassDialog.querySelector('#impressionist-stepstyles-class-select');
        populateSelectOptions(availableStepStyles);
        stepClassSelect.addEventListener("change", function (event) {
            applySelected();
        });
        document.body.appendChild(stepClassDialog);
    };

    var hideStepClassDialog = function() {
        stepClassDialog.parentElement.removeChild(stepClassDialog);
        stepClassDialog = null;
    };

    var populateSelectOptions = function (options) {
        if ( stepClassSelect ) {
            var selectHTML = "";
            for( var o of options ) {
                selectHTML += '<option value="' + o + '">' + o + '</option>\n';
            }
            if ( selectHTML === "" ) {
                selectHTML = '<option value="">This presentation doesn\'t specify any styles.</option>';
            }
            stepClassSelect.innerHTML = selectHTML;
            selectOptions();
        }
    };

    // Select the options in the select dialog that are found in the class attribute of activeStep
    var selectOptions = function() {
        var activeStepStyles = getActiveStepStyles();
        for ( var option of stepClassSelect.options ) {
            if ( activeStepStyles.indexOf( option.value ) != -1 ) {
                option.selected = true;
            }
        }
    };


    var getAvailableStepStyles = function () {
        var element = document.head.querySelector('meta[name="impressionist-step-styles"]');
        if ( element && element.content) {
            return element.content.split(" ");
        }
        return [];
    };

    // Intersection of activeStep.className and meta[name="impressionist-step-styles"]
    var getActiveStepStyles = function () {
        var availableStepStyles = getAvailableStepStyles();
        var activeStepStyles = activeStep.className.split(" ");
        // intersection
        return impressionist().util.array.intersection(availableStepStyles, activeStepStyles);
//         return availableStepStyles.filter(function(value) { 
//             return activeStepStyles.indexOf(value) > -1;
//         });
    };

    var refreshWidgets = function () {
        if ( activeStep && stepId && stepClass ) {
            stepId.value = activeStep.id;
            stepClass.value = getActiveStepStyles().join(" ");
        }
    };

    var applySelected = function () {
        if ( stepClassSelect && stepClass && activeStep ) {
            var oldSelections = stepClass.value.split(" ");
            var selections = util.getSelectValues(stepClassSelect);
            stepClass.value = selections.join(" ");
            var removeStyles = impressionist().util.array.minus(oldSelections, selections);
            var addStyles = impressionist().util.array.minus(selections, oldSelections);
            for ( var style of removeStyles ) {
                if ( style ) {
                    activeStep.classList.remove(style);
                }
            }
            for ( var style of addStyles ) {
                if ( style ) {
                    activeStep.classList.add(style);
                }
            }
        }
    };

    // impressionist and impress.js events ///////////////////////////////////////////////////////
    var gc = impressionist().gc;

    gc.addEventListener(document, "impressionist:init", function (event) {
        activeStep = document.querySelector("#impress .active.step");
        refreshWidgets();
    });

    gc.addEventListener(document, "impressionist:toolbar:init", function (event) {
        toolbar = event.target;
        createWidgets();
        util.triggerEvent(toolbar, "impressionist:stepstyles:init", { "widgets" : myWidgets } );
        refreshWidgets();
    });

    // Keeping the state: Refresh list of steps and activeStep on each move
    gc.addEventListener(document, "impress:steprefresh", function (event) {
        activeStep = event.target;
        refreshWidgets();
    });

})(document, window);

