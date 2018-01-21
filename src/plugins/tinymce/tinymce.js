/**
 * Tinymce integration
 *
 * Initialize tinyMCE editor after impressionist:init. Note that tinyMCE itself is in node_modules.
 *
 * Copyright 2016 Henrik Ingo (@henrikingo)
 * Released under the MIT license.
 */
(function ( document, window ) {
    'use strict';
    var toolbar;
    var script;
    var gc = impressionist().gc;

    var tinymceOnInitDone = false;

    var tinymceOnInit = function(event) {
        // When user types text into TinyMCE, we don't want that to trigger impress.js events.
        // Note that the form plugin in impress.js does this exact same thing, but it has already
        // been executed at this point, so we have to do this ourselves specifically for TinyMCE.
        // Example: When user type's 'p' into a slide, we must not launch the presenter console!
        var editableDiv = event.target.targetElm;
        gc.addEventListener( editableDiv, "keydown", function( event ) {
            event.stopPropagation();
        } );
        gc.addEventListener( editableDiv, "keyup", function( event ) {
            event.stopPropagation();
        } );

        // Send an event to tell other plugins that TinyMCE has now initialized at least one editor
        // window.
        if ( !tinymceOnInitDone ) {
            tinymceOnInitDone = true;
            // TODO: This is now done as the first editor instance completed init.
            // Someone might expect that we would only trigger this event once all editors did init.
            // That would be complex, and nobody needs that now, so I didn't do that.
            impressionist().util.triggerEvent( document, "impressionist:tinymce:init", { script : script, toolbar : toolbar } );
        }
    };

    var tinymceInit = function() {
        window.tinymce.init({
            setup: function(editor) { editor.on('init', tinymceOnInit); },
            inline: true,
            selector: '.step',
            theme: 'modern',
            width: 780,
            height: 550,
            menubar: false,
            statusbar: false,
            fixed_toolbar_container: '#tinymce-toolbar',
            toolbar: 'styleselect fontselect fontsizeselect forecolor | ' +
                     'cut copy paste | undo redo | ' +
                     'bold italic underline strikethrough | ' +
                     'alignleft aligncenter alignright alignjustify | ' +
                     'bullist numlist outdent indent | ' +
                     'link image table code',
            fontsize_formats: '8pt 12pt 16pt 20pt 24pt 30pt 36pt 48pt 72pt 96pt',
            plugins: [
            'advlist autolink link image lists charmap print preview hr anchor pagebreak spellchecker',
            'searchreplace wordcount visualblocks visualchars code fullscreen insertdatetime media nonbreaking',
            'save table contextmenu directionality emoticons template paste textcolor'
            ]
        });
    };


    gc.addEventListener(document, "impressionist:init", function (event) {
        var html = '<div id="tinymce-toolbar"></div>';
        toolbar = impressionist().util.makeDomElement(html);
        gc.appendChild(document.body, toolbar);
        script = impressionist().util.loadJavaScript(process.resourcesPath + "/../../../tinymce/tinymce.js", tinymceInit);
        impressionist().gc.pushElement(script);
    });

})(document, window);
