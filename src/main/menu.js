import { app, Menu } from 'electron'
import { COMMANDS } from './constants.js'

// 菜单 = 纯数据（label/accelerator/command 或系统 role）。
// 修正项（T-002）：role 误用移除（'window'/'help'）、CmdOrCtr 拼写、
// 空实现项标注"未实现"（保留空行为）、死链"首页"（inedex.html）移除。
function menuTemplate() {
    return [
        {
            label: '文件(F)',
            submenu: [
                { label: '新建（未实现）', accelerator: 'CmdOrCtrl+N' },
                { label: '打开', accelerator: 'CmdOrCtrl+O', command: COMMANDS.OPEN_FILE },
                { label: '保存', accelerator: 'CmdOrCtrl+S', command: COMMANDS.SAVE },
                { label: '重新加载', accelerator: 'CmdOrCtrl+R', role: 'reload', command: COMMANDS.RELOAD },
                { type: 'separator' },
                { label: 'Minimize ( 最小化 )', accelerator: 'CmdOrCtrl+M', role: 'minimize' },
                { type: 'separator' },
                { label: 'Close ( 关闭 )', accelerator: 'CmdOrCtrl+W', role: 'close' }
            ]
        },
        {
            label: '编辑',
            submenu: [
                { label: '撤销', accelerator: 'CmdOrCtrl+Z', command: COMMANDS.UNDO },
                { label: '重做', accelerator: 'CmdOrCtrl+Y', command: COMMANDS.REDO },
                { type: 'separator' },
                { label: '剪贴', accelerator: 'CmdOrCtrl+X', role: 'cut' },
                { label: '复制', accelerator: 'CmdOrCtrl+V', role: 'copy' },
                { label: '粘贴', accelerator: 'CmdOrCtrl+P', role: 'paste' }
            ]
        },
        {
            label: '段落',
            submenu: [
                { label: '一级目录', accelerator: 'CmdOrCtrl+1', command: COMMANDS.HEADING_1 },
                { label: '二级目录', accelerator: 'CmdOrCtrl+2', command: COMMANDS.HEADING_2 },
                { label: '三级目录', accelerator: 'CmdOrCtrl+3', command: COMMANDS.HEADING_3 },
                { label: '四级目录', accelerator: 'CmdOrCtrl+4', command: COMMANDS.HEADING_4 },
                { label: '五级目录', accelerator: 'CmdOrCtrl+5', command: COMMANDS.HEADING_5 },
                { label: '六级目录', accelerator: 'CmdOrCtrl+6', command: COMMANDS.HEADING_6 },
                { type: 'separator' },
                { label: '代码块（未实现）', accelerator: 'CmdOrCtrl+Shift+k' },
                { label: '编辑器', command: COMMANDS.EDITOR_CODEMIRROR }
            ]
        },
        {
            label: '格式',
            submenu: [
                { label: '加粗', accelerator: 'CmdOrCtrl+B' },
                { label: '斜线', accelerator: 'CmdOrCtrl+I' },
                { label: '下划线', accelerator: 'CmdOrCtrl+U' },
                { label: '代码', accelerator: 'CmdOrCtrl+shift+`' },
                { label: '删除线', accelerator: 'CmdOrCtrl+alt+D' },
                { label: '超链接', accelerator: 'CmdOrCtrl+K' },
                { label: '图片', accelerator: 'CmdOrCtrl+alt+I' }
            ]
        },
        {
            label: '视图',
            submenu: [
                {
                    label: '切换开发者工具',
                    accelerator: process.platform === 'darwin' ? 'Alt+Command+I' : 'Ctrl+Shift+I',
                    role: 'toggleDevTools'
                },
                { label: 'vditor', command: COMMANDS.EDITOR_VDITOR },
                { label: 'hyperMD', command: COMMANDS.EDITOR_HYPERMD }
            ]
        },
        {
            label: '主题',
            submenu: [
                { label: '主题样式（未实现）' },
                { label: '主题切换', command: COMMANDS.THEME_TOGGLE }
            ]
        },
        {
            label: '帮助',
            submenu: [
                { label: '项目信息', command: COMMANDS.PROJECT_HOME },
                { label: '意见反馈', command: COMMANDS.FEEDBACK },
                { label: '关于（未实现）' }
            ]
        }
    ]
}

// command 字段 → click 装配；系统 role 项不动
function attachCommands(template, ctx) {
    for (const item of template) {
        if (item.submenu) {
            attachCommands(item.submenu, ctx)
            continue
        }
        if (item.command) {
            const command = item.command
            item.click = function (item, focusedWindow) {
                ctx.exec(focusedWindow || ctx.getWindow(), command)
            }
        }
    }
    return template
}

/**
 * 增加更新相关的菜单选项（保留自旧版；mas/win32 分支）
 */
function addUpdateMenuItems(items, position) {
    if (process.mas) return

    const version = app.getVersion()
    const updateItems = [{
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

export function findReopenMenuItem() {
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

export function buildApplicationMenu(ctx) {
    const template = attachCommands(menuTemplate(), ctx)

    // 针对Mac端的一些配置（保留自旧版，含 template[3] 历史行为）
    if (process.platform === 'darwin') {
        const name = app.getName()
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

    return Menu.buildFromTemplate(template)
}
