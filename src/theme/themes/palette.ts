/**
 * 音乐杂志的纸白 / 石墨画布。内容保持实色，玻璃只用于浮动控制和弹层。
 * 字色也属于语义角色：初始帧和切换后的主题由同一份色板生成。
 * 危险操作始终使用浅底配红字，不把深色主题的浅红强行配白字。
 */

export interface SemanticPalette {
  'c-font': string
  'c-font-label': string
  'c-content-background': string
  'c-grouped-background': string
  'c-card-background': string
  'c-primary-input-background': string
  'c-border-background': string
  'c-list-header-border-bottom': string
  'c-accent': string
  'c-accent-soft': string
  'c-danger': string
  'c-danger-soft': string
  'c-glass-background': string
  'c-glass-border': string
  'c-glass-highlight': string
  'c-glass-fluid-glow': string
  'c-glass-surface': string
}

const lightPalette: SemanticPalette = {
  'c-font': 'rgb(25, 33, 26)',
  'c-font-label': 'rgb(96, 105, 94)',
  'c-content-background': 'rgb(247, 248, 242)',
  'c-grouped-background': 'rgb(237, 240, 230)',
  'c-card-background': 'rgb(255, 255, 250)',
  'c-primary-input-background': 'rgba(63, 82, 47, 0.08)',
  'c-border-background': 'rgba(39, 58, 31, 0.14)',
  'c-list-header-border-bottom': 'rgba(39, 58, 31, 0.14)',
  'c-accent': 'rgb(61, 92, 39)',
  'c-accent-soft': 'rgba(61, 92, 39, 0.10)',
  'c-danger': 'rgb(215, 0, 21)',
  'c-danger-soft': 'rgba(215, 0, 21, 0.12)',
  'c-glass-background': 'rgba(248, 250, 240, 0.56)',
  'c-glass-border': 'rgba(49, 68, 38, 0.16)',
  'c-glass-highlight': 'rgba(255, 255, 255, 0.92)',
  'c-glass-fluid-glow': 'rgba(255, 255, 255, 0.06)',
  'c-glass-surface': 'rgba(255, 255, 250, 0.40)',
}

const darkPalette: SemanticPalette = {
  'c-font': 'rgb(239, 244, 233)',
  'c-font-label': 'rgb(171, 181, 163)',
  'c-content-background': 'rgb(17, 22, 18)',
  'c-grouped-background': 'rgb(13, 18, 14)',
  'c-card-background': 'rgb(29, 37, 30)',
  'c-primary-input-background': 'rgba(196, 218, 172, 0.10)',
  'c-border-background': 'rgba(220, 237, 201, 0.13)',
  'c-list-header-border-bottom': 'rgba(220, 237, 201, 0.13)',
  'c-accent': 'rgb(211, 239, 165)',
  'c-accent-soft': 'rgba(211, 239, 165, 0.12)',
  'c-danger': 'rgb(255, 69, 58)',
  'c-danger-soft': 'rgba(255, 69, 58, 0.20)',
  'c-glass-background': 'rgba(28, 37, 27, 0.60)',
  'c-glass-border': 'rgba(222, 241, 208, 0.20)',
  'c-glass-highlight': 'rgba(239, 255, 221, 0.32)',
  'c-glass-fluid-glow': 'rgba(255, 255, 255, 0.05)',
  'c-glass-surface': 'rgba(218, 239, 194, 0.10)',
}

/** 按明暗返回同一套语义角色，浅/深结构完全一致 */
export const createSemanticPalette = (isDark: boolean): SemanticPalette => (
  isDark ? darkPalette : lightPalette
)

/**
 * 强调色实底上的文字/图标色；与两套色板一起验证普通文字的 4.5:1 对比度。
 */
export const getOnAccentColor = (isDark: boolean) => (
  isDark ? 'rgb(21, 30, 16)' : 'rgb(255, 255, 255)'
)

/** 禁用态统一透明度：只降透明度，不改布局和字号 */
export const DISABLED_OPACITY = 0.45

/**
 * 自定义背景图上的遮罩色：
 * 与 `c-content-background` 同色相加透明度，保证图片背景时文字仍可读。
 */
export const getBgPicOverlayColor = (isDark: boolean) => (
  isDark ? 'rgba(17, 22, 18, 0.78)' : 'rgba(247, 248, 242, 0.82)'
)
