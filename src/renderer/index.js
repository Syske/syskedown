// 渲染层装配（T-003 契约版）：全部跨进程调用经 window.api（preload 白名单）。
// 编辑器适配层抽象在 T-007 引入；本文件为迁移后的直接实现。

import Vditor from 'vditor'
import 'vditor/dist/index.css'

const api = window.api

var vditor

function applyTheme(isDark) {
  vditor.setTheme(isDark ? 'dark' : 'light', isDark ? 'dark' : 'light', isDark ? 'native' : 'github')
  document.querySelector('body').style.backgroundColor = isDark ? '#2f363d' : ''
}

window.onload = function () {
  vditor = new Vditor('vditor', {
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
  vditor.setValue(content)
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
      api.saveFile({ content: vditor.getValue() }).then(res => {
        if (!res.ok && res.error.code === 'E-NO-PATH') {
          // 无保存目标 → 自动转另存为
          return api.saveFileAs({ content: vditor.getValue() })
        }
        if (!res.ok) {
          console.warn('[save failed]', res.error)
        }
      })
      break
    }
    case 'undo':
      vditor.vditor.undo.undo(vditor.vditor)
      break
    case 'redo':
      vditor.vditor.undo.redo(vditor.vditor)
      break
    default: {
      const m = /^heading-([1-6])$/.exec(id)
      if (m) {
        vditor.processHeading('#'.repeat(Number(m[1])) + ' ')
      } else {
        console.warn('[app:command] unknown id ignored:', id)
      }
    }
  }
})
