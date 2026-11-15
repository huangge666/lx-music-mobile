const assert = require('node:assert/strict')
const { test } = require('node:test')
const { loadSource, deferred, flush } = require('./load-source.cjs')

const setup = (readFile = async() => '/* @name Source */') => {
  const write = deferred(); const messages = []; const scripts = []
  const api = loadSource('src/screens/Home/Views/Setting/settings/Basic/UserApiEditModal/action.ts', {
    '@/core/userApi': { importUserApi: async(script) => { scripts.push(script); await write.promise } },
    '@/utils/fs': { readFile },
    '@/utils/log': { log: { error() {} } },
    '@/utils/tools': { toast: message => messages.push(message) },
  }, { i18n: { t: (key, params) => params ? `${key}: ${params.message}` : key } })
  return { api, write, messages, scripts }
}

test('local source import resolves and reports success only after saving the script', async() => {
  const s = setup()
  let finished = false
  const imported = s.api.handleImportLocalFile('source.js').then(value => { finished = true; return value })
  await flush()
  assert.equal(finished, false)
  assert.equal(s.messages.length, 0)
  s.write.resolve()
  assert.equal(await imported, true)
  assert.deepEqual(s.messages, ['user_api_import_success_tip'])
})

test('source persistence failure produces one error and no success message', async() => {
  const s = setup()
  const imported = s.api.handleImportLocalFile('source.js')
  await flush()
  s.write.reject(new Error('disk full'))
  assert.equal(await imported, false)
  assert.deepEqual(s.messages, ['user_api_import_failed_tip: disk full'])
})

test('source read failure does not attempt to import an empty script', async() => {
  const s = setup(async() => null)
  assert.equal(await s.api.handleImportLocalFile('missing.js'), false)
  assert.equal(s.scripts.length, 0)
  assert.deepEqual(s.messages, ['user_api_import_failed_tip: Read file failed'])
})

for (const script of [undefined, '', 'a'.repeat(9_000_001)]) {
  test(`invalid ${script ? 'oversized' : 'empty'} source response is rejected before persistence`, async() => {
    const s = setup()
    assert.equal(await s.api.handleImportScript(script), false)
    assert.equal(s.scripts.length, 0)
    assert.equal(s.messages.length, 1)
    assert.match(s.messages[0], /user_api_import_failed_tip/)
  })
}

test('all source import entry points enforce the 20-source limit at the shared boundary', async() => {
  const list = Array.from({ length: 20 }, (_, id) => ({ id }))
  const api = loadSource('src/core/userApi.ts', {
    '@/config/constant': { USER_API_IMPORT_LIMIT: 20 },
    '@/store/userApi': { state: { list }, action: { addUserApi() { assert.fail('must not add') } } },
    '@/store/setting/state': {},
    '@/utils/data': { addUserApi() { assert.fail('must not persist') } },
    '@/utils/nativeModules/userApi': {},
    '@/utils/log': { log: {} },
  }, { i18n: { t: key => key } })
  await assert.rejects(api.importUserApi('/* @name Source */'), /user_api_max_tip/)
})
