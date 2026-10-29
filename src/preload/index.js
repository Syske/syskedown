import { contextBridge, ipcRenderer } from 'electron'
import { CHANNELS } from '../shared/ipc-channels.js'

// preload 白名单（契约 §6）：渲染层仅见 window.api.*；
// 广播回调只透传 data，不暴露 ipcRenderer / event（官方安全清单 #20）

const api = {
  openFile: () => ipcRenderer.invoke(CHANNELS.FILE_OPEN),
  saveFile: (p) => ipcRenderer.invoke(CHANNELS.FILE_SAVE, p),
  saveFileAs: (p) => ipcRenderer.invoke(CHANNELS.FILE_SAVE_AS, p),
  getCurrentFile: () => ipcRenderer.invoke(CHANNELS.FILE_CURRENT),
  toggleTheme: () => ipcRenderer.invoke(CHANNELS.THEME_TOGGLE),
  currentTheme: () => ipcRenderer.invoke(CHANNELS.THEME_CURRENT),
  onFileOpened: (cb) => ipcRenderer.on(CHANNELS.FILE_OPENED, (_e, data) => cb(data)),
  onFileSaved: (cb) => ipcRenderer.on(CHANNELS.FILE_SAVED, (_e, data) => cb(data)),
  onThemeChanged: (cb) => ipcRenderer.on(CHANNELS.THEME_CHANGED, (_e, data) => cb(data)),
  onAppCommand: (cb) => ipcRenderer.on(CHANNELS.APP_COMMAND, (_e, data) => cb(data))
}

contextBridge.exposeInMainWorld('api', api)
