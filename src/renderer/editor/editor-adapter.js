// 编辑器接口契约（内部）：渲染层只依赖本接口，不直接触达 Vditor API。
// getValue / setValue / exec(commandId) / setTheme(isDark)

export function createEditorAdapter(impl) {
    return {
        getValue: impl.getValue,
        setValue: impl.setValue,
        exec: impl.exec,
        setTheme: impl.setTheme
    }
}
