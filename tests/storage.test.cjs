const assert = require('node:assert/strict')
const { test } = require('node:test')
const { loadSource, deferred, flush } = require('./load-source.cjs')

const setup = () => {
  const data = new Map()
  let failWrite = false
  let failCleanup = false
  let beforeWrite
  const storage = {
    async getItem(key) { return data.get(key) ?? null },
    async multiGet(keys) { return keys.map(key => [key, data.get(key) ?? null]) },
    async multiSet(entries) {
      if (beforeWrite) await beforeWrite()
      if (failWrite) throw new Error('disk full')
      for (const [key, value] of entries) data.set(key, value)
    },
    async multiRemove(keys) {
      if (failCleanup) throw new Error('cleanup failed')
      keys.forEach(key => data.delete(key))
    },
    async removeItem(key) { data.delete(key) },
    async getAllKeys() { return [...data.keys()] },
    async clear() { data.clear() },
  }
  return {
    data,
    api: loadSource('src/plugins/storage.ts', {
      '@react-native-async-storage/async-storage': storage,
      '@/utils/log': { log: { error() {}, warn() {} } },
    }),
    failWrite() { failWrite = true },
    failCleanup() { failCleanup = true },
    beforeWrite(fn) { beforeWrite = fn },
  }
}

test('failed large overwrite preserves the complete previous playlist', async() => {
  const s = setup()
  const original = 'a'.repeat(600000)
  await s.api.saveData('list', original)
  s.failWrite()
  await assert.rejects(s.api.saveData('list', 'b'.repeat(700000)), /disk full/)
  assert.equal(await s.api.getData('list'), original)
})

test('large to small overwrite and removal reclaim all old chunks', async() => {
  const s = setup()
  await s.api.saveData('list', 'a'.repeat(1200000))
  await s.api.saveData('list', ['one song'])
  assert.equal(s.data.size, 1)
  assert.equal(JSON.stringify(await s.api.getData('list')), '["one song"]')
  await s.api.removeData('list')
  assert.equal(s.data.size, 0)
})

test('shrinking a chunked value removes only obsolete chunks', async() => {
  const s = setup()
  await s.api.saveData('list', 'a'.repeat(1700000))
  await s.api.saveData('list', 'b'.repeat(600000))
  assert.equal(s.data.size, 3)
  assert.equal(await s.api.getData('list'), 'b'.repeat(600000))
})

test('exact chunk boundary does not create an empty chunk', async() => {
  const s = setup()
  await s.api.saveData('list', 'a'.repeat(999998))
  assert.equal(s.data.size, 3)
})

test('legacy comma-separated chunks survive migration and are reclaimed', async() => {
  const s = setup()
  s.data.set('list', '@___PART___old0,old1')
  s.data.set('old0', '["a",')
  s.data.set('old1', '"b"]')
  assert.equal(JSON.stringify(await s.api.getData('list')), '["a","b"]')
  await s.api.saveData('list', ['new'])
  assert.equal(s.data.size, 1)
})

test('batch overwrite preserves all old values when the transaction fails', async() => {
  const s = setup()
  await s.api.saveDataMultiple([['a', 'x'.repeat(600000)], ['b', 'y'.repeat(600000)]])
  s.failWrite()
  await assert.rejects(s.api.saveDataMultiple([['a', 'z'.repeat(800000)], ['b', 'new']]), /disk full/)
  assert.equal(await s.api.getData('a'), 'x'.repeat(600000))
  assert.equal(await s.api.getData('b'), 'y'.repeat(600000))
})

test('cleanup failure keeps the newly committed value and reports save success', async() => {
  const s = setup()
  await s.api.saveData('list', 'a'.repeat(600000))
  s.failCleanup()
  await s.api.saveData('list', 'new')
  assert.equal(await s.api.getData('list'), 'new')
})

test('overlapping read, write and delete cannot observe recycled chunks', async() => {
  const s = setup()
  await s.api.saveData('list', 'old'.repeat(200000))
  const gate = deferred()
  s.beforeWrite(() => gate.promise)
  const saving = s.api.saveData('list', 'new'.repeat(400000))
  await flush()
  const reading = s.api.getData('list')
  const removing = s.api.removeData('list')
  gate.resolve()
  await saving
  assert.equal(await reading, 'new'.repeat(400000))
  await removing
  assert.equal(s.data.size, 0)
})
