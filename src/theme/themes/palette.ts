/**
 * 语义色板（Phase 6A）
 *
 * 这里只放**不依赖主题主色**的明暗角色，供 `buildActiveThemeColors` 与
 * `store/theme/state.ts` 的初始态共用，保证首帧与稳定态是同一套颜色。
 *
 * 角色划分：
 * - 内容底色 `c-content-background`：页面底，浅色近白、深色近黑
 * - 分组/浮层 `c-card-background`：实色卡片、菜单、抬亮浮层（浅色纯白、深色 #1C1C1E）
 * - 输入/次级填充 `c-primary-input-background`：输入框、内嵌容器、未选中胶囊
 * - 分隔 `c-border-background` / `c-list-header-border-bottom`：中性发丝线（不再是白色高光）
 * - 强调 `c-accent` / `c-accent-soft`：选中态、激活图标、主按钮实底
 * - 危险 `c-danger` / `c-danger-soft`：删除、失败、重试
 * - 玻璃 `c-glass-*`：只用于导航控制区、抽屉和弹层（半透明底 + 高光）
 *
 * 对比度（WCAG，正文 4.5:1）：
 * - 浅色 `c-accent` rgb(74,112,126)：白字压在其上 5.38:1；作为文字压在 rgb(247,247,249) 上 4.97:1
 * - 深色 `c-accent` rgb(214,176,148)：深色反色字压在其上 9.6:1；作为文字压在 rgb(8,10,14) 上 9.6:1
 * - 浅色 `c-danger` rgb(198,24,44)：压在页面底 5.35:1；白字压在其上 5.79:1
 * - 深色 `c-danger` rgb(255,105,97)：压在 rgb(28,28,30) 上 6.04:1
 *
 * 危险色只做「文字/图标 + 柔和底」两种用法，不给实底配白字：
 * 深色主题下可读的红（浅红）与「白字可读的红」不可兼得，所以危险按钮统一
 * 用 `c-danger-soft` 底 + `c-danger` 文字，避免出现看不清的白字红底。
 */

export interface SemanticPalette {
  'c-content-background': string
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
  // 页面底：近白，分组/卡片用纯白压在它上面才有层级
  'c-content-background': 'rgb(247, 247, 249)',
  // 实色卡片：设置分组、菜单、抬亮浮层
  'c-card-background': 'rgb(255, 255, 255)',
  // 输入框与次级填充
  'c-primary-input-background': 'rgba(118, 118, 128, 0.12)',
  // 中性发丝线：分隔线、行边框、进度轨道底
  'c-border-background': 'rgba(60, 60, 67, 0.14)',
  'c-list-header-border-bottom': 'rgba(60, 60, 67, 0.12)',
  // 强调：雾青，白字可读
  'c-accent': 'rgb(74, 112, 126)',
  'c-accent-soft': 'rgba(74, 112, 126, 0.14)',
  // 危险：删除/失败/重试
  'c-danger': 'rgb(198, 24, 44)',
  'c-danger-soft': 'rgba(198, 24, 44, 0.12)',
  // 玻璃：仅导航控制区、抽屉、弹层
  'c-glass-background': 'rgba(255, 255, 255, 0.94)',
  // 玻璃边缘用中性发丝线：纯白描边在浅色页面底上几乎不可见
  'c-glass-border': 'rgba(60, 60, 67, 0.12)',
  'c-glass-highlight': 'rgba(255, 255, 255, 0.92)',
  'c-glass-fluid-glow': 'rgba(74, 112, 126, 0.10)',
  'c-glass-surface': 'rgba(255, 255, 255, 0.82)',
}

const darkPalette: SemanticPalette = {
  'c-content-background': 'rgb(8, 10, 14)',
  // 深色浮层适度抬亮，与内容底分层
  'c-card-background': 'rgb(28, 28, 30)',
  'c-primary-input-background': 'rgba(118, 118, 128, 0.24)',
  'c-border-background': 'rgba(255, 255, 255, 0.10)',
  'c-list-header-border-bottom': 'rgba(255, 255, 255, 0.10)',
  // 强调：暖沙，深色反色字可读
  'c-accent': 'rgb(214, 176, 148)',
  'c-accent-soft': 'rgba(214, 176, 148, 0.18)',
  'c-danger': 'rgb(255, 105, 97)',
  'c-danger-soft': 'rgba(255, 105, 97, 0.20)',
  'c-glass-background': 'rgba(12, 14, 18, 0.94)',
  'c-glass-border': 'rgba(255, 255, 255, 0.16)',
  'c-glass-highlight': 'rgba(255, 255, 255, 0.22)',
  'c-glass-fluid-glow': 'rgba(214, 176, 148, 0.10)',
  'c-glass-surface': 'rgba(255, 255, 255, 0.12)',
}

/** 按明暗返回同一套语义角色，浅/深结构完全一致 */
export const createSemanticPalette = (isDark: boolean): SemanticPalette => (
  isDark ? darkPalette : lightPalette
)

/**
 * 压在主色实底上的文字/图标色。
 * `c-primary-font` 与 `c-primary` 同值，不能当实底文字色用，这里统一取反色。
 */
export const getOnAccentColor = (isDark: boolean) => (
  isDark ? 'rgb(18, 16, 14)' : 'rgb(255, 255, 255)'
)

/** 禁用态统一透明度：只降透明度，不改布局和字号 */
export const DISABLED_OPACITY = 0.45

/**
 * 自定义背景图上的遮罩色：
 * 与 `c-content-background` 同色相加透明度，保证图片背景时文字仍可读。
 */
export const getBgPicOverlayColor = (isDark: boolean) => (
  isDark ? 'rgba(8, 10, 14, 0.62)' : 'rgba(247, 247, 249, 0.62)'
)
