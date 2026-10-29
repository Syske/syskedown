import path from 'node:path'
import { BrowserWindow, app } from 'electron'

// 窗口创建与页面装载（T-002 自 index.js 拆出，行为等价）
export function createMainWindow() {
    const windowOptions = {
        width: 1220,
        height: 780,
        minWidth: 1220,
        minHeight: 780,
        title: app.getName(),
        themeSource: 'dark',
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            preload: path.join(__dirname, '../preload/index.js')
        }
    }

    if (process.platform === 'linux') {
        windowOptions.icon = path.join(__dirname, '/app/ico/your-ico.png')
    }

    const win = new BrowserWindow(windowOptions)
    loadEditorPage(win)
    win.webContents.openDevTools({ mode: 'bottom' })
    return win
}

// 编辑器主页装载（dev 走 electron-vite 开发服务器，生产加载打包入口）
export function loadEditorPage(win) {
    if (!app.isPackaged && process.env['ELECTRON_RENDERER_URL']) {
        win.loadURL(process.env['ELECTRON_RENDERER_URL'])
    } else {
        win.loadFile(path.join(__dirname, '../renderer/index.html'))
    }
}

// 旧原型页装载（codemirror/hyperMD 试验页保留至 T-007 删除）
export function loadLegacyPage(win, fileName) {
    win.loadURL(path.join('file://', __dirname, '../..', fileName))
}
