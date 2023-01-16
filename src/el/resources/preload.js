const { contextBridge, ipcRenderer } = require('electron')

window.osim = {
    openFile: (param=null) => ipcRenderer.invoke("osim.openFile", param),      //打开选择文件窗口
    selectFile: (type=1) => ipcRenderer.invoke("osim.selectFile", type),      //打开选择文件窗口，选择一个文件 ，1为所有类型的文件 ，2为图片
    openScreenshot: () => ipcRenderer.invoke("osim.openScreenshot"),      //打开屏幕截图窗口
    getimgScreenshot: () => ipcRenderer.invoke("osim.getimgScreenshot"),      //获取截图图片
    closeScreenshot: () => ipcRenderer.invoke("osim.closeScreenshot"),      //关闭截图窗口
    notify: (title, message) => ipcRenderer.invoke("osim.notify", title, message), 
    closewin: () => ipcRenderer.invoke("osim.closewin"),
    minwin: () => ipcRenderer.invoke("osim.minwin"),
    maxwin: () => ipcRenderer.invoke("osim.maxwin"),
    quit: () => ipcRenderer.invoke("osim.quit"),
    getUserDir: (uid) => ipcRenderer.invoke("osim.getUserDir",uid),
    //sqlite3操作
    opendb: (uid) => ipcRenderer.invoke("osim.opendb",uid),
    closedb: () => ipcRenderer.invoke("osim.closedb"),
    sqlexec: (sql) => ipcRenderer.invoke("osim.sqlexec",sql),
    sqlall: (sql) => ipcRenderer.invoke("osim.sqlall",sql),
    sqlget: (sql) => ipcRenderer.invoke("osim.sqlget",sql),
    cache_set: (k,v) => ipcRenderer.invoke("osim.cache_set",k,v),
    cache_get: (k) => ipcRenderer.invoke("osim.cache_get",k),
    cache_del: (k) => ipcRenderer.invoke("osim.cache_del",k),
    conf: () => ipcRenderer.invoke("osim.conf"),
    log: (msg, pre=null, host=null, port=null) => {
        if(typeof msg=='object') msg=JSON.stringify(msg,null, 6)
        ipcRenderer.invoke("osim.log", msg, pre, host, port)
    },
}