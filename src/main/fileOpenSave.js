/* File open and save. (Dialogs and implementation) */
const electron = require('electron')
const app = electron.app



let mainWindowPointer = null
let currentFile = ""
const dialog = require('electron').dialog

var fileOpen = function(){
  dialog.showOpenDialog({
    title: 'Open Presentation',
    filters: [
      { name: 'Impress Presentation (HTML)', extensions: ['html'] }
    ],
    properties: ['openFile']
  }, function (files) {
    if (files) {
      currentFile = files[0]
      mainWindowPointer.loadURL('file://' + currentFile)
    }
  })
};

const ipc = require('electron').ipcMain
const fs = require('fs')
var fileSave = function() {
  mainWindowPointer.webContents.send('impressionist-get-documentElement', currentFile)
}

var fileSaveAs = function() {
  dialog.showSaveDialog({
    title: 'Save Presentation',
    filters: [
      { name: 'Impress Presentation (HTML)', extensions: ['html'] }
    ]
  }, function (filename) {
    if (filename) {
      currentFile = filename
      mainWindowPointer.webContents.send('impressionist-get-documentElement', currentFile)
    }
  })
}
ipc.on('impressionist-return-documentElement', function(event, data){
  fs.writeFile(data.filename, data.documentElement, function (err) {
      if(err){
          console.log("An error ocurred creating the file "+ err.message)
      }
  })
})

module.exports = {
  init: function(mainWindow){
    mainWindowPointer = mainWindow
    return {
      open: fileOpen,
      save: fileSave,
      saveAs: fileSaveAs
    }
  }
}
