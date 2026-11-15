import { type ImageSourcePropType } from 'react-native'
import { createSemanticPalette } from './palette'

/** 纯派生函数，同时供启动初始态和运行时主题使用，避免两份手写色表漂移。 */
export const createActiveTheme = (theme: LX.Theme, backgroundImage?: ImageSourcePropType): LX.ActiveTheme => {
  const colors = theme.config.themeColors
  const isDark = theme.isDark
  return {
    id: theme.id,
    name: theme.name,
    isDark,
    ...colors,
    ...theme.config.extInfo,
    'c-primary-font': colors['c-primary'],
    'c-primary-font-hover': colors['c-primary-alpha-300'],
    'c-primary-font-active': colors['c-primary-dark-100-alpha-200'],
    'c-primary-background': colors[isDark ? 'c-primary-alpha-800' : 'c-primary-alpha-900'],
    'c-primary-background-hover': colors[isDark ? 'c-primary-alpha-700' : 'c-primary-alpha-800'],
    'c-primary-background-active': colors[isDark ? 'c-primary-alpha-600' : 'c-primary-alpha-700'],
    'c-button-font': colors['c-primary-alpha-100'],
    'c-button-font-selected': colors['c-primary-dark-100-alpha-100'],
    'c-button-background': colors[isDark ? 'c-primary-alpha-800' : 'c-primary-alpha-900'],
    'c-button-background-selected': colors['c-primary-alpha-600'],
    'c-button-background-hover': colors[isDark ? 'c-primary-alpha-700' : 'c-primary-alpha-800'],
    'c-button-background-active': colors[isDark ? 'c-primary-alpha-600' : 'c-primary-alpha-700'],
    ...createSemanticPalette(isDark),
    'bg-image': backgroundImage,
  }
}
