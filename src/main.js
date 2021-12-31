const path = require('path')
const electron = require("electron")
const app = electron.app
const BrowserWindow = electron.BrowserWindow
const { ipcMain, nativeTheme } = require("electron")
const Menu = electron.Menu
const UUID = require("es6-uuid");
const storage = require('electron-localstorage')
const { dialog } = require('electron')
storage.setStoragePath(path.join(__dirname, 'db.json'))

if (process.mas) app.setName('syskedown - 开源、易用的markdown编辑器')

let mainWindow;

function createWindow() {
    console.log('主进程日志')
    let windowOptions = {
        width: 1220,
        height: 780,
        minWidth: 1220,
        minHeight: 780,
        title: app.getName(),
        themeSource: 'dark',
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            enabledRemoteModule: true,
            preload: path.join('/preload.js')
        }
    }

    if (process.platform === 'linux') {
        windowOptions.icon = path.join(__dirname, '/app/ico/your-ico.png')
    }

    mainWindow = new BrowserWindow(windowOptions);
    console.log(__dirname)
    mainWindow.loadURL(path.join('file://', __dirname, '../vditor-index.html'))

    mainWindow.on('closed', function () {
        mainWindow = null
    })

    mainWindow.webContents.openDevTools({
        mode: 'bottom'
    });
    mainWindow.$ = mainWindow.jQuery = require("jquery");
    const sessionId = UUID(32);
    console.log("session-id", sessionId);
    storage.setItem("sessionId", sessionId)
    

    // 在主进程中.
    ipcMain.on('asynchronous-message', (event, arg) => {
        console.log(arg) // prints "ping"
        event.reply('asynchronous-reply', 'pong')
    })

    ipcMain.on('synchronous-message', (event, arg) => {
        console.log(arg) // prints "ping"
        event.returnValue = 'pong'
    })
    ipcMain.on('getFileName', (event, arg) => {
        console.log("main - getFileName:", arg) // prints "ping"
        save(arg)
    })
}

app.on('ready', function () {
    const menu = Menu.buildFromTemplate(template)
    Menu.setApplicationMenu(menu) // 设置菜单部分
    createWindow();
})

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit()
})

app.on('activate', function () {
    if (mainWindow === null) createWindow()
})

app.on('browser-window-created', function () {
    let reopenMenuItem = findReopenMenuItem()
    if (reopenMenuItem) reopenMenuItem.enabled = false
})

app.on('window-all-closed', function () {
    let reopenMenuItem = findReopenMenuItem()
    if (reopenMenuItem) reopenMenuItem.enabled = true
    app.quit()
});

ipcMain.handle('dark-mode:toggle', () => {
    if (nativeTheme.shouldUseDarkColors) {
        nativeTheme.themeSource = 'light'
    } else {
        nativeTheme.themeSource = 'dark'
    }
    return nativeTheme.shouldUseDarkColors;
});

ipcMain.handle('dark-mode:system', () => {
    nativeTheme.themeSource = 'system'
});


function openFile(focusedWindow) {
    
    dialog.showOpenDialog(mainWindow, {
        title: "打开文件",
        properties: ['openFile'],
        filters: [
            { name: 'Markdown File', extensions: ['md'] },
            { name: 'All Files', extensions: ['*'] }
        ]
    }).then(result => {
        console.log(result.canceled)
        console.log(result.filePaths)
        // 读取文件内容
        const fs = require("fs");
        const files = result.filePaths;
        if (files && files.length >= 1) {
            const file = files[0];
            console.log("file:", file);
            storage.setItem("file-name", file)
            console.log(file)
            const content = fs.readFileSync(file);
            console.log(content.toString());
            console.log(mainWindow)
            focusedWindow.webContents.send('open_file', content.toString());

        }

    }).catch(err => {
        console.log(err)
    })
}

function save(path) {
    console.log("main - path:", path)
    dialog.showSaveDialog({
        title: '保存文件',
        defaultPath: path,
        filters: [
            { name: 'Markdown File', extensions: ['md'] },
            { name: 'All Files', extensions: ['*'] }
        ]
    }).then(result => {
        console.log(result);
        if (!result.canceled) {
            storage.setItem("file-name", result.filePath)
            BrowserWindow.getFocusedWindow().webContents.send('save-file', result.filePath);
        } else {
            console.log("user canceled")
        }
        
    }).catch(err => {
        console.log(err);
    })
}


/**
 * 注册键盘快捷键
 * 其中：label: '切换开发者工具',这个可以在发布时注释掉
 */
