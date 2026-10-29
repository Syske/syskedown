// 渲染层装配（T-007 契约版）：编辑器经 adapter 抽象，跨进程调用经 window.api。

import { createVditorAdapter } from './editor/vditor-adapter.js'

const api = window.api

var editor

function applyTheme(isDark) {
  editor.setTheme(isDark)
  document.querySelector('body').style.backgroundColor = isDark ? '#2f363d' : ''
}

window.onload = function () {
  editor = createVditorAdapter('vditor', {
    cdn: '.',
    placeholder: 'Hello, Vditor!',
    typewriterMode: true,
    toolbar: [],
    toolbarConfig: {
      hide: true
    },
    counter: {
      enable: true,
      type: 'text',
    },
    after() {
      // Vditor 初始化完成后才可调用 setTheme（其内部状态为异步装配）
      api.currentTheme().then(res => {
        if (res.ok) applyTheme(res.data.isDark)
      })
    }
  })
}

// 打开文件：主进程广播 file:opened（契约 §4）
api.onFileOpened(({ content }) => {
  editor.setValue(content)
})

// 保存成功提示位（现行为：无 UI 提示，保持等价；结构化结果已可用）
api.onFileSaved(({ path }) => {
  console.log('[saved]', path)
})

// 主题：toggle 由菜单在主进程执行，渲染层只跟随 theme:changed
api.onThemeChanged(({ isDark }) => {
  applyTheme(isDark)
})

// 菜单/快捷键命令（契约 §5；未知 id 忽略并记日志）
api.onAppCommand(({ id }) => {
  switch (id) {
    case 'save': {
      api.saveFile({ content: editor.getValue() }).then(res => {
        if (!res.ok && res.error.code === 'E-NO-PATH') {
          // 无保存目标 → 自动转另存为
          return api.saveFileAs({ content: editor.getValue() })
        }
        if (!res.ok) {
          console.warn('[save failed]', res.error)
        }
      })
      break
    }
    case 'undo':
    case 'redo':
      editor.exec(id)
      break
    default: {
      if (/^heading-[1-6]$/.test(id)) {
        editor.exec(id)
      } else {
        console.warn('[app:command] unknown id ignored:', id)
      }
    }
  }
})
