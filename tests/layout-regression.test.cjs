const assert = require('node:assert/strict')
const { test } = require('node:test')
const { loadSource, deferred, flush } = require('./load-source.cjs')

const makeSizeView = () => {
  const requests = []
  const effects = []
  const sizes = []
  const heights = []
  let size = { width: 360, height: 800 }
  const SizeView = loadSource('src/components/SizeView.tsx', {
    react: {
      memo: component => component,
      useCallback: callback => callback,
      useRef: current => ({ current }),
      useEffect: effect => effects.push(effect()),
    },
    'react-native': { View: 'View', StyleSheet: { absoluteFill: {} }, StatusBar: { currentHeight: 24 } },
    '@/store/common/state': { statusbarHeight: 24 },
    '@/store/setting/state': { setting: { 'common.alwaysKeepStatusbarHeight': false } },
    '@/core/common': { setStatusbarHeight: height => heights.push(height) },
    '@/utils/windowSizeTools': {
      getWindowSize: () => {
        const request = deferred()
        requests.push(request)
        return request.promise
      },
      windowSizeTools: {
        getSize: () => size,
        setWindowSize: (width, height) => { size = { width, height }; sizes.push(size) },
      },
    },
  }, { state_event: { on() {}, off() {} } }).default
  const view = SizeView()
  const layout = (width, height) => view.props.onLayout({ nativeEvent: { layout: { width, height } } })
  return { layout, requests, sizes, heights, effects, view }
}

test('rotation updates from the measured layout even without a Dimensions event', async() => {
  const { layout, requests, sizes, heights, view } = makeSizeView()
  layout(360, 800)
  requests[0].resolve({ width: 360, height: 800 })
  await flush()
  layout(800, 360)
  requests[1].resolve({ width: 800, height: 360 })
  await flush()
  assert.deepEqual(sizes, [{ width: 800, height: 360 }])
  assert.deepEqual(heights, [0])
  assert.equal(view.props.pointerEvents, 'none')
})

test('older native measurements and callbacks after unmount cannot overwrite the current layout', async() => {
  const { layout, requests, sizes, effects } = makeSizeView()
  layout(360, 800)
  layout(800, 360)
  requests[1].resolve({ width: 800, height: 360 })
  await flush()
  requests[0].resolve({ width: 360, height: 800 })
  await flush()
  layout(360, 800)
  effects[0]()
  requests[2].resolve({ width: 360, height: 800 })
  await flush()
  assert.deepEqual(sizes, [{ width: 800, height: 360 }])
})

test('browse source tabs use intrinsic height rather than filling the entire list viewport', () => {
  const SourceSelector = loadSource('src/screens/Home/Views/SongList/HeaderBar/SourceSelector.tsx', {
    react: {
      forwardRef: component => component,
      useState: value => [value, () => {}],
      useImperativeHandle() {},
    },
    'react-native': { View: 'View', TouchableOpacity: 'TouchableOpacity' },
    '@/components/common/Text': 'Text',
    '@/lang': { useI18n: () => key => key },
    '@/store/setting/hook': { useSettingValue: () => 'real' },
    '@/store/theme/hook': { useTheme: () => ({}) },
    '@/store/songlist/state': { sources: ['kw', 'wy'] },
    '@/utils/tools': { createStyle: styles => styles },
  }).default
  const view = SourceSelector({ onSourceChange() {} }, null)
  assert.equal(view.props.style[0].height, undefined)
  assert.equal(view.props.style[0].minHeight, 48)
})

test('unmounting an orientation subtree during notification does not skip the next screen', () => {
  const { windowSizeTools } = loadSource('src/utils/windowSizeTools.ts', {
    'react-native': {},
    './nativeModules/utils': {},
  })
  const calls = []
  let removeChild
  windowSizeTools.onSizeChanged(() => {
    calls.push('home')
    removeChild()
  })
  removeChild = windowSizeTools.onSizeChanged(() => calls.push('child'))
  windowSizeTools.onSizeChanged(() => calls.push('player'))
  windowSizeTools.setWindowSize(800, 360)
  assert.deepEqual(calls, ['home', 'child', 'player'])
  removeChild()
  calls.length = 0
  windowSizeTools.setWindowSize(360, 800)
  assert.deepEqual(calls, ['home', 'player'])
})

test('a current track renders on the Download tab instead of leaving an empty HomeDock surface', () => {
  let keyboardShown = false
  const PlayerBar = loadSource('src/components/player/PlayerBar/index.tsx', {
    react: { memo: component => component, useMemo: factory => factory() },
    'react-native': { StyleSheet: { create: styles => styles }, View: 'View' },
    '@/utils/hooks': { useHorizontalMode: () => false, useKeyboard: () => ({ keyboardShown }) },
    './components/Pic': 'Pic',
    './components/Title': 'Title',
    './components/ControlBtn': 'ControlBtn',
    '@/utils/tools': { createStyle: styles => styles },
    '@/store/setting/hook': { useSettingValue: () => true },
    '@/store/common/hook': { useFontSize() {}, useNavActiveId: () => 'nav_download' },
    '@/store/common/state': { componentIds: { home: 'home' } },
    '@/components/common/LiquidGlass': 'LiquidGlass',
    './layout': { getMiniPlayerHeight: () => 56 },
    '@/store/player/hook': { usePlayerMusicInfo: () => ({ id: 'track' }) },
  }).default
  assert.notEqual(PlayerBar({ isHome: true, embedded: true }), null)
  keyboardShown = true
  assert.equal(PlayerBar({ isHome: true, embedded: true }), null)
})

