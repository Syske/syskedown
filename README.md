# syskedown

开源、易用的个人 Markdown 编辑器（Electron + [Vditor](https://github.com/Vanessa219/vditor)）。

## 开发

要求 Node.js ≥ 22.12。

```bash
# 安装依赖
npm ci

# 开发模式（HMR）
npm run dev

# 构建 + 启动（生产模式）
npm start

# 仅构建
npm run build

# 单元测试 / 代码检查
npm test
npm run lint

# 打包（Windows nsis；需提供 build/icon.png >=256x256）
npm run package
```

## 架构

```text
src/
├── main/                  # 主进程：系统能力唯一持有者
│   ├── index.js           # app 生命周期装配
│   ├── window.js          # BrowserWindow + 安全配置
│   ├── menu.js            # 菜单 = 纯数据 + 命令 id
│   ├── commands.js        # 命令注册表
│   ├── ipc.js             # IPC 注册（统一响应包 + sender 校验）
│   └── services/          # file-service / theme-service / store
├── preload/index.js       # contextBridge 暴露 window.api（白名单）
├── renderer/              # Vditor 编辑器（editor/ 适配层）
└── shared/ipc-channels.js # IPC 契约常量（通道/命令/错误码）单一来源
```

## 安全基线

- `nodeIntegration: false` + `contextIsolation: true` + `sandbox: true`
- 渲染层零 Node 能力；全部跨进程调用经 `window.api`（preload 白名单）
- 生产构建注入 CSP；IPC 全量 sender 校验；统一错误码响应包
- 文件读写仅发生在主进程；持久化位于 `userData/syskedown/state.json`

## 数据

- 编辑状态持久化：`<userData>/syskedown/state.json`（最近文件、主题）
- 旧版 `dist/db.json` 首次启动自动只读迁移（旧文件保留）

## License

CC0-1.0（详见 LICENSE）
