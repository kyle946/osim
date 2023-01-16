const {
    app,
    BrowserWindow,
    Notification,
    ipcMain,
    Tray,
    Menu,
    screen,
    globalShortcut,
    ipcRenderer,
    contextBridge
} = require('electron')
const path = require("path")
const fs = require("fs")



global.osim = {}
let appPath = path.dirname(app.getPath('exe'));
var icon = path.join(appPath, '/resources/app.asar/logo1.ico')
var preloadjs = path.join(appPath, '/resources/app.asar/preload.js')
var configpath = path.join(appPath, '/resources/config.json')
if(process.env.NODE_ENV == "development"){
    let appPath = app.getAppPath()
    icon =  `${appPath}/logo1.ico`
    preloadjs =  `${appPath}/preload.js`
    configpath =  `${appPath}/config.json`
}
var AppName = "OSIM聊天软件"
let confstr = fs.readFileSync(configpath, "utf8")
osim.confjson = JSON.parse(confstr.toString())

var tray;
app.on('ready', function () {

    require("./_ipcMain");
    mainWindow = new BrowserWindow({
        title: AppName,
        width: 1280,
        height: 750,
        icon,
        fullscreen: false,
        frame: false,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            zoomFactor: 1,
            preload: preloadjs
        }
    });

    if(process.env.NODE_ENV == "development"){
        mainWindow.loadURL("http://127.0.0.1:8080/")
    }else{
        mainWindow.loadFile("./index.html");
        mainWindow.menuBarVisible = false;  //隐藏菜单
    }

    mainWindow.on('close', function (e) {
        // mainWindow.hide();
        // e.preventDefault();
    });

    if (process.platform == 'win32') {
        tray = new Tray(icon)
        var contextMenu = Menu.buildFromTemplate([
            {
                label: '打开主页', click: () => {
                    mainWindow.show()
                }
            },
            {
                label: '退出', click: () => {
                    app.quit();
                }
            }
        ]);
        tray.setToolTip(AppName)
        tray.setContextMenu(contextMenu)
        tray.on('click', function () {
            mainWindow.show();
        })
    }

    ipcMain.on('openDevtools', (event, arg) => {
        if(mainWindow.webContents.isDevToolsOpened()){
            mainWindow.webContents.closeDevTools()
        }else{
            mainWindow.webContents.openDevTools()
        }
    })

});