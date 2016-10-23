/**
 * Impressionist.js - A visual editor for impress.js
 *
 * This is the main JS file for the browser / renderer process side of Impressionist. By running
 * `node build.js` this is concatenated with all the `src/plugins/*` into `js/impressionist.js`,
 * which is the file actually used in a browser / Electron renderer process.
 *
 * This file simply exposes a global function `impressionist()`, which returns an object that is
 * the impressionist api. This is exactly analogous to how `impress()` returns the impress api.
 *
 * Currently this file doesn't include any core functionality or interesting api. The only
 * functions you can actually call in the api are common utility functions like 
 * `impressionist().util.toNumber()`.
 *
 * Henrik Ingo (c) 2016
 * MIT License
 */
(function ( document, window ) {
    'use strict';
    
    // Populated by separate library plugins, see src/lib/*
    var impressionistApi = {};

    window.impressionist = function(){
        return impressionistApi;
    };

})(document, window);