test('landscape playlist hero bounds artwork without reducing action touch targets', () => {
  const styles = []
  const Hero = loadSource('src/components/common/PlaylistHero.tsx', {
    react: {
      memo: component => component,
      useCallback: callback => callback,
      useMemo: factory => factory(),
      useState: value => [typeof value == 'number' ? 800 : value, () => {}],
    },
    'react-native': { View: 'View', TouchableOpacity: 'TouchableOpacity', StyleSheet: { create: style => style, absoluteFillObject: {}, absoluteFill: {} } },
    './Image': 'Image',
    './Loading': 'Loading',
    './Text': 'Text',
    './RecordArtwork': 'RecordArtwork',
    './Icon': { Icon: 'Icon' },
    './playlistCover': { getPlaylistCoverTint: () => ({}), getPlaylistInitial: () => 'A' },
    '@/store/theme/hook': { useTheme: () => ({}) },
    '@/theme/themes/palette': { getOnAccentColor: () => '#fff' },
    '@/theme': { BorderRadius: { large: 20 } },
    '@/utils/pixelRatio': { scaleSizeW: value => value },
    '@/utils/tools': { createStyle: style => { styles.push(style); return style } },
    '@/utils/hooks': { useHorizontalMode: () => true },
  }).default
  const view = Hero({ title: 'Landscape', onPlay() {}, onShuffle() {} })
  const body = view.props.children[1]
  const artwork = body.props.children[0]
  assert.equal(artwork.props.style[1].width, 104)
  assert.equal(artwork.props.style[1].height, 104)
  assert.equal(view.props.style[1].paddingBottom, 16)
  assert.equal(styles[0].playButton.minHeight, 48)
  assert.equal(styles[0].actionCircle.width, 48)
})

test('landscape settings remain outside the scrolling tabs at large font sizes', () => {
  const menus = [
    { id: 'nav_love', icon: 'love' },
    { id: 'nav_songlist', icon: 'album' },
    { id: 'nav_search', icon: 'search' },
    { id: 'nav_download', icon: 'download' },
  ]
  const Aside = loadSource('src/screens/Home/Horizontal/Aside.tsx', {
    react: { memo: component => component },
    'react-native': { ScrollView: 'ScrollView', TouchableOpacity: 'TouchableOpacity', View: 'View', StyleSheet: { create: style => style } },
    '@/store/common/hook': { useNavActiveId: () => 'nav_love', useStatusbarHeight: () => 0 },
    '@/store/theme/hook': { useTheme: () => ({}) },
    '@/components/common/Icon': { Icon: 'Icon' },
    '@/lang': { useI18n: () => key => key },
    '@/utils/tools': { createStyle: style => style },
    '@/config/constant': { isMainNavId: id => id != 'nav_setting', MAIN_NAV_MENUS: menus, NAV_MENUS: [...menus, { id: 'nav_setting', icon: 'settings' }] },
    '@/core/common': { setNavActiveId() {} },
    '@/theme': { BorderWidths: { hairline: 0.5 } },
    '@/components/common/GlassSurface': 'GlassSurface',
    '@/components/common/Text': 'Text',
  }).default
  const view = Aside()
  const children = view.props.children
  assert.equal(children[1].type, 'ScrollView')
  assert.equal(children[1].props.children.props.children.length, 4)
  assert.equal(children[3].props.children[0].props.id, 'nav_setting')
  const menu = children[1].props.children.props.children[0]
  const rendered = menu.type(menu.props)
  assert.equal(rendered.props.style[0].minHeight, 64)
  assert.equal(rendered.props.children[0].props.children.props.rawSize, 22)
})

for (const online of [false, true]) {
  test(`${online ? 'online' : 'local'} song list changes its column geometry and native key after rotation`, () => {
    let size = { width: 800, height: 360 }
    const refs = []
    let refIndex = 0
    const mocks = {
      react: {
        forwardRef: component => component,
        useCallback: callback => callback,
        useMemo: factory => factory(),
        useRef: current => refs[refIndex++] ??= { current },
        useState: value => [value, () => {}],
        useImperativeHandle() {},
        useEffect() {},
      },
      'react-native': { FlatList: 'FlatList', View: 'View', RefreshControl: 'RefreshControl' },
      './ListItem': 'ListItem',
      './listAction': { handlePlay() {} },
      '@/components/common/MusicRow': { getMusicRowHeight: () => 64 },
      '@/utils/tools': { createStyle: style => style, getRowInfo: () => size.width > size.height ? { rowNum: 2, rowWidth: '50%' } : { rowNum: undefined, rowWidth: '100%' } },
      '@/store/theme/hook': { useTheme: () => ({}) },
      '@/store/setting/state': { setting: {} },
      '@/components/common/BottomInset': { useBottomInset: () => 0 },
      '@/lang': { useI18n: () => key => key },
      '@/components/common/Text': 'Text',
      '@/store/setting/hook': { useSettingValue: () => true },
      '@/components/common/ListState': 'ListState',
      '@/store/player/hook': { usePlayMusicInfo: () => ({}), usePlayInfo: () => ({}) },
      '@/store/common/hook': { useFontSize() {} },
      '@/utils/hooks': { useWindowSize: () => size },
      '@/core/player/player': {},
      '@/store/list/state': {},
      '@/store/player/state': {},
      '@/utils/data': {},
      '@/core/list': {},
      '@/utils/pixelRatio': { scaleSizeW: value => value },
      '@/store/list/hook': { useActiveListId: () => 'list' },
    }
    const List = loadSource(online ? 'src/components/OnlineList/List.tsx' : 'src/screens/Home/Views/Mylist/MusicList/List.tsx', mocks).default
    const render = () => { refIndex = 0; return List({}, {}) }
    const wide = render()
    assert.equal(wide.props.numColumns, 2)
    size = { width: 360, height: 800 }
    const portrait = render()
    assert.equal(portrait.props.numColumns, undefined)
    assert.notEqual(portrait.key, wide.key)
  })
}
