const assert = require('node:assert/strict')
const { test } = require('node:test')
const { loadSource, flush } = require('./load-source.cjs')

for (const fail of [false, true]) {
  test(`backup export ${fail ? 'reports write failure instead of false success' : 'reports success after writing'}`, async() => {
    const messages = []
    const api = loadSource('src/core/listImportExport.ts', {
      '@/config/constant': { LIST_IDS: { DEFAULT: 'default' } },
      '@/core/list': { getListMusics: async() => [] },
      '@/utils': {},
      '@/utils/log': { log: { error() {} } },
      '@/store/list/state': { defaultList: { id: 'default' }, loveList: { id: 'love' }, userList: [] },
      '@/utils/tools': { toast: message => messages.push(message), handleSaveFile: async() => { if (fail) throw new Error('disk full') } },
    }, { i18n: { t: key => key } })
    api.handleExportList('/backup')
    await flush()
    assert.equal(messages.some(message => message.includes('tip_success')), !fail)
    assert.equal(messages.some(message => message.includes('tip_failed')), fail)
  })
}
