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
  hairline: 0.5,   // 极细分隔线/微高光晶体边框（物理像素级）
  normal: 0.5,     // 兼容旧引用
  thin: 1,
  crystal: 1,      // 先锋冰晶棱镜边框
  medium: 1.5,
  thick: 2,
}

/**
 * 液态冰晶玻璃 / 先锋数字圆角令牌体系
 * - micro: 微元件 (Tag, Dot)
 * - small: 小按钮、标签
 * - medium: 列表项卡片、二级容器
 * - normal: 标准卡片
 * - large: 浮动面板、抽屉卡片
 * - xlarge: 悬浮大胶囊 (Mini Player, 弹窗)
 * - continuous: 流线曲率连续圆角
 * - pill / round: 胶囊形
 */
export const BorderRadius = {
  micro: 4,
  small: 8,
  medium: 12,
  normal: 14,
  large: 18,
  xlarge: 24,
  continuous: 22,
  pill: 999,
  round: 999,
}

// 兼容旧引用
export { FontSizes as Heading }
