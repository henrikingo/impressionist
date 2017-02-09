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

