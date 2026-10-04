/* Run with: node --test tests/ui-interactions.test.cjs
 * Uses the existing TypeScript compiler and mocked platform boundaries; no device or network required.
 */
const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const ts = require('typescript')

function loadModule(file, mocks, extra = {}) {
  const output = ts.transpileModule(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
  }).outputText
  const exports = {}
  vm.runInNewContext(output, {
    exports,
    require(id) {
      assert.ok(Object.hasOwn(mocks, id), `Unexpected dependency: ${id}`)
      return mocks[id]
    },
    console: { log() {} },
    ...extra,
  }, { filename: file })
  return exports
}

function deferred() {
  const callbacks = {}
  const promise = new Promise((resolve, reject) => { Object.assign(callbacks, { resolve, reject }) })
  return { promise, ...callbacks }
}

function tipFixture(fetchTips) {
  const timers = new Map()
  let nextId = 0
  const api = loadModule('src/screens/Home/Views/Search/tipSearch.ts', {}, {
    setTimeout(callback, delay) {
      assert.equal(delay, 250)
      const id = ++nextId
      timers.set(id, callback)
      return id
    },
    clearTimeout(id) { timers.delete(id) },
  })
  return {
    search: api.createTipSearch(fetchTips),
    async flush() {
      for (const [id, callback] of [...timers]) {
        timers.delete(id)
        callback()
      }
      await new Promise(resolve => setImmediate(resolve))
    },
  }
}

test('suggestions: rapid typing only fetches the latest keyword', async() => {
  const fetched = []
  const shown = []
  const f = tipFixture(async(keyword) => { fetched.push(keyword); return [keyword] })
  f.search('a', 'kw', list => shown.push(...list))
  f.search('ab', 'kw', list => shown.push(...list))
  f.search('abc', 'kw', list => shown.push(...list))
  await f.flush()
  assert.deepEqual(fetched, ['abc'])
  assert.deepEqual(shown, ['abc'])
})
test('suggestions: blur before the delay prevents network work', async() => {
  let fetched = false
  const f = tipFixture(async() => { fetched = true; return [] })
  f.search('a', 'kw', () => assert.fail('should not show'))
  f.search.cancel()
  await f.flush()
  assert.equal(fetched, false)
})
test('suggestions: submit or unmount discards an in-flight result', async() => {
  const reply = deferred()
  const f = tipFixture(() => reply.promise)
  f.search('a', 'kw', () => assert.fail('late suggestion'))
  await f.flush()
  f.search.cancel()
  reply.resolve(['old'])
  await f.flush()
})
test('suggestions: source switch with the same keyword discards the old source', async() => {
  const old = deferred()
  const shown = []
  const f = tipFixture(async(keyword, source) => source == 'kw' ? old.promise : [source])
  f.search('same', 'kw', list => shown.push(...list))
  await f.flush()
  f.search('same', 'kg', list => shown.push(...list))
  await f.flush()
  old.resolve(['old'])
  await f.flush()
  assert.deepEqual(shown, ['kg'])
})
test('suggestions: clearing text cancels the previous request immediately', async() => {
  const sizes = []
  const f = tipFixture(async() => { assert.fail('should not fetch') })
  f.search('old', 'kw', list => sizes.push(list.length))
  f.search('', 'kw', list => sizes.push(list.length))
  await f.flush()
  assert.deepEqual(sizes, [0])
})
test('suggestions: both synchronous and asynchronous errors resolve to an empty list', async() => {
  for (const fetch of [() => { throw new Error('sync') }, async() => { throw new Error('async') }]) {
    const sizes = []
    const f = tipFixture(fetch)
    f.search('a', 'kw', list => sizes.push(list.length))
    await f.flush()
    assert.deepEqual(sizes, [0])
  }
})
test('bottom inset: overlaid bars use max height instead of double-counting', () => {
  const api = loadModule('src/components/common/BottomInset.ts', {
    react: { createContext: value => ({ value }), useContext: context => context.value },
  })
  assert.equal(api.useBottomInset(), 0)
  api.BottomInsetContext.value = 156
  assert.equal(api.useBottomInset(), 156)
  api.OverlayInsetContext.value = 202
  assert.equal(api.useBottomInset(), 202)
  api.OverlayInsetContext.value = 0
  api.BottomInsetContext.value = 72
  assert.equal(api.useBottomInset(), 72)
})
test('reduced motion: a newer system event wins over the initial async read', async() => {
  const initial = deferred()
  const values = []
  let listener, cleanup
  let removed = false
  const api = loadModule('src/utils/hooks/useReduceMotion.ts', {
    'react': {
      useState: value => [value, next => values.push(next)],
      useEffect: effect => { cleanup = effect() },
    },
    'react-native': {
      AccessibilityInfo: {
        addEventListener(event, callback) { listener = callback; return { remove() { removed = true } } },
        isReduceMotionEnabled: () => initial.promise,
      },
    },
  })
  assert.equal(api.useReduceMotion(), true)
  listener(true)
  initial.resolve(false)
  await new Promise(resolve => setImmediate(resolve))
  assert.deepEqual(values, [true])
  cleanup()
  assert.equal(removed, true)
})

