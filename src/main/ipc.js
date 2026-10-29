import path from 'node:path'
import { BrowserWindow, ipcMain } from 'electron'
import { CHANNELS, ERR, ok, fail } from '../shared/ipc-channels.js'
import * as fileService from './services/file-service.js'
import * as themeService from './services/theme-service.js'

// IPC 注册唯一入口（契约版）：
// - invoke/handle 一问一答 + 统一响应包；sender 白名单校验（清单 #17）
// - 文件动作委托 file-service，主题委托 theme-service（T-004/T-005）
// - 广播: file:opened / file:saved / theme:changed / app:command（契约 §4）

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

export function sendAppCommand(win, id) {
    const target = BrowserWindow.getFocusedWindow() || win
    if (target && !target.isDestroyed()) {
        target.webContents.send(CHANNELS.APP_COMMAND, { id })
    }
}

// 菜单触发的主进程侧入口（ipc.js 对 commands.js 的唯一出口）
export function openViaMenu(win) {
    const target = BrowserWindow.getFocusedWindow() || win
    if (target && !target.isDestroyed()) {
        return invokeFileOpen(target.webContents)
    }
    return ok({ canceled: true, path: null, content: null })
}

export function toggleThemeMenu(win) {
    const target = BrowserWindow.getFocusedWindow() || win
    if (target && !target.isDestroyed()) {
        themeService.toggleTheme()
        themeService.broadcastTheme()
    }
    return ok(themeService.current())
}

function invokeFileOpen(sender) {
    return fileService.openViaDialog().then(result => {
        if (!result.canceled) {
            sender.send(CHANNELS.FILE_OPENED, { path: result.path, content: result.content })
        }
        return result
    })
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

    handle(CHANNELS.FILE_OPEN, (sender) => invokeFileOpen(sender))
    handle(CHANNELS.FILE_SAVE, (sender, payload) => {
        return fileService.save(payload).then(result => {
            sender.send(CHANNELS.FILE_SAVED, { path: result.path })
            return result
        })
    })
    handle(CHANNELS.FILE_SAVE_AS, (sender, payload) => {
        return fileService.saveAs(payload).then(result => {
            if (result.path) {
                sender.send(CHANNELS.FILE_SAVED, { path: result.path })
            }
            return result
        })
    })
    handle(CHANNELS.FILE_CURRENT, () => fileService.currentFile())
    handle(CHANNELS.THEME_TOGGLE, () => {
        const result = themeService.toggleTheme()
        themeService.broadcastTheme()
        return result
    })
    handle(CHANNELS.THEME_CURRENT, () => themeService.current())
}
