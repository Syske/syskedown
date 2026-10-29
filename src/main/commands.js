import { shell } from 'electron'
import { COMMAND_ID } from '../shared/ipc-channels.js'
import { loadEditorPage, loadLegacyPage } from './window.js'
import { sendAppCommand, openViaMenu, toggleThemeMenu } from './ipc.js'

// 命令注册表：菜单/快捷键 → 主进程动作或 app:command 渲染层转发。
// 文件/主题动作归主进程；编辑器内容动作经 app:command（契约 §4/§5）。

// 重新加载（旧版自定义逻辑：关闭 id>1 的窗口后 reload 主窗口）
function reloadMain(focusedWindow) {
    if (focusedWindow) {
        if (focusedWindow.id === 1) {
            const { BrowserWindow } = require('electron')
            BrowserWindow.getAllWindows().forEach(function (win) {
                if (win.id > 1) {
                    win.close()
                }
            })
        }
        focusedWindow.reload()
    }
}

export function executeCommand(win, id) {
    switch (id) {
        case COMMAND_ID.NEW_FILE:
        case COMMAND_ID.CODE_BLOCK:
            return // 未实现（菜单已标注）
        case COMMAND_ID.OPEN_FILE:
            return openViaMenu(win)
        case COMMAND_ID.SAVE:
            return sendAppCommand(win, COMMAND_ID.SAVE)
        case COMMAND_ID.RELOAD:
            return reloadMain(win)
        case COMMAND_ID.UNDO:
            return sendAppCommand(win, COMMAND_ID.UNDO)
        case COMMAND_ID.REDO:
            return sendAppCommand(win, COMMAND_ID.REDO)
        case COMMAND_ID.HEADING_1:
        case COMMAND_ID.HEADING_2:
        case COMMAND_ID.HEADING_3:
        case COMMAND_ID.HEADING_4:
        case COMMAND_ID.HEADING_5:
        case COMMAND_ID.HEADING_6:
            return sendAppCommand(win, id)
        case COMMAND_ID.THEME_TOGGLE:
            return toggleThemeMenu(win)
        case COMMAND_ID.EDITOR_VDITOR:
            return loadEditorPage(win)
        case COMMAND_ID.EDITOR_CODEMIRROR:
            return loadLegacyPage(win, 'codemirror-index.html')
        case COMMAND_ID.EDITOR_HYPERMD:
            return loadLegacyPage(win, 'index-hyperMD.html')
        case COMMAND_ID.PROJECT_HOME:
            return shell.openExternal('https://github.com/Syske/syskedown')
        case COMMAND_ID.FEEDBACK:
            return shell.openExternal('https://github.com/Syske/syskedown/issues')
        default:
            console.warn('unknown command:', id)
    }
}
