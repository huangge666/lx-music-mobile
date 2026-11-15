import { createContext } from 'react'
import themes from '@/theme/themes/themes'
import { createActiveTheme } from '@/theme/themes/active'

interface InitState {
  shouldUseDarkColors: boolean
  theme: LX.ActiveTheme
}

// 初始帧直接派生默认主题，不维护会与生成色表漂移的第二份 300 行色值。
const state: InitState = {
  shouldUseDarkColors: false,
  theme: createActiveTheme(themes[0] as LX.Theme),
}

export const ThemeContext = createContext(state.theme)

export default state
