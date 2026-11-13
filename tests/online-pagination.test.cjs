const assert = require('node:assert/strict')
const { test } = require('node:test')
const { loadSource } = require('./load-source.cjs')

for (const kind of ['songlist', 'leaderboard']) {
  const setup = (limit, total) => {
    const songs = Array.from({ length: total }, (_, id) => ({ id: String(id) }))
    const pages = []
    const get = async(id, page) => {
      pages.push(page)
      return { list: songs.slice((page - 1) * limit, page * limit), total, limit, page }
    }
    const api = loadSource(`src/core/${kind}.ts`, {
      [`@/store/${kind}/state`]: {},
      [`@/store/${kind}/action`]: {},
      '@/utils': { toNewMusicInfo: song => song, deduplicationList: list => [...new Map(list.map(song => [song.id, song])).values()] },
      '@/utils/common': { arrPush: (list, items) => list.push(...items) },
      '@/utils/musicSdk': { kw: { songList: { getListDetail: get }, leaderboard: { getList: get } } },
    })
    return { pages, songs, getAll: () => kind === 'songlist' ? api.getListDetailAll('kw', 'id') : api.getListDetailAll('kw__id') }
  }

  for (const [limit, total] of [[20, 80], [50, 160], [100, 305], [10, 0]]) {
    test(`${kind}: collects all ${total} songs from upstream ${limit}-item pages without duplicates`, async() => {
      const s = setup(limit, total)
      const list = await s.getAll()
      assert.equal(JSON.stringify(list), JSON.stringify(s.songs))
      assert.equal(s.pages.length, Math.max(1, Math.ceil(total / limit)))
      assert.equal(new Set(s.pages).size, s.pages.length)
    })
  }
}
