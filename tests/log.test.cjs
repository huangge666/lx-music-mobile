const assert = require('node:assert/strict')
const { test } = require('node:test')
const { loadSource, flush } = require('./load-source.cjs')

test('log append failure is contained rather than becoming another unhandled error', async() => {
  const warnings = []
  const api = loadSource('src/utils/log.ts', {
    '@/utils/fs': { temporaryDirectoryPath: '/cache', existsFile: async() => true, appendFile: async() => { throw new Error('disk full') } },
  }, { console: { log() {}, warn: (...args) => warnings.push(args) } })
  await api.init()
  api.log.error('original failure')
  await flush()
  assert.equal(warnings.length, 1)
  assert.equal(warnings[0][0], 'write log failed')
})
