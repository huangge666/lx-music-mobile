const assert = require('node:assert/strict')
const { test } = require('node:test')
const { loadSource, deferred, flush } = require('./load-source.cjs')

const setup = () => {
  const write = deferred()
  const timestamps = []
  const api = loadSource('src/core/syncSourceList.ts', {
    '@/utils/data': { setListUpdateTime: async(id, now) => { timestamps.push([id, now]) } },
    './list': { setFetchingListStatus() {}, overwriteListMusics: () => write.promise },
    '@/core/songlist': { getListDetailAll: async() => [{ id: 'song' }] },
    '@/core/leaderboard': {},
  }).default
  return { sync: () => api({ id: 'local-list', source: 'kw', sourceListId: 'online-list' }), write, timestamps }
}

test('source-list sync reports completion only after playlist persistence', async() => {
  const s = setup()
  let finished = false
  const sync = s.sync().then(() => { finished = true })
  await flush()
  assert.equal(finished, false)
  assert.equal(s.timestamps.length, 0)
  s.write.resolve()
  await sync
  assert.equal(s.timestamps[0][0], 'local-list')
})

test('source-list persistence failure rejects sync and does not advance its timestamp', async() => {
  const s = setup()
  const rejected = assert.rejects(s.sync(), /disk full/)
  await flush()
  s.write.reject(new Error('disk full'))
  await rejected
  assert.equal(s.timestamps.length, 0)
})
