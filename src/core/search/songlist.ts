import searchSonglistState, { type Source, type ListInfoItem } from '@/store/search/songlist/state'
import searchSonglistActions, { type SearchResult } from '@/store/search/songlist/action'
import musicSdk from '@/utils/musicSdk'

export const setSource: typeof searchSonglistActions['setSource'] = (source) => {
  searchSonglistActions.setSource(source)
}
export const setSearchText: typeof searchSonglistActions['setSearchText'] = (text) => {
  searchSonglistActions.setSearchText(text)
}
const setListInfo: typeof searchSonglistActions.setListInfo = (result, page, text) => {
  return searchSonglistActions.setListInfo(result, page, text)
}
export const clearListInfo: typeof searchSonglistActions.clearListInfo = (source) => {
  searchSonglistActions.clearListInfo(source)
}

let requestId = 0

export const search = async(text: string, page: number, sourceId: Source, onPartial?: (list: ListInfoItem[]) => void, onSourceErrors?: (count: number) => void, force = false): Promise<ListInfoItem[]> => {
  const currentRequest = ++requestId
  const listInfo = searchSonglistState.listInfos[sourceId]!
  if (!text) return []
  const key = `${page}__${sourceId}__${text}`
  const isCurrent = () => currentRequest == requestId
  if (!force && sourceId != 'all' && listInfo.key == key && listInfo.list.length) {
    setSearchText(text)
    setSource(sourceId)
    return listInfo.list
  }
  setSearchText(text)
  setSource(sourceId)
  if (sourceId == 'all') {
    const results: SearchResult[] = []
    let failedSources = 0
    const sources = searchSonglistState.sources.filter((source): source is Exclude<Source, 'all'> => source != 'all' && !(page > 1 && page > searchSonglistState.maxPages[source]!))
    const task = sources.map(async(source) => {
      const result = await Promise.resolve().then(async() => {
        const api = musicSdk[source]?.songList
        if (!api) throw new Error('source not found: ' + source)
        return await api.search(text, page, listInfo.limit) as SearchResult
      }).catch((error: unknown): SearchResult => {
        console.log(error)
        failedSources++
        return { list: [], total: 0, limit: listInfo.limit, source }
      })
      if (!isCurrent()) return
      results.push(result)
      if (onPartial && result.list.length) onPartial(setListInfo([...results], page, text))
    })
    await Promise.all(task)
    if (!isCurrent()) return []
    // 已全部翻到底不属于错误；真正发出的请求全部失败时才进入重试状态。
    if ((!task.length && page == 1) || (task.length > 0 && failedSources == task.length)) throw new Error('All search sources failed')
    onSourceErrors?.(failedSources)
    return setListInfo(results, page, text)
  }
  try {
    const api = musicSdk[sourceId]?.songList
    if (!api) throw new Error('source not found: ' + sourceId)
    const data = await api.search(text, page, listInfo.limit) as SearchResult
    if (!isCurrent()) return []
    listInfo.key = key
    return setListInfo(data, page, text)
  } catch (err) {
    if (!isCurrent()) return []
    if (listInfo.list.length && page == 1) clearListInfo(sourceId)
    throw err
  }
}
