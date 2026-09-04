import state, { type InitState, type Source } from './state'
import { arrPush } from '@/utils/common'
import { deduplicationList, toNewMusicInfo } from '@/utils'


export interface SearchResult {
  list: LX.Music.MusicInfoOnline[]
  allPage: number
  limit: number
  total: number
  source: LX.OnlineSource
}


/**
 * 按搜索关键词重新排序列表（轻量分级规则）
 * 不再对每条结果做 Levenshtein 编辑距离（O(n·m)），改为 O(n) 的分级匹配：
 *   4 = 歌名与关键词完全一致
 *   3 = 歌手与关键词完全一致
 *   2 = 歌名包含关键词
 *   1 = 歌手包含关键词
 *   0 = 其余（保持源返回顺序）
 * 同级内依赖 sort 的稳定性保持原有相对顺序。
 * @param list 歌曲列表
 * @param keyword 搜索关键词
 * @returns 排序后的列表
 */
const handleSortList = (list: LX.Music.MusicInfoOnline[], keyword: string) => {
  const kw = keyword.trim().toLowerCase()
  if (!kw) return list
  return list
    .map(item => {
      const name = item.name?.toLowerCase?.() ?? ''
      const singer = item.singer?.toLowerCase?.() ?? ''
      let score = 0
      if (name == kw) score = 4
      else if (singer == kw) score = 3
      else if (name.includes(kw)) score = 2
      else if (singer.includes(kw)) score = 1
      return { item, score }
    })
    .sort((a, b) => b.score - a.score)
    .map(s => s.item)
}


const setLists = (results: SearchResult[], page: number, text: string): LX.Music.MusicInfoOnline[] => {
  let pages = []
  let totals = []
  let limit = 0
  let list = [] as LX.Music.MusicInfoOnline[]
  for (const source of results) {
    state.maxPages[source.source] = source.allPage
    limit = Math.max(source.limit, limit)
    if (source.allPage < page) continue
    arrPush(list, source.list)
    pages.push(source.allPage)
    totals.push(source.total)
  }
  list = handleSortList(list.map(s => toNewMusicInfo(s) as LX.Music.MusicInfoOnline), text)
  let listInfo = state.listInfos.all
  listInfo.maxPage = Math.max(0, ...pages)
  const total = Math.max(0, ...totals)
  if (page == 1 || (total && list.length)) listInfo.total = total
  else listInfo.total = limit * page
  // listInfo.limit = limit
  listInfo.page = page
  listInfo.list = deduplicationList(page > 1 ? [...listInfo.list, ...list] : list)
  state.source = 'all'

  return listInfo.list
}

const setList = (datas: SearchResult, page: number, text: string): LX.Music.MusicInfoOnline[] => {
  // console.log(datas.source, datas.list)
  let listInfo = state.listInfos[datas.source]!
  const list = datas.list.map(s => toNewMusicInfo(s) as LX.Music.MusicInfoOnline)
  listInfo.list = deduplicationList(page == 1 ? list : [...listInfo.list, ...list])
  if (page == 1 || (datas.total && datas.list.length)) listInfo.total = datas.total
  else listInfo.total = datas.limit * page
  listInfo.maxPage = datas.allPage
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
    listInfo.list = []
    listInfo.page = 0
    listInfo.maxPage = 0
    listInfo.total = 0
  },
}
