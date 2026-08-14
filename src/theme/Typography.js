/**
 * Apple Music 风格排版与设计令牌
 *
 * 字体层级遵循 Apple HIG（Human Interface Guidelines）：
 * - LargeTitle 34pt — 首页大标题（粗体）
 * - Title1 28pt — 导航栏大标题
 * - Title2 22pt — 区块标题
 * - Title3 20pt — 子标题
 * - Headline 17pt — 列表项主标题（ Semibold）
 * - Body 17pt — 正文
 * - SubHeadline 15pt — 子标题/歌手名
 * - Footnote 13pt — 脚注
 * - Caption1 12pt — 时间/编号
 * - Caption2 11pt — Tab 标签
 */

export const FontWeights = {
  Bold: {
    fontFamily: 'SFProDisplay-Bold',
    color: '#000',
  },
  Regular: {
    fontFamily: 'SFProDisplay-Regular',
    color: '#000',
  },
  Light: {
    fontFamily: 'SFProDisplay-Light',
    color: '#000',
  },
}

export const FontSizes = {
  // Apple Music 大标题层级
  LargeTitle: {
    fontSize: 34,
  },
  Title1: {
    fontSize: 28,
  },
  Title2: {
    fontSize: 22,
  },
  Title3: {
    fontSize: 20,
  },
  // 正文层级
  Headline: {
    fontSize: 17,
  },
  Body: {
    fontSize: 17,
  },
  SubHeadline: {
    fontSize: 15,
  },
  // 脚注/标签层级
  Footnote: {
    fontSize: 13,
  },
  Caption: {
    fontSize: 14,
  },
}

export const BorderWidths = {
  hairline: 0.5,   // Apple 极细分隔线（物理像素级）
  normal: 0.5,     // 兼容旧引用 — Apple separator 级别
  thin: 1,
  medium: 1.5,
  thick: 2,
}

/**
 * Apple Music 圆角令牌体系
 * - small: 小元件（Badge、Tag）
 * - medium: 卡片、列表项
 * - large: 大卡片、播放器栏
 * - xlarge: 搜索框、大区域
 * - continuous: 持续圆角（Apple 标志性圆角风格）
 * - round: 胶囊形
 */
export const BorderRadius = {
  small: 8,
  medium: 12,
  normal: 14,
  large: 18,
  xlarge: 24,
  continuous: 22, // Apple continuous corner radius
  round: 999,
}

// 兼容旧引用
export { FontSizes as Heading }
