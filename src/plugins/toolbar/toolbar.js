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
    var groups = [];
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

    /**
     * Insert the html element that is this toolbar
     *
     * Do this after adding the tinymce toolbar so that this is below tinymce when both are visible.
     */
    gc.addEventListener(document, "impressionist:tinymce:init", function (event) {
        gc.appendChild(document.body, toolbar);
        impressionist().util.triggerEvent( document, "impressionist:toolbar:init", { toolbar : toolbar } );
    });

})(document, window);

