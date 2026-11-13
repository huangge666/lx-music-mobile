const assert = require('node:assert/strict')
const { test } = require('node:test')
const { loadSource, deferred } = require('./load-source.cjs')

for (const method of ['getComment', 'getHotComment']) {
  test(`NetEase ${method} keeps its request handle and cancels the previous request`, async() => {
    const requests = []
    const api = loadSource('src/utils/musicSdk/wy/comment.js', {
      '../../request': {
        httpFetch(url, options) {
          const request = deferred()
          const item = { options, cancelled: false, request }
          requests.push(item)
          return { promise: request.promise, cancelHttp() { item.cancelled = true; request.reject(new Error('cancelled')) } }
        },
      },
      './utils/crypto': { weapi: value => value },
      '../../index': { dateFormat2: value => value },
    }).default
    const first = api[method]({ songmid: 'one' })
    const rejected = assert.rejects(first, /cancelled/)
    const second = api[method]({ songmid: 'two' })
    assert.equal(requests[0].cancelled, true)
    assert.equal(requests[1].options.headers.Referer, 'http://music.163.com/')
    requests[1].request.resolve({ statusCode: 200, body: { code: 200, data: { cursor: 1, comments: [], totalCount: 0 }, hotComments: [], total: 0 } })
    await Promise.all([rejected, second])
  })
}
