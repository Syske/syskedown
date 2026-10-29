import fs from 'node:fs'
import { dialog, BrowserWindow } from 'electron'
import { ERR } from '../../shared/ipc-channels.js'
import { get, set } from './store.js'

// 文件服务（T-004 自 ipc.js 抽取）：对话框 + UTF-8 读写 + 错误分类
// recentFile 存于 userData state.json（迁移自旧 electron-localstorage file-name）

const MD_FILTERS = [
    { name: 'Markdown File', extensions: ['md'] },
    { name: 'All Files', extensions: ['*'] }
]

function readUtf8(p) {
    const content = fs.readFileSync(p, 'utf-8')
    if (content.includes('\uFFFD')) {
        const err = new Error('not valid utf-8 text')
        err.code = ERR.READ
        throw err
    }
    return content
}

function writeUtf8(p, content) {
    fs.writeFileSync(p, content, 'utf-8')
}

export function getRecentFile() {
    return get('recentFile', null)
}

function setRecentFile(p) {
    set('recentFile', p)
}

// 打开：对话框 → 读取 → recentFile；返回 {canceled, path, content}
export async function openViaDialog() {
    const win = BrowserWindow.getFocusedWindow()
    const result = await dialog.showOpenDialog(win, {
        title: '打开文件',
        properties: ['openFile'],
        filters: MD_FILTERS
    })
    if (result.canceled || !result.filePaths || result.filePaths.length < 1) {
        return { canceled: true, path: null, content: null }
    }
    const p = result.filePaths[0]
    const content = readUtf8(p) // 失败抛 E-READ
    setRecentFile(p)
    return { canceled: false, path: p, content }
}

// 保存：path 缺省取 recentFile；无可用路径抛 E-NO-PATH（渲染层转 saveAs）
export async function save(payload) {
    const p = (payload && payload.path) || getRecentFile()
    if (!p) {
        const err = new Error('no save target; use saveAs')
        err.code = ERR.NO_PATH
        throw err
    }
    writeUtf8(p, (payload && payload.content) || '') // 失败抛 E-WRITE
    setRecentFile(p)
    return { path: p }
}

// 另存为：对话框 → 写入 → recentFile；返回 {path}（取消 path=null）
export async function saveAs(payload) {
    const result = await dialog.showSaveDialog({
        title: '保存文件',
        filters: MD_FILTERS
    })
    if (result.canceled || !result.filePath) {
        return { path: null }
    }
    const p = result.filePath
    writeUtf8(p, (payload && payload.content) || '') // 失败抛 E-WRITE
    setRecentFile(p)
    return { path: p }
}

export function currentFile() {
    return { path: getRecentFile() }
}
