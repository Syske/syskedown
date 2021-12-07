const electron = require('electron')
const { property } = require('lodash')
const app = electron.app
const BrowserWindow = electron.BrowserWindow
const Menu = electron.Menu
const path = require('path')
const { ipcMain } = require("electron")

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
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            preload: path.join('/preload.js')
        }
    }

    if (process.platform === 'linux') {
        windowOptions.icon = path.join(__dirname, '/app/ico/your-ico.png')
    }

    mainWindow = new BrowserWindow(windowOptions);
    console.log(__dirname)
    mainWindow.loadURL(path.join('file://', __dirname, 'index.html'))

    mainWindow.on('closed', function () {
        mainWindow = null
    })

    mainWindow.webContents.openDevTools({
        mode: 'bottom'
    });

    // 在主进程中.
    ipcMain.on('asynchronous-message', (event, arg) => {
        console.log(arg) // prints "ping"
        event.reply('asynchronous-reply', 'pong')
    })

    ipcMain.on('synchronous-message', (event, arg) => {
        console.log(arg) // prints "ping"
        event.returnValue = 'pong'
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
})


function openFile() {
    const { dialog } = require('electron')
    dialog.showOpenDialog(mainWindow, {
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
            console.log("file:", files[0]);
            const content = fs.readFileSync(files[0]);
            console.log(content.toString());
            console.log(mainWindow)
            BrowserWindow.getFocusedWindow().webContents.send('open_file', content.toString());
           }

    }).catch(err => {
        console.log(err)
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
            label: '打开',
            accelerator: 'CmdOrCtrl+O',
            role: 'open',
            click: function (item, focusedWindow) {
            openFile();
            }
        }, {
            label: 'Copy (复制)',
            accelerator: 'CmdOrCtrl+C',
            role: 'copy'
        }, {
            label: 'Paste ( 粘贴 )',
            accelerator: 'CmdOrCtrl+V',
            role: 'paste'
        }, {
            label: 'Reload ( 重新加载 )',
            accelerator: 'CmdOrCtrl+R',
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
        }]
    },
    {
        label: '编辑',
        role: 'window',
        submenu: [{
            label: 'Minimize ( 最小化 )',
            accelerator: 'CmdOrCtrl+M',
            role: 'minimize'
        }, {
            label: 'Close ( 关闭 )',
            accelerator: 'CmdOrCtrl+W',
            role: 'close'
        }, {
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
            type: 'separator'
        }]
    },
    {
        label: '段落',
        role: 'help',
        submenu: [{
            label: '编辑器',
            click: function () {
                mainWindow.loadURL(path.join('file://', __dirname, 'codemirror-index.html'))
            }
        }]
    },
    {
        label: '格式',
        role: 'help',
        submenu: [{
            label: '首页',
            click: function () {
                mainWindow.loadURL(path.join('file://', __dirname, 'inedex.html'))
            }
        }]
    },
    {
        label: '视图',
        role: 'help',
        submenu: [{
            label: 'FeedBack ( 意见反馈 )',
            click: function () {
                electron.shell.openExternal('https://forum.iptchain.net')
            }
        }]
    },
    {
        label: '主题',
        role: 'help',
        submenu: [{
            label: 'FeedBack ( 意见反馈 )',
            click: function () {
                electron.shell.openExternal('https://forum.iptchain.net')
            }
        }]
    },
    {
        label: '帮助',
        role: 'help',
        submenu: [{
            label: 'FeedBack ( 意见反馈 )',
            click: function () {
                electron.shell.openExternal('https://forum.iptchain.net')
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

