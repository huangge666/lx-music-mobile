import { clearPlayedList } from './playedList'

/**
 * 过滤列表中已播放的歌曲
 */
export const filterMusicList = ({ playedList, listId, list, playerMusicInfo }: {
  /**
   * 已播放列表
   */
  playedList: LX.Player.PlayMusicInfo[] | readonly LX.Player.PlayMusicInfo[]
  /**
   * 列表id
   */
  listId: string
  /**
   * 播放列表
   */
  list: Array<LX.Music.MusicInfo | LX.Download.ListItem>
  /**
   * 下载目录
   */
  // savePath: string
  /**
   * 播放器内当前歌曲（`playInfo.playerPlayIndex`指向的歌曲）
   */
  playerMusicInfo?: LX.Music.MusicInfo | LX.Download.ListItem

}) => {
  let playerIndex = -1

  let canPlayList: Array<LX.Music.MusicInfo | LX.Download.ListItem> = []
  // 随机播放时 playedList 会持续增长，使用 Set 将逐曲 findIndex 降为 O(1)，
  // 避免大歌单切歌时反复扫描已播放历史造成卡顿。
  const filteredPlayedIds = new Set(
    playedList
      .filter(pmInfo => pmInfo.listId == listId && !pmInfo.isTempPlay)
      .map(({ musicInfo }) => musicInfo.id),
  )
  const filteredList: Array<LX.Music.MusicInfo | LX.Download.ListItem> = list.filter(s => {
    // if (!assertApiSupport(s.source)) return false
    if ('progress' in s) {
      if (!s.isComplate) return false
    }

    canPlayList.push(s)

    if (filteredPlayedIds.has(s.id)) {
      filteredPlayedIds.delete(s.id)
      return false
    }
    return true
  })
  if (playerMusicInfo) {
    playerIndex = (filteredList.length ? filteredList : canPlayList).findIndex(m => m.id == playerMusicInfo.id)
  }
  return {
    filteredList,
    canPlayList,
    playerIndex,
  }
}

/**
 * 过滤列表中已播放的歌曲
 */
export const filterList = async({ playedList, listId, list, playerMusicInfo }: {
  playedList: LX.Player.PlayMusicInfo[] | readonly LX.Player.PlayMusicInfo[]
  listId: string
  list: Array<LX.Music.MusicInfo | LX.Download.ListItem>
  playerMusicInfo?: LX.Music.MusicInfo | LX.Download.ListItem
}) => {
  // if (this.list.listName === null) return
  // console.log(isCheckFile)
  let { filteredList, canPlayList, playerIndex } = filterMusicList({
    listId,
    list,
    playedList,
    // savePath: global.lx.setting['download.savePath'],
    playerMusicInfo,
  })

  if (!filteredList.length && playedList.length) {
    clearPlayedList()
    return { filteredList: canPlayList, playerIndex }
  }
  return { filteredList, playerIndex }
}

