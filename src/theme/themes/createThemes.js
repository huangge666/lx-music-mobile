//! 更新默认主题配置后，需要执行 npm run build:theme 重新构建index.json
//!
//! Apple Music 风格调色板：
//! - 亮色主题：纯白基底 (#FFFFFF) + 灰阶分层 (#F2F2F7 secondary / #E5E5EA tertiary)
//! - 暗色主题：纯黑基底 (#000000) + 灰阶分层 (#1C1C1E secondary / #2C2C2E tertiary)
//! - 强调色 (c-primary) 为每个主题独立的品牌色，用于按钮、进度条、选中态
//! - 字体色随亮/暗自动反转，保持高对比度

const fs = require('fs')
const path = require('path')
const { createThemeColors } = require('./utils')

const defaultThemes = [
  {
    // 默认主题 — Apple Music 经典红
    id: 'green',
    name: '经典红',
    isDark: false,
    config: {
      primary: 'rgb(250, 45, 59)', // Apple Music 系统红
      font: 'rgb(28, 28, 30)',     // Apple label 色
      'c-app-background': 'rgb(255, 255, 255)',
      'c-main-background': 'rgb(255, 255, 255)',
      'bg-image': '',
      'bg-image-position': 'center',
      'bg-image-size': 'cover',

      'c-badge-primary': 'var(c-primary)',
      'c-badge-secondary': 'var(c-primary-dark-100-alpha-700)',
      'c-badge-tertiary': 'var(c-primary-alpha-600)',
    },
  },
  {
    id: 'blue',
    name: '海洋蓝',
    isDark: false,
    config: {
      primary: 'rgb(0, 122, 255)', // Apple 系统蓝
      font: 'rgb(28, 28, 30)',
      'c-app-background': 'rgb(255, 255, 255)',
      'c-main-background': 'rgb(255, 255, 255)',
      'bg-image': '',
      'bg-image-position': 'center',
      'bg-image-size': 'cover',

      'c-badge-primary': 'var(c-primary)',
      'c-badge-secondary': 'var(c-primary-dark-100-alpha-700)',
      'c-badge-tertiary': 'var(c-primary-alpha-600)',
    },
  },
  {
    id: 'blue_plus',
    name: '靛蓝',
    isDark: false,
    config: {
      primary: 'rgb(88, 86, 214)', // Apple 系统靛蓝
      font: 'rgb(28, 28, 30)',
      'c-app-background': 'rgb(255, 255, 255)',
      'c-main-background': 'rgb(255, 255, 255)',
      'bg-image': '',
      'bg-image-position': 'center',
      'bg-image-size': 'cover',

      'c-badge-primary': 'var(c-primary)',
      'c-badge-secondary': 'var(c-primary-dark-100-alpha-700)',
      'c-badge-tertiary': 'var(c-primary-alpha-600)',
    },
  },
  {
    id: 'orange',
    name: '暖橙',
    isDark: false,
    config: {
      primary: 'rgb(255, 149, 0)', // Apple 系统橙
      font: 'rgb(28, 28, 30)',
      'c-app-background': 'rgb(255, 255, 255)',
      'c-main-background': 'rgb(255, 255, 255)',
      'bg-image': '',
      'bg-image-position': 'center',
      'bg-image-size': 'cover',

      'c-badge-primary': 'var(c-primary)',
      'c-badge-secondary': 'var(c-primary-dark-100-alpha-700)',
      'c-badge-tertiary': 'var(c-primary-alpha-600)',
    },
  },
  {
    id: 'brown',
    name: '檀木棕',
    isDark: false,
    config: {
      primary: 'rgb(162, 132, 94)', // 柔和暖棕
      font: 'rgb(28, 28, 30)',
      'c-app-background': 'rgb(255, 255, 255)',
      'c-main-background': 'rgb(255, 255, 255)',
      'bg-image': '',
      'bg-image-position': 'center',
      'bg-image-size': 'cover',

      'c-badge-primary': 'var(c-primary)',
      'c-badge-secondary': 'var(c-primary-dark-100-alpha-700)',
      'c-badge-tertiary': 'var(c-primary-alpha-600)',
    },
  },
  {
    id: 'red',
    name: '热情红',
    isDark: false,
    config: {
      primary: 'rgb(255, 59, 48)', // Apple 系统红 (different shade)
      font: 'rgb(28, 28, 30)',
      'c-app-background': 'rgb(255, 255, 255)',
      'c-main-background': 'rgb(255, 255, 255)',
      'bg-image': '',
      'bg-image-position': 'center',
      'bg-image-size': 'cover',

      'c-badge-primary': 'var(c-primary)',
      'c-badge-secondary': 'var(c-primary-dark-100-alpha-700)',
      'c-badge-tertiary': 'var(c-primary-alpha-600)',
    },
  },
  {
    id: 'pink',
    name: '柔粉',
    isDark: false,
    config: {
      primary: 'rgb(255, 45, 149)', // Apple 系统粉
      font: 'rgb(28, 28, 30)',
      'c-app-background': 'rgb(255, 255, 255)',
      'c-main-background': 'rgb(255, 255, 255)',
      'bg-image': '',
      'bg-image-position': 'center',
      'bg-image-size': 'cover',

      'c-badge-primary': 'var(c-primary)',
      'c-badge-secondary': 'var(c-primary-dark-100-alpha-700)',
      'c-badge-tertiary': 'var(c-primary-alpha-600)',
    },
  },
  {
    id: 'purple',
    name: '魅紫',
    isDark: false,
    config: {
      primary: 'rgb(175, 82, 222)', // Apple 系统紫
      font: 'rgb(28, 28, 30)',
      'c-app-background': 'rgb(255, 255, 255)',
      'c-main-background': 'rgb(255, 255, 255)',
      'bg-image': '',
      'bg-image-position': 'center',
      'bg-image-size': 'cover',

      'c-badge-primary': 'var(c-primary)',
      'c-badge-secondary': 'var(c-primary-dark-100-alpha-700)',
      'c-badge-tertiary': 'var(c-primary-alpha-600)',
    },
  },
  {
    id: 'grey',
    name: '石墨灰',
    isDark: false,
    config: {
      primary: 'rgb(142, 142, 147)', // Apple 系统灰
      font: 'rgb(28, 28, 30)',
      'c-app-background': 'rgb(255, 255, 255)',
      'c-main-background': 'rgb(255, 255, 255)',
      'bg-image': '',
      'bg-image-position': 'center',
      'bg-image-size': 'cover',

      'c-badge-primary': 'var(c-primary)',
      'c-badge-secondary': 'var(c-primary-dark-100-alpha-700)',
      'c-badge-tertiary': 'var(c-primary-alpha-600)',
    },
  },
  {
    id: 'ming',
    name: '薄荷青',
    isDark: false,
    config: {
      primary: 'rgb(48, 209, 198)', // Apple 系统青
      font: 'rgb(28, 28, 30)',
      'c-app-background': 'rgb(255, 255, 255)',
      'c-main-background': 'rgb(255, 255, 255)',
      'bg-image': '',
      'bg-image-position': 'center',
      'bg-image-size': 'cover',

      'c-badge-primary': 'var(c-primary)',
      'c-badge-secondary': 'var(c-primary-dark-100-alpha-700)',
      'c-badge-tertiary': 'var(c-primary-alpha-600)',
    },
  },
  {
    id: 'blue2',
    name: '天空蓝',
    isDark: false,
    config: {
      primary: 'rgb(90, 200, 250)', // Apple 系统天蓝
      font: 'rgb(28, 28, 30)',
      'c-app-background': 'rgb(255, 255, 255)',
      'c-main-background': 'rgb(255, 255, 255)',
      'bg-image': '',
      'bg-image-position': 'center',
      'bg-image-size': 'cover',

      'c-badge-primary': 'var(c-primary)',
      'c-badge-secondary': 'var(c-primary-dark-100-alpha-700)',
      'c-badge-tertiary': 'var(c-primary-alpha-600)',
    },
  },
  {
    id: 'mid_autumn',
    name: '月里嫦娥',
    isDark: false,
    config: {
      primary: 'rgb(74, 55, 82)',
      font: 'rgb(28, 28, 30)',
      'c-app-background': 'rgba(255, 255, 255, 0)',
      'c-main-background': 'rgba(255, 255, 255, 0.92)',
      'bg-image': 'jqbg.jpg',
      'bg-image-position': 'center',
      'bg-image-size': 'cover',

      'c-badge-primary': 'var(c-primary)',
      'c-badge-secondary': 'var(c-primary-dark-100-alpha-700)',
      'c-badge-tertiary': 'var(c-primary-alpha-600)',
    },
  },
  {
    id: 'naruto',
    name: '木叶之村',
    isDark: false,
    config: {
      primary: 'rgb(87, 144, 167)',
      font: 'rgb(28, 28, 30)',
      'c-app-background': 'rgba(255, 255, 255, 0.15)',
      'c-main-background': 'rgba(255, 255, 255, 0.88)',
      'bg-image': 'myzcbg.jpg',
      'bg-image-position': 'center',
      'bg-image-size': 'cover',

      'c-badge-primary': 'var(c-primary)',
      'c-badge-secondary': 'var(c-primary-dark-100-alpha-700)',
      'c-badge-tertiary': 'var(c-primary-alpha-600)',
    },
  },
  {
    id: 'china_ink',
    name: '近墨者黑',
    isDark: false,
    config: {
      primary: 'rgba(47, 47, 47, 1)',
      font: 'rgb(28, 28, 30)',
      'c-app-background': 'rgba(255, 255, 255, 0)',
      'c-main-background': 'rgba(255, 255, 255, 0.88)',
      'bg-image': 'china_ink.jpg',
      'bg-image-position': 'center',
      'bg-image-size': 'cover',

      'c-badge-primary': 'var(c-primary)',
      'c-badge-secondary': 'var(c-primary-dark-100-alpha-700)',
      'c-badge-tertiary': 'var(c-primary-alpha-600)',
    },
  },
  {
    id: 'happy_new_year',
    name: '新年快乐',
    isDark: false,
    config: {
      primary: 'rgb(196, 57, 43)',
      font: 'rgb(28, 28, 30)',
      'c-app-background': 'rgba(255, 255, 255, 0.15)',
      'c-main-background': 'rgba(255, 255, 255, 0.88)',
      'bg-image': 'xnkl.png',
      'bg-image-position': 'center',
      'bg-image-size': 'cover',

      'c-badge-primary': 'var(c-primary)',
      'c-badge-secondary': 'var(c-primary-dark-100-alpha-700)',
      'c-badge-tertiary': 'var(c-primary-alpha-600)',
    },
  },
  // ========== 暗色主题 ==========
  {
    // 默认暗色 — Apple Music 黑色模式
    id: 'black',
    name: '深黑',
    isDark: true,
    config: {
      primary: 'rgb(250, 45, 59)', // Apple Music 红（暗色模式下略亮以保持可见性）
      font: 'rgb(235, 235, 240)',  // Apple 暗色 label 色
      'c-app-background': 'rgb(0, 0, 0)',
      'c-main-background': 'rgb(0, 0, 0)',
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
