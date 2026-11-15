const assert = require('node:assert/strict')
const { test } = require('node:test')
const { loadSource, deferred, flush } = require('./load-source.cjs')

const musicUtils = loadSource('src/utils/index.ts', {
  './common': {},
  '@/utils/simplify-chinese-main': {},
  he: {},
})
const song = id => ({ id, name: id, singer: '', source: 'kw', meta: { songId: id, albumName: '', _qualitys: {}, qualitys: [] } })
const playlist = (id, songs = [song('new')]) => ({ id, name: id, locationUpdateTime: null, list: songs })
const setup = (config, confirm = true) => {
  const messages = []; const writes = []; const tips = []
  const write = deferred()
  const state = {
    defaultList: { id: 'default', name: '试听列表' },
    loveList: { id: 'love', name: '我的收藏' },
    userList: [{ id: 'keep', name: 'Keep', locationUpdateTime: 10 }],
  }
  state.allList = [state.defaultList, state.loveList, ...state.userList]
  const commit = (...args) => { writes.push(args); return write.promise }
  const tools = {
    handleReadFile: async() => config,
    confirmDialog: async() => confirm,
    toast: message => messages.push(message),
    showImportTip: type => tips.push(type),
  }
  const api = loadSource('src/core/listImportExport.ts', {
    '@/config/constant': { LIST_IDS: { DEFAULT: 'default', LOVE: 'love' } },
    '@/core/list': { getListMusics: async id => [song(id)], createList: commit, overwriteList: commit, overwriteListFull: commit, overwriteListMusics: commit },
    '@/utils': musicUtils,
    '@/utils/log': { log: { error() {} } },
    '@/utils/tools': tools,
    '@/store/list/state': state,
  }, { i18n: { t: key => key } })
  return { api, messages, writes, write, tips, tools, state }
}

for (const replace of [false, true]) {
  test(`single playlist ${replace ? 'replacement' : 'creation'} awaits persistence and leaves the caller unchanged`, async() => {
    const s = setup(null, replace)
    const data = playlist('keep')
    data.name = 'Imported name'
    data.list[0].meta = { songId: 'new', albumName: '', _qualitys: { flac32bit: {} }, qualitys: [{ type: 'flac32bit' }] }
    const original = JSON.stringify(data)
    let finished = false
    const task = s.api.handleImportListPart(data, 0).then(() => { finished = true })
    await flush()
    assert.equal(finished, false)
    assert.equal(s.messages.length, 0)
    assert.equal(JSON.stringify(data), original)
    const imported = s.writes[0][0]
    assert.equal(imported.name, replace ? 'Keep' : 'Imported name')
    assert.equal(imported.id === 'keep', replace)
    assert.equal(imported.list[0].meta.qualitys[0].type, 'flac24bit')
    s.write.resolve()
    await task
    assert.deepEqual(s.messages, ['setting_backup_part_import_list_tip_success'])
  })
}

test('single playlist write failure produces one error and no success', async() => {
  const s = setup({ type: 'playListPart_v2', data: playlist('new') })
  const task = s.api.handleImportList('/playlist.json')
  await flush()
  s.write.reject(new Error('disk full'))
  await task
  assert.equal(s.messages.filter(m => m.includes('tip_error')).length, 1)
  assert.equal(s.messages.some(m => m.includes('tip_success')), false)
})

test('malformed batch does not partially replace valid or unrelated local playlists', async() => {
  const s = setup({ type: 'playList_v2', data: [playlist('keep'), { id: 'broken', name: 'Broken', list: null }] })
  await s.api.handleImportList('/playlist.json')
  assert.equal(s.writes.length, 0)
  assert.equal(s.messages.some(m => m.includes('tip_success')), false)
  assert.equal(s.messages.some(m => m.includes('tip_error')), true)
})

for (const type of ['playList_v2', 'allData_v2', 'playList', 'allData', 'playListPart', 'playListPart_v2', 'defautlList']) {
  test(`playlist file import preserves the ${type} format`, async() => {
    const legacy = !type.endsWith('_v2')
    const data = playlist('new', [legacy ? { name: 'Legacy', singer: '', source: 'kw', songmid: 'legacy', _types: {}, types: [] } : song('new')])
    const config = type == 'defautlList' || type.startsWith('playListPart')
      ? { type, data }
      : type.startsWith('allData') ? { type, playList: [data] } : { type, data: [data] }
    const s = setup(config)
    const task = s.api.handleImportList('/playlist.json')
    await flush()
    assert.equal(s.writes.length, 1)
    assert.equal(s.messages.some(m => m.includes('tip_success')), false)
    if (!type.startsWith('playListPart') && type != 'defautlList') {
      const batch = s.writes[0][0]
      assert.equal(batch.defaultList[0].id, 'default')
      assert.equal(batch.loveList[0].id, 'love')
      assert.equal(batch.userList[0].id, 'keep')
      assert.equal(batch.userList[1].list[0].id, legacy ? 'kw_legacy' : 'new')
    }
    s.write.resolve()
    await task
    assert.equal(s.messages.filter(m => m.includes('tip_success')).length, 1)
  })
}

test('declining batch replacement does not write or report success', async() => {
  const s = setup({ type: 'playList_v2', data: [playlist('new')] }, false)
  await s.api.handleImportList('/playlist.json')
  assert.equal(s.writes.length, 0)
  assert.equal(s.messages.some(m => m.includes('tip_success')), false)
})

test('unsupported file shows the format explanation without a false success', async() => {
  const s = setup({ type: 'setting_v2', data: {} })
  await s.api.handleImportList('/settings.json')
  assert.deepEqual(s.tips, ['setting_v2'])
  assert.equal(s.writes.length, 0)
  assert.equal(s.messages.some(m => m.includes('tip_success')), false)
})

test('single playlist menu export reports the real disk failure', async() => {
  const messages = []
  const api = loadSource('src/screens/Home/Views/Mylist/MyList/listAction.ts', {
    '@/core/list': { getListMusics: async() => [] },
    '@/utils/tools': { toast: message => messages.push(message), handleSaveFile: async() => { throw new Error('disk full') } },
    '@/core/updateImportedList': {},
    '@/utils/log': { log: { error() {} } },
    '@/utils': { filterFileName: name => name },
    '@/core/listImportExport': {},
    '@/utils/localMediaMetadata': {},
    '@/store/setting/state': {},
    'react-native-background-timer': {},
  }, { i18n: { t: key => key } })
  await api.handleExport({ id: 'keep', name: 'Keep' }, '/playlists')
  assert.equal(messages.some(m => m.includes('tip_success')), false)
  assert.equal(messages.some(m => m.includes('tip_failed') && m.includes('disk full')), true)
})
