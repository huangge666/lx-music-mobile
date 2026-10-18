/**
 * 随机播放的起始位置。
 *
 * 随机模式由播放内核按 `player.togglePlayMethod` 承担，这里只负责挑第一首：
 * 调用方必须在切换到 random 模式后用本函数取到的索引发起播放，否则只是「随机第一首、之后顺序播」。
 * 长度异常（空歌单、负数、NaN）返回 0，正常长度下结果永远落在 [0, length - 1]。
 */
export const getShuffleStartIndex = (length: number, random: () => number = Math.random): number => {
  if (!Number.isFinite(length) || length <= 0) return 0
  const size = Math.floor(length)
  const value = Math.floor(random() * size)
  if (!Number.isFinite(value)) return 0
  return Math.min(Math.max(value, 0), size - 1)
}
