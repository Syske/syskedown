// 通道与命令常量（T-002 过渡版：沿用旧通道名保持行为等价；
// T-003 切换为 contracts/ipc-contract.md 的契约通道并迁移至 src/shared/）
export const LEGACY_CHANNELS = {
  OPEN_FILE: 'open_file',
  SAVE_FILE: 'save-file',
  FILE_NAME: 'file_name',
  GET_FILE_NAME: 'getFileName',
  MD_HOT_KEY: 'md-hot-key',
  MD_HOT_KEY_NO_VALUE: 'md-hot-key-no-value',
  THEME_CHANGE: 'theme-chanage',
  DARK_MODE_TOGGLE: 'dark-mode:toggle',
  DARK_MODE_SYSTEM: 'dark-mode:system'
}

// 菜单命令 id（菜单/快捷键唯一出口；渲染层 T-003 起按契约 CommandId 消费）
export const COMMANDS = {
  NEW_FILE: 'new-file',
  OPEN_FILE: 'open-file',
  SAVE: 'save',
  RELOAD: 'reload',
  MINIMIZE: 'minimize',
  CLOSE: 'close',
  UNDO: 'undo',
  REDO: 'redo',
  CUT: 'cut',
  COPY: 'copy',
  PASTE: 'paste',
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
  DEVTOOLS: 'devtools',
  PROJECT_HOME: 'project-home',
  FEEDBACK: 'feedback'
}

// Markdown 片段命令 → 旧通道载荷映射（T-003 重写）
export const HEADING_PREFIX = {
  [COMMANDS.HEADING_1]: '# ',
  [COMMANDS.HEADING_2]: '## ',
  [COMMANDS.HEADING_3]: '### ',
  [COMMANDS.HEADING_4]: '#### ',
  [COMMANDS.HEADING_5]: '##### ',
  [COMMANDS.HEADING_6]: '###### '
}
