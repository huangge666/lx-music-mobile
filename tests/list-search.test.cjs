const assert = require('node:assert/strict')
const { test } = require('node:test')
const { loadSource, deferred, flush } = require('./load-source.cjs')

const setup = () => {
  const refs = []
  const frames = []
  const requests = []
  const results = []
  const debounceCallbacks = []
  let currentRef = 0
  let visible = false
  let imperative
  const api = loadSource('src/screens/Home/Views/Mylist/MusicList/ListMusicSearch.tsx', {
    react: {
      useRef(value) { return refs[currentRef++] ??= { current: value } },
      useState() { return [visible, value => { visible = value }] },
      useEffect() {},
      useImperativeHandle(ref, factory) { imperative = factory() },
      forwardRef: render => render,
    },
    'react/jsx-runtime': { jsx: (type, props) => ({ type, props }) },
    '@/components/SearchTipList': {},
    '@/utils': { debounce: callback => (...args) => debounceCallbacks.push(() => callback(...args)) },
    './listAction': { searchListMusic: (list, keyword) => [keyword] },
    '@/components/common/Button': {},
    '@/components/common/Text': {},
    '@/utils/tools': { createStyle: styles => styles },
    '@/store/theme/hook': { useTheme: () => ({}) },
    'react-native': { View: {} },
    '@/utils/pixelRatio': { scaleSizeH: value => value },
    '@/core/list': { getListMusics() { const task = deferred(); requests.push(task); return task.promise } },
    '@/store/list/state': { activeListId: 'list' },
  }, { requestAnimationFrame: callback => { frames.push(callback) } })
  const render = () => { currentRef = 0; return api.default({ onScrollToInfo() {} }, {}) }
  render()
  refs[0].current = { setHeight() {}, setList: list => results.push(list) }
  return {
    render,
    requests,
    results,
    search(keyword) { imperative.search(keyword, 500); render() },
    hide() { imperative.hide() },
    runFrames() { while (frames.length) frames.shift()() },
    runDebounce() { while (debounceCallbacks.length) debounceCallbacks.shift()() },
  }
}

test('closing search before its first animation frame prevents the request', () => {
  const s = setup()
  s.search('old')
  s.hide()
  s.runFrames()
  assert.equal(s.requests.length, 0)
})

test('clearing the keyword discards a late result from the same playlist', async() => {
  const s = setup()
  s.search('old'); s.runFrames()
  s.search('')
  s.requests[0].resolve([])
  await flush(); s.runDebounce()
  assert.equal(JSON.stringify(s.results), '[[]]')
})

test('slow earlier query cannot overwrite the newer query on the same playlist', async() => {
  const s = setup()
  s.search('old'); s.runFrames()
  s.search('new')
  s.requests[1].resolve([])
  await flush(); s.runDebounce()
  s.requests[0].resolve([])
  await flush(); s.runDebounce()
  assert.equal(JSON.stringify(s.results), '[["new"]]')
})
