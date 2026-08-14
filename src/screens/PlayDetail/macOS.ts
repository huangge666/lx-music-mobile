/**
 * macOS Sonoma 风格设计 Tokens
 *
 * 设计语言参考 macOS Sonoma / Apple Music 视觉规范：
 * - 浅色毛玻璃卡片：rgba 白色半透明 + 细 1px 描边 + 柔和长投影
 * - 圆角统一：12 / 14 / 18 / 22 四档
 * - 间距统一：8 / 12 / 16 / 20 / 24 五档
 * - 字体层级：11 / 13 / 15 / 17 / 20
 * - 动效：spring 弹性过渡，时长 220 ~ 320ms
 *
 * 说明：所有 token 仅供 PlayDetail 模块使用，便于统一视觉风格。
 * 实际颜色取值会优先从主题 theme 中读取（保持多主题兼容），
 * macOS 风格主要体现在「布局 / 圆角 / 阴影 / 分格」上。
 */

import { Platform } from 'react-native'
import { scaleSizeW, scaleSizeH } from '@/utils/pixelRatio'

// ──────────────────────────────────────────────────────────────────────────────
// 圆角（macOS Big Sur 起的标志性超椭圆）
// ──────────────────────────────────────────────────────────────────────────────
export const MacRadius = {
  /** 小型按钮 / 标签 */
  xs: scaleSizeW(6),
  /** 通用卡片 */
  sm: scaleSizeW(10),
  /** 播放主卡（控制区） */
  md: scaleSizeW(14),
  /** 顶部 Header 胶囊 */
  lg: scaleSizeW(18),
  /** 大型封面卡片 */
  xl: scaleSizeW(22),
}

// ──────────────────────────────────────────────────────────────────────────────
// 间距（基于 4pt 栅格）
// ──────────────────────────────────────────────────────────────────────────────
export const MacSpacing = {
  xxs: scaleSizeW(2),
  xs: scaleSizeW(4),
  sm: scaleSizeW(8),
  md: scaleSizeW(12),
  lg: scaleSizeW(16),
  xl: scaleSizeW(20),
  xxl: scaleSizeW(24),
  xxxl: scaleSizeW(32),
}

// ──────────────────────────────────────────────────────────────────────────────
// 字号（macOS 系统字体规范）
// ──────────────────────────────────────────────────────────────────────────────
export const MacFontSize = {
  caption: 11, // 时间戳 / 标签
  footnote: 13, // 状态 / 次要信息
  body: 15, // 通用文字
  headline: 17, // 标题 / 控制按钮数字
  title: 20, // 主标题（歌曲名）
  largeTitle: 28, // 大标题
}

// ──────────────────────────────────────────────────────────────────────────────
// 阴影（macOS 标志性的长投影 + 柔和分层）
// ──────────────────────────────────────────────────────────────────────────────
export const MacShadow = {
  /** 卡片悬浮阴影 — 用于主播放卡 */
  card: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.08,
      shadowRadius: 24,
    },
    android: {
      elevation: 6,
    },
    default: {},
  }) as object,
  /** 小型元素阴影 — Header 胶囊 / 按钮 */
  small: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
    },
    android: {
      elevation: 2,
    },
    default: {},
  }) as object,
  /** 大封面阴影 — 用于专辑封面 */
  large: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 16 },
      shadowOpacity: 0.18,
      shadowRadius: 32,
    },
    android: {
      elevation: 12,
    },
    default: {},
  }) as object,
}

// ──────────────────────────────────────────────────────────────────────────────
// 毛玻璃卡片背景（按主题 isDark 自适应）
// — 浅色：rgba(255,255,255,0.72) + 极淡描边
// — 深色：rgba(28,28,30,0.72) + 极淡白色描边
// ──────────────────────────────────────────────────────────────────────────────
export const getMacGlassBackground = (isDark: boolean) => {
  return isDark
    ? 'rgba(28, 28, 30, 0.72)'
    : 'rgba(255, 255, 255, 0.72)'
}

export const getMacGlassBorder = (isDark: boolean) => {
  return isDark
    ? 'rgba(255, 255, 255, 0.08)'
    : 'rgba(0, 0, 0, 0.06)'
}

/** 内嵌卡片背景（用于控制按钮 / chip 之类） */
export const getMacChipBackground = (isDark: boolean) => {
  return isDark
    ? 'rgba(255, 255, 255, 0.08)'
    : 'rgba(0, 0, 0, 0.04)'
}

