import { nativeTheme, BrowserWindow } from 'electron'
import { CHANNELS } from '../../shared/ipc-channels.js'
import { get, set } from './store.js'

// 主题服务（T-005）：nativeTheme 单一事实源 + 全窗口广播 + themeSource 持久化

const VALID_SOURCES = ['system', 'light', 'dark']

export function initTheme() {
    const saved = get('themeSource', 'system')
    if (VALID_SOURCES.includes(saved)) {
        nativeTheme.themeSource = saved
    }
    // 系统主题变化（含手动设置 system 后的跟随）→ 广播
    nativeTheme.on('updated', () => broadcastTheme())
}

export function toggleTheme() {
    nativeTheme.themeSource = nativeTheme.shouldUseDarkColors ? 'light' : 'dark'
    set('themeSource', nativeTheme.themeSource)
    return current()
}

export function current() {
    return { isDark: nativeTheme.shouldUseDarkColors }
}

export function broadcastTheme() {
    const payload = current()
    for (const win of BrowserWindow.getAllWindows()) {
        if (!win.isDestroyed()) {
            win.webContents.send(CHANNELS.THEME_CHANGED, payload)
        }
    }
}
