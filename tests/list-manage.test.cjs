const assert = require('node:assert/strict')
const { test } = require('node:test')
const { loadSource } = require('./load-source.cjs')

const setup = (getListMusics = async() => []) => {
  const removedMetadata = []
  const api = loadSource('src/utils/listManage.ts', {
    '@/config/constant': { LIST_IDS: { DEFAULT: 'default', LOVE: 'love', TEMP: 'temp' } },
    '@/utils/data': {
      getListMusics,
      getUserLists: async() => [],
      overwriteListPosition: async() => {},
      overwriteListUpdateInfo: async() => {},
      removeListPosition: async(id) => { removedMetadata.push(id) },
      removeListUpdateInfo: async() => {},
    },
    '@/utils/common': {
      arrPush: (list, items) => list.push(...items),
      arrUnshift: (list, items) => list.unshift(...items),
      arrPushByPosition: (list, items, position) => list.splice(position, 0, ...items),
    },
  })
  return { api, removedMetadata }
}

test('removing an unloaded active playlist still reports it and clears its metadata', () => {
  const { api, removedMetadata } = setup()
  api.setUserLists([{ id: 'unloaded', name: 'Playlist' }])
  assert.equal(JSON.stringify(api.userListsRemove(['unloaded'])), '["unloaded"]')
  assert.deepEqual(removedMetadata, ['unloaded'])
  assert.equal(api.userLists.length, 0)
})

test('full overwrite includes newly loaded playlists and persists an initially absent temp list', () => {
  const { api } = setup()
  const ids = api.listDataOverwrite({ defaultList: [], loveList: [], userList: [{ id: 'new', list: [] }], tempList: [{ id: 'song' }] })
  assert(ids.includes('new'))
  assert(ids.includes('default'))
  assert(ids.includes('temp'))
  assert.equal(api.allMusicList.get('temp')[0].id, 'song')
})

test('destination read failure leaves source songs untouched', async() => {
  const { api } = setup(async() => { throw new Error('read failed') })
  const song = { id: 'song' }
  api.setMusicList('from', [song])
  await assert.rejects(api.listMusicMove('from', 'to', [song], 'bottom'), /read failed/)
  assert.equal(api.allMusicList.get('from')[0], song)
})

test('moving songs to their own playlist does not reorder or erase them', async() => {
  const { api } = setup()
  const a = { id: 'a' }; const b = { id: 'b' }
  api.setMusicList('list', [a, b])
  assert.equal((await api.listMusicMove('list', 'list', [a], 'bottom')).length, 0)
  assert.equal(api.allMusicList.get('list')[0], a)
})
