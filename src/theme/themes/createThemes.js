//! 更新默认主题配置后，需要执行 npm run build:theme 重新构建 themes.ts
//!
//! 主题只有两套基底：green 纸白 / black 石墨；保留历史 id 与用户设置兼容。
//! 玻璃材质用于浮动导航栏、迷你播放器、抽屉和弹层；内容区使用实色分组。
//! 其他历史主题 id 已废弃，运行时会回退到这两套。

const fs = require('fs')
const path = require('path')
const { createThemeColors } = require('./utils')

const defaultThemes = [
  {
    id: 'green',
    name: '浅色',
    isDark: false,
    config: {
      primary: 'rgb(61, 92, 39)',
      font: 'rgb(25, 33, 26)',
      'c-app-background': 'rgb(247, 248, 242)',
      'c-main-background': 'rgba(247, 248, 242, 0.88)',
      'bg-image': '',
      'bg-image-position': 'center',
      'bg-image-size': 'cover',

      'c-badge-primary': 'var(c-primary)',
      'c-badge-secondary': 'var(c-primary-dark-100-alpha-700)',
      'c-badge-tertiary': 'var(c-primary-alpha-600)',
    },
  },
  {
    id: 'black',
    name: '深色',
    isDark: true,
    config: {
      primary: 'rgb(211, 239, 165)',
      font: 'rgb(239, 244, 233)',
      'c-app-background': 'rgb(17, 22, 18)',
      'c-main-background': 'rgba(17, 22, 18, 0.88)',
      'bg-image': '',
      'bg-image-position': 'center',
      'bg-image-size': 'cover',

      'c-badge-primary': 'var(c-primary-dark-200)',
      'c-badge-secondary': 'var(c-primary)',
      'c-badge-tertiary': 'var(c-primary-dark-300)',
    },
  },
]

const themes = defaultThemes.map(({ config: { primary, font, ...extInfo }, ...themeInfo }) => {
  return {
    ...themeInfo,
    isCustom: false,
    config: {
      themeColors: createThemeColors(primary, font, themeInfo.isDark),
      extInfo,
    },
  }
})

fs.writeFileSync(path.join(__dirname, 'themes.ts'), `/* eslint-disable */\n//! 此文件由 createThemes.js 生成\n\nexport default ${JSON.stringify(themes, null, 2)} as const`)
