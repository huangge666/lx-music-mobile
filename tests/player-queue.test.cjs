/* Run: node --test tests/player-queue.test.cjs
 * Tests the real TypeScript implementation with mocked native/network boundaries.
 */
const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const ts = require('typescript')

const flush = () => new Promise(resolve => setImmediate(resolve))
const music = id => ({ id, name: id, singer: '', source: 'kw', meta: {} })
const track = (id, url = id) => ({ id: `${id}__//${url}`, musicId: id, url })
function deferred() {
  let resolve
  const promise = new Promise(r => { resolve = r })
  return { promise, resolve }
}
function evaluate(source, globals) {
  const exports = {}
  const output = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
  }).outputText
  vm.runInNewContext(output, { exports, console, ...globals })
  return exports
}
const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8')

function queueFixture() {
  let queue = [track('a'), track('a', 'default')]
  let current = 0
  const calls = []
  const native = {
    async getCurrentTrack() { return current },
    async getQueue() { return queue.slice() },
    async add(tracks) { calls.push('add'); queue.push(...tracks) },
    async remove(indices) {
      calls.push('remove')
      current -= indices.filter(i => i < current).length
      queue = queue.filter((_, index) => !indices.includes(index))
    },
    async skip(index) { calls.push('skip'); current = index },
    async setRepeatMode() {},
    async play() { calls.push('play') },
    async seekTo() {},
  }
  const mocks = {
    'react-native-track-player': { __esModule: true, default: native, RepeatMode: { Off: 0 }, State: {} },
    'react-native-background-timer': { setTimeout, clearTimeout },
    '@/config': { defaultUrl: 'silence' },
    '@/store/setting/state': { setting: {} },
    '@/store/player/state': { musicInfo: {} },
  }
  const api = evaluate(read('src/plugins/player/playList.ts'), {
    require(id) { assert.ok(id in mocks, id); return mocks[id] },
    global: { lx: {}, app_event: { playerLoadstart() {} } },
  })
  return { api, calls, native, queue: () => queue, current: () => queue[current] }
}

test('same next song and URL preserve native track id without remove/add', async() => {
  const f = queueFixture()
  const first = await f.api.enqueueNextMusic('a', music('b'), 'b-url')
  f.calls.length = 0
  const second = await f.api.enqueueNextMusic('a', music('b'), 'b-url')
  assert.equal(second, first)
  assert.deepEqual(f.calls, [])
})

test('manual next reuses prepared track rather than adding it again', async() => {
  const f = queueFixture()
  const id = await f.api.enqueueNextMusic('a', music('b'), 'b-url')
  f.calls.length = 0
  f.api.playMusic(music('b'), 'b-url', 0)
  await flush()
  assert.equal(f.current().id, id)
  assert.equal(f.calls.includes('add'), false)
  assert.deepEqual(f.calls, ['skip', 'play', 'remove'])
  assert.equal(f.queue().length, 2)
})

test('changed URL replaces pending track instead of reusing the old quality', async() => {
  const f = queueFixture()
  const old = await f.api.enqueueNextMusic('a', music('b'), 'b-low')
  const next = await f.api.enqueueNextMusic('a', music('b'), 'b-high')
  assert.notEqual(next, old)
  assert.equal(f.queue()[1].url, 'b-high')
})

test('latest queued preload wins and native mutations stay serialized', async() => {
  const f = queueFixture()
  const results = await Promise.all([
    f.api.enqueueNextMusic('a', music('b'), 'b-url'),
    f.api.enqueueNextMusic('a', music('c'), 'c-url'),
  ])
  assert.equal(results[0], undefined)
  assert.ok(results[1])
  assert.equal(f.queue()[1].musicId, 'c')
  assert.equal(f.calls.filter(call => call === 'add').length, 1)
})

test('invalidation while reading the queue prevents stale native writes', async() => {
  const f = queueFixture()
  const gate = deferred()
  f.native.getQueue = () => gate.promise
  let valid = true
  const result = f.api.enqueueNextMusic('a', music('b'), 'b-url', () => valid)
  await flush()
  valid = false
  gate.resolve(f.queue().slice())
  assert.equal(await result, undefined)
  assert.deepEqual(f.calls, [])
})

test('failed skip never deletes the currently playing track', async() => {
  const f = queueFixture()
  await f.api.enqueueNextMusic('a', music('b'), 'b-url')
  f.calls.length = 0
  f.native.skip = async() => { throw new Error('native failure') }
  f.api.playMusic(music('b'), 'b-url', 0)
  await flush()
  assert.equal(f.current().musicId, 'a')
  assert.deepEqual(f.calls, [])
})

