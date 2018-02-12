/**
 * Load impressionist.css
 *
 * Copyright 2016 Henrik Ingo (@henrikingo)
 * Released under the MIT license.
 */
(function ( document, window ) {
    'use strict';
    // Just load it ASAP. No need to wait for impressionist:init
    var link = impressionist().util.loadCss(process.cwd() + "/css/impressionist.css");
    impressionist().gc.pushElement(link);

})(document, window);
