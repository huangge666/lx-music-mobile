import { useCallback, useEffect, useRef, useState } from 'react'

import { setTempList } from '@/core/list'
import { updateSetting } from '@/core/common'
import { playList } from '@/core/player/player'
import { getListDetailAll } from '@/core/songlist'
import { LIST_IDS, MUSIC_TOGGLE_MODE } from '@/config/constant'
import { useMyList } from '@/store/list/hook'
import songlistState, { type ListInfoItem } from '@/store/songlist/state'
import { useSettingValue } from '@/store/setting/hook'
import { toast } from '@/utils/tools'
import { getShuffleStartIndex } from '@/utils/shuffle'
import { handleCollect, handlePlay } from './listAction'

export const getSonglistId = (id: string, source: LX.OnlineSource) => `${source}__${id}`

export interface PlaylistActions {
  isCollected: boolean
  busy: boolean
  shuffleActive: boolean
  play: () => void
  shuffle: () => void
  collect: () => void
}

/**
 * 在线歌单详情的动作层：普通播放沿用现有逻辑，随机走真实随机模式。
 *
 * 随机不能用「先播第一首，再把播放模式换个图标」冒充：
 * 先用现有完整歌单能力取全量列表，成功后才切到 random 模式并用随机起点开播；
 * 取不到内容、页面已离开或重复点击时都不改播放模式、不动当前队列。
 */
export const usePlaylistActions = (info: ListInfoItem | undefined): PlaylistActions => {
  const lists = useMyList()
  const togglePlayMethod = useSettingValue('player.togglePlayMethod')
  const [busy, setBusy] = useState(false)
  const busyRef = useRef(false)
  const isMountedRef = useRef(true)

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  const listId = info ? getSonglistId(info.id, info.source) : ''
  const isCollected = !!info && lists.some(list => 'sourceListId' in list && (list.sourceListId == listId || list.sourceListId == info.id))

  const play = useCallback(() => {
    if (!info || busyRef.current) return
    // 详情数据还没就绪时不抢播，保留当前播放状态
    if (!songlistState.listDetailInfo.info.name) return
    void handlePlay(info.id, info.source, songlistState.listDetailInfo.list)
  }, [info])

  const collect = useCallback(() => {
    if (!info) return
    if (!songlistState.listDetailInfo.info.name) return
    void handleCollect(info.id, info.source, songlistState.listDetailInfo.info.name || info.name)
  }, [info])

  const shuffle = useCallback(() => {
    if (!info || busyRef.current) return
    if (!songlistState.listDetailInfo.info.name) return
    const targetId = info.id
    const targetSource = info.source
    const targetListId = getSonglistId(targetId, targetSource)
    busyRef.current = true
    setBusy(true)
    void getListDetailAll(targetSource, targetId).then(async(fullList) => {
      if (!fullList.length) throw new Error('empty songlist')
      // 请求期间页面已离开（返回或切到别的歌单）时不抢播
      if (!isMountedRef.current) return
      await setTempList(targetListId, [...fullList])
      if (!isMountedRef.current) return
      updateSetting({ 'player.togglePlayMethod': MUSIC_TOGGLE_MODE.random })
      await playList(LIST_IDS.TEMP, getShuffleStartIndex(fullList.length))
    }).catch((err: unknown) => {
      console.error(err)
      if (isMountedRef.current) toast(global.i18n.t('playlist_shuffle_failed'))
    }).finally(() => {
      busyRef.current = false
      if (isMountedRef.current) setBusy(false)
    })
  }, [info])

  return {
    isCollected,
    busy,
    shuffleActive: togglePlayMethod == MUSIC_TOGGLE_MODE.random,
    play,
    shuffle,
    collect,
  }
}
