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


export const search = async(text: string, page: number, sourceId: Source, onPartial?: (list: LX.Music.MusicInfoOnline[]) => void): Promise<LX.Music.MusicInfoOnline[]> => {
  const listInfo = searchMusicState.listInfos[sourceId]!
  if (!text) return []
  const key = `${page}__${text}`
  if (sourceId == 'all') {
    listInfo.key = key
    setSearchText(text)
    setSource(sourceId)
    // 先到先展示：每个源的结果一返回就合并渲染，不再被最慢的源拖住整页空白。
    // 到达的结果按到达顺序累积；store 的 setLists 每次都会从原始（旧格式）数据
    // 重新转换并全量合并，重复调用是幂等的（toNewMusicInfo 非幂等，不能对已转换条目二次转换）。
    const results: SearchResult[] = []
    let task = []
    for (const source of searchMusicState.sources) {
      if (source == 'all') continue
      task.push(((musicSdk[source]?.musicSearch.search(text, page, searchMusicState.listInfos.all.limit) as Promise<SearchResult>) ?? Promise.reject(new Error('source not found: ' + source))).catch((error: any) => {
        console.log(error)
        return {
          allPage: 1,
          limit: 30,
          list: [],
          source,
          total: 0,
        }
      }).then((result: SearchResult) => {
        // 搜索条件已变化时丢弃过期结果
        if (key != listInfo.key) return
        results.push(result)
        // 失败的源返回空列表，跳过无效的重复渲染
        if (onPartial && result.list.length) onPartial(setListInfo([...results], page, text))
      }))
    }
    return Promise.all(task).then(() => {
      if (key != listInfo.key) return []
      return setListInfo(results, page, text)
    })
  } else {
    if (listInfo?.key == key && listInfo?.list.length) return listInfo?.list
    listInfo.key = key
    return (musicSdk[sourceId]?.musicSearch.search(text, page, listInfo.limit).then((data: SearchResult) => {
      if (key != listInfo.key) return []
      return setListInfo(data, page, text)
    }) ?? Promise.reject(new Error('source not found: ' + sourceId))).catch((err: any) => {
      if (listInfo.list.length && page == 1) clearListInfo(sourceId)
      throw err
    })
  }
}

