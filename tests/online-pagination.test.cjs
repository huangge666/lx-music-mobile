const assert = require('node:assert/strict')
const { test } = require('node:test')
const { loadSource, deferred } = require('./load-source.cjs')

const setup = (limit, total) => {
  const songs = Array.from({ length: total }, (_, id) => ({ id: String(id) }))
  const pages = []
  const get = async(id, page) => {
    pages.push(page)
    return { list: songs.slice((page - 1) * limit, page * limit), total, limit, page }
  }
  const api = loadSource('src/core/songlist.ts', {
    '@/store/songlist/state': {},
    '@/store/songlist/action': {},
    '@/utils': { toNewMusicInfo: song => song, deduplicationList: list => [...new Map(list.map(song => [song.id, song])).values()] },
    '@/utils/common': { arrPush: (list, items) => list.push(...items) },
    '@/utils/musicSdk': { kw: { songList: { getListDetail: get } } },
  })
  return { pages, songs, getAll: () => api.getListDetailAll('kw', 'id') }
}

for (const [limit, total] of [[20, 80], [50, 160], [100, 305], [10, 0]]) {
  test(`songlist: collects all ${total} songs from upstream ${limit}-item pages without duplicates`, async() => {
    const s = setup(limit, total)
    const list = await s.getAll()
    assert.equal(JSON.stringify(list), JSON.stringify(s.songs))
    assert.equal(s.pages.length, Math.max(1, Math.ceil(total / limit)))
    assert.equal(new Set(s.pages).size, s.pages.length)
  })
}

const pendingSetup = () => {
  const pending = []
  const get = (id, page) => {
    const request = deferred()
    pending.push({ id, page, ...request })
    return request.promise
  }
  const api = loadSource('src/core/songlist.ts', {
    '@/store/songlist/state': {},
    '@/store/songlist/action': {},
    '@/utils': { toNewMusicInfo: song => song, deduplicationList: list => [...new Map(list.map(song => [song.id, song])).values()] },
    '@/utils/common': { arrPush: (list, items) => list.push(...items) },
    '@/utils/musicSdk': { kw: { songList: { getListDetail: get } } },
  })
  const load = (id, refresh = false) => api.getListDetail(id, 'kw', 1, refresh)
  const result = id => ({ list: [{ id }], total: 1, limit: 30, page: 1, source: 'kw' })
  return { pending, load, result }
}

test('songlist: an in-flight request still returns a complete page after LRU eviction', async() => {
  const s = pendingSetup()
  const first = s.load('first')
  for (let index = 0; index < 12; index++) {
    const task = s.load(`other-${index}`)
    s.pending.at(-1).resolve(s.result(`other-${index}`))
    await task
  }
  s.pending[0].resolve(s.result('first'))
  const result = await first
  assert.equal(result.list[0].id, 'first')
  assert.equal(result.limit, 30)
})

test('songlist: explicit refresh rejects the older request with AbortError, never undefined', async() => {
  const s = pendingSetup()
  const old = s.load('same')
  const checked = assert.rejects(old, error => error.name == 'AbortError')
  const fresh = s.load('same', true)
  s.pending[1].resolve(s.result('new'))
  assert.equal((await fresh).list[0].id, 'new')
  s.pending[0].resolve(s.result('old'))
  await checked
  assert.equal((await s.load('same')).list[0].id, 'new')
})
