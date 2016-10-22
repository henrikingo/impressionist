# Impressionist

Impressionist is a prototype and concept to build a visual (wysiwyg) editor for creating impress.js
presentations. The idea is to use [Electron](http://electron.atom.io/) to make the browser based
impress.js presentation into a proper desktop app that can open and save files. 
[TinyMCE](https://www.tinymce.com/docs/demo/inline/) is integrated to provide the editing
capability.

Currently this is a work in progress, not yet useable. 


## HOWTO

Pre-requisites: git, node 6.5+ and npm

        git clone https://github.com/henrikingo/impressionist.git
        cd impressionist
        git submodule init
        git submodule update
        npm install
        npm start

Note: As of this writing the only impress.js presentation in the world that will actually work in
the editing app is the one in templates/cube/index.html. So you can open that with File->Open,
do some edits, zoom around with the camera controls, and save the file. But that's really all
you can do.

## Repository organization

### Electron main process

* `main.js`
* `src/main/*`

### Browser process / Electron renderer process

* `src/impressionist.*`
* `src/plugins/*`

Use `npm build` to build the above into `js/impressionist.js` and `css/impressionist.css`.