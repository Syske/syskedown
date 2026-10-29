import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mkdtempSync, rmSync, existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'

// electron mock: app.getPath/getAppPath 指向临时目录（每测试隔离）
let dataDir
let appDir

vi.mock('electron', () => ({
  app: {
    getPath: () => dataDir,
    getAppPath: () => appDir
  }
}))

async function freshStore() {
  vi.resetModules()
  return import('../src/main/services/store.js')
}

beforeEach(() => {
  dataDir = mkdtempSync(path.join(tmpdir(), 'sk-store-'))
  appDir = mkdtempSync(path.join(tmpdir(), 'sk-app-'))
})

afterEach(() => {
  rmSync(dataDir, { recursive: true, force: true })
  rmSync(appDir, { recursive: true, force: true })
})

describe('store', () => {
  it('set/get 往返并落盘 state.json', async () => {
    const store = await freshStore()
    store.initStore()
    store.set('recentFile', '/tmp/a.md')
    expect(store.get('recentFile', null)).toBe('/tmp/a.md')
    const onDisk = JSON.parse(readFileSync(path.join(dataDir, 'syskedown', 'state.json'), 'utf-8'))
    expect(onDisk.recentFile).toBe('/tmp/a.md')
  })

  it('损坏 state.json → 空状态重建不崩溃', async () => {
    mkdirSync(path.join(dataDir, 'syskedown'), { recursive: true })
    writeFileSync(path.join(dataDir, 'syskedown', 'state.json'), '{broken json!!')
    const store = await freshStore()
    store.initStore()
    expect(store.get('recentFile', null)).toBe(null)
    store.set('recentFile', '/tmp/b.md')
    expect(JSON.parse(readFileSync(path.join(dataDir, 'syskedown', 'state.json'), 'utf-8')).recentFile).toBe('/tmp/b.md')
  })

  it('S7 迁移：legacy dist/db.json file-name → recentFile，旧文件保留，sessionId 放弃', async () => {
    mkdirSync(path.join(appDir, 'dist'), { recursive: true })
    writeFileSync(path.join(appDir, 'dist', 'db.json'), JSON.stringify({ sessionId: 'abc', 'file-name': '/docs/a.md' }))
    const store = await freshStore()
    store.initStore()
    expect(store.get('recentFile', null)).toBe('/docs/a.md')
    // 旧文件保留
    expect(existsSync(path.join(appDir, 'dist', 'db.json'))).toBe(true)
    // sessionId 不迁移
    expect(store.get('sessionId', undefined)).toBe(undefined)
  })

  it('迁移幂等：state.json 已存在时忽略 legacy', async () => {
    mkdirSync(path.join(dataDir, 'syskedown'), { recursive: true })
    writeFileSync(path.join(dataDir, 'syskedown', 'state.json'), JSON.stringify({ recentFile: '/keep.md' }))
    mkdirSync(path.join(appDir, 'dist'), { recursive: true })
    writeFileSync(path.join(appDir, 'dist', 'db.json'), JSON.stringify({ 'file-name': '/legacy.md' }))
    const store = await freshStore()
    store.initStore()
    expect(store.get('recentFile', null)).toBe('/keep.md')
  })

  it('原子写：不残留 .tmp', async () => {
    const store = await freshStore()
    store.initStore()
    store.set('recentFile', '/tmp/x.md')
    expect(existsSync(path.join(dataDir, 'syskedown', 'state.json.tmp'))).toBe(false)
  })

  it('get 未加载时惰性加载', async () => {
    const store = await freshStore()
    expect(store.get('recentFile', 'fallback')).toBe('fallback')
  })
})
