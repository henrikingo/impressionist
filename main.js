const electron = require('electron')
const app = electron.app
const BrowserWindow = electron.BrowserWindow
const menu = require('./src/main/menu')

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow

function createWindow () {
    // Create the browser window.
    mainWindow = new BrowserWindow({useContentSize: true,
                                    icon: './favicon.png'})
    mainWindow.maximize()
    // debug
    //mainWindow.webContents.openDevTools()

    // This triggers when user opens a presentation and it has loaded into the window
    mainWindow.webContents.on('dom-ready', function(event) {
        mainWindow.webContents.executeJavaScript(loadImpressionist())
    })

    mainWindow.on('closed', function () {
        mainWindow = null
    })
    menu.createMenu(mainWindow)
}

app.on('ready', createWindow)
app.on('window-all-closed', function () {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
        app.quit()
    }
})
app.on('activate', function () {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (mainWindow === null) {
        createWindow()
    }
})


function loadImpressionist () {
    return `var script = document.createElement("script");
    script.src = process.cwd() + "/js/impressionist.js";
    script.type = "text/javascript";
    script.onload = function(){
        impressionist().gc.pushElement(script)
        impressionist().util.triggerEvent(document, "impressionist:init", {})
    };
    document.head.appendChild(script);
    `
}
