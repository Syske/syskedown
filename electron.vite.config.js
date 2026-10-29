import { defineConfig } from 'electron-vite'
import { resolve } from 'node:path'

// CSP 仅注入生产构建（dev 需放行 Vite HMR 的 ws: 连接；生产页无远程内容）。
// 内容按官方安全清单 #7：default-src 'self' + Vditor 行内样式所需的 style-src 'unsafe-inline'。
const cspPlugin = {
  name: 'inject-csp-production',
  apply: 'build',
  transformIndexHtml(html) {
    // script-src 含 'unsafe-inline'：Vditor 懒加载器以 XHR 取回脚本后内联注入
    // （node_modules/vditor addScriptSync 实现），属实现级约束；其余指令保持严格。
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "font-src 'self' data:",
      "media-src 'self' blob:",
      "connect-src 'self'"
    ].join('; ')
    return html.replace('</head>', `    <meta http-equiv="Content-Security-Policy" content="${csp}">\n</head>`)
  }
}

// renderer.publicDir 指向 npm 安装的 vditor 包：
// dev 由 Vite 静态服务（/dist/js/**），build 时整体拷贝进 out/renderer，
// 使编辑器 `cdn: '.'` 的懒加载资源在两种模式下均为本地解析（替代旧根目录 vendored/vditor）。
export default defineConfig({
  main: {},
  preload: {},
  renderer: {
    publicDir: resolve(__dirname, 'node_modules/vditor'),
    plugins: [cspPlugin]
  }
})
