const {
    app,
    BrowserWindow,
    Notification,
    ipcMain,
    screen,
    dialog,
    globalShortcut,
    desktopCapturer,
    nativeImage,
} = require('electron')
const path = require("path");
const fs = require("fs");
const ffi = require('ffi-napi');
const dgram = require('dgram');



osim.log = (e, text, pre = null, host = null, port = null) => {
    // console.log("msg, pre, host, port", msg, pre, host, port)
    let client = dgram.createSocket("udp4")
    host = host || "127.0.0.1"
    port = port || 9460
    var date = new Date()
    var y = date.getFullYear()
    var m = date.getMonth() + 1
    var d = date.getDate()
    var h = date.getHours()
    var mm = date.getMinutes()
    var s = date.getSeconds()
    let timestring = y + "-" + m + "-" + d + " " + h + ":" + mm + ":" + s
    let msg = `======== [${timestring} ======== ${pre}]\n${text}`
    client.send(msg, port, host, (err, bytes) => {
        client.close()
    })
}


let appPath = path.dirname(app.getPath('exe'));
let icon = path.join(appPath, '/resources/app.asar/logo1.ico');
let preloadjs = path.join(appPath, '/resources/app.asar/preload.js');
let libfile = path.join(appPath, '/resources/libosim.dll');
// osim.log(null,libfile,"ipcMain","192.168.1.5")
if (process.env.NODE_ENV == "development") {
    appPath = app.getAppPath();
    icon = `${appPath}/logo1.ico`;
    preloadjs = `${appPath}/preload.js`;
    libfile = `${appPath}/libosim.dll`;
}

osim.lib = ffi.Library(libfile, {
    "_open": ["int", ["string"]],
    "_close1": ["int", ["string"]],
    "_createtable": ["int", []],
    "_select": ["string", ["string"]],
    "_execute": ["int", ["string"]],
    "_count": ["int", ["string"]],
    "_findone": ["string", ["string"]]
});

osim.openFile = async (e, param) => {
    let options = param || { title: "Open file" }
    const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, options);
    if (canceled) {
        return
    } else {
        return filePaths[0]
    }
}

osim.selectFile = async (e, type) => {
    let options = null;
    if (type == 1) {
        options = {
            title: "Open file",
            filters: [
                { name: 'All Files', extensions: ['*'] }
            ]
        }
    }
    else if (type == 2) {
        options = {
            title: "Select image.",
            filters: [
                { name: 'Images', extensions: ['jpg', 'png', 'gif'] }
            ]
        }
    }
    const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, options);
    if (canceled) {
        return
    } else {
        if (type == 2) {
            const image = nativeImage.createFromPath(filePaths[0])
            return image.toDataURL();
        } else {
            return filePaths[0]
        }
    }
}

osim.openScreenshot = async (e, param) => {

    let { width, height } = screen.getPrimaryDisplay().bounds;
    global.screenshotWin = new BrowserWindow({
        title: "屏幕截图",
        icon,
        fullscreen: process.platform == "win32" || undefined,
        width,
        height,
        transparent: true,
        frame: false,
        skipTaskbar: true,
        resizable: false,
        movable: false,
        minimizable: false,
        maximizable: false,
        alwaysOnTop: true,
        // autoHideMenuBar: true,
        enableLargerThanScreen: true,
        hasShadow: false,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            preload: preloadjs
        }
    })
    screenshotWin.setSkipTaskbar(true)  //不在任务栏显示

    if (process.env.NODE_ENV == "development") {
        screenshotWin.loadURL("http://127.0.0.1:8080/#/screenshot")
    } else {
        screenshotWin.loadFile("./index.html", { hash: "screenshot" });
    }
    screenshotWin.menuBarVisible = false;  //隐藏菜单

    //按退出时，关闭窗口
    globalShortcut.register('Esc', () => {
        if (screenshotWin) {
            screenshotWin.close();
            screenshotWin = null;
            globalShortcut.unregister('Esc');
        }
    });

    //当页面渲染完成时
    screenshotWin.on("read-to-show", () => {
        //
    })
    screenshotWin.hide();
    // mainWindow.hide();

}

