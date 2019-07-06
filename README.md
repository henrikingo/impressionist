# Impressionist

Impressionist is a prototype and concept to build a visual (wysiwyg) editor for creating 
[impress.js presentations](http://henrikingo.github.io/impress.js/examples/classic-slides/). 
The idea is to use [Electron](http://electron.atom.io/) to make the browser based
impress.js presentation into a proper desktop app that can open and save files. 
[TinyMCE](https://www.tinymce.com/docs/demo/inline/) is integrated to provide the editing
capability.

Current status is that you can open a presentations (such as the ones under
[templates/](https://github.com/henrikingo/impressionist-templates)) then move, add or remove slides and edit their contents with TinyMCE. You
can't really modify the style of slides, or have different kinds of slides. For that you'd still
have to edit raw CSS and HTML.

## Demo

* [Short](https://www.youtube.com/watch?v=OHG27IBeuHM)
* [17 minutes, narrated](https://www.youtube.com/watch?v=c07w0hsC4yQ)

## HOWTO

Pre-requisites: git, node 6.5+ and npm 5+

        git clone --recursive https://github.com/henrikingo/impressionist.git
        cd impressionist
        npm install
        npm start


## Mailing list

[impressionist-presentations](https://groups.google.com/forum/#!forum/impressionist-presentations)

## Repository organization

### Electron main process

* `main.js`
* `src/main/*`

### Browser process / Electron renderer process

* `src/impressionist.*`
* `src/lib/*.js`
* `src/plugins/*`

...where `lib` functions are common utility functions and called synchronously. `plugins` are
features, implemented as anonymous closures, and use the event based communication
mechanism familiar from impress.js.

Use `npm build` or just `node build.js` to build the above into `js/impressionist.js` and
`css/impressionist.css`.
