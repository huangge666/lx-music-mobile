const assert = require('node:assert/strict')
const { test } = require('node:test')
const { loadSource } = require('./load-source.cjs')

for (const primary of [true, false]) {
  test(`initializing a ${primary ? 'primary' : 'secondary'} source ${primary ? 'clears' : 'preserves'} active quality metadata`, async() => {
    const qualityList = { kw: ['128k', '320k'] }
    const lx = { qualityList }
    const loaded = []
    const api = loadSource('src/core/userApi.ts', {
      '@/store/userApi': { state: { list: [{ id: 'user_api_secondary' }] }, action: { setStatus() {} } },
      '@/store/setting/state': { setting: { 'common.apiSource': primary ? 'user_api_secondary' : 'user_api_primary' } },
      '@/utils/data': { getUserApiScript: async() => 'script' },
      '@/utils/nativeModules/userApi': { loadScript: info => loaded.push(info) },
      '@/utils/log': { log: {} },
      '@/config/constant': { USER_API_IMPORT_LIMIT: 20 },
    }, { lx })
    await api.setUserApi('user_api_secondary')
    if (primary) assert.equal(Object.keys(lx.qualityList).length, 0)
    else assert.equal(lx.qualityList, qualityList)
    assert.equal(loaded[0].script, 'script')
  })
}

test('bulk source removal does not mutate caller ids or skip matching entries', async() => {
  const saved = []
  const removed = []
  const api = loadSource('src/utils/data.ts', {
    '@/plugins/storage': {
      getData: async() => [{ id: 'a' }, { id: 'b' }, { id: 'c' }],
      saveData: async(key, value) => { saved.push(JSON.stringify(value)) },
      removeDataMultiple: async(keys) => { removed.push(...keys) },
    },
    '@/config/constant': { storageDataPrefix: { userApi: 'api:' }, DEFAULT_SETTING: {} },
    '@/utils/pixelRatio': {},
    './common': { throttle: fn => fn },
  })
  await api.getUserApiList()
  const ids = ['c', 'a']
  const remaining = await api.removeUserApi(ids)
  assert.deepEqual(ids, ['c', 'a'])
  assert.equal(JSON.stringify(remaining), '[{"id":"b"}]')
  assert.deepEqual(removed.sort(), ['api:a', 'api:c'])
  assert.equal(saved[0], '[{"id":"b"}]')
})