/** 悬浮态背景（hover / active） */
export const getMacPressedBackground = (isDark: boolean) => {
  return isDark
    ? 'rgba(255, 255, 255, 0.14)'
    : 'rgba(0, 0, 0, 0.08)'
}

// ──────────────────────────────────────────────────────────────────────────────
// 动效时长（ms）— macOS 风格的弹性过渡
// ──────────────────────────────────────────────────────────────────────────────
export const MacDuration = {
  fast: 160,
  normal: 240,
  slow: 360,
}

// ──────────────────────────────────────────────────────────────────────────────
// 触控目标（HIG：最小 44pt）
// ──────────────────────────────────────────────────────────────────────────────
export const MacTouchSize = {
  small: scaleSizeW(36),
  medium: scaleSizeW(44),
  large: scaleSizeW(56),
}

// ──────────────────────────────────────────────────────────────────────────────
// 边框宽度（macOS 极细 1pt 描边）
// ──────────────────────────────────────────────────────────────────────────────
export const MacBorderWidth = {
  hairline: 0.5,
  thin: 1,
}

// ──────────────────────────────────────────────────────────────────────────────
// 字号 2 倍映射（用于阴影 / 内边距计算）
// ──────────────────────────────────────────────────────────────────────────────
export const MacIconSize = {
  sm: scaleSizeW(16),
  md: scaleSizeW(20),
  lg: scaleSizeW(24),
  xl: scaleSizeW(32),
}

// ──────────────────────────────────────────────────────────────────────────────
// 圆点手柄（用于进度条拖拽头）
// ──────────────────────────────────────────────────────────────────────────────
export const MacProgressHeight = scaleSizeH(4)
export const MacProgressDotSize = scaleSizeW(14)

// ──────────────────────────────────────────────────────────────────────────────
// 现代简约红色强调色（与迷你播放栏呼应：圆润、干净、红色点缀）
// — 不直接覆盖主题 c-primary，避免影响全局；仅在 PlayDetail 中使用
// — 灵感来自主流中文音乐 App（网易云 / QQ 音乐）的红
// ──────────────────────────────────────────────────────────────────────────────
/** 主红色 — 用于播放按钮、进度条、喜欢激活态、歌词高亮 */
export const MacAccentRed = '#E53935'
/** 主红色按下态 */
export const MacAccentRedPressed = '#C62828'
/** 主红色柔和（次要强调、循环模式激活态） */
export const MacAccentRedSoft = '#FF6B6B'
/** 半透明红（用于阴影 / 底色） */
export const MacAccentRedShadow = 'rgba(229, 57, 53, 0.35)'
export const MacAccentRedAlpha100 = 'rgba(229, 57, 53, 0.10)'
export const MacAccentRedAlpha200 = 'rgba(229, 57, 53, 0.20)'
export const MacAccentRedAlpha300 = 'rgba(229, 57, 53, 0.40)'

// ──────────────────────────────────────────────────────────────────────────────
// 沉浸式 Now Playing 色板（封面氛围底 + 白色控件）
// 播放详情竖屏固定走这套对比，不跟随主题主色，保证封面模糊底上的可读性
// ──────────────────────────────────────────────────────────────────────────────
export const Immersive = {
  /** 主文字 — 纯白 */
  text: '#FFFFFF',
  /** 次级文字 — 艺术家 / 时间 */
  textSecondary: 'rgba(255,255,255,0.78)',
  /** 三级文字 — 未激活歌词 */
  textTertiary: 'rgba(255,255,255,0.48)',
  /** 毛玻璃按钮底 */
  glass: 'rgba(255,255,255,0.16)',
  /** 底部胶囊更强磨砂感 */
  glassStrong: 'rgba(255,255,255,0.14)',
  glassBorder: 'rgba(255,255,255,0.12)',
  /** 进度/音量未播放轨道 */
  track: 'rgba(255,255,255,0.32)',
  fill: '#FFFFFF',
  /** 全屏氛围遮罩 — 略轻，让封面色透出来 */
  overlay: 'rgba(18,12,20,0.28)',
  /** 底部再压一层，控制区更稳 */
  overlayBottom: 'rgba(10,8,14,0.38)',
  /** 无封面时的兜底色 */
  fallback: '#1C1420',
  /** 「无损」标签底 */
  chip: 'rgba(255,255,255,0.14)',
}
