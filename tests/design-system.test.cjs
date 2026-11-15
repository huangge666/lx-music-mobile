const assert = require('node:assert/strict')
const { test } = require('node:test')
const { loadSource } = require('./load-source.cjs')

const palette = loadSource('src/theme/themes/palette.ts')
const themes = loadSource('src/theme/themes/themes.ts').default
const { createActiveTheme } = loadSource('src/theme/themes/active.ts', {
  './palette': palette,
})

const rgb = color => color.match(/[\d.]+/g).slice(0, 3).map(Number)
const luminance = color => {
  const channels = rgb(color).map(value => {
    value /= 255
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
  })
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722
}
const contrast = (foreground, background) => {
  const values = [luminance(foreground), luminance(background)].sort((a, b) => b - a)
  return (values[0] + 0.05) / (values[1] + 0.05)
}

test('both themes provide readable body, secondary and accent text on all content surfaces', () => {
  for (const dark of [false, true]) {
    const colors = palette.createSemanticPalette(dark)
    for (const surface of ['c-content-background', 'c-grouped-background', 'c-card-background']) {
      for (const text of ['c-font', 'c-font-label', 'c-accent']) {
        assert(contrast(colors[text], colors[surface]) >= 4.5, `${dark ? 'dark' : 'light'} ${text} on ${surface}`)
      }
    }
    assert(contrast(palette.getOnAccentColor(dark), colors['c-accent']) >= 4.5)
    assert(contrast(colors['c-danger'], colors['c-card-background']) >= 4.5)
  }
})

test('initial theme and resolved theme share the same derivation and preserve every generated token', () => {
  const initial = loadSource('src/store/theme/state.ts', {
    react: { createContext: theme => ({ theme }) },
    '@/theme/themes/themes': { default: themes, __esModule: true },
    '@/theme/themes/active': { createActiveTheme },
  }).default.theme
  assert.equal(JSON.stringify(initial), JSON.stringify(createActiveTheme(themes[0])))
  for (const theme of themes) {
    const result = createActiveTheme(theme)
    assert.equal(result.id, theme.id)
    assert.equal(result.isDark, theme.isDark)
    for (const [key, value] of Object.entries(theme.config.themeColors)) assert.equal(result[key], value)
    assert.equal(result['c-font-label'], palette.createSemanticPalette(theme.isDark)['c-font-label'])
  }
})

test('native typography uses actual system font weights rather than missing bundled font families', () => {
  const { FontWeights } = loadSource('src/theme/Typography.js')
  assert.equal(FontWeights.Bold.fontWeight, '700')
  assert.equal(FontWeights.Regular.fontWeight, '400')
  for (const font of Object.values(FontWeights)) assert.equal(font.fontFamily, undefined)
})

test('library row geometry grows with two text lines without clipping its cover or touch targets', () => {
  const { getLibraryRowHeight } = loadSource('src/screens/Home/Views/Mylist/MyList/rowLayout.ts')
  assert.equal(getLibraryRowHeight({ coverSize: 52, minRowHeight: 64, verticalPadding: 8, titleLineHeight: 22, metaLineHeight: 17, metaGap: 2 }), 68)
  assert.equal(getLibraryRowHeight({ coverSize: 52, minRowHeight: 64, verticalPadding: 8, titleLineHeight: 44, metaLineHeight: 34, metaGap: 4 }), 98)
})

test('normal song row memo cannot retain old press handlers or accessibility labels', () => {
  let memoCompare
  loadSource('src/components/common/MusicRow.tsx', {
    react: { memo: (component, compare) => { memoCompare = compare; return component } },
    'react-native': {},
    '@/components/common/Icon': {},
    '@/components/common/Image': {},
    '@/components/common/Text': {},
    '@/config/constant': {},
    '@/store/theme/hook': {},
    '@/utils/pixelRatio': {},
    '@/utils/tools': { createStyle: styles => styles },
    '@/lang': {},
  })
  assert.equal(memoCompare, undefined, 'React shallow comparison must include callbacks and labels')
})
