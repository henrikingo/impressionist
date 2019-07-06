/**
 * Load impressionist.css
 *
 * Copyright 2016 Henrik Ingo (@henrikingo)
 * Released under the MIT license.
 */
(function ( document, window ) {
    'use strict';
    impressionist().gc.addEventListener(document, "impressionist:init", function (event) {
        var link = impressionist().util.loadCss(impressionist().rootDir + "/css/impressionist.css");
        impressionist().gc.pushElement(link);
    });

})(document, window);
