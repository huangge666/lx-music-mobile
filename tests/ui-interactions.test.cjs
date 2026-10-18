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

const constants = loadModule('src/config/constant.ts', {})

test('navigation: the three main tabs come from one ordered definition', () => {
  // 模块在独立 realm 里求值，比较前换成主 realm 的数组
  assert.deepEqual(Array.from(constants.MAIN_NAV_MENUS, menu => menu.id), ['nav_love', 'nav_songlist', 'nav_search'])
  for (const menu of constants.MAIN_NAV_MENUS) {
    const defined = constants.NAV_MENUS.find(item => item.id == menu.id)
    assert.ok(defined, `unknown main tab id: ${menu.id}`)
    assert.equal(defined.icon, menu.icon, `icon drift for ${menu.id}`)
    assert.equal(constants.getMainNavIndex(menu.id), constants.MAIN_NAV_MENUS.indexOf(menu))
    assert.equal(constants.getMainNavIdAt(constants.getMainNavIndex(menu.id)), menu.id)
  }
  assert.equal(constants.getMainNavIdAt(constants.MAIN_NAV_MENUS.length), undefined)
  assert.equal(constants.getMainNavIndex(constants.DEFAULT_MAIN_NAV_ID), 0)
  assert.equal(constants.DEFAULT_SETTING.viewPrevState.id, constants.DEFAULT_MAIN_NAV_ID)
})

test('navigation: the auxiliary drawer never duplicates a main tab', () => {
  assert.deepEqual(Array.from(constants.DRAWER_NAV_MENUS, menu => menu.id), ['nav_download', 'nav_setting'])
  for (const menu of constants.DRAWER_NAV_MENUS) {
    assert.equal(constants.isMainNavId(menu.id), false)
    assert.ok(constants.NAV_MENUS.some(item => item.id == menu.id && item.icon == menu.icon))
  }
})

test('navigation: restoring a legacy id never opens an overlay', () => {
  for (const id of ['nav_love', 'nav_songlist', 'nav_search']) {
    assert.equal(constants.normalizeNavId(id), id)
    assert.equal(constants.isMainNavId(id), true)
  }
  assert.equal(constants.isMainNavId('nav_top'), false)
  assert.equal(constants.normalizeNavId('nav_top'), 'nav_songlist')
  for (const id of ['nav_download', 'nav_setting', '', 'nav_unknown', undefined, null]) {
    assert.equal(constants.normalizeNavId(id), 'nav_love')
  }
})

test('navigation: overlay pages never become the restore point', () => {
  const state = { navActiveId: 'nav_love', lastNavActiveId: 'nav_love' }
  const events = []
  const actions = loadModule('src/store/common/action.ts', {
    './state': state,
    '@/config/constant': constants,
  }, { global: { state_event: { navActiveIdUpdated: id => events.push(id) } } })

  actions.default.setNavActiveId('nav_top')
  assert.equal(state.navActiveId, 'nav_top')
  assert.equal(state.lastNavActiveId, 'nav_love')
  actions.default.setNavActiveId('nav_download')
  assert.equal(state.lastNavActiveId, 'nav_love')
  actions.default.setNavActiveId('nav_setting')
  assert.equal(state.lastNavActiveId, 'nav_love')
  actions.default.setNavActiveId('nav_songlist')
  assert.equal(state.lastNavActiveId, 'nav_songlist')
  assert.deepEqual(events, ['nav_top', 'nav_download', 'nav_setting', 'nav_songlist'])
})

function navigationFixture() {
  const commonState = { navActiveId: 'nav_love', lastNavActiveId: 'nav_love' }
  const saved = []
  const actions = {
    setNavActiveId(id) { commonState.navActiveId = id },
    setLastNavActiveId(id) { commonState.lastNavActiveId = id },
  }
  const api = loadModule('src/core/common.ts', {
    './desktopLyric': { hideDesktopLyric() {} },
    '@/utils/nativeModules/utils': { exitApp() {} },
    '@/plugins/player/utils': { setPause() {} },
    '@/config/setting': { initSetting() {} },
    '@/lang/i18n': { setLanguage() {} },
    '@/store/setting/action': { updateSetting() {} },
    '@/store/setting/state': { setting: {} },
    '@/store/common/action': actions,
    '@/store/common/state': commonState,
    '@/config/constant': constants,
    '@/plugins/storage': { saveData() {} },
    '@/utils/common': { throttle: fn => fn },
    '@/utils/data': {
      getSelectedManagedFolder() {},
      setSelectedManagedFolder() {},
      saveFontSize() {},
      saveViewPrevState(state) { saved.push(state) },
    },
    '@/utils/nativeModules/lyricDesktop': { hideDesktopLyricView() {} },
    '@/core/init/player/playProgress': { flushPendingListInterval() {} },
    '@/utils/fs': { getPersistedUriList() {}, selectManagedFolder() {} },
  }, { global: { state_event: { languageChanged() {} } } })
  return { ...api, commonState, saved }
}

