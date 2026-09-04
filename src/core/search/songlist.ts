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


export const search = async(text: string, page: number, sourceId: Source, onPartial?: (list: ListInfoItem[]) => void): Promise<ListInfoItem[]> => {
  const listInfo = searchSonglistState.listInfos[sourceId]!
  // if (!text) return []
  const key = `${page}__${sourceId}__${text}`
  if (listInfo.key == key && listInfo.list.length) return listInfo.list
  if (sourceId == 'all') {
    listInfo.key = key
    setSearchText(text)
    setSource(sourceId)
    // 先到先展示：每个源的结果一返回就合并渲染，不再被最慢的源拖住整页空白。
    // store 的 setLists 每次都全量重算并按 id 去重，重复调用是幂等的。
    const results: SearchResult[] = []
    let task = []
    for (const source of searchSonglistState.sources) {
      if (source == 'all' || (page > 1 && page > (searchSonglistState.maxPages[source]!))) continue
      task.push(((musicSdk[source]?.songList.search(text, page, searchSonglistState.listInfos.all.limit) as Promise<SearchResult>) ?? Promise.reject(new Error('source not found: ' + source))).catch((error: any) => {
        console.log(error)
        return {
          list: [],
          total: 0,
          limit: searchSonglistState.listInfos.all.limit,
          source,
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
    return ((musicSdk[sourceId]?.songList.search(text, page, listInfo.limit) as Promise<SearchResult>).then((data: SearchResult) => {
      if (key != listInfo.key) return []
      return setListInfo(data, page, text)
    }) ?? Promise.reject(new Error('source not found: ' + sourceId))).catch((err: any) => {
      if (listInfo.list.length && page == 1) clearListInfo(sourceId)
      throw err
    })
  }
}
