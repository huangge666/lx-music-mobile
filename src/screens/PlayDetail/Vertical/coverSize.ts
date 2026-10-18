/**
 * 正在播放页大封面的尺寸计算（纯函数，便于回归）。
 *
 * 规则：
 * - 设计基准比例（屏宽 82%、扣除状态栏与页头后可用高的 42%）只作为**上限**；
 * - 实际边长再与页面实测的可用空间取较小值，这样小屏、横屏残留高度或应用大字号
 *   把控制区撑高时，封面会跟着收缩，不会把进度条与控制按钮挤出屏幕；
 * - 返回值单位是 dp，属于实测/布局值，调用方不要再交给缩放工具处理。
 */

/** 平板/超长屏的封面上限，避免封面无限放大 */
export const COVER_MAX_SIZE = 420

/**
 * 设计基准上限值。
 * @param windowWidth 窗口宽（dp）
 * @param windowHeight 窗口高（dp）
 * @param statusBarHeight 状态栏高度（dp，已缩放）
 * @param headerHeight 页头高度（dp，已缩放）
 */
export const getPreferredCoverSize = (
  windowWidth: number,
  windowHeight: number,
  statusBarHeight: number,
  headerHeight: number,
) => {
  const byWidth = windowWidth * 0.82
  const byHeight = Math.max(0, windowHeight - statusBarHeight - headerHeight) * 0.42
  const size = Math.min(byWidth, byHeight, COVER_MAX_SIZE)
  return Number.isFinite(size) && size > 0 ? size : 0
}

/**
 * 用实测可用空间收敛封面边长。
 * 实测值无效（尚未布局、0 尺寸）时回退到设计基准值，避免首帧或共享元素转场拿到 0 尺寸。
 * @param preferred 设计基准上限
 * @param availableWidth 封面容器实测宽
 * @param availableHeight 封面容器实测高
 * @param horizontalPadding 左右留白（单侧）
 * @param verticalPadding 上下留白（单侧）
 */
export const fitCoverSize = (
  preferred: number,
  availableWidth: number,
  availableHeight: number,
  horizontalPadding: number,
  verticalPadding: number,
) => {
  if (!Number.isFinite(availableWidth) || !Number.isFinite(availableHeight)) return preferred
  if (availableWidth <= 0 || availableHeight <= 0) return preferred
  const side = Math.min(
    preferred,
    availableWidth - horizontalPadding * 2,
    availableHeight - verticalPadding * 2,
  )
  if (!Number.isFinite(side) || side <= 0) return 0
  return Math.round(side)
}

/** 封面圆角：随边长等比，最大 26，避免小封面出现「药丸」感 */
export const getCoverRadius = (size: number) => {
  if (!Number.isFinite(size) || size <= 0) return 0
  return Math.min(Math.round(size * 0.09), 26)
}
