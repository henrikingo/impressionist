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
                process.cwd() + "/js/impressionist.js", function(){
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
