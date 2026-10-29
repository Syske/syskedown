// 菜单构建与命令装配（数据见 menu-data.js）
import { Menu, app } from 'electron'
import { menuTemplate } from './menu-data.js'

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