let template = [
    {
        label: '文件(F)',
        submenu: [{
            label: '新建',
            accelerator: 'CmdOrCtrl+N',
            role: 'new',
            click: function (item, focusedWindow) {
                console.log("新建")
            }
        }, {
            label: '打开',
            accelerator: 'CmdOrCtrl+O',
            role: 'open',
            click: function (item, focusedWindow) {
                openFile(focusedWindow);
            }
        }, {
            label: '保存',
            accelerator: 'CmdOrCtrl+S',
            role: 'save',
            click: function (item, focusedWindow) {
                console.log(focusedWindow)
                console.log(item)
                var fileName = storage.getItem("file-name")
                console.log("fileName: ", fileName)
                if (fileName === undefined || fileName === null || fileName === '') {
                    focusedWindow.webContents.send('file_name');
                } else {
                    focusedWindow.webContents.send('save-file', fileName);
                }
                
                console.log(storage.getItem("file-name"))
                //save(storage.getItem("file-name"), focusedWindow)
            }
        }, {
            label: '重新加载',
            accelerator: 'CmdOrCtrl+R',
            role: 'reload',
            click: function (item, focusedWindow) {
                if (focusedWindow) {
                    // on reload, start fresh and close any old
                    // open secondary windows
                    if (focusedWindow.id === 1) {
                        BrowserWindow.getAllWindows().forEach(function (win) {
                            if (win.id > 1) {
                                win.close()
                            }
                        })
                    }
                    focusedWindow.reload()
                }
            }
        }, {
            type: 'separator'
        }, {
            label: 'Minimize ( 最小化 )',
            accelerator: 'CmdOrCtrl+M',
            role: 'minimize'
        }, {
            type: 'separator'
        }, {
            label: 'Close ( 关闭 )',
            accelerator: 'CmdOrCtrl+W',
            role: 'close'
        }]
    },
    {
        label: '编辑',
        role: 'window',
        submenu: [{
            label: '撤销',
            accelerator: 'CmdOrCtrl+Z',
            click: function () {
                console.log("撤销");
                BrowserWindow.getFocusedWindow().webContents.send('md-hot-key-no-value', "undo");
            }
        }, {
            label: '重做',
            accelerator: 'CmdOrCtrl+Y',
            click: function () {
                console.log("重做");
                BrowserWindow.getFocusedWindow().webContents.send('md-hot-key-no-value', "redo");
            }
        }, {
            type: 'separator'
        }, {
            label: '剪贴',
            accelerator: 'CmdOrCtrl+X',
            role: 'cut'
        }, {
            label: '复制',
            accelerator: 'CmdOrCtrl+V',
            role: 'copy'
        }, {
            label: '粘贴',
            accelerator: 'CmdOrCtrl+P',
            role: 'paste'
        }]
    },
    {
        label: '段落',
        role: 'help',
        submenu: [{
            label: '一级目录',
            accelerator: 'CmdOrCtrl+1',
            click: function () {
                console.log("一级目录");
                BrowserWindow.getFocusedWindow().webContents.send('md-hot-key', "# ");
            }
        }, {
            label: '二级目录',
            accelerator: 'CmdOrCtrl+2',
            click: function () {
                console.log("二级目录")
                BrowserWindow.getFocusedWindow().webContents.send('md-hot-key', "## ");
            }
        }, {
            label: '三级目录',
            accelerator: 'CmdOrCtrl+3',
            click: function () {
                console.log("三级目录")
                BrowserWindow.getFocusedWindow().webContents.send('md-hot-key', "### ");
            }
        }, {
            label: '四级目录',
            accelerator: 'CmdOrCtrl+4',
            click: function () {
                console.log("四级目录")
                BrowserWindow.getFocusedWindow().webContents.send('md-hot-key', "#### ");
            }
        }, {
            label: '五级目录',
            accelerator: 'CmdOrCtrl+5',
            click: function () {
                console.log("五级目录")
                BrowserWindow.getFocusedWindow().webContents.send('md-hot-key', "##### ");
            }
        }, {
            label: '六级目录',
            accelerator: 'CmdOrCtrl+6',
            click: function () {
                console.log("六级目录")
                BrowserWindow.getFocusedWindow().webContents.send('md-hot-key', "###### ");
            }
        }, {
            type: 'separator'
        }, {
            label: '代码块',
            accelerator: 'CmdOrCtrl+Shift+k',
            click: function () {
                console.log("代码块")
            }
        }, {
            label: '编辑器',
            click: function () {
                mainWindow.loadURL(path.join('file://', __dirname, '../codemirror-index.html'))
            }
        }]
    },
    {
        label: '格式',
        role: 'help',
        submenu: [{
            label: '加粗',
            accelerator: 'CmdOrCtrl+B'
      
        }, {
            label: '斜线',
            accelerator: 'CmdOrCtrl+I' 

        }, {
            label: '下划线',
            accelerator: 'CmdOrCtrl+U'

        }, {
            label: '代码',
            accelerator: 'CmdOrCtrl+shift+`'
            
        }, {
            label: '删除线',
            accelerator: 'CmdOrCtrl+alt+D'

        }, {
            label: '超链接',
            accelerator: 'CmdOrCtr+K'
            
        }, {
            label: '图片',
            accelerator: 'CmdOrCtrl+alt+I'
            
        }, {
            type: 'separator'
        }, {
            label: '首页',
            click: function () {
                mainWindow.loadURL(path.join('file://', __dirname, '../inedex.html'))
            }
        }]
    },
    {
        label: '视图',
        role: 'help',
        submenu: [{
            label: '切换开发者工具',
            accelerator: (function () {
                if (process.platform === 'darwin') {
                    return 'Alt+Command+I'
                } else {
                    return 'Ctrl+Shift+I'
                }
            })(),
            click: function (item, focusedWindow) {
                if (focusedWindow) {
                    focusedWindow.toggleDevTools()
                }
            }
        }, {
            label: 'vditor',
            click: function () {
                mainWindow.loadURL(path.join('file://', __dirname, '../vditor-index.html'))
            }
        }, {
            label: 'hyperMD',
            click: function () {
                mainWindow.loadURL(path.join('file://', __dirname, '../index-hyperMD.html'))
            }
        }]
    },
    {
        label: '主题',
        role: 'help',
        submenu: [{
            label: '主题样式',
            click: function ()  {
                
            }
        }, {
            label: '主题切换',
            click: function ()  {
                console.log(nativeTheme.themeSource)
                BrowserWindow.getFocusedWindow().webContents.send('theme-chanage');
            }
        }]
    },
    {
        label: '帮助',
        role: 'help',
        submenu: [{
            label: '项目信息',
            click: function ()  {
                electron.shell.openExternal('https://github.com/Syske/syskedown')
            }
        }, {
            label: '意见反馈',
            click: function () {
                electron.shell.openExternal('https://github.com/Syske/syskedown/issues')
            }
        }, {
            label: '关于',
            click: function ()  {
                   
            }
        }]
    }
]

