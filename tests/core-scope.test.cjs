const assert = require('node:assert/strict')
const { test } = require('node:test')
const { loadSource } = require('./load-source.cjs')

test('core tabs share a stable order and removed navigation restores to my playlists', () => {
  const nav = loadSource('src/config/constant.ts')
  assert.deepEqual(Array.from(nav.MAIN_NAV_IDS), ['nav_love', 'nav_songlist', 'nav_search', 'nav_download'])
  for (const id of nav.MAIN_NAV_IDS) {
    assert.equal(nav.normalizeNavId(id), id)
    assert.equal(nav.getMainNavIdAt(nav.getMainNavIndex(id)), id)
  }
  for (const id of ['nav_top', 'nav_setting', 'unknown', null, undefined]) assert.equal(nav.normalizeNavId(id), 'nav_love')
})

test('settings expose only source, appearance and the four core behavior groups', () => {
  const mocks = { react: { forwardRef: component => component } }
  for (const name of ['Basic', 'Source', 'Player', 'Search', 'List', 'Download']) mocks[`./settings/${name}`] = name
  const settings = loadSource('src/screens/Home/Views/Setting/Main.tsx', mocks)
  assert.deepEqual(Array.from(settings.SETTING_SCREENS), ['source', 'basic', 'player', 'search', 'list', 'download'])
  assert.deepEqual(Array.from(settings.SETTING_NAV_GROUPS.flatMap(group => group.items)).sort(), Array.from(settings.SETTING_SCREENS).sort())
})

test('playlist import menu keeps both link and file actions reachable', () => {
  const shown = []; const opens = []
  const refs = [
    { current: { show: () => opens.push('link') } },
    { current: { show: info => shown.push(info) } },
    { current: { import: () => opens.push('file') } },
  ]
  const Import = loadSource('src/screens/Home/Views/Mylist/MyList/ImportSonglist/index.tsx', {
    react: { useRef: () => refs.shift() },
    '@/components/common/GlassIconButton': 'Button',
    '@/lang': { useI18n: () => key => key },
    './Modal': 'Modal',
    '@/components/common/ActionSheet': 'Sheet',
    '../ListFileImportExport': 'File',
  }).default
  const view = Import()
  view.props.children[0].props.onPress()
  assert.deepEqual(Array.from(shown[0].items, item => item.action), ['link', 'file'])
  const sheet = view.props.children[3]
  sheet.props.onPress('link')
  sheet.props.onPress('file')
  assert.deepEqual(opens, ['link', 'file'])
})

const playback = () => {
  const cleared = []
  const api = loadSource('src/core/player/utils.ts', { './playedList': { clearPlayedList: () => cleared.push(true) } })
  return { api, cleared }
}

test('shuffle skips played songs only from the same non-temporary list', () => {
  const { api } = playback()
  const list = [{ id: 'a' }, { id: 'b' }, { id: 'c' }]
  const result = api.filterMusicList({
    listId: 'mine',
    list,
    playedList: [
      { listId: 'mine', musicInfo: list[0] },
      { listId: 'other', musicInfo: list[1] },
      { listId: 'mine', isTempPlay: true, musicInfo: list[2] },
    ],
    playerMusicInfo: list[1],
  })
  assert.deepEqual(Array.from(result.filteredList, music => music.id), ['b', 'c'])
  assert.equal(result.playerIndex, 0)
})

test('shuffle starts another cycle after all playable songs were played', async() => {
  const { api, cleared } = playback()
  const list = [{ id: 'a' }, { id: 'b' }]
  const result = await api.filterList({ listId: 'mine', list, playedList: list.map(musicInfo => ({ listId: 'mine', musicInfo })), playerMusicInfo: list[1] })
  assert.deepEqual(Array.from(result.filteredList, music => music.id), ['a', 'b'])
  assert.equal(result.playerIndex, 1)
  assert.equal(cleared.length, 1)
})

test('download playback excludes incomplete files even on shuffle cycle reset', async() => {
  const { api } = playback()
  const list = [{ id: 'pending', progress: {}, isComplate: false }, { id: 'done', progress: {}, isComplate: true }]
  const result = await api.filterList({ listId: 'download', list, playedList: [{ listId: 'download', musicInfo: list[1] }] })
  assert.deepEqual(Array.from(result.filteredList, music => music.id), ['done'])
})
