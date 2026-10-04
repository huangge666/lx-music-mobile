import { addListMusics, removeListMusics, updateListMusicPosition } from '@/core/list'
import listState from '@/store/list/state'
import { getListMusicSync } from '@/utils/listManage'

/** 只保存被移除的一首歌及相邻锚点，撤销不覆盖整张歌单或同期的同步修改。 */
export const removeMusicWithUndo = async(listId: string, musicInfo: LX.Music.MusicInfo): Promise<() => Promise<void>> => {
  const list = getListMusicSync(listId)
  const index = list.findIndex(item => item.id == musicInfo.id)
  if (index < 0) throw new Error('Song is no longer in the playlist')
  const saved = list[index]
  const beforeId = list[index - 1]?.id
  const afterId = list[index + 1]?.id
  await removeListMusics(listId, [saved.id])

  const status = { restored: false, added: false }
  let inFlight: Promise<void> | null = null
  const restore = async() => {
    if (status.restored) return
    if (!listState.allList.some(item => item.id == listId) && listId != listState.tempList.id) {
      throw new Error(global.i18n.t('list_undo_list_missing'))
    }
    // 用户或同步已重新加回歌曲时，不重复添加，也不改变对方选择的位置。
    if (!status.added && getListMusicSync(listId).some(item => item.id == saved.id)) {
      status.restored = true
      return
    }
    if (!status.added) {
      await addListMusics(listId, [saved], 'bottom')
      status.added = true
    }
    const current = getListMusicSync(listId).filter(item => item.id != saved.id)
    const afterIndex = current.findIndex(item => item.id == afterId)
    const beforeIndex = current.findIndex(item => item.id == beforeId)
    const position = afterIndex >= 0 ? afterIndex : beforeIndex >= 0 ? beforeIndex + 1 : Math.min(index, current.length)
    await updateListMusicPosition(listId, position, [saved.id])
    status.restored = true
  }
  // 连点共享同一次恢复；失败后允许重试，不再次添加已成功恢复的歌曲。
  return async() => {
    inFlight ??= restore().finally(() => { inFlight = null })
    await inFlight
  }
}
