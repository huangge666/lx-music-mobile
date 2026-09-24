//! 更新默认主题配置后，需要执行 npm run build:theme 重新构建 themes.ts
//!
//! 液态玻璃只有两套基底：
//! - green：浅色，浅白玻璃主色 + 雾青辅色
//! - black：深色，黑色玻璃主色 + 暖沙辅色
//! 其他历史主题 id 已废弃，运行时会回退到这两套。

const fs = require('fs')
const path = require('path')
const { createThemeColors } = require('./utils')

const defaultThemes = [
  {
    id: 'green',
    name: '浅色玻璃',
    isDark: false,
    config: {
      // 浅白玻璃上的墨色主色，避免刺眼的纯黑
      primary: 'rgb(42, 46, 54)',
      font: 'rgb(28, 32, 38)',
      'c-app-background': 'rgb(236, 240, 244)',
      'c-main-background': 'rgba(255, 255, 255, 0.62)',
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
    name: '深色玻璃',
    isDark: true,
    config: {
      // 黑玻璃上的雾白主色，保证图标和选中态可读
      primary: 'rgb(232, 236, 242)',
      font: 'rgb(236, 238, 244)',
      'c-app-background': 'rgb(8, 10, 14)',
      'c-main-background': 'rgba(18, 20, 26, 0.72)',
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
