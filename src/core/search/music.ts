import searchMusicState, { type Source } from '@/store/search/music/state'
import searchMusicActions, { type SearchResult } from '@/store/search/music/action'
import musicSdk from '@/utils/musicSdk'

export const setSource: typeof searchMusicActions['setSource'] = (source) => {
  searchMusicActions.setSource(source)
}
export const setSearchText: typeof searchMusicActions['setSearchText'] = (text) => {
  searchMusicActions.setSearchText(text)
}
export const setListInfo: typeof searchMusicActions.setListInfo = (result, id, page) => {
  return searchMusicActions.setListInfo(result, id, page)
}
export const clearListInfo: typeof searchMusicActions.clearListInfo = (source) => {
  searchMusicActions.clearListInfo(source)
}

let requestId = 0

export const search = async(text: string, page: number, sourceId: Source, onPartial?: (list: LX.Music.MusicInfoOnline[]) => void, onSourceErrors?: (count: number) => void, force = false): Promise<LX.Music.MusicInfoOnline[]> => {
  const currentRequest = ++requestId
  const listInfo = searchMusicState.listInfos[sourceId]!
  if (!text) return []
  const key = `${page}__${text}`
  // 同关键词重试、切换音源也会产生新请求，不能只靠关键词过滤过期回包。
  const isCurrent = () => currentRequest == requestId
  if (!force && sourceId != 'all' && listInfo.key == key && listInfo.list.length) {
    setSearchText(text)
    setSource(sourceId)
    return listInfo.list
  }
  setSearchText(text)
  setSource(sourceId)
  if (sourceId == 'all') {
    // 每个源先到先展示；setListInfo 每次从原始数据重算，避免重复转换歌曲。
    const results: SearchResult[] = []
    let failedSources = 0
    const sources = searchMusicState.sources.filter(source => source != 'all')
    const task = sources.map(async(source) => {
      const result = await Promise.resolve().then(async() => {
        const api = musicSdk[source]?.musicSearch
        if (!api) throw new Error('source not found: ' + source)
        return await api.search(text, page, listInfo.limit) as SearchResult
      }).catch((error: unknown): SearchResult => {
        console.log(error)
        failedSources++
        return { allPage: 1, limit: 30, list: [], source, total: 0 }
      })
      if (!isCurrent()) return
      results.push(result)
      if (onPartial && result.list.length) onPartial(setListInfo([...results], page, text))
    })
    await Promise.all(task)
    if (!isCurrent()) return []
    // 失败不等于零结果；至少一个音源成功，才能进入正常的结束状态。
    if (!task.length || failedSources == task.length) throw new Error('All search sources failed')
    onSourceErrors?.(failedSources)
    return setListInfo(results, page, text)
  }
  try {
    const api = musicSdk[sourceId]?.musicSearch
    if (!api) throw new Error('source not found: ' + sourceId)
    const data = await api.search(text, page, listInfo.limit) as SearchResult
    if (!isCurrent()) return []
    // 缓存键只对应成功数据，不能让正在请求的新关键词命中上一轮旧列表。
    listInfo.key = key
    return setListInfo(data, page, text)
  } catch (err) {
    if (!isCurrent()) return []
    if (listInfo.list.length && page == 1) clearListInfo(sourceId)
    throw err
  }
}