/**
 * 增加更新相关的菜单选项
 */
function addUpdateMenuItems(items, position) {
    if (process.mas) return

    const version = electron.app.getVersion()
    let updateItems = [{
        label: `Version ${version}`,
        enabled: false
    }, {
        label: 'Checking for Update',
        enabled: false,
        key: 'checkingForUpdate'
    }, {
        label: 'Check for Update',
        visible: false,
        key: 'checkForUpdate',
        click: function () {
            require('electron').autoUpdater.checkForUpdates()
        }
    }, {
        label: 'Restart and Install Update',
        enabled: true,
        visible: false,
        key: 'restartToUpdate',
        click: function () {
            require('electron').autoUpdater.quitAndInstall()
        }
    }]

    items.splice.apply(items, [position, 0].concat(updateItems))
}

function findReopenMenuItem() {
    const menu = Menu.getApplicationMenu()
    if (!menu) return

    let reopenMenuItem
    menu.items.forEach(function (item) {
        if (item.submenu) {
            item.submenu.items.forEach(function (item) {
                if (item.key === 'reopenMenuItem') {
                    reopenMenuItem = item
                }
            })
        }
    })
    return reopenMenuItem
}

// 针对Mac端的一些配置
if (process.platform === 'darwin') {
    const name = electron.app.getName()
    template.unshift({
        label: name,
        submenu: [{
            label: 'Quit ( 退出 )',
            accelerator: 'Command+Q',
            click: function () {
                app.quit()
            }
        }]
    })

    // Window menu.
    template[3].submenu.push({
        type: 'separator'
    }, {
        label: 'Bring All to Front',
        role: 'front'
    })

    addUpdateMenuItems(template[0].submenu, 1)
}

// 针对Windows端的一些配置
if (process.platform === 'win32') {
    const helpMenu = template[template.length - 1].submenu
    addUpdateMenuItems(helpMenu, 0)
}