osim.getimgScreenshot = async (e, param) => {
    let { bounds: { width, height }, scaleFactor } = screen.getPrimaryDisplay();
    let imgret = await desktopCapturer.getSources({
        types: ['screen'],
        thumbnailSize: {
            width: width * scaleFactor,
            height: height * scaleFactor
        }
    }).then((sources) => {
        let imgret = sources[0].thumbnail.toDataURL();
        return imgret;
    });
    screenshotWin.show();
    return imgret;
}

osim.closeScreenshot = (e, param) => {
    if (screenshotWin) {
        screenshotWin.close();
        screenshotWin = null;
        globalShortcut.unregister('Esc');
        // mainWindow.show();
        return true;
    } else {
        return false;
    }
}

osim.notify = async (e, title, message) => {
    new Notification({ title, body: message }).show()
}

osim.quit = (e) => {
    app.quit();
}

osim.closewin = (e) => {
    mainWindow.hide();
}

osim.maxwin = (e) => {
    if (mainWindow.isMaximized()) {
        mainWindow.unmaximize()
    } else {
        mainWindow.maximize()
    }
}

osim.minwin = (e) => {
    mainWindow.minimize()
}

osim.getUserDir = async (e, uid) => {
    if (!uid) {
        return false;
    }
    let datadir = `${appPath}/data/`;
    if (fs.existsSync(datadir) == false) {
        fs.mkdirSync(datadir);
    }
    let userdir = `${datadir}/${uid}/`;
    if (fs.existsSync(userdir) == false) {
        fs.mkdirSync(userdir);
    }
    return userdir;
}


osim.opendb = async (e, uid) => {
    let userdir = osim.getUserDir(uid);
    let dbpath = userdir + "/osim.db";
    osim.lib._open(dbpath);
}

osim.closedb = async (e) => {
    let userdir = osim.getUserDir(uid);
    let dbpath = userdir + "/osim.db";
    osim.lib._close1(dbpath);
}

osim.sqlexec = async (e, sql) => {
    let jsonString = osim.lib._execute(sql);
    return jsonString;
}

//查询多条数据
osim.sqlall = (e, sql) => {
    let jsonString = osim.lib._select(sql);
    return jsonString;
}

//查询一条数据
osim.sqlget = (e, sql) => {
    let jsonString = osim.lib._findone(sql);
    return jsonString;
}


osim.cache = {};
osim.cache_set = (e, k, v) => {
    osim.cache[k] = v
}

osim.cache_get = (e, k) => {
    return osim.cache[k]
}

osim.cache_del = (e, k) => {
    osim.cache[k] = undefined
}

osim.conf = (e)=>{
    return osim.confjson
}



ipcMain.handle("osim.openFile", osim.openFile)
ipcMain.handle("osim.selectFile", osim.selectFile)
ipcMain.handle("osim.openScreenshot", osim.openScreenshot);
ipcMain.handle("osim.getimgScreenshot", osim.getimgScreenshot);
ipcMain.handle("osim.closeScreenshot", osim.closeScreenshot)
ipcMain.handle("osim.notify", osim.notify)
ipcMain.handle("osim.quit", osim.quit)
ipcMain.handle("osim.closewin", osim.closewin)
ipcMain.handle("osim.minwin", osim.minwin)
ipcMain.handle("osim.maxwin", osim.maxwin)
ipcMain.handle("osim.getUserDir", osim.getUserDir)
//sqlite3操作
ipcMain.handle("osim.opendb", osim.opendb)
ipcMain.handle("osim.closedb", osim.closedb)
ipcMain.handle("osim.sqlexec", osim.sqlexec)
ipcMain.handle("osim.sqlall", osim.sqlall)
ipcMain.handle("osim.sqlget", osim.sqlget)
ipcMain.handle("osim.cache_set", osim.cache_set)
ipcMain.handle("osim.cache_get", osim.cache_get)
ipcMain.handle("osim.cache_del", osim.cache_del)
ipcMain.handle("osim.conf", osim.conf)
ipcMain.handle("osim.log", osim.log)


//注册全局截图快捷键
globalShortcut.register('CommandOrControl+Alt+X', osim.openScreenshot);