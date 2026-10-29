import { ipcMain, nativeTheme } from 'electron'
import { LEGACY_CHANNELS } from './constants.js'
import { saveAs } from './commands.js'

// IPC 注册唯一入口（T-002 过渡版：旧通道；T-003 切换契约 + sender 校验）。
// 旧调试通道 synchronous-message / asynchronous-message 已随 T-002 清理（无消费方）。

export function registerIpc() {
    ipcMain.on(LEGACY_CHANNELS.GET_FILE_NAME, (event, arg) => {
        saveAs(arg)
    })

    ipcMain.handle(LEGACY_CHANNELS.DARK_MODE_TOGGLE, () => {
        if (nativeTheme.shouldUseDarkColors) {
            nativeTheme.themeSource = 'light'
        } else {
            nativeTheme.themeSource = 'dark'
        }
        return nativeTheme.shouldUseDarkColors;
    });

    ipcMain.handle(LEGACY_CHANNELS.DARK_MODE_SYSTEM, () => {
        nativeTheme.themeSource = 'system'
    });
}
