import { getRandom } from '@/utils/common'

interface ShuffleCache {
  listId: string
  order: string[]
  orderSet: Set<string>
}

let cache: ShuffleCache | null = null

const shuffleIds = (ids: string[]) => {
  const next = [...ids]
  for (let i = next.length - 1; i > 0; i--) {
    const j = getRandom(0, i + 1)
    const current = next[i]
    next[i] = next[j]
    next[j] = current
  }
  return next
}

/**
 * 未播歌曲的稳定随机顺序：同一批剩余歌曲保持顺序，
 * 切歌后只从队列头部取走已播歌曲，保证「当前播放」列表与下一首一致
 */
export const getShuffledIds = (listId: string, remainingIds: string[]): string[] => {
  const remainingSet = new Set(remainingIds)

  const currentCache = cache
  if (currentCache?.listId === listId) {
    const kept = currentCache.order.filter(id => remainingSet.has(id))
    const added = remainingIds.filter(id => !currentCache.orderSet.has(id))

    // 集合未变化时仅返回当前剩余歌曲，避免每次切歌都排序并拼接整份签名字符串。
    if (!added.length && kept.length === remainingIds.length) return kept

    // 保留原有随机顺序，新加入的歌曲只追加到队尾并随机化，避免已播歌曲变化时重排整队。
    const order = kept.concat(shuffleIds(added))
    cache = { listId, order, orderSet: new Set(order) }
    return order
  }

  const order = shuffleIds(remainingIds)
  cache = { listId, order, orderSet: new Set(order) }
  return order
}

export const getShuffledRemaining = <T extends { id: string }>(listId: string, remaining: T[]): T[] => {
  const byId = new Map(remaining.map(item => [item.id, item]))
  return getShuffledIds(listId, remaining.map(item => item.id))
    .map(id => byId.get(id))
    .filter((item): item is T => !!item)
}

export const pickShuffledNextIndex = (listId: string, filteredList: Array<{ id: string }>): number => {
  if (!filteredList.length) return -1
  const nextId = getShuffledIds(listId, filteredList.map(item => item.id))[0]
  const index = filteredList.findIndex(item => item.id === nextId)
  return index < 0 ? 0 : index
}

/**
 * 手动点到随机队列中的某首歌后，把该曲之后的未播歌曲提前，其前未播歌曲挪到队尾。
 * 避免下一首又从队列头部把「点过的歌前面那些」按原顺序重播一遍。
 */
export const jumpShuffleQueue = (listId: string, musicId: string) => {
  const currentCache = cache
  if (!currentCache || currentCache.listId !== listId) return
  const idx = currentCache.order.indexOf(musicId)
  if (idx < 0) return
  const order = currentCache.order.slice(idx + 1).concat(currentCache.order.slice(0, idx))
  cache = { listId, order, orderSet: new Set(order) }
}