test('navigation: the leaderboard entry pins its browse parent and returns to it', () => {
  const f = navigationFixture()
  // 持久化内容在独立 realm 里生成，这里只比较 id 序列
  const savedIds = () => f.saved.map(state => state.id)

  // 直接切到覆盖页也不能改写返回落点或写回持久化
  f.setNavActiveId('nav_top')
  assert.equal(f.commonState.lastNavActiveId, 'nav_love')
  assert.deepEqual(savedIds(), [])

  f.closeLeaderboard()
  assert.equal(f.commonState.navActiveId, 'nav_songlist')

  f.setNavActiveId('nav_love')
  assert.deepEqual(savedIds(), ['nav_songlist', 'nav_love'])

  f.openLeaderboard()
  assert.equal(f.commonState.navActiveId, 'nav_top')
  assert.equal(f.commonState.lastNavActiveId, 'nav_songlist')
  // 打开排行榜覆盖页不写回持久化的主标签
  assert.deepEqual(savedIds(), ['nav_songlist', 'nav_love'])

  f.closeLeaderboard()
  assert.equal(f.commonState.navActiveId, 'nav_songlist')
  assert.deepEqual(savedIds(), ['nav_songlist', 'nav_love', 'nav_songlist'])

  // 覆盖页在栈顶时同样回到有效主标签，脏值退回资料库
  f.commonState.navActiveId = 'nav_download'
  f.backToHomeTab()
  assert.equal(f.commonState.navActiveId, 'nav_songlist')
  f.commonState.lastNavActiveId = 'nav_setting'
  f.commonState.navActiveId = 'nav_top'
  f.backToHomeTab()
  assert.equal(f.commonState.navActiveId, 'nav_love')
})

test('locale keys: navigation labels exist in all supported languages', () => {
  const languages = ['zh-cn', 'zh-tw', 'en-us'].map(language => JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'src/lang', `${language}.json`), 'utf8')))
  for (const language of languages) {
    for (const key of ['nav_love', 'nav_songlist', 'nav_search', 'nav_top', 'nav_more']) {
      assert.ok(typeof language[key] == 'string' && language[key].length, key)
    }
  }
})

/* ---- Phase 4: 资料库网格几何、封面占位与真实随机 ---- */

function gridMetrics(input) {
  const base = { contentPadding: 16, columnGap: 12, minCardWidth: 148, rowSpacing: 18, titleBlockHeight: 34, metaBlockHeight: 28 }
  return loadModule('src/screens/Home/Views/Mylist/MyList/gridLayout.ts', {}).getLibraryGridMetrics({ ...base, ...input })
}

test('library grid: portrait uses two columns whose width follows the measured container', () => {
  const m = gridMetrics({ width: 360 })
  assert.equal(m.columns, 2)
  // (360 - 16*2 - 12) / 2
  assert.equal(m.cardWidth, 158)
  // 行高必须等于卡片高度加行间距，getItemLayout 用的是同一个值
  assert.equal(m.cardHeight, 158 + 34 + 28)
  assert.equal(m.rowHeight, m.cardHeight + 18)
})

test('library grid: wider containers add columns, narrow ones keep the two-column floor', () => {
  assert.equal(gridMetrics({ width: 800 }).columns, 4)
  assert.equal(gridMetrics({ width: 200 }).columns, 2)
  assert.equal(gridMetrics({ width: 0 }).cardWidth, 0)
  assert.equal(gridMetrics({ width: 0 }).columns, 2)
  // 列宽和间距一起不能超出可用宽度
  for (const width of [320, 375, 411, 600, 900]) {
    const m = gridMetrics({ width })
    const used = m.cardWidth * m.columns + m.columnGap * (m.columns - 1)
    assert.ok(used <= width - m.contentPadding * 2, `overflow at ${width}`)
  }
})

