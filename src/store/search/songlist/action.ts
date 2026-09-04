import type { InitState, ListInfoItem, Source } from './state'
import state from './state'

export interface SearchResult {
  list: ListInfoItem[]
  limit: number
  total: number
  source: LX.OnlineSource
}


/**
 * 按搜索关键词重新排序列表（轻量分级规则）
 * 不再对每条结果做 Levenshtein 编辑距离（O(n·m)），改为 O(n) 的分级匹配：
 *   2 = 歌单名与关键词完全一致
 *   1 = 歌单名包含关键词
 *   0 = 其余（保持源返回顺序）
 * 同级内依赖 sort 的稳定性保持原有相对顺序。
 * @param list 歌单列表
 * @param keyword 搜索关键词
 * @returns 排序后的列表
 */
const handleSortList = (list: ListInfoItem[], keyword: string) => {
  const kw = keyword.trim().toLowerCase()
  if (!kw) return list
  return list
    .map(item => {
      const name = item.name?.toLowerCase?.() ?? ''
      let score = 0
      if (name == kw) score = 2
      else if (name.includes(kw)) score = 1
      return { item, score }
    })
    .sort((a, b) => b.score - a.score)
    .map(s => s.item)
}

/** 按 id 去重（保留首次出现的位置），支撑增量合并与翻页不出现重复项 */
const deduplicationSonglist = (list: ListInfoItem[]): ListInfoItem[] => {
  const ids = new Set<string>()
  return list.filter(item => {
    if (ids.has(item.id)) return false
    ids.add(item.id)
    return true
  })
}


let maxTotals: Partial<Record<LX.OnlineSource, number>> = {

}
const setLists = (results: SearchResult[], page: number, text: string): ListInfoItem[] => {
  let totals = []
  let limit = 0
  let list = []
  for (const source of results) {
    list.push(...source.list)
    totals.push(source.total)
    maxTotals[source.source] = source.total
    state.maxPages[source.source] = Math.ceil(source.total / source.limit)
    limit = Math.max(source.limit, limit)
  }

  let listInfo = state.listInfos.all
  const total = Math.max(0, ...totals)
  if (page == 1 || (total && list.length)) listInfo.total = total
  else listInfo.total = limit * page
  listInfo.page = page
  list = handleSortList(list, text)
  // 增量合并（先到先展示）时同一页会被多次合并，去重避免重复项
  listInfo.list = page > 1 ? deduplicationSonglist([...listInfo.list, ...list]) : list
  state.source = 'all'
  return listInfo.list
}

const setList = (datas: SearchResult, page: number, text: string): ListInfoItem[] => {
  // console.log(datas.source, datas.list)
  let listInfo = state.listInfos[datas.source]!
  listInfo.list = page == 1 ? datas.list : [...listInfo.list, ...datas.list]
  if (page == 1 || (datas.total && datas.list.length)) listInfo.total = datas.total
  else listInfo.total = datas.limit * page
  listInfo.page = page
  listInfo.limit = datas.limit
  state.source = datas.source
  return listInfo.list
}


export default {
  setSource(source: InitState['source']) {
    state.source = source
  },
  setSearchText(searchText: InitState['searchText']) {
    state.searchText = searchText
  },
  setListInfo(result: SearchResult | SearchResult[], page: number, text: string) {
    if (Array.isArray(result)) {
      return setLists(result, page, text)
    } else {
      return setList(result, page, text)
    }
  },
  clearListInfo(sourceId: Source) {
    let listInfo = state.listInfos[sourceId]!
    listInfo.page = 1
    listInfo.limit = 20
    listInfo.total = 0
    listInfo.list = []
    listInfo.key = null
    listInfo.tagId = ''
    listInfo.sortId = ''
  },
}
