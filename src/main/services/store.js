import path from 'node:path'
import fs from 'node:fs'
import { app } from 'electron'

// userData JSON 持久化（零依赖替代 electron-localstorage）
// 位置: <userData>/syskedown/state.json（设计 §5；契约 §8 schema）
// 写入: .tmp 原子覆写；损坏: 降级空状态重建

let cache = null
let loaded = false

function stateDir() {
    return path.join(app.getPath('userData'), 'syskedown')
}

function stateFile() {
    return path.join(stateDir(), 'state.json')
}

function load() {
    try {
        cache = JSON.parse(fs.readFileSync(stateFile(), 'utf-8'))
        if (!cache || typeof cache !== 'object') cache = {}
    } catch (e) {
        cache = {} // 损坏 → 空状态重建
    }
    loaded = true
}

// 一次性只读迁移：旧 dist/db.json 的 file-name → recentFile（旧文件保留不删，幂等）
function migrateIfNeeded() {
    const legacy = path.join(app.getAppPath(), 'dist', 'db.json')
    try {
        if (fs.existsSync(stateFile())) return // 新状态已存在，不重复迁移
        if (!fs.existsSync(legacy)) return
        const legacyState = JSON.parse(fs.readFileSync(legacy, 'utf-8'))
        const recent = legacyState && legacyState['file-name']
        cache = recent ? { recentFile: recent } : {}
        persist()
        console.log('[store] migrated recentFile from legacy db.json')
    } catch (e) {
        // 旧文件不可解析 → 放弃迁移，不影响启动
    }
}

function persist() {
    fs.mkdirSync(stateDir(), { recursive: true })
    const tmp = stateFile() + '.tmp'
    fs.writeFileSync(tmp, JSON.stringify(cache, null, 2), 'utf-8')
    fs.renameSync(tmp, stateFile())
}

export function initStore() {
    migrateIfNeeded()
    load()
}

export function get(key, fallback) {
    if (!loaded) load()
    return cache && cache[key] !== undefined ? cache[key] : fallback
}

export function set(key, value) {
    if (!loaded) load()
    cache[key] = value
    try {
        persist()
    } catch (e) {
        console.warn('[store] persist failed:', e.message)
    }
}
