import { setListUpdateTime } from '@/utils/data'
import { overwriteListMusics, setFetchingListStatus } from './list'
import { getListDetailAll } from '@/core/songlist'

const fetchList = async(id: string, source: LX.OnlineSource, sourceListId: string) => {
  // 旧排行榜收藏保留本地歌曲，但精简版不再请求排行榜接口。
  if (sourceListId.startsWith('board__')) throw new Error(global.i18n.t('list_refresh_unavailable'))
  setFetchingListStatus(id, true)
  // 收藏歌单存 source__id，早期导入存纯 id；两种格式都还原成平台歌单 id。
  const prefix = `${source}__`
  const playlistId = sourceListId.startsWith(prefix) ? sourceListId.slice(prefix.length) : sourceListId
  return getListDetailAll(source, playlistId, true).finally(() => {
    setFetchingListStatus(id, false)
  })
}

export default async(targetListInfo: LX.List.UserListInfo) => {
  if (!targetListInfo.source || !targetListInfo.sourceListId) return
  const list = await fetchList(targetListInfo.id, targetListInfo.source, targetListInfo.sourceListId)
  // 更新成功包含落盘；保存失败不能提示成功或推进最后更新时间。
  await overwriteListMusics(targetListInfo.id, list)
  const now = Date.now()
  await setListUpdateTime(targetListInfo.id, now)
}
