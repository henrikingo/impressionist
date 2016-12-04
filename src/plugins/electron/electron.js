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
        var ipc = require('electron').ipcRenderer;
        ipc.on('impressionist-get-documentElement', function (event, filename) {
            // Remove DOM elements added by impressionist itself (toolbars, tinymce)
            impressionist().gc.removeAll();
            impress().tear();

            ipc.send('impressionist-return-documentElement', {
                filename: filename,
                // TODO: I have no idea why the closing </html> is missing from innerHTML
                documentElement: document.documentElement.innerHTML + "\n</html>"
            });

            // Aaannd then we reload impress and put the impressionist bits right back to where they were
            impress().init();
            var script = impressionist().util.loadJavaScript(
                process.resourcesPath + "/../../../../js/impressionist.js", function(){
                    impressionist().gc.pushElement(script); // The circle of life :-)
                    impressionist().util.triggerEvent(document, "impressionist:init", {}) 
                });
        });
    }

})(document, window);