function searchFixture(kind) {
  const fresh = () => ({ list: [], key: '', limit: 30, maxPage: 0, page: 0 })
  const state = { sources: ['all', 'kw', 'kg'], listInfos: { all: fresh(), kw: fresh(), kg: fresh() }, maxPages: {}, searchText: '', source: 'all' }
  const calls = []
  const actions = {
    setSearchText(text) { state.searchText = text },
    setSource(source) { state.source = source },
    clearListInfo(source) { state.listInfos[source].list = [] },
    setListInfo(result, page, text) {
      calls.push({ result, page, text })
      const source = Array.isArray(result) ? 'all' : result.source
      const list = Array.isArray(result) ? result.flatMap(item => item.list) : result.list
      Object.assign(state.listInfos[source], { list, page, maxPage: 1 })
      return list
    },
  }
  const sdk = {}
  const key = kind == 'music' ? 'musicSearch' : 'songList'
  const api = loadModule(`src/core/search/${kind}.ts`, {
    [`@/store/search/${kind}/state`]: state,
    [`@/store/search/${kind}/action`]: actions,
    '@/utils/musicSdk': sdk,
  })
  return {
    ...api,
    state,
    calls,
    source(id, run) { sdk[id] = { [key]: { search: run } } },
    result(source, list = []) { return { source, list, total: list.length, allPage: 1, limit: 30 } },
  }
}

for (const kind of ['music', 'songlist']) {
  test(`${kind}: successful zero results are not a request failure`, async() => {
    const f = searchFixture(kind)
    for (const source of ['kw', 'kg']) f.source(source, async() => f.result(source))
    let failed = -1
    const list = await f.search('song', 1, 'all', undefined, count => { failed = count })
    assert.equal(list.length, 0)
    assert.equal(failed, 0)
  })
  test(`${kind}: all source failures reject instead of becoming empty results`, async() => {
    const f = searchFixture(kind)
    f.source('kw', async() => { throw new Error('offline') })
    f.source('kg', () => { throw new Error('sync error') })
    await assert.rejects(f.search('song', 1, 'all'), /All search sources failed/)
    assert.equal(f.calls.length, 0)
  })
  test(`${kind}: one success is shown before a slow failing source`, async() => {
    const f = searchFixture(kind)
    const slow = deferred()
    const shown = deferred()
    f.source('kw', async() => f.result('kw', [{ id: 'song' }]))
    f.source('kg', () => slow.promise)
    let failures = 0
    const request = f.search('song', 1, 'all', list => { shown.resolve(list) }, count => { failures = count })
    assert.equal((await shown.promise)[0].id, 'song')
    slow.reject(new Error('offline'))
    assert.equal((await request)[0].id, 'song')
    assert.equal(failures, 1)
  })
  test(`${kind}: retry of the same keyword discards older replies`, async() => {
    const f = searchFixture(kind)
    const old = deferred()
    f.state.sources = ['all', 'kw']
    f.source('kw', () => old.promise)
    const first = f.search('same', 1, 'all')
    await Promise.resolve()
    f.source('kw', async() => f.result('kw', [{ id: 'new' }]))
    await f.search('same', 1, 'all')
    old.resolve(f.result('kw', [{ id: 'old' }]))
    await first
    assert.equal(f.state.listInfos.all.list[0].id, 'new')
  })
  test(`${kind}: changing sources discards late errors and results`, async() => {
    const f = searchFixture(kind)
    const old = deferred()
    f.source('kw', () => old.promise)
    f.source('kg', async() => f.result('kg', [{ id: 'new' }]))
    const first = f.search('old', 1, 'kw')
    await f.search('new', 1, 'kg')
    old.reject(new Error('late error'))
    await first
    assert.equal(f.state.source, 'kg')
    assert.equal(f.calls.length, 1)
  })
  test(`${kind}: explicit retry bypasses the single-source cache`, async() => {
    const f = searchFixture(kind)
    let requests = 0
    f.source('kw', async() => { requests++; return f.result('kw', [{ id: String(requests) }]) })
    await f.search('song', 1, 'kw')
    await f.search('song', 1, 'kw')
    assert.equal(requests, 1)
    const list = await f.search('song', 1, 'kw', undefined, undefined, true)
    assert.equal(requests, 2)
    assert.equal(list[0].id, '2')
  })
  test(`${kind}: an in-flight keyword cannot reuse the previous keyword's list`, async() => {
    const f = searchFixture(kind)
    f.source('kw', async() => f.result('kw', [{ id: 'old' }]))
    await f.search('old', 1, 'kw')
    const slow = deferred()
    f.source('kw', () => slow.promise)
    const first = f.search('new', 1, 'kw')
    f.source('kw', async() => f.result('kw', [{ id: 'new' }]))
    const result = await f.search('new', 1, 'kw')
    slow.resolve(f.result('kw', [{ id: 'stale' }]))
    await first
    assert.equal(result[0].id, 'new')
    assert.equal(f.state.listInfos.kw.list[0].id, 'new')
  })
  test(`${kind}: missing source is a recoverable error`, async() => {
    const f = searchFixture(kind)
    await assert.rejects(f.search('song', 1, 'kw'), /source not found/)
    f.state.sources = ['all']
    await assert.rejects(f.search('song', 1, 'all'), /All search sources failed/)
  })
}

