const assert = require('node:assert/strict')
const { test } = require('node:test')
const { loadSource, deferred, flush } = require('./load-source.cjs')

const setup = () => {
  const write = deferred()
  const timestamps = []
  const api = loadSource('src/core/updateImportedList.ts', {
    '@/utils/data': { setListUpdateTime: async(id, now) => { timestamps.push([id, now]) } },
    './list': { setFetchingListStatus() {}, overwriteListMusics: () => write.promise },
    '@/core/songlist': { getListDetailAll: async() => [{ id: 'song' }] },
  }).default
  return { sync: () => api({ id: 'local-list', source: 'kw', sourceListId: 'online-list' }), write, timestamps }
}

test('imported-list update reports completion only after playlist persistence', async() => {
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

test('imported-list persistence failure rejects update and does not advance its timestamp', async() => {
  const s = setup()
  const rejected = assert.rejects(s.sync(), /disk full/)
  await flush()
  s.write.reject(new Error('disk full'))
  await rejected
  assert.equal(s.timestamps.length, 0)
})

for (const sourceListId of ['1234', 'kw__1234']) {
  test(`imported-list update restores platform id from ${sourceListId}`, async() => {
    const requests = []
    const fetching = []
    const api = loadSource('src/core/updateImportedList.ts', {
      '@/utils/data': { setListUpdateTime: async() => {} },
      './list': { setFetchingListStatus: (id, value) => fetching.push(value), overwriteListMusics: async() => {} },
      '@/core/songlist': { getListDetailAll: async(...args) => { requests.push(args); return [] } },
    }).default
    await api({ id: 'local', source: 'kw', sourceListId })
    assert.deepEqual(requests, [['kw', '1234', true]])
    assert.deepEqual(fetching, [true, false])
  })
}

test('old chart collections keep local songs without requesting removed chart APIs', async() => {
  const api = loadSource('src/core/updateImportedList.ts', {
    '@/utils/data': { setListUpdateTime() { assert.fail('must not change timestamp') } },
    './list': {
      setFetchingListStatus() { assert.fail('must not start fetching') },
      overwriteListMusics() { assert.fail('must not replace local songs') },
    },
    '@/core/songlist': { getListDetailAll() { assert.fail('must not fetch') } },
  }, { i18n: { t: key => key } }).default
  await assert.rejects(api({ id: 'old', source: 'kw', sourceListId: 'board__kw__hot' }), /list_refresh_unavailable/)
})
