import Vditor from 'vditor'
import 'vditor/dist/index.css'
import { createEditorAdapter } from './editor-adapter.js'

// Vditor 实现（npm vditor ^3.9.9；懒加载资源经 renderer.publicDir 本地解析，cdn: '.'）

export function createVditorAdapter(el, options = {}) {
    let instance = null

    const editor = new Vditor(el, {
        ...options,
        after() {
            options.after && options.after()
        }
    })
    instance = editor

    return createEditorAdapter({
        getValue: () => instance.getValue(),
        setValue: (v) => instance.setValue(v),
        exec: (commandId) => {
            const m = /^heading-([1-6])$/.exec(commandId)
            if (m) {
                instance.processHeading('#'.repeat(Number(m[1])) + ' ')
                return
            }
            switch (commandId) {
                case 'undo':
                    instance.vditor.undo.undo(instance.vditor)
                    break
                case 'redo':
                    instance.vditor.undo.redo(instance.vditor)
                    break
                default:
                    console.warn('[editor] unknown command:', commandId)
            }
        },
        setTheme: (isDark) => {
            instance.setTheme(isDark ? 'dark' : 'light', isDark ? 'dark' : 'light', isDark ? 'native' : 'github')
        }
    })
}