function undoFixture() {
  let list = ['a', 'b', 'c'].map(id => ({ id, name: id }))
  const state = { allList: [{ id: 'playlist' }], tempList: { id: 'temp' } }
  let adds = 0
  let failMove = false
  const api = loadModule('src/screens/Home/Views/Mylist/MusicList/removeMusicWithUndo.ts', {
    '@/core/list': {
      async removeListMusics(id, ids) { list = list.filter(item => !ids.includes(item.id)) },
      async addListMusics(id, items) { adds++; list.push(...items) },
      async updateListMusicPosition(id, position, ids) {
        if (failMove) { failMove = false; throw new Error('disk') }
        const moving = list.filter(item => ids.includes(item.id))
        list = list.filter(item => !ids.includes(item.id))
        list.splice(position, 0, ...moving)
      },
    },
    '@/store/list/state': state,
    '@/utils/listManage': { getListMusicSync() { return list } },
  }, { global: { i18n: { t: key => key } } })
  return { ...api, state, list: () => list, ids: () => list.map(item => item.id), adds: () => adds, failMove() { failMove = true } }
}

test('locale keys: new interaction messages are available in all supported languages', () => {
  const languages = ['zh-cn', 'zh-tw', 'en-us'].map(language => JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'src/lang', `${language}.json`), 'utf8')))
  const keys = ['player_cover', 'player_lyrics', 'player_show_cover', 'player_show_lyrics', 'player_change_quality', 'list_load_failed', 'list_load_failed_hint', 'list_no_content', 'list_no_content_hint', 'search_no_results', 'search_no_results_hint', 'search_partial_failed', 'list_remove_undo_message', 'list_undo', 'list_undo_failed', 'list_undo_list_missing', 'list_remove_failed', 'list_music_actions']
  for (const language of languages) {
    for (const key of keys) assert.ok(typeof language[key] == 'string' && language[key].length, key)
  }
})

test('undo: restores original position and is idempotent', async() => {
  const f = undoFixture()
  const restore = await f.removeMusicWithUndo('playlist', f.list()[1])
  assert.deepEqual(f.ids(), ['a', 'c'])
  await restore()
  await restore()
  assert.deepEqual(f.ids(), ['a', 'b', 'c'])
  assert.equal(f.adds(), 1)
})
test('undo: preserves concurrent additions rather than overwriting the playlist', async() => {
  const f = undoFixture()
  const restore = await f.removeMusicWithUndo('playlist', f.list()[1])
  f.list().unshift({ id: 'new' })
  await restore()
  assert.deepEqual(f.ids(), ['new', 'a', 'b', 'c'])
})
test('undo: does not recreate a deleted playlist', async() => {
  const f = undoFixture()
  const restore = await f.removeMusicWithUndo('playlist', f.list()[1])
  f.state.allList = []
  await assert.rejects(restore(), /list_undo_list_missing/)
  assert.equal(f.adds(), 0)
})
test('undo: does not duplicate or reposition a song already restored elsewhere', async() => {
  const f = undoFixture()
  const saved = f.list()[1]
  const restore = await f.removeMusicWithUndo('playlist', saved)
  f.list().push(saved)
  await restore()
  assert.deepEqual(f.ids(), ['a', 'c', 'b'])
  assert.equal(f.adds(), 0)
})
test('undo: retry after position-update failure does not add twice', async() => {
  const f = undoFixture()
  const restore = await f.removeMusicWithUndo('playlist', f.list()[1])
  f.failMove()
  await assert.rejects(restore(), /disk/)
  await restore()
  assert.deepEqual(f.ids(), ['a', 'b', 'c'])
  assert.equal(f.adds(), 1)
})
test('undo: concurrent taps share one restore operation', async() => {
  const f = undoFixture()
  const restore = await f.removeMusicWithUndo('playlist', f.list()[1])
  await Promise.all([restore(), restore(), restore()])
  assert.deepEqual(f.ids(), ['a', 'b', 'c'])
  assert.equal(f.adds(), 1)
})
test('undo: a disappeared song is not offered as a removal', async() => {
  const f = undoFixture()
  await assert.rejects(f.removeMusicWithUndo('playlist', { id: 'gone' }), /no longer/)
  assert.deepEqual(f.ids(), ['a', 'b', 'c'])
})
