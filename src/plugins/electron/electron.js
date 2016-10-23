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
    // TODO: We need to actually remove the impressionist and tinymce controls first and return just the impress.js bits
    if( window.require ){
        var ipc = require('electron').ipcRenderer;
        ipc.on('impressionist-get-documentElement', function (event, filename) {
            ipc.send('impressionist-return-documentElement', {
                filename: filename,
                // TODO: I have no idea why the closing </html> is missing from innerHTML
                documentElement: document.documentElement.innerHTML + "\n</html>"
            });
        });
    }

})(document, window);
