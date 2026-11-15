const assert = require('node:assert/strict')
const { test } = require('node:test')
const { loadSource, deferred, flush } = require('./load-source.cjs')

// 读取真实 SDK 解析规则，只替换网络边界，防止测试和平台实现各写一套正则。
const sdk = {}
for (const source of ['kw', 'tx', 'wy', 'kg', 'mg']) {
  sdk[source] = {
    songList: loadSource(`src/utils/musicSdk/${source}/songList.js`, {
      '../../request': {},
      '../../index': {},
      './util': {},
      './album': {},
      '../utils': {},
      './utils/crypto': {},
      './musicDetail': {},
      './utils/index': {},
      './vendors/infSign.min': {},
      './musicInfo': {},
      './musicSearch': {},
    }).default,
  }
}
const identity = loadSource('src/utils/songlistId.ts', { '@/utils/musicSdk': sdk })

const setup = (userList = [], confirmed = true) => {
  const requests = []; const created = []; const updated = []
  const write = deferred()
  const api = loadSource('src/screens/Home/Views/Mylist/MyList/ImportSonglist/actions.ts', {
    '@/core/list': { createList: async(info) => { created.push(info); await write.promise } },
    '@/core/songlist': {
      getListDetail: async(id, source) => { requests.push([id, source]); return { info: { name: 'Online playlist' } } },
      getListDetailAll: async() => [{ id: 'song' }],
    },
    '@/core/updateImportedList': async(info) => { updated.push(info); await write.promise },
    '@/utils/tools': { confirmDialog: async() => confirmed, toMD5: id => id },
    '@/store/list/state': { userList },
    '@/utils/songlistId': identity,
  }, { i18n: { t: key => key } })
  return { api, requests, created, updated, write }
}

for (const [source, url, expected] of [
  ['kw', 'https://www.kuwo.cn/playlist_detail/123', '123'],
  ['kw', 'https://m.kuwo.cn/h5app/playlist/123?t=qqfriend', '123'],
  ['kw', 'digest-8__123', '123'],
  ['tx', 'https://y.qq.com/n/ryqq/playlist/123', '123'],
  ['tx', 'https://i.y.qq.com/n2/m/share/details/taoge.html?platform=11&id=123&ADTAG=share', '123'],
  ['wy', 'https://music.163.com/#/playlist?id=123&userid=9', '123'],
  ['wy', 'https://music.163.com/playlist/123/9/share', '123'],
  ['mg', 'https://music.migu.cn/v3/music/playlist/123?page=1', '123'],
  ['mg', 'https://h5.nf.migu.cn/app/v4/p/share/playlist/index.html?id=123&channel=0146921', '123'],
  ['kg', 'https://www.kugou.com/yy/special/single/123.html', 'id_123'],
]) {
  test(`${source} direct playlist link shares its identity with ${expected}`, async() => {
    assert.equal(identity.normalizeSonglistId(url, source), expected)
    const s = setup([{ id: 'existing', name: 'Existing', source, sourceListId: expected }], false)
    assert.equal(await s.api.handleImportSonglist(url, source), false)
    assert.equal(s.created.length + s.updated.length + s.requests.length, 0)
  })
}

test('legacy full links match numeric imports without rewriting or duplicating the saved playlist', async() => {
  for (const sourceListId of ['https://www.kuwo.cn/playlist_detail/123', 'kw__https://m.kuwo.cn/h5app/playlist/123?t=qqfriend']) {
    const s = setup([{ id: 'old', name: 'Old', source: 'kw', sourceListId }], false)
    assert.equal(await s.api.handleImportSonglist('123', 'kw'), false)
    assert.equal(s.created.length + s.updated.length + s.requests.length, 0)
  }
})

test('new direct-link imports fetch and persist the canonical playlist id', async() => {
  const s = setup()
  const imported = s.api.handleImportSonglist('https://www.kuwo.cn/playlist_detail/123', 'kw')
  await flush()
  assert.deepEqual(s.requests, [['123', 'kw']])
  assert.equal(s.created[0].sourceListId, 'kw__123')
  s.write.resolve()
  assert.equal(await imported, true)
})

test('identity normalization preserves private authorization, albums, Bodian collections and Kugou share codes', () => {
  for (const [source, input, expected] of [
    ['wy', 'https://music.163.com/#/playlist?id=123###private-token', '123###private-token'],
    ['kw', 'digest-13__123', 'digest-13__123'],
    ['kw', 'https://h5app.kuwo.cn/m/bodian/collection.html?playlistId=123&source=5', 'https://h5app.kuwo.cn/m/bodian/collection.html?playlistId=123&source=5'],
    ['kg', '123', '123'],
    ['kg', 'id_123', 'id_123'],
    ['kg', 'https://www.kugou.com/songlist/gcid_abc/?uid=9', 'https://www.kugou.com/songlist/gcid_abc/?uid=9'],
  ]) assert.equal(identity.normalizeSonglistId(input, source), expected)
  assert.equal(identity.isImportedSonglist({ source: 'tx', sourceListId: '123' }, '123', 'kw'), false)
})

test('full share text detects its platform before importing the canonical id', async() => {
  const { parseSonglistInput } = loadSource('src/screens/Home/Views/SongList/HeaderBar/OpenList/utils.ts')
  const parsed = parseSonglistInput('分享歌单「华语怀旧」 https://www.kuwo.cn/playlist_detail/123。', 'wy')
  const s = setup()
  const imported = s.api.handleImportSonglist(parsed.id, parsed.source)
  await flush()
  assert.deepEqual(s.requests, [['123', 'kw']])
  s.write.resolve()
  assert.equal(await imported, true)
})

test('canceling a duplicate online playlist import does not update or report success', async() => {
  const s = setup([{ id: 'local', name: 'Existing', source: 'kw', sourceListId: '123' }], false)
  assert.equal(await s.api.handleImportSonglist('123', 'kw'), false)
  assert.equal(s.requests.length + s.created.length + s.updated.length, 0)
})

test('a legacy playlist id on another platform does not replace that playlist', async() => {
  const s = setup([{ id: 'local-tx', name: 'QQ playlist', source: 'tx', sourceListId: '123' }])
  const imported = s.api.handleImportSonglist('123', 'kw')
  await flush()
  assert.deepEqual(s.requests, [['123', 'kw']])
  assert.equal(s.updated.length, 0)
  assert.equal(s.created[0].sourceListId, 'kw__123')
  s.write.resolve()
  assert.equal(await imported, true)
})

for (const sourceListId of ['123', 'kw__123']) {
  test(`updating the duplicate ${sourceListId} waits for playlist persistence`, async() => {
    const list = { id: 'local-kw', name: 'Kuwo playlist', source: 'kw', sourceListId }
    const s = setup([list])
    let finished = false
    const imported = s.api.handleImportSonglist('123', 'kw').then(value => { finished = true; return value })
    await flush()
    assert.equal(finished, false)
    assert.equal(s.updated[0], list)
    assert.equal(s.created.length, 0)
    s.write.resolve()
    assert.equal(await imported, true)
  })
}
