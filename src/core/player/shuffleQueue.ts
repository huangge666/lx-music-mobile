import { getRandom } from '@/utils/common'

interface ShuffleCache {
  listId: string
  signature: string
  order: string[]
}

let cache: ShuffleCache | null = null

const toSignature = (ids: string[]) => [...ids].sort().join('\0')

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
  const signature = toSignature(remainingIds)

  if (cache?.listId === listId && cache.signature === signature) {
    return cache.order.filter(id => remainingSet.has(id))
  }

  if (cache?.listId === listId) {
    const kept = cache.order.filter(id => remainingSet.has(id))
    const keptSet = new Set(kept)
    const added = remainingIds.filter(id => !keptSet.has(id))
    const order = kept.concat(shuffleIds(added))
    cache = { listId, signature, order }
    return order
  }

  const order = shuffleIds(remainingIds)
  cache = { listId, signature, order }
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
