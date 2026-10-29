import { defineConfig } from 'electron-vite'
import { resolve } from 'node:path'

// renderer.publicDir 指向 npm 安装的 vditor 包：
// dev 由 Vite 静态服务（/dist/js/**），build 时整体拷贝进 out/renderer，
// 使编辑器 `cdn: '.'` 的懒加载资源在两种模式下均为本地解析（替代旧根目录 vendored/vditor）。
export default defineConfig({
  main: {},
  preload: {},
  renderer: {
    publicDir: resolve(__dirname, 'node_modules/vditor')
  }
})
