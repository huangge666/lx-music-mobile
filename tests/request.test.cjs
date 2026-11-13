const assert = require('node:assert/strict')
const { test } = require('node:test')
const { loadSource, flush } = require('./load-source.cjs')

const setup = (file, fetch) => {
  const timers = new Set()
  const timer = { setTimeout(fn) { timers.add(fn); return fn }, clearTimeout(fn) { timers.delete(fn) } }
  const api = loadSource(file, {
    'react-native-background-timer': timer,
    './message': { requestMsg: { timeout: 'timeout' } },
    './musicSdk/options': { bHh: 'special' },
    'pako': { deflateRaw: value => value },
    '@/utils/request': { getGithubFetchUrls: url => [url, 'https://fallback.test/'] },
  }, {
    fetch,
    FormData: class {
      constructor() { this.entries = [] }
      append(key, value) { this.entries.push([key, value]) }
    },
  })
  return { api, timers }
}
const response = () => ({ headers: { map: {} }, text: async() => '{}', status: 200, ok: true })

for (const [file, start, cancel] of [
  ['src/utils/request.js', 'httpFetch', 'cancelHttp'],
  ['src/core/init/userApi/request.js', 'fetchData', 'abort'],
]) {
  test(`${file}: explicit cancellation does not start a fallback request`, async() => {
    let count = 0
    const s = setup(file, async(url, { signal }) => {
      count++
      return new Promise((resolve, reject) => {
        signal.addEventListener('abort', () => reject(new Error('Aborted')))
      })
    })
    const request = s.api[start]('https://raw.githubusercontent.com/owner/repo/main/script.js', {})
    await flush()
    request[cancel]()
    await assert.rejects(request.promise ?? request.request)
    assert.equal(count, 1)
    assert.equal(s.timers.size, 0)
  })

  test(`${file}: FormData is passed through and fetch supplies the boundary`, async() => {
    let options
    const s = setup(file, async(url, opts) => { options = opts; return response() })
    const body = { multipart: true }
    const request = s.api[start]('https://upload.test/', { method: 'post', formData: body })
    await (request.promise ?? request.request)
    if (file === 'src/utils/request.js') assert.equal(options.body, body)
    else assert.equal(JSON.stringify(options.body.entries), '[["multipart",true]]')
    assert.equal(options.headers['Content-Type'], undefined)
    assert.equal(s.timers.size, 0)
  })

  test(`${file}: option serialization failures clear the request timeout`, async() => {
    const s = setup(file, async() => { throw new Error('must not reach fetch') })
    const body = {}; body.self = body
    const request = s.api[start]('https://upload.test/', { method: 'post', body })
    await assert.rejects(request.promise ?? request.request, /circular/i)
    assert.equal(s.timers.size, 0)
  })
}
