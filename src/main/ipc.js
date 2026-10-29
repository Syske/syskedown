import path from 'node:path'
import fs from 'node:fs'
import { BrowserWindow, dialog, ipcMain, nativeTheme } from 'electron'
import storage from 'electron-localstorage'
import { CHANNELS, COMMAND_ID, ERR, ok, fail } from '../shared/ipc-channels.js'

// IPC 注册唯一入口（T-003 契约版）：
// - invoke/handle 一问一答 + 统一响应包
// - sender 白名单校验（官方安全清单 #17）
// - 调试通道与旧通道全部淘汰（契约 §7）
// 文件动作内联于本文件（T-004 抽取为 services/file-service.js + userData 存储迁移）

const recentFileKey = 'file-name' // T-004 迁移为 userData state.json

function trustedPrefixes() {
    const list = []
    if (process.env['ELECTRON_RENDERER_URL']) {
        list.push(String(process.env['ELECTRON_RENDERER_URL']))
    }
    list.push('file://' + path.join(__dirname, '../renderer'))
    return list
}

function trustedSender(event) {
    const frame = event.senderFrame
    if (!frame) return false
    const url = frame.url || ''
    return trustedPrefixes().some(p => url === p || url.startsWith(p + '/') || url.startsWith(p + '?'))
}

function getRecentFile() {
    return storage.getItem(recentFileKey) || null
}

function setRecentFile(p) {
    storage.setItem(recentFileKey, p)
}

function readFileContent(p) {
    // 非 UTF-8 可解码文本 / 不存在 / 无权限 → E-READ
    const content = fs.readFileSync(p, 'utf-8')
    if (content.includes('\uFFFD')) {
        const err = new Error('not valid utf-8 text')
        err.code = ERR.READ
        throw err
    }
    return content
}

function writeFileContent(p, content) {
    fs.writeFileSync(p, content, 'utf-8')
}

// file:open 处理：对话框 → 读取 → recentFile → 广播 file:opened
async function doOpen(sender) {    const result = await dialog.showOpenDialog(BrowserWindow.getFocusedWindow(), {
        title: '打开文件',
        properties: ['openFile'],
        filters: [
            { name: 'Markdown File', extensions: ['md'] },
            { name: 'All Files', extensions: ['*'] }
        ]
    })
    if (result.canceled || !result.filePaths || result.filePaths.length < 1) {
        return { canceled: true, path: null, content: null }
    }
    const p = result.filePaths[0]
    const content = readFileContent(p)
    setRecentFile(p)
    sender.send(CHANNELS.FILE_OPENED, { path: p, content })
    return { canceled: false, path: p, content }
}

// file:save 处理：path 缺省取 recentFile；无可用路径 → E-NO-PATH（渲染层转 saveAs）
async function doSave(sender, payload) {
    const p = (payload && payload.path) || getRecentFile()
    if (!p) {
        return fail(ERR.NO_PATH, 'no save target; use file:saveAs')
    }
    try {
        writeFileContent(p, (payload && payload.content) || '')
    } catch (e) {
        return fail(ERR.WRITE, String(e && e.message || e))
    }
    setRecentFile(p)
    sender.send(CHANNELS.FILE_SAVED, { path: p })
    return { path: p }
}

// file:saveAs 处理：保存对话框 → 写入 → recentFile
async function doSaveAs(sender, payload) {
    const result = await dialog.showSaveDialog({
        title: '保存文件',
        filters: [
            { name: 'Markdown File', extensions: ['md'] },
            { name: 'All Files', extensions: ['*'] }
        ]
    })
    if (result.canceled || !result.filePath) {
        return { path: null }
    }
    const p = result.filePath
    try {
        writeFileContent(p, (payload && payload.content) || '')
    } catch (e) {
        return fail(ERR.WRITE, String(e && e.message || e))
    }
    setRecentFile(p)
    sender.send(CHANNELS.FILE_SAVED, { path: p })
    return { path: p }
}

function toggleTheme(sender) {
    nativeTheme.themeSource = nativeTheme.shouldUseDarkColors ? 'light' : 'dark'
    const isDark = nativeTheme.shouldUseDarkColors
    sender.send(CHANNELS.THEME_CHANGED, { isDark })
    return { isDark }
}

// 菜单触发的主进程侧入口（ipc.js 对 commands.js 的唯一出口）
export function openViaMenu(win) {
    const target = BrowserWindow.getFocusedWindow() || win
    if (target && !target.isDestroyed()) {
        return doOpen(target.webContents)
    }
    return { canceled: true, path: null, content: null }
}

export function toggleThemeMenu(win) {
    const target = BrowserWindow.getFocusedWindow() || win
    if (target && !target.isDestroyed()) {
        toggleTheme(target.webContents)
    }
}

// 菜单命令广播（主 → 渲染）
export function sendAppCommand(win, id) {
    const target = BrowserWindow.getFocusedWindow() || win
    if (target && !target.isDestroyed()) {
        target.webContents.send(CHANNELS.APP_COMMAND, { id })
    }
}

export function registerIpc() {
    const handle = (channel, fn) => {
        ipcMain.handle(channel, async (event, payload) => {
            if (!trustedSender(event)) {
                return fail(ERR.FORBIDDEN_SENDER, 'untrusted sender frame')
            }
            try {
                return ok(await fn(event.sender, payload))
            } catch (e) {
                if (e && e.code && Object.values(ERR).includes(e.code)) {
                    return fail(e.code, String(e.message || e))
                }
                return fail(ERR.UNKNOWN, String(e && e.message || e))
            }
        })
    }

    handle(CHANNELS.FILE_OPEN, (sender) => doOpen(sender))
    handle(CHANNELS.FILE_SAVE, (sender, payload) => doSave(sender, payload))
    handle(CHANNELS.FILE_SAVE_AS, (sender, payload) => doSaveAs(sender, payload))
    handle(CHANNELS.FILE_CURRENT, () => ({ path: getRecentFile() }))
    handle(CHANNELS.THEME_TOGGLE, (sender) => toggleTheme(sender))
    handle(CHANNELS.THEME_CURRENT, () => ({ isDark: nativeTheme.shouldUseDarkColors }))
}
