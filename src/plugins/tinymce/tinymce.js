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

    var tinymceInit = function() {
        window.tinymce.init({
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


    document.addEventListener("impressionist:init", function (event) {
        var html = '<div id="tinymce-toolbar"></div>\n';
        var toolbar = impressionist().util.makeDomElement(html);
        document.body.appendChild(toolbar);
        impressionist().util.loadJavaScript(process.resourcesPath + "/../../../tinymce/tinymce.js", tinymceInit);
    }, false);

})(document, window);
