import { createList } from '@/core/list'
import { getListDetail, getListDetailAll } from '@/core/songlist'
import updateImportedList from '@/core/updateImportedList'
import { confirmDialog, toMD5 } from '@/utils/tools'
import listState from '@/store/list/state'
import { type Source } from '@/store/songlist/state'
import { getSonglistId, isImportedSonglist, normalizeSonglistId } from '@/utils/songlistId'

/**
 * 把在线歌单导入“我的列表”
 * 与歌单详情页的收藏（handleCollect）同款逻辑，区别在于这里没有现成的歌单名，
 * 需要先拉取第一页详情获取歌单名称，再拉取全量歌曲创建本地列表。
 */
export const handleImportSonglist = async(id: string, source: Source) => {
  id = normalizeSonglistId(id, source)
  const sourceListId = getSonglistId(id, source)
  const targetList = listState.userList.find(l => isImportedSonglist(l, id, source))
  if (targetList) {
    const confirm = await confirmDialog({
      message: global.i18n.t('duplicate_list_tip', { name: targetList.name }),
      cancelButtonText: global.i18n.t('cancel'),
      confirmButtonText: global.i18n.t('confirm_button_text'),
    })
    if (!confirm) return false
    await updateImportedList(targetList)
    return true
  }

  const detail = await getListDetail(id, source, 1)
  const list = await getListDetailAll(source, id)
  if (!list.length) throw new Error('empty songlist')

  await createList({
    name: detail.info?.name ?? sourceListId,
    id: `${source}_${toMD5(sourceListId)}`,
    list,
    source,
    sourceListId,
  })
  return true
}
