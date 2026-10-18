/**
 * 资料库封面网格的几何计算。
 *
 * 渲染与定位必须来自同一份计算：卡片高度 = 封面（正方形）+ 单行标题 + 一行歌曲数，
 * 行高再加行间距，`getItemLayout` 用的是同一个 rowHeight，避免出现「猜出来的行高」。
 * 这里只做纯计算，输入由调用方测量/给定，方便回归测试。
 */
export interface LibraryGridInput {
  width: number
  contentPadding: number
  columnGap: number
  minCardWidth: number
  rowSpacing: number
  titleBlockHeight: number
  metaBlockHeight: number
}

export interface LibraryGridMetrics {
  columns: number
  cardWidth: number
  cardHeight: number
  rowHeight: number
  contentPadding: number
  columnGap: number
  rowSpacing: number
}

const MIN_COLUMNS = 2
const MAX_COLUMNS = 8

export const getLibraryGridMetrics = ({
  width,
  contentPadding,
  columnGap,
  minCardWidth,
  rowSpacing,
  titleBlockHeight,
  metaBlockHeight,
}: LibraryGridInput): LibraryGridMetrics => {
  const available = Math.max(width - contentPadding * 2, 0)
  const safeMinWidth = Math.max(minCardWidth, 1)
  const safeGap = Math.max(columnGap, 0)

  let columns = Math.floor((available + safeGap) / (safeMinWidth + safeGap))
  if (!Number.isFinite(columns) || columns < MIN_COLUMNS) columns = MIN_COLUMNS
  if (columns > MAX_COLUMNS) columns = MAX_COLUMNS

  const cardWidth = available > 0
    ? Math.floor((available - safeGap * (columns - 1)) / columns)
    : 0
  // 卡片自身高度：封面（正方形）+ 单行标题块 + 一行歌曲数
  const cardHeight = cardWidth + titleBlockHeight + metaBlockHeight

  return {
    columns,
    cardWidth,
    cardHeight,
    rowHeight: cardHeight + rowSpacing,
    contentPadding,
    columnGap: safeGap,
    rowSpacing,
  }
}
