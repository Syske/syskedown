import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mkdtempSync, rmSync, writeFileSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'

// electron mock：file-service 依赖 dialog/BrowserWindow 与 store 的 app 路径
const dialogMock = {
  showOpenDialog: vi.fn(),
  showSaveDialog: vi.fn()
}
let dataDir
let appDir

vi.mock('electron', () => ({
  app: {
    getPath: () => dataDir,
    getAppPath: () => appDir
  },
  dialog: dialogMock,
  BrowserWindow: {
    getFocusedWindow: () => null
  }
}))

async function freshService() {
  vi.resetModules()
  const store = await import('../src/main/services/store.js')
  store.initStore()
  const svc = await import('../src/main/services/file-service.js')
  return { store, svc }
}

beforeEach(() => {
  dataDir = mkdtempSync(path.join(tmpdir(), 'sk-fs-data-'))
  appDir = mkdtempSync(path.join(tmpdir(), 'sk-fs-app-'))
  dialogMock.showOpenDialog.mockReset()
  dialogMock.showSaveDialog.mockReset()
})

afterEach(() => {
  rmSync(dataDir, { recursive: true, force: true })
  rmSync(appDir, { recursive: true, force: true })
})

describe('file-service', () => {
  it('save 无 recentFile 且无 path → E-NO-PATH', async () => {
    const { svc } = await freshService()
    await expect(svc.save({ content: 'x' })).rejects.toMatchObject({ code: 'E-NO-PATH' })
  })

  it('save 写入 UTF-8 并更新 recentFile', async () => {
    const { svc, store } = await freshService()
    const target = path.join(appDir, 'out.md')
    const res = await svc.save({ path: target, content: '# 你好\n\n正文' })
    expect(res.path).toBe(target)
    expect(readFileSync(target, 'utf-8')).toBe('# 你好\n\n正文')
    expect(store.get('recentFile', null)).toBe(target)
  })

  it('save 缺省 path 时使用 recentFile', async () => {
    const { svc, store } = await freshService()
    const target = path.join(appDir, 'b.md')
    store.set('recentFile', target)
    await svc.save({ content: 'hello' })
    expect(readFileSync(target, 'utf-8')).toBe('hello')
  })

  it('save 写入失败（目录不存在）→ E-WRITE', async () => {
    const { svc } = await freshService()
    await expect(svc.save({ path: path.join(appDir, 'no-such-dir', 'x.md'), content: 'x' }))
      .rejects.toMatchObject({ code: 'E-WRITE' })
  })

  it('saveAs 用户取消 → {path:null}', async () => {
    const { svc } = await freshService()
    dialogMock.showSaveDialog.mockResolvedValue({ canceled: true, filePath: null })
    const res = await svc.saveAs({ content: 'x' })
    expect(res.path).toBe(null)
  })

  it('saveAs 选择路径 → 写入并更新 recentFile', async () => {
    const { svc, store } = await freshService()
    const target = path.join(appDir, 'as.md')
    dialogMock.showSaveDialog.mockResolvedValue({ canceled: false, filePath: target })
    const res = await svc.saveAs({ content: 'as-content' })
    expect(res.path).toBe(target)
    expect(readFileSync(target, 'utf-8')).toBe('as-content')
    expect(store.get('recentFile', null)).toBe(target)
  })

  it('openViaDialog 取消 → {canceled:true}', async () => {
    const { svc } = await freshService()
    dialogMock.showOpenDialog.mockResolvedValue({ canceled: true, filePaths: [] })
    const res = await svc.openViaDialog()
    expect(res).toEqual({ canceled: true, path: null, content: null })
  })

  it('openViaDialog 成功 → 读取内容并更新 recentFile', async () => {
    const { svc, store } = await freshService()
    const target = path.join(appDir, 'open.md')
    writeFileSync(target, '# open', 'utf-8')
    dialogMock.showOpenDialog.mockResolvedValue({ canceled: false, filePaths: [target] })
    const res = await svc.openViaDialog()
    expect(res.canceled).toBe(false)
    expect(res.content).toBe('# open')
    expect(store.get('recentFile', null)).toBe(target)
  })

  it('读取非法 UTF-8 → E-READ', async () => {
    const { svc } = await freshService()
    const target = path.join(appDir, 'bin.md')
    writeFileSync(target, Buffer.from([0xff, 0xfe, 0x00, 0x81]))
    dialogMock.showOpenDialog.mockResolvedValue({ canceled: false, filePaths: [target] })
    await expect(svc.openViaDialog()).rejects.toMatchObject({ code: 'E-READ' })
  })

  it('currentFile 返回 recentFile', async () => {
    const { svc, store } = await freshService()
    store.set('recentFile', '/docs/c.md')
    expect(await svc.currentFile()).toEqual({ path: '/docs/c.md' })
  })
})
