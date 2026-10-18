/**
 * 播放进度相关的数值归一（纯函数）。
 *
 * 进度条与时间文字的消费者都会把 store 里的原始数值直接用进样式和文案，
 * 取链失败、时长未知或计时器抖动时可能出现 NaN / Infinity，
 * 一旦写进 `width: 'NaN%'` 或时间文案就会显示成 NaN，所以在所有入口先归一。
 */

/** 进度比例：非法值当 0，并收敛到 0~1 */
export const safeProgressRatio = (value: number) => {
  if (!Number.isFinite(value)) return 0
  if (value <= 0) return 0
  if (value >= 1) return 1
  return value
}

/** 时间（秒）：非法值或负数当 0 */
export const safePlayTime = (value: number) => {
  if (!Number.isFinite(value)) return 0
  return value > 0 ? value : 0
}

/** 剩余时长（秒）：已播放时间先夹到总时长内，结果不会为负、也不会出现 NaN */
export const getRemainTime = (total: number, played: number) => {
  const duration = safePlayTime(total)
  const current = Math.min(safePlayTime(played), duration)
  return Math.max(0, duration - current)
}
