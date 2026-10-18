/**
 * 本地歌单没有封面字段。
 *
 * `LX.List.UserListInfo` 只有 name / source / sourceListId，没有 cover，也没有 createdAt，
 * 因此不能伪造封面地址或「最近添加」时间。这里按稳定 id 派生固定色相作为封面占位艺术：
 * 同一歌单每次渲染颜色一致，颜色只属于封面插图，不承担主题语义角色，
 * 亮度选在深浅主题下都能承住浅色文字的范围。
 */
const TINT_HUES = [6, 22, 38, 58, 96, 142, 166, 190, 214, 242, 268, 296, 322, 344]

const hashSeed = (seed: string) => {
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    // 与 31 相乘并保持 32 位整数，字符串再长也不会溢出成浮点
    hash = (hash * 31 + seed.charCodeAt(i)) | 0
  }
  return Math.abs(hash)
}

export interface CoverTint {
  backgroundColor: string
  color: string
}

export const getPlaylistCoverTint = (seed: string): CoverTint => {
  const hue = TINT_HUES[hashSeed(seed ?? '') % TINT_HUES.length]
  return {
    backgroundColor: `hsl(${hue}, 46%, 42%)`,
    color: '#F7F7F9',
  }
}

/** 首字：跳过空白与前后符号，取第一个可见字符，读不出字符时不显示占位文字 */
export const getPlaylistInitial = (name: string) => {
  const text = (name ?? '').trim()
  if (!text) return ''
  const chars = Array.from(text)
  return (chars[0] ?? '').toUpperCase()
}
