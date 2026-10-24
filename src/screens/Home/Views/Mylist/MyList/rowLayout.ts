/**
 * 资料库列表的几何计算（纯函数）。
 *
 * 行高同时被渲染与 `getItemLayout` 使用：封面尺寸、两行文字、上下留白三者取最大，
 * 大字号下文字块变高时整行一起变高，不会出现「文字被裁掉但定位仍按旧行高」的问题。
 */
export interface LibraryRowInput {
  /** 封面边长（已按设计值换算） */
  coverSize: number
  /** 行高设计下限 */
  minRowHeight: number
  /** 行内上下留白（单侧） */
  verticalPadding: number
  /** 标题行高（已按应用字号换算） */
  titleLineHeight: number
  /** 副标题行高（已按应用字号换算） */
  metaLineHeight: number
  /** 标题与副标题的间距 */
  metaGap: number
}

export const getLibraryRowHeight = ({
  coverSize,
  minRowHeight,
  verticalPadding,
  titleLineHeight,
  metaLineHeight,
  metaGap,
}: LibraryRowInput) => {
  const safeCover = Math.max(coverSize, 0)
  const safePadding = Math.max(verticalPadding, 0)
  const textBlock = Math.max(titleLineHeight, 0) + Math.max(metaGap, 0) + Math.max(metaLineHeight, 0)
  return Math.max(
    Math.max(minRowHeight, 0),
    safeCover + safePadding * 2,
    textBlock + safePadding * 2,
  )
}