test('manual song selection supersedes an in-flight enqueue', async() => {
  const f = queueFixture()
  const gate = deferred()
  const getQueue = f.native.getQueue
  let first = true
  f.native.getQueue = () => {
    if (!first) return getQueue()
    first = false
    return gate.promise
  }
  const pending = f.api.enqueueNextMusic('a', music('b'), 'b-url')
  await flush()
  f.api.playMusic(music('c'), 'c-url', 0)
  gate.resolve(f.queue().slice())
  assert.equal(await pending, undefined)
  await flush()
  assert.equal(f.current().musicId, 'c')
  assert.equal(f.queue().some(t => t.musicId === 'b'), false)
})

test('natural transition during queue inspection cancels stale removal', async() => {
  const f = queueFixture()
  let reads = 0
  f.native.getCurrentTrack = async() => ++reads === 1 ? 0 : 1
  assert.equal(await f.api.enqueueNextMusic('a', music('b'), 'b-url'), undefined)
  assert.deepEqual(f.calls, [])
})

// Select actual prewarm declarations with the TS AST; do not duplicate their logic.
function prewarmFixture() {
  const source = ts.createSourceFile('player.ts', read('src/core/player/player.ts'), ts.ScriptTarget.Latest, true)
  const names = new Set([
    'createGettingUrlId', 'getPrewarmContext', 'prewarmNextMusicUrl', 'prewarmSeq', 'prewarmInFlight',
    'prewarmLastTriggerForId', 'prewarmLastTriggerAt', 'prewarmMusicUrlMap', 'prewarmAttemptAtMap',
    'PREWARM_MUSIC_URL_TTL', 'PREWARM_REQUEST_TIMEOUT', 'PREWARM_RETRY_INTERVAL', 'PREWARM_TRIGGER_INTERVAL',
  ])
  const selected = source.statements.filter(s => ts.isVariableStatement(s) &&
    s.declarationList.declarations.some(d => names.has(d.name.getText(source))))
  let now = 100000
  let requests = 0
  const request = deferred()
  const enqueued = []
  const playerState = { playMusicInfo: { musicInfo: music('a'), listId: 'list' }, tempPlayList: [] }
  const settingState = { setting: { 'player.playQuality': '128k', 'player.togglePlayMethod': 'listLoop' } }
  const globals = {
    playerState, settingState, pausedByUser: false, preparedNext: null,
    global: { lx: {} }, Date: { now: () => now },
    getNextPlayMusicInfo: async() => ({ musicInfo: music('b'), listId: 'list' }),
    getPlayQuality: quality => quality,
    getStoreMusicUrl: async() => '',
    handleGetOnlineMusicUrl: () => { requests++; return request.promise },
    enqueueNextMusic: async(...args) => { enqueued.push(args); return 'b-track' },
    BackgroundTimer: { setTimeout, clearTimeout },
  }
  const api = evaluate(selected.map(s => s.getText(source)).join('\n'), globals)
  return { api, request, enqueued, settingState, requests: () => requests, advance: ms => { now += ms } }
}

test('progress polling does not invalidate a slow in-flight prewarm', async() => {
  const f = prewarmFixture()
  f.api.prewarmNextMusicUrl()
  await flush()
  f.advance(3000)
  f.api.prewarmNextMusicUrl()
  await flush()
  assert.equal(f.requests(), 1)
  f.request.resolve({ url: 'b-url', quality: '128k' })
  await flush()
  assert.equal(f.enqueued.length, 1)
})

test('quality change discards an old prewarm result', async() => {
  const f = prewarmFixture()
  f.api.prewarmNextMusicUrl()
  await flush()
  f.settingState.setting['player.playQuality'] = '320k'
  f.request.resolve({ url: 'b-low', quality: '128k' })
  await flush()
  assert.equal(f.enqueued.length, 0)
})

test('cache hits do not extend the original URL expiry', async() => {
  const f = prewarmFixture()
  f.api.prewarmNextMusicUrl()
  await flush()
  f.request.resolve({ url: 'b-url', quality: '128k' })
  await flush()
  f.advance(5 * 60 * 1000)
  f.api.prewarmNextMusicUrl()
  await flush()
  assert.equal(f.requests(), 1)
  f.advance(6 * 60 * 1000)
  f.api.prewarmNextMusicUrl()
  await flush()
  assert.equal(f.requests(), 2)
})
