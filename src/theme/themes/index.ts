/* eslint-disable @typescript-eslint/no-var-requires */
import { getUserTheme, saveUserTheme } from '@/utils/data'
import themes from '@/theme/themes/themes'
import settingState from '@/store/setting/state'
import themeState from '@/store/theme/state'
import { isUrl } from '@/utils'
import { privateStorageDirectoryPath } from '@/utils/fs'
import { type ImageSourcePropType } from 'react-native'

export const BG_IMAGES = {
  'china_ink.jpg': require('./images/china_ink.jpg') as ImageSourcePropType,
  'jqbg.jpg': require('./images/jqbg.jpg') as ImageSourcePropType,
  'landingMoon.png': require('./images/landingMoon2.png') as ImageSourcePropType,
  'myzcbg.jpg': require('./images/myzcbg.jpg') as ImageSourcePropType,
  'xnkl.png': require('./images/xnkl.png') as ImageSourcePropType,
} as const


let userThemes: LX.Theme[]
export const getAllThemes = async() => {
  // eslint-disable-next-line require-atomic-updates
  userThemes ??= await getUserTheme()
  return {
    themes,
    userThemes,
    dataPath: privateStorageDirectoryPath + '/theme_images',
  }
}

export const saveTheme = async(theme: LX.Theme) => {
  const targetTheme = userThemes.find(t => t.id === theme.id)
  if (targetTheme) Object.assign(targetTheme, theme)
  else userThemes.push(theme)
  await saveUserTheme(userThemes)
}

export const removeTheme = async(id: string) => {
  const index = userThemes.findIndex(t => t.id === id)
  if (index < 0) return
  userThemes.splice(index, 1)
  await saveUserTheme(userThemes)
}

