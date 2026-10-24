/**
 * 语义色板（对齐 Sonify 的明暗角色，不跟系统动态取色）
 *
 * 这里只放**不依赖主题主色**的明暗角色，供 `buildActiveThemeColors` 与
 * `store/theme/state.ts` 的初始态共用，保证首帧与稳定态是同一套颜色。
 *
 * 角色划分（对照 Sonify 的 Color.kt，不是整屏一套灰）：
 * - 内容底色 `c-content-background`：首页画布浅色纯白、深色纯黑
 * - 分组底 `c-grouped-background`：设置页 #F2F1F6 / #000002，白卡或 #1C1C1E 浮在上面
 * - 分组/浮层 `c-card-background`：浅色纯白、深色 #1C1C1E
 * - 输入/次级填充 `c-primary-input-background`：半透明灰填充
 * - 分隔 `c-border-background` / `c-list-header-border-bottom`
 * - 强调 `c-accent` / `c-accent-soft`：Sonify primary #F54047 / primaryDark #E64366
 * - 危险 `c-danger` / `c-danger-soft`：删除、失败、重试
 * - 玻璃 `c-glass-*`：浮动导航栏、迷你播放器、抽屉和弹层（半透明底 + 高光）
 *
 * 对比度：浅色强调色 #F54047 用于进度、链接和大按钮，白字压在其上。
 * 底栏选中态不靠这个红，而靠玻璃透镜（与 Sonify 开着液态玻璃时一致）。
 * - 浅色 `c-danger` rgb(215,0,21)：压在页面底 4.83:1，白字压在其上 5.38:1
 * - 深色 `c-danger` rgb(255,69,58)：压在 #1C1C1E 上 5.15:1
 *
 * 危险色只做「文字/图标 + 柔和底」两种用法，不给实底配白字：
 * 深色主题下可读的红（浅红）与「白字可读的红」不可兼得，所以危险按钮统一
 * 用 `c-danger-soft` 底 + `c-danger` 文字，避免出现看不清的白字红底。
 */

export interface SemanticPalette {
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
  // 首页画布：Sonify background = 白
  'c-content-background': 'rgb(255, 255, 255)',
  // 设置页：Sonify settingBack #F2F1F6
  'c-grouped-background': 'rgb(242, 241, 246)',
  // 实色卡片：设置分组、菜单、抬亮浮层
  'c-card-background': 'rgb(255, 255, 255)',
  // 输入框与次级填充
  'c-primary-input-background': 'rgba(118, 118, 128, 0.12)',
  // iOS separator：分隔线、行边框、进度轨道底
  'c-border-background': 'rgba(60, 60, 67, 0.18)',
  'c-list-header-border-bottom': 'rgba(60, 60, 67, 0.18)',
  // 强调：Sonify primary #F54047
  'c-accent': 'rgb(245, 64, 71)',
  'c-accent-soft': 'rgba(245, 64, 71, 0.12)',
  // 危险：删除/失败/重试
  'c-danger': 'rgb(215, 0, 21)',
  'c-danger-soft': 'rgba(215, 0, 21, 0.12)',
  // 玻璃：浮动导航栏、迷你播放器、抽屉、弹层
  'c-glass-background': 'rgba(255, 255, 255, 0.62)',
  // 边缘：亮底上用中性发丝线，避免纯白描边在浅色页面底上消失
  'c-glass-border': 'rgba(60, 60, 67, 0.12)',
  'c-glass-highlight': 'rgba(255, 255, 255, 0.92)',
  'c-glass-fluid-glow': 'rgba(255, 255, 255, 0.06)',
  'c-glass-surface': 'rgba(255, 255, 255, 0.72)',
}

const darkPalette: SemanticPalette = {
  // 首页画布：Sonify backgroundDark = 黑；设置页 settingBackDark #000002
  'c-content-background': 'rgb(0, 0, 0)',
  'c-grouped-background': 'rgb(0, 0, 2)',
  'c-card-background': 'rgb(28, 28, 30)',
  'c-primary-input-background': 'rgba(118, 118, 128, 0.24)',
  'c-border-background': 'rgba(255, 255, 255, 0.12)',
  'c-list-header-border-bottom': 'rgba(255, 255, 255, 0.12)',
  // 强调：Sonify primaryDark #E64366
  'c-accent': 'rgb(230, 67, 102)',
  'c-accent-soft': 'rgba(230, 67, 102, 0.18)',
  'c-danger': 'rgb(255, 69, 58)',
  'c-danger-soft': 'rgba(255, 69, 58, 0.20)',
  'c-glass-background': 'rgba(20, 20, 22, 0.70)',
  'c-glass-border': 'rgba(255, 255, 255, 0.14)',
  'c-glass-highlight': 'rgba(255, 255, 255, 0.24)',
  'c-glass-fluid-glow': 'rgba(255, 255, 255, 0.05)',
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
  isDark ? 'rgba(0, 0, 0, 0.62)' : 'rgba(255, 255, 255, 0.62)'
)
