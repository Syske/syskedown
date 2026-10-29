import { app, Menu } from 'electron'
import { createMainWindow } from './window.js'
import { buildApplicationMenu, findReopenMenuItem } from './menu.js'
import { registerIpc } from './ipc.js'
import { executeCommand } from './commands.js'
import { initStore } from './services/store.js'
import { initTheme } from './services/theme-service.js'

if (process.mas) app.setName('syskedown - 开源、易用的markdown编辑器')

let mainWindow = null

app.on('ready', function () {
    initStore() // 先于任何 recentFile / themeSource 读取（含旧 db.json 只读迁移）
    initTheme()
    const menu = buildApplicationMenu({
        getWindow: () => mainWindow,
        exec: executeCommand
    })
    Menu.setApplicationMenu(menu)
    registerIpc()
    mainWindow = createMainWindow()
    mainWindow.on('closed', function () {
        mainWindow = null
    })
})

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit()
})

app.on('activate', function () {
    if (mainWindow === null) mainWindow = createMainWindow()
})

app.on('browser-window-created', function () {
    const reopenMenuItem = findReopenMenuItem()
    if (reopenMenuItem) reopenMenuItem.enabled = false
})

