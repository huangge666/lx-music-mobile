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

  // Apple Music 风格语义色映射
  // 亮色模式：c-content-background = 系统白 #FFFFFF，c-border-background = #E5E5EA
  // 暗色模式：c-content-background = 纯黑 #000，c-border-background = #38383A
  const isDark = theme.isDark
  return {
    id: theme.id,
    name: theme.name,
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
    // 列表分隔线 — Apple 极细半透明
    'c-list-header-border-bottom': isDark
      ? 'rgba(255, 255, 255, 0.08)'
      : 'rgba(60, 60, 67, 0.10)',
    // 内容背景 — 亮色纯白 / 暗色纯黑
    'c-content-background': isDark ? 'rgb(0, 0, 0)' : 'rgb(255, 255, 255)',
    // 分隔线/边框 — Apple separator 色
    'c-border-background': isDark
      ? 'rgba(255, 255, 255, 0.08)'
      : 'rgba(60, 60, 67, 0.10)',
    // 卡片/分组背景 — Apple secondary system background
    'c-card-background': isDark ? 'rgb(28, 28, 30)' : 'rgb(242, 242, 247)',
    // 弥散流体水光玻璃质感令牌体系
    // 基础水光半透底色（更柔润温润的流体通透感）
    'c-glass-background': isDark
      ? 'rgba(16, 18, 27, 0.78)'
      : 'rgba(255, 255, 255, 0.82)',
    // 水光漫反射/微光边框（带环境光散射感）
    'c-glass-border': isDark
      ? 'rgba(255, 255, 255, 0.12)'
      : 'rgba(255, 255, 255, 0.70)',
    // 弥散流体高光反射层（水面流光波纹微光）
    'c-glass-highlight': isDark
      ? theme.config.themeColors['c-primary-alpha-800']
      : theme.config.themeColors['c-primary-alpha-900'],
    // 弥散主色流体光晕（基于环境主色的水光漫反射光晕）
    'c-glass-fluid-glow': isDark
      ? theme.config.themeColors['c-primary-alpha-700']
      : theme.config.themeColors['c-primary-alpha-800'],
    // 流体水光卡片/浮层表面层
    'c-glass-surface': isDark
      ? 'rgba(255, 255, 255, 0.05)'
      : 'rgba(255, 255, 255, 0.60)',
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
  let themeId = settingState.setting['common.isAutoTheme'] && shouldUseDarkColors
    ? 'black'
    : settingState.setting['theme.id']
  // themeId = 'naruto'
  // themeId = 'pink'
  // themeId = 'black'
  let theme: LocalTheme | LX.Theme | undefined = themes.find(theme => theme.id == themeId)
  if (!theme) {
    userThemes = await getUserTheme()
    theme = userThemes.find(theme => theme.id == themeId)
    if (!theme) {
      themeId = settingState.setting['theme.id'] == 'auto' && shouldUseDarkColors ? 'black' : 'green'
      theme = themes.find(theme => theme.id == themeId) as LX.Theme
    }
  }

  return theme
}
