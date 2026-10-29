// IPC 契约常量 — 单一来源（contracts/ipc-contract.md §2–§5）
// main / preload / renderer 三方引用本模块（分别打包，纯常量无副作用）

export const CHANNELS = {
  // invoke（渲染 → 主）
  FILE_OPEN: 'file:open',
  FILE_SAVE: 'file:save',
  FILE_SAVE_AS: 'file:saveAs',
  FILE_CURRENT: 'file:current',
  THEME_TOGGLE: 'theme:toggle',
  THEME_CURRENT: 'theme:current',
  // 广播（主 → 渲染）
  FILE_OPENED: 'file:opened',
  FILE_SAVED: 'file:saved',
  THEME_CHANGED: 'theme:changed',
  APP_COMMAND: 'app:command'
}

// 命令 id（app:command 载荷；菜单/快捷键唯一出口）
export const COMMAND_ID = {
  NEW_FILE: 'new-file',
  OPEN_FILE: 'open-file',
  SAVE: 'save',
  SAVE_AS: 'save-as',
  RELOAD: 'reload',
  UNDO: 'undo',
  REDO: 'redo',
  HEADING_1: 'heading-1',
  HEADING_2: 'heading-2',
  HEADING_3: 'heading-3',
  HEADING_4: 'heading-4',
  HEADING_5: 'heading-5',
  HEADING_6: 'heading-6',
  CODE_BLOCK: 'code-block',
  EDITOR_CODEMIRROR: 'editor-codemirror',
  EDITOR_VDITOR: 'editor-vditor',
  EDITOR_HYPERMD: 'editor-hypermd',
  THEME_TOGGLE: 'theme-toggle',
  PROJECT_HOME: 'project-home',
  FEEDBACK: 'feedback'
}

// 错误码（契约 §2）
export const ERR = {
  CANCELED: 'E-CANCELED',
  READ: 'E-READ',
  WRITE: 'E-WRITE',
  NO_PATH: 'E-NO-PATH',
  FORBIDDEN_SENDER: 'E-FORBIDDEN-SENDER',
  UNKNOWN: 'E-UNKNOWN'
}

// 统一响应包（契约 §1）
export const ok = (data) => ({ ok: true, data })
export const fail = (code, message) => ({ ok: false, error: { code, message } })