export type LocalTheme = typeof themes[number]
type ColorsKey = keyof LX.Theme['config']['themeColors']
type ExtInfoKey = keyof LX.Theme['config']['extInfo']
const varColorRxp = /^var\((.+)\)$/
export const buildActiveThemeColors = (theme: LX.Theme): LX.ActiveTheme => {
  let bgImg: ImageSourcePropType | undefined
  if (theme.isCustom) {
    if (theme.config.extInfo['bg-image']) {
      theme.config.extInfo['bg-image'] =
        isUrl(theme.config.extInfo['bg-image'])
          ? theme.config.extInfo['bg-image']
          : `${privateStorageDirectoryPath}/theme_images/${theme.config.extInfo['bg-image']}`
    }
  } else {
    const extInfo = (theme as LocalTheme).config.extInfo
    if (extInfo['bg-image']) {
      if (!theme.isDark || !settingState.setting['theme.hideBgDark']) bgImg = BG_IMAGES[extInfo['bg-image']]
    }
  }

  theme.config.extInfo = { ...theme.config.extInfo }

  for (const [k, v] of Object.entries(theme.config.extInfo) as Array<[ExtInfoKey, LX.Theme['config']['extInfo'][ExtInfoKey]]>) {
    if (!v.startsWith('var(')) continue
    theme.config.extInfo[k] = theme.config.themeColors[v.replace(varColorRxp, '$1') as ColorsKey]
  }

  // 液态玻璃语义色：浅色用浅白玻璃，深色用黑玻璃。
  // 辅色独立于主色，浅色雾青、深色暖沙，避免整屏只剩黑白。
  const isDark = theme.isDark
  const accent = isDark ? 'rgb(214, 176, 148)' : 'rgb(92, 132, 146)'
  return {
    'id': theme.id,
    'name': theme.name,
    isDark,
    ...theme.config.themeColors,
    ...theme.config.extInfo,
    // 主文字色 — 亮色 #1C1C1E / 暗色 #EBEBF0
    'c-font': isDark ? theme.config.themeColors['c-850'] : theme.config.themeColors['c-900'],
    // 次要文字色 — 亮色 #8E8E93 / 暗色 #98989F
    'c-font-label': isDark ? theme.config.themeColors['c-450'] : theme.config.themeColors['c-400'],
    // 强调色文字
    'c-primary-font': theme.config.themeColors['c-primary'],
    'c-primary-font-hover': theme.config.themeColors['c-primary-alpha-300'],
    'c-primary-font-active': theme.config.themeColors['c-primary-dark-100-alpha-200'],
    // 强调色背景层 — 用于选中态、悬浮态
    'c-primary-background': isDark
      ? theme.config.themeColors['c-primary-alpha-800']
      : theme.config.themeColors['c-primary-alpha-900'],
    'c-primary-background-hover': isDark
      ? theme.config.themeColors['c-primary-alpha-700']
      : theme.config.themeColors['c-primary-alpha-800'],
    'c-primary-background-active': isDark
      ? theme.config.themeColors['c-primary-alpha-600']
      : theme.config.themeColors['c-primary-alpha-700'],
    // 输入框背景 — Apple Music 浅灰填充
    'c-primary-input-background': isDark
      ? 'rgba(118, 118, 128, 0.24)'
      : 'rgba(118, 118, 128, 0.12)',
    // 按钮色
    'c-button-font': theme.config.themeColors['c-primary-alpha-100'],
    'c-button-font-selected': theme.config.themeColors['c-primary-dark-100-alpha-100'],
    'c-button-background': isDark
      ? theme.config.themeColors['c-primary-alpha-800']
      : theme.config.themeColors['c-primary-alpha-900'],
    'c-button-background-selected': theme.config.themeColors['c-primary-alpha-600'],
    'c-button-background-hover': isDark
      ? theme.config.themeColors['c-primary-alpha-700']
      : theme.config.themeColors['c-primary-alpha-800'],
    'c-button-background-active': isDark
      ? theme.config.themeColors['c-primary-alpha-600']
      : theme.config.themeColors['c-primary-alpha-700'],
    'c-list-header-border-bottom': isDark
      ? 'rgba(255, 255, 255, 0.10)'
      : 'rgba(255, 255, 255, 0.55)',
    // 页面底色保留轻微渐变感，玻璃层叠在它上面
    'c-content-background': isDark ? 'rgb(8, 10, 14)' : 'rgb(236, 240, 244)',
    'c-border-background': isDark
      ? 'rgba(255, 255, 255, 0.10)'
      : 'rgba(255, 255, 255, 0.62)',
    'c-card-background': isDark
      ? 'rgba(255, 255, 255, 0.06)'
      : 'rgba(255, 255, 255, 0.58)',
    // 柔和辅色：用于选中描边、图标点缀和进度强调，不替代玻璃主色
    'c-accent': accent,
    'c-accent-soft': isDark ? 'rgba(214, 176, 148, 0.18)' : 'rgba(92, 132, 146, 0.16)',
    'c-glass-background': isDark
      ? 'rgba(12, 14, 18, 0.94)'
      : 'rgba(255, 255, 255, 0.94)',
    'c-glass-border': isDark
      ? 'rgba(255, 255, 255, 0.16)'
      : 'rgba(255, 255, 255, 0.82)',
    'c-glass-highlight': isDark
      ? 'rgba(255, 255, 255, 0.22)'
      : 'rgba(255, 255, 255, 0.92)',
    'c-glass-fluid-glow': isDark
      ? 'rgba(214, 176, 148, 0.10)'
      : 'rgba(92, 132, 146, 0.12)',
    'c-glass-surface': isDark
      ? 'rgba(255, 255, 255, 0.12)'
      : 'rgba(255, 255, 255, 0.82)',
    'bg-image': bgImg,
  } as const
}


// const copyTheme = (theme: LX.Theme): LX.Theme => {
//   return {
//     ...theme,
//     config: {
//       ...theme.config,
//       extInfo: { ...theme.config.extInfo },
//       themeColors: { ...theme.config.themeColors },
//     },
//   }
// }
// type IDS = LocalTheme['id']
export const getTheme = async() => {
  // fs.promises.readdir()
  const shouldUseDarkColors = themeState.shouldUseDarkColors
  // let themeId = settingState.setting['theme.id'] == 'auto'
  //   ? shouldUseDarkColors
  //     ? settingState.setting['theme.darkId']
  //     : settingState.setting['theme.lightId']
  //   // : 'china_ink'
  //   : settingState.setting['theme.id']
  // 只保留浅色 green / 深色 black。跟随系统时按系统深浅切换，旧主题 id 一律回退。
  const themeId = settingState.setting['common.isAutoTheme']
    ? (shouldUseDarkColors ? 'black' : 'green')
    : (settingState.setting['theme.id'] == 'black' ? 'black' : 'green')
  const theme = themes.find(item => item.id == themeId) as LX.Theme

  return theme
}
