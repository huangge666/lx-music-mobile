const assert = require('node:assert/strict')
const { test } = require('node:test')
const { loadSource, deferred, flush } = require('./load-source.cjs')

const setup = () => {
  const requests = []
  const frames = []
  const updates = []
  const statuses = []
  let unmount
  let controls
  let refCount = 0
  const state = { listInfo: { source: 'kw', sortId: '', tagId: '', list: [], page: 1, maxPage: 1 } }
  const component = loadSource('src/screens/Home/Views/SongList/List.tsx', {
    react: {
      forwardRef: component => component,
      useRef: current => ({ current: refCount++ == 0 ? { setList: list => updates.push(list), setStatus: status => statuses.push(status) } : current }),
      useEffect: effect => { unmount = effect() },
      useImperativeHandle: (ref, factory) => { controls = factory() },
    },
    './components/Songlist': { default: () => null, __esModule: true },
    '@/store/songlist/state': { default: state, __esModule: true },
    '@/core/songlist': {
      clearList: () => { state.listInfo.list = [] },
      setListInfo: (source, tagId, sortId) => { Object.assign(state.listInfo, { source, tagId, sortId, list: [] }) },
      getList: (source, tagId, sortId, page) => {
        const request = deferred()
        requests.push({ source, tagId, sortId, page, ...request })
        return request.promise
      },
      setList: (info, tagId, sortId, page) => {
        Object.assign(state.listInfo, info, { tagId, sortId, page, maxPage: 1 })
        return state.listInfo
      },
    },
  }, { requestAnimationFrame: callback => { frames.push(callback) } }).default
  component({}, {})
  const result = name => ({ source: name, list: [{ id: name }], page: 1 })
  const render = () => { while (frames.length) frames.shift()() }
  return { controls, requests, updates, statuses, state, result, render, unmount: () => unmount() }
}

test('slow old platform results never overwrite the newer selected platform', async() => {
  const s = setup()
  const old = s.controls.loadList('kw', '5', '')
  const next = s.controls.loadList('kg', '1', 'rock')
  s.requests[1].resolve(s.result('kg'))
  await next
  s.render()
  s.requests[0].resolve(s.result('kw'))
  await old
  s.render()
  assert.equal(s.state.listInfo.source, 'kg')
  assert.equal(s.state.listInfo.tagId, 'rock')
  assert.equal(JSON.stringify(s.updates.at(-1)), JSON.stringify([{ id: 'kg' }]))
})

test('stale rejection does not clear a valid newer page or expose an error', async() => {
  const s = setup()
  const old = s.controls.loadList('kw', '5', '')
  const next = s.controls.loadList('kg', '1', '')
  s.requests[1].resolve(s.result('kg'))
  await next
  s.render()
  s.requests[0].reject(new Error('old network error'))
  await old
  s.render()
  assert.equal(s.state.listInfo.list[0].id, 'kg')
  assert(!s.statuses.includes('error'))
})

test('pending animation frame is invalidated by a new selection and by unmount', async() => {
  const s = setup()
  const first = s.controls.loadList('kw', '5', '')
  s.requests[0].resolve(s.result('kw'))
  await first
  const second = s.controls.loadList('kg', '1', '')
  s.render()
  assert.equal(s.updates.at(-1).length, 0)
  s.unmount()
  s.requests[1].resolve(s.result('kg'))
  await second
  s.render()
  assert.equal(s.state.listInfo.source, 'kg')
  assert.equal(s.state.listInfo.list.length, 0)
  await flush()
})

test('restoring an already loaded page also restores end status rather than remaining loading', async() => {
  const s = setup()
  Object.assign(s.state.listInfo, { source: 'kw', tagId: '', sortId: '5', list: [{ id: 'cached' }], page: 1, maxPage: 1 })
  await s.controls.loadList('kw', '5', '')
  s.render()
  assert.equal(s.requests.length, 0)
  assert.equal(s.statuses.at(-1), 'end')
})
