const electron = require('electron')
const app = electron.app
const Menu = electron.Menu

/* Menu */
module.exports = {
  createMenu: function(mainWindow){
    let file = require('./fileOpenSave').init(mainWindow)

    var menuLabel = "&File"
    if (process.platform === 'darwin') {
      menuLabel = electron.app.getName()
    }

    let template = [{
      label: menuLabel,
      submenu: [{
        label: '&Open',
        accelerator: 'CmdOrCtrl+O',
        click: file.open
      }, {
        label: '&Save',
        accelerator: 'CmdOrCtrl+S',
        click: file.save
      }, {
        label: 'Save &As...',
        accelerator: 'Shift+CmdOrCtrl+S',
        click: file.saveAs
      }, {
        label: 'Quit',
        accelerator: 'CmdOrCtrl+Q',
        role: 'quit'
      }]
    }]

    const menu = Menu.buildFromTemplate(template)
    Menu.setApplicationMenu(menu)
  }
}
