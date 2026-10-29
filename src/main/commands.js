import { BrowserWindow, dialog, shell } from 'electron'
import fs from 'node:fs'
import storage from 'electron-localstorage'
import { COMMANDS, HEADING_PREFIX, LEGACY_CHANNELS } from './constants.js'
import { loadEditorPage, loadLegacyPage } from './window.js'

// 命令注册表：菜单/快捷键 → 主进程动作或渲染层转发。
// T-002 过渡版沿用旧通道与载荷（行为等价）；T-003 切换契约通道。

function sendToFocused(win, channel, payload) {
    const target = BrowserWindow.getFocusedWindow() || win
    if (target && !target.isDestroyed()) {
        target.webContents.send(channel, payload)
    }
}

// 文件动作（T-004 迁入 file-service）
export function openFile(win) {
    dialog.showOpenDialog(win, {
        title: "打开文件",
        properties: ['openFile'],
        filters: [
            { name: 'Markdown File', extensions: ['md'] },
            { name: 'All Files', extensions: ['*'] }
        ]
    }).then(result => {
        const files = result.filePaths;
        if (files && files.length >= 1) {
            const file = files[0];
            storage.setItem("file-name", file)
            const content = fs.readFileSync(file);
            sendToFocused(win, LEGACY_CHANNELS.OPEN_FILE, content.toString());
        }
    }).catch(err => {
        console.log(err)
    })
}

export function saveAs(name) {
    dialog.showSaveDialog({
        title: '保存文件',
        defaultPath: name,
        filters: [
            { name: 'Markdown File', extensions: ['md'] },
            { name: 'All Files', extensions: ['*'] }
        ]
    }).then(result => {
        if (!result.canceled) {
            storage.setItem("file-name", result.filePath)
            BrowserWindow.getFocusedWindow().webContents.send(LEGACY_CHANNELS.SAVE_FILE, result.filePath);
        } else {
            console.log("user canceled")
        }
    }).catch(err => {
        console.log(err);
    })
}

// 重新加载（旧版自定义逻辑：关闭 id>1 的窗口后 reload 主窗口）
function reloadMain(focusedWindow) {
    if (focusedWindow) {
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

export function executeCommand(win, id) {
    switch (id) {
        case COMMANDS.NEW_FILE:
        case COMMANDS.CODE_BLOCK:
            return // 未实现（菜单已标注）
        case COMMANDS.OPEN_FILE:
            return openFile(win)
        case COMMANDS.SAVE: {
            const fileName = storage.getItem("file-name")
            if (fileName === undefined || fileName === null || fileName === '') {
                return sendToFocused(win, LEGACY_CHANNELS.FILE_NAME);
            }
            return sendToFocused(win, LEGACY_CHANNELS.SAVE_FILE, fileName);
        }
        case COMMANDS.RELOAD:
            return reloadMain(win)
        case COMMANDS.UNDO:
            return sendToFocused(win, LEGACY_CHANNELS.MD_HOT_KEY_NO_VALUE, 'undo')
        case COMMANDS.REDO:
            return sendToFocused(win, LEGACY_CHANNELS.MD_HOT_KEY_NO_VALUE, 'redo')
        case COMMANDS.THEME_TOGGLE:
            return sendToFocused(win, LEGACY_CHANNELS.THEME_CHANGE)
        case COMMANDS.EDITOR_VDITOR:
            return loadEditorPage(win)
        case COMMANDS.EDITOR_CODEMIRROR:
            return loadLegacyPage(win, 'codemirror-index.html')
        case COMMANDS.EDITOR_HYPERMD:
            return loadLegacyPage(win, 'index-hyperMD.html')
        case COMMANDS.PROJECT_HOME:
            return shell.openExternal('https://github.com/Syske/syskedown')
        case COMMANDS.FEEDBACK:
            return shell.openExternal('https://github.com/Syske/syskedown/issues')
        default:
            if (HEADING_PREFIX[id]) {
                return sendToFocused(win, LEGACY_CHANNELS.MD_HOT_KEY, HEADING_PREFIX[id])
            }
            console.warn('unknown command:', id)
    }
}