test('playlist cover placeholder: stable id gives a stable tint and initial', () => {
  const api = loadModule('src/components/common/playlistCover.ts', {})
  const a = api.getPlaylistCoverTint('userlist_1')
  assert.deepEqual(a, api.getPlaylistCoverTint('userlist_1'))
  assert.match(a.backgroundColor, /^hsl\(\d+, \d+%, \d+%\)$/)
  const distinct = new Set(['a', 'b', 'userlist_1', 'userlist_2', 'kw__123', 'love'].map(id => api.getPlaylistCoverTint(id).backgroundColor))
  assert.ok(distinct.size > 1, 'different ids must not all share one tint')
  assert.equal(api.getPlaylistInitial('  后来 '), '后')
  assert.equal(api.getPlaylistInitial(''), '')
  assert.equal(api.getPlaylistInitial('   '), '')
})

test('shuffle: the start index stays inside the playlist for any random value', () => {
  const { getShuffleStartIndex } = loadModule('src/utils/shuffle.ts', {})
  assert.equal(getShuffleStartIndex(0), 0)
  assert.equal(getShuffleStartIndex(-3), 0)
  assert.equal(getShuffleStartIndex(Number.NaN), 0)
  assert.equal(getShuffleStartIndex(5, () => 0), 0)
  assert.equal(getShuffleStartIndex(5, () => 0.999999), 4)
  assert.equal(getShuffleStartIndex(5, () => 1), 4)
  assert.equal(getShuffleStartIndex(5, () => Number.NaN), 0)
  for (const value of [0, 0.1, 0.5, 0.99]) {
    const index = getShuffleStartIndex(9, () => value)
    assert.ok(index >= 0 && index <= 8, `out of range: ${index}`)
  }
})

function positionFixture() {
  const storage = {}
  const api = loadModule('src/utils/data.ts', {
    '@/plugins/storage': {
      async getData(key) { return storage[key] ?? null },
      async saveData(key, value) { storage[key] = value },
      async getDataMultiple(keys) { return keys.map(key => storage[key] ?? null) },
      async saveDataMultiple() {},
      async getAllKeys() { return Object.keys(storage) },
      async removeDataMultiple() {},
      async removeData(key) { delete storage[key] },
    },
    '@/config/constant': constants,
    '@/utils/pixelRatio': {
      scaleSizeH: size => size,
      scaleSizeW: size => size,
      setSpText: size => size,
    },
    './common': { throttle: fn => fn },
  })
  return api
}

test('library position: an unknown layout resets only this view instead of reusing old pixels', async() => {
  const api = positionFixture()
  // 旧版本只存了像素偏移，没有行高/列数记录
  await api.saveListPosition('__LIST_SCROLL_POSITION_KEY__', 640)
  assert.equal(await api.getMusicListPosition('__LIST_SCROLL_POSITION_KEY__', 238, 2, { resetWhenLayoutUnknown: true }), 0)
  // 其他调用方（歌曲列表）仍按旧基线换算，行为不变
  await api.saveListPosition('music_list', 108)
  assert.equal(await api.getMusicListPosition('music_list', 60, 1), 120)
})

test('library position: a recorded layout restores pixels and a column change resets', async() => {
  const api = positionFixture()
  await api.saveMusicListPosition('__LIST_SCROLL_POSITION_KEY__', 476, 238, 2)
  assert.equal(await api.getMusicListPosition('__LIST_SCROLL_POSITION_KEY__', 238, 2), 476)
  // 旋转后列数变了，没有稳定的首项可以换算
  assert.equal(await api.getMusicListPosition('__LIST_SCROLL_POSITION_KEY__', 180, 4), 0)
})

test('locale keys: playlist shuffle failure message exists in all supported languages', () => {
  const languages = ['zh-cn', 'zh-tw', 'en-us'].map(language => JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'src/lang', `${language}.json`), 'utf8')))
  for (const language of languages) {
    assert.ok(typeof language.playlist_shuffle_failed == 'string' && language.playlist_shuffle_failed.length)
  }
})

