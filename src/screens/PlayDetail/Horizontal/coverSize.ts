/**
 * 横屏播放页封面几何（Phase 6B）
 *
 * 与竖屏 `Vertical/coverSize.ts` 同一套思路：设计比例值只作为上限，
 * 实际尺寸取「容器实测可用空间」与上限的较小值，短屏/大字号时封面收缩，
 * 不会把播放控制挤出屏幕。
 *
 * 之前直接按窗口比例算高度（0.66 × 可用高），在 360dp 左右高的横屏上
 * 封面想占 194dp，而左栏留给「更多按钮 + 封面 + 播放控制」的空间不足，
 * 结果底部控制被裁掉。这里改成由父容器实测高度决定。
 */

export interface CoverBox {
  width: number
  height: number
}

/**
 * @param box 封面容器实测尺寸（0 表示还没测量到）
 * @param designCap 设计上限（窗口比例 × 字号补偿后的值）
 * @param minSize 最小兜底尺寸，避免测量抖动时归零
 */
export const getHorizontalCoverSize = (box: CoverBox, designCap: number, minSize = 48): number => {
  const cap = Number.isFinite(designCap) && designCap > 0 ? designCap : 0
  const available = Math.min(box.width, box.height)
  if (!Number.isFinite(available) || available <= 0) return cap
  // 实测空间比设计值大时保持设计值，小时按实测收缩
  const size = cap > 0 ? Math.min(available, cap) : available
  return Math.max(size, Math.min(minSize, available))
}