/* ---- Phase 5: 正在播放页封面几何、进度条数值与读屏文案 ---- */

function coverApi() {
  return loadModule('src/screens/PlayDetail/Vertical/coverSize.ts', {})
}

test('now playing cover: the design ratio stays the upper bound so the first frame has no jump', () => {
  const api = coverApi()
  // 412x915 手机、状态栏 24、页头 56：宽 82% 小于高 42%，取宽
  const preferred = api.getPreferredCoverSize(412, 915, 24, 56)
  assert.equal(preferred, Math.round(412 * 0.82 * 1000) / 1000)
  // 实测空间充裕时仍然沿用设计比例值，不会在转场后突然放大
  assert.equal(api.fitCoverSize(preferred, 412, 535, 24, 12), Math.round(preferred))
  // 平板等超大屏有上限
  assert.ok(api.getPreferredCoverSize(1600, 2400, 24, 56) <= api.COVER_MAX_SIZE)
})

test('now playing cover: tight space from small screens or large fonts shrinks the artwork', () => {
  const api = coverApi()
  const preferred = api.getPreferredCoverSize(412, 915, 24, 56)
  // 应用大字号把控制区撑高，只剩 240 的可用高度：封面跟真实空间收缩，控制按钮不会被挤出屏幕
  const fitted = api.fitCoverSize(preferred, 412, 240, 24, 12)
  assert.equal(fitted, 240 - 12 * 2)
  assert.ok(fitted < preferred)
  // 窄屏同理
  assert.equal(api.fitCoverSize(preferred, 200, 535, 24, 12), 200 - 24 * 2)
  // 任何输入都不能超过实测可用空间
  for (const [w, h] of [[320, 200], [411, 480], [900, 300]]) {
    const size = api.fitCoverSize(preferred, w, h, 24, 12)
    assert.ok(size <= w - 48 && size <= h - 24, `overflow at ${w}x${h}`)
  }
})

test('now playing cover: unmeasured or invalid boxes fall back instead of collapsing to zero', () => {
  const api = coverApi()
  const preferred = api.getPreferredCoverSize(360, 720, 24, 56)
  assert.equal(api.fitCoverSize(preferred, 0, 0, 24, 12), preferred)
  assert.equal(api.fitCoverSize(preferred, Number.NaN, 500, 24, 12), preferred)
  // 空间连留白都放不下时返回 0，由调用方画同尺寸占位而不是溢出
  assert.equal(api.fitCoverSize(preferred, 20, 20, 24, 12), 0)
  // 圆角随边长等比并封顶
  assert.equal(api.getCoverRadius(338), 26)
  assert.equal(api.getCoverRadius(100), 9)
  assert.equal(api.getCoverRadius(0), 0)
})

test('progress values: NaN and out-of-range durations never reach the bar or the time text', () => {
  const api = loadModule('src/utils/playTime.ts', {})
  assert.equal(api.safeProgressRatio(Number.NaN), 0)
  assert.equal(api.safeProgressRatio(Number.POSITIVE_INFINITY), 0)
  assert.equal(api.safeProgressRatio(-0.5), 0)
  assert.equal(api.safeProgressRatio(1.4), 1)
  assert.equal(api.safeProgressRatio(0.25), 0.25)
  assert.equal(api.safePlayTime(Number.NaN), 0)
  assert.equal(api.safePlayTime(-12), 0)
  assert.equal(api.safePlayTime(183), 183)
  // 剩余时长：已播超过总时长时夹到 0，未知时长时也是 0
  assert.equal(api.getRemainTime(210, 30), 180)
  assert.equal(api.getRemainTime(210, 300), 0)
  assert.equal(api.getRemainTime(0, 30), 0)
  assert.equal(api.getRemainTime(Number.NaN, Number.NaN), 0)
})

test('locale keys: now playing control labels exist in all supported languages', () => {
  const languages = ['zh-cn', 'zh-tw', 'en-us'].map(language => JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'src/lang', `${language}.json`), 'utf8')))
  for (const language of languages) {
    for (const key of ['play_detail_action_prev', 'play_detail_action_next', 'play_detail_action_download', 'play_detail_action_comment', 'play_detail_action_more']) {
      assert.ok(typeof language[key] == 'string' && language[key].length, key)
    }
  }
})

