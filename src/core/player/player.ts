import { isInitialized, initial as playerInitial, isEmpty, setPause, setPlay, setResource, setStop, initTrackInfo } from '@/plugins/player'
import {
  setStatusText,
} from '@/core/player/playStatus'
import playerState from '@/store/player/state'
import settingState from '@/store/setting/state'
import {
  getList,
  setPlayMusicInfo,
  setMusicInfo,
  setPlayListId,
} from '@/core/player/playInfo'
import {
  clearPlayedList,
  addPlayedList,
  removePlayedList,
} from '@/core/player/playedList'
import {
  clearTempPlayeList,
  removeTempPlayList,
} from '@/core/player/tempPlayList'
import { getMusicUrl, getPicPath, getLyricInfo } from '@/core/music'
import { getPlayQuality, handleGetOnlineMusicUrl } from '@/core/music/utils'
import { requestMsg } from '@/utils/message'
import { getRandom } from '@/utils/common'
import { filterList } from './utils'
import { jumpShuffleQueue, pickShuffledNextIndex } from './shuffleQueue'
import BackgroundTimer from 'react-native-background-timer'
import { checkIgnoringBatteryOptimization, checkNotificationPermission, debounceBackgroundTimer } from '@/utils/tools'
import { LIST_IDS } from '@/config/constant'
import { addListMusics, removeListMusics } from '@/core/list'
import { addDislikeInfo } from '@/core/dislikeList'
import { getActiveApiSources, getUserApiHandlers, isUserApiReady } from '@/core/apiSource'
import { toOldMusicInfo } from '@/utils'
import { getMusicUrl as getStoreMusicUrl } from '@/utils/data'
import { checkUrl } from '@/utils/request'
import { isCached } from '@/plugins/player/utils'

// import { checkMusicFileAvailable } from '@renderer/utils/music'

const createDelayNextTimeout = (delay: number) => {
  let timeout: number | null
  const clearDelayNextTimeout = () => {
    // console.log(this.timeout)
    if (timeout) {
      BackgroundTimer.clearTimeout(timeout)
      timeout = null
    }
  }

  const addDelayNextTimeout = () => {
    clearDelayNextTimeout()
    timeout = BackgroundTimer.setTimeout(() => {
      timeout = null
      if (global.lx.isPlayedStop) return
      console.log('delay next timeout timeout', delay)
      void playNext(true)
    }, delay)
  }

  return {
    clearDelayNextTimeout,
    addDelayNextTimeout,
  }
}
const { addDelayNextTimeout, clearDelayNextTimeout } = createDelayNextTimeout(5000)
const { addDelayNextTimeout: addLoadTimeout, clearDelayNextTimeout: clearLoadTimeout } = createDelayNextTimeout(100000)

// 用户主动暂停/停止。自动切歌过程中的 pause 事件不能当成用户暂停，
// 否则后台恢复和 queue-ended 会误判而不切下一首。
let pausedByUser = false
// handlePlay 已开始取链但资源尚未交给播放器。后台 JS 被挂起时靠这个标记恢复。
let waitingPlay = false
let lastAutoToggleAt = 0
// 单次取链的失败重试次数上限：配合 delayRetry（BackgroundTimer）做有界后台重试，
// 避免后台切歌时立即递归在冻结的 JS 上再次失败，也防止 tooManyRequests 无限循环。
let retryFetchCount = 0
const MAX_FETCH_RETRY = 3

const createGettingUrlId = (musicInfo: LX.Music.MusicInfo | LX.Download.ListItem) => {
  const tInfo = 'progress' in musicInfo ? musicInfo.metadata.musicInfo.meta.toggleMusicInfo : musicInfo.meta.toggleMusicInfo
  return `${musicInfo.id}_${tInfo?.id ?? ''}`
}
/**
 * 检查音乐信息是否已更改
 */
const diffCurrentMusicInfo = (curMusicInfo: LX.Music.MusicInfo | LX.Download.ListItem): boolean => {
  // return curMusicInfo !== playerState.playMusicInfo.musicInfo || playerState.isPlay
  return createGettingUrlId(curMusicInfo) != global.lx.gettingUrlId || curMusicInfo.id != playerState.playMusicInfo.musicInfo?.id || playerState.isPlay
}

/**
 * 当前这次取链是否已失效。
 * 刷新当前歌曲 URL（音质切换 / 错误重试）时忽略 isPlay，否则播放中拿到的新地址会被当成过期请求丢掉。
 */
const isMusicUrlRequestInvalid = (musicInfo: LX.Music.MusicInfo | LX.Download.ListItem, isRefresh = false): boolean => {
  if (global.lx.isPlayedStop) return true
  if (createGettingUrlId(musicInfo) != global.lx.gettingUrlId) return true
  if (musicInfo.id != playerState.playMusicInfo.musicInfo?.id) return true
  return isRefresh ? false : playerState.isPlay
}

const getCurrentMusicQuality = (musicInfo: LX.Music.MusicInfo | LX.Download.ListItem, quality?: LX.Quality): LX.Quality | null => {
  if ('progress' in musicInfo) return musicInfo.metadata.quality
  if (musicInfo.source == 'local') return null
  return getPlayQuality(quality ?? settingState.setting['player.playQuality'], musicInfo)
}

let cancelDelayRetry: (() => void) | null = null
const delayRetry = async(musicInfo: LX.Music.MusicInfo | LX.Download.ListItem, isRefresh = false, quality?: LX.Quality): Promise<string | null> => {
  // if (cancelDelayRetry) cancelDelayRetry()
  return new Promise<string | null>((resolve, reject) => {
    const time = getRandom(2, 6)
    setStatusText(global.i18n.t('player__getting_url_delay_retry', { time }))
    // 使用 BackgroundTimer 确保后台播放时重试仍然生效
    const tiemout = BackgroundTimer.setTimeout(() => {
      getMusicPlayUrl(musicInfo, isRefresh, true, quality).then((result) => {
        cancelDelayRetry = null
        resolve(result)
      }).catch(async(err: any) => {
        cancelDelayRetry = null
        reject(err)
      })
    }, time * 1000)
    cancelDelayRetry = () => {
      BackgroundTimer.clearTimeout(tiemout)
      cancelDelayRetry = null
      resolve(null)
    }
  })
}
/**
 * 多选源支持：在主流程失败时按顺序尝试其它已成功初始化的用户源。
 * 仅对在线（非 local、非下载）歌曲生效，遍历 `common.apiSourceList` 中
 * 所有已 settle 的 userApi，对每个 apiId 取其对应当前 musicInfo.source 的
 * handler 直接拉取 URL。
 * 返回值：
 * - string：找到可用的 URL
 * - null：所有其它用户源均失败或不存在可用的源
 */
/** 单个用户源请求的超时时间（毫秒） */
const USER_API_REQUEST_TIMEOUT = 15_000

const tryOtherUserApiHandlers = async(musicInfo: LX.Music.MusicInfoOnline, quality?: LX.Quality): Promise<string | null> => {
  const activeList = getActiveApiSources()
  const userApiIds = activeList.filter(id => /^user_api/.test(id))
  if (userApiIds.length < 1) return null

  for (const apiId of userApiIds) {
    if (!isUserApiReady(apiId)) continue
    const handlers = getUserApiHandlers(apiId, musicInfo.source)
    if (!handlers?.getMusicUrl) continue
    const getMusicUrlHandler = handlers.getMusicUrl
    try {
      const targetQuality = getPlayQuality(quality ?? settingState.setting['player.playQuality'], musicInfo)
      const sourceMusicInfo = toOldMusicInfo(musicInfo) as LX.Music.MusicInfo
      // 为每个用户源请求添加超时保护，防止某个源挂起阻塞后续尝试
      const result = await new Promise<{ url: string }>((resolve, reject) => {
        const timer = BackgroundTimer.setTimeout(() => {
          reject(new Error(`user api ${apiId} timeout`))
        }, USER_API_REQUEST_TIMEOUT)
        getMusicUrlHandler(sourceMusicInfo, targetQuality).promise.then((res: { url: string }) => {
          BackgroundTimer.clearTimeout(timer)
          resolve(res)
        }).catch((err: any) => {
          BackgroundTimer.clearTimeout(timer)
          reject(err)
        })
      })
      if (result.url) {
        console.log('tryOtherUserApiHandlers: success with', apiId)
        return result.url
      }
    } catch (e) {
      console.log('tryOtherUserApiHandlers: failed with', apiId, e)
    }
  }
  return null
}

const getMusicPlayUrl = async(musicInfo: LX.Music.MusicInfo | LX.Download.ListItem, isRefresh = false, isRetryed = false, quality?: LX.Quality): Promise<string | null> => {
  // this.musicInfo.url = await getMusicPlayUrl(targetSong, type)
  setStatusText(global.i18n.t('player__getting_url'))
  addLoadTimeout()

  // const type = getPlayType(settingState.setting['player.isPlayHighQuality'], musicInfo)
  let toggleMusicInfo = ('progress' in musicInfo ? musicInfo.metadata.musicInfo : musicInfo).meta.toggleMusicInfo

  // 中止检查：当用户切歌或停止播放时，终止正在进行的换源操作
  const isAborted = () => isMusicUrlRequestInvalid(musicInfo, isRefresh)

  return (toggleMusicInfo ? getMusicUrl({
    musicInfo: toggleMusicInfo,
    isRefresh,
    quality,
    allowToggleSource: false,
  }) : Promise.reject(new Error('not found'))).catch(async() => {
    return getMusicUrl({
      musicInfo,
      isRefresh,
      quality,
      isAborted,
      onToggleSource(mInfo) {
        if (isMusicUrlRequestInvalid(musicInfo, isRefresh)) return
        // 显示当前正在尝试的音源名称，让用户知道换源进度
        if (mInfo) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
          const sourceName = global.i18n.t(`source_real_${mInfo.source}` as any)
          setStatusText(global.i18n.t('toggle_source_try_source', { source: sourceName }))
        } else {
          setStatusText(global.i18n.t('toggle_source_try'))
        }
      },
    })
  }).then(url => {
    if (isMusicUrlRequestInvalid(musicInfo, isRefresh)) return null

    return url
  }).catch(async err => {
    // console.log('err', err.message)
    if (isMusicUrlRequestInvalid(musicInfo, isRefresh) ||
      err.message == requestMsg.cancelRequest) return null

    if (err.message == 'no api source' || err.message == 'source init failed') throw err

    // 多选源支持：在进入内部重试之前，先尝试其它已成功初始化的用户源。
    // 仅对普通在线歌曲（非 download item）生效。
    // LX.Music.MusicInfoOnline 已排除 'local'，无需额外判断。
    if (!isRetryed && !('progress' in musicInfo)) {
      const onlineInfo = musicInfo as LX.Music.MusicInfoOnline
      setStatusText(global.i18n.t('toggle_source_try'))
      const otherUrl = await tryOtherUserApiHandlers(onlineInfo, quality)
      if (otherUrl) {
        if (isMusicUrlRequestInvalid(musicInfo, isRefresh)) return null
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        setStatusText(global.i18n.t('toggle_source_success', { source: global.i18n.t(`source_real_${onlineInfo.source}` as any) }))
        return otherUrl
      }
    }

    // 用 BackgroundTimer 做有界的后台友好重试（含 tooManyRequests），
    // 而不是立即递归：后台切歌时 JS 可能被冻结，立即递归极易再次失败；
    // 延迟重试能在 App 回到后台后仍由后台定时器拉起，且次数有限防止无限循环。
    if (retryFetchCount < MAX_FETCH_RETRY) {
      retryFetchCount++
      return delayRetry(musicInfo, isRefresh, quality)
    }

    throw err
  })
}

export const setMusicUrl = (
  musicInfo: LX.Music.MusicInfo | LX.Download.ListItem,
  isRefresh?: boolean,
  // 可选的结果回调，供音质切换等场景向用户反馈成功/失败
  callbacks?: { quality?: LX.Quality, onSuccess?: () => void, onError?: (err: any) => void },
) => {
  // addLoadTimeout()
  // 刷新当前歌曲时允许覆盖进行中的取链（音质切换），避免被 isPlay / 同曲取链去重直接丢掉
  if (!isRefresh && !diffCurrentMusicInfo(musicInfo)) return
  if (cancelDelayRetry) cancelDelayRetry()
  // 每次发起新的取链，重置本轮的后台重试计数（有界重试）
  retryFetchCount = 0
  global.lx.gettingUrlId = createGettingUrlId(musicInfo)

  // 优先消费未过期的预取结果，避免后台切歌时重新发起网络请求。
  // 预取缓存只存在内存中，过期后必须丢弃，回退到正常取链流程获取新 URL。
  if (!isRefresh) {
    const prewarmKey = createGettingUrlId(musicInfo)
    const prewarmed = prewarmMusicUrlMap.get(prewarmKey)
    if (prewarmed) {
      prewarmMusicUrlMap.delete(prewarmKey)
      const desiredQuality = getCurrentMusicQuality(musicInfo, callbacks?.quality)
      const qualityMatched = !desiredQuality || !prewarmed.quality || prewarmed.quality === desiredQuality
      if (Date.now() < prewarmed.expireAt && qualityMatched) {
        setMusicInfo({ quality: prewarmed.quality ?? desiredQuality })
        setResource(musicInfo, prewarmed.url, playerState.progress.nowPlayTime)
        waitingPlay = false
        callbacks?.onSuccess?.()
        global.lx.gettingUrlId = ''
        prewarmNextMusicUrl()
        return
      }
    }
  }

  void getMusicPlayUrl(musicInfo, isRefresh, false, callbacks?.quality).then((url) => {
    if (!url) {
      callbacks?.onError?.(new Error('aborted'))
      return
    }
    setMusicInfo({ quality: getCurrentMusicQuality(musicInfo, callbacks?.quality) })
    setResource(musicInfo, url, playerState.progress.nowPlayTime)
    waitingPlay = false
    callbacks?.onSuccess?.()
    // 当前曲成功开始播放后，预取下一首在线歌曲 URL。
    // 音质切换成功后也要重预取，避免下一首仍命中旧音质缓存。
    prewarmNextMusicUrl()
  }).catch((err: any) => {
    console.log(err)
    if (err?.message == 'no api source') {
      // 未启用音源时每首歌都会失败，不能自动切歌把整个列表扫一遍
      setStatusText(global.i18n.t('player__no_api_source'))
      global.app_event.error()
      callbacks?.onError?.(err)
      return
    }
    // 所有换源尝试均失败，显示明确的失败提示并自动切歌
    setStatusText(global.i18n.t('player__source_all_failed'))
    global.app_event.error()
    addDelayNextTimeout()
    callbacks?.onError?.(err)
  }).finally(() => {
    if (musicInfo === playerState.playMusicInfo.musicInfo) {
      global.lx.gettingUrlId = ''
      clearLoadTimeout()
    }
  })
}

// 恢复上次播放的状态
const handleRestorePlay = async(restorePlayInfo: LX.Player.SavedPlayInfo) => {
  const musicInfo = playerState.playMusicInfo.musicInfo
  if (!musicInfo) return

  setTimeout(() => {
    global.app_event.setProgress(settingState.setting['player.isSavePlayTime'] ? restorePlayInfo.time : 0, restorePlayInfo.maxTime)
  })

  const playMusicInfo = playerState.playMusicInfo

  void initTrackInfo(musicInfo, playerState.musicInfo)

  void getPicPath({ musicInfo, listId: playMusicInfo.listId }).then((url: string) => {
    if (
      musicInfo.id != playMusicInfo.musicInfo?.id ||
      playerState.musicInfo.pic == url ||
      playerState.loadErrorPicUrl == url
    ) return
    setMusicInfo({ pic: url })
    global.app_event.picUpdated()
  })

  void getLyricInfo({ musicInfo }).then((lyricInfo) => {
    if (musicInfo.id != playMusicInfo.musicInfo?.id) return
    setMusicInfo({
      lrc: lyricInfo.lyric,
      tlrc: lyricInfo.tlyric,
      lxlrc: lyricInfo.lxlyric,
      rlrc: lyricInfo.rlyric,
      rawlrc: lyricInfo.rawlrcInfo.lyric,
    })
    global.app_event.lyricUpdated()
  }).catch((err) => {
    console.log(err)
    if (musicInfo.id != playMusicInfo.musicInfo?.id) return
    setStatusText(global.i18n.t('lyric__load_error'))
  })

  if (settingState.setting['player.togglePlayMethod'] == 'random' && !playMusicInfo.isTempPlay) addPlayedList(playMusicInfo as LX.Player.PlayMusicInfo)
}


const debouncePlay = debounceBackgroundTimer((musicInfo: LX.Player.PlayMusic) => {
  setMusicUrl(musicInfo)

  void getPicPath({ musicInfo, listId: playerState.playMusicInfo.listId }).then((url: string) => {
    if (
      musicInfo.id != playerState.playMusicInfo.musicInfo?.id ||
      playerState.musicInfo.pic == url ||
      playerState.loadErrorPicUrl == url) return
    setMusicInfo({ pic: url })
    global.app_event.picUpdated()
  })

  void getLyricInfo({ musicInfo }).then((lyricInfo) => {
    if (musicInfo.id != playerState.playMusicInfo.musicInfo?.id) return
    setMusicInfo({
      lrc: lyricInfo.lyric,
      tlrc: lyricInfo.tlyric,
      lxlrc: lyricInfo.lxlyric,
      rlrc: lyricInfo.rlyric,
      rawlrc: lyricInfo.rawlrcInfo.lyric,
    })
    global.app_event.lyricUpdated()
  }).catch((err) => {
    console.log(err)
    if (musicInfo.id != playerState.playMusicInfo.musicInfo?.id) return
    setStatusText(global.i18n.t('lyric__load_error'))
  })
}, 200)

// 处理音乐播放
const handlePlay = async() => {
  if (!isInitialized()) {
    await checkNotificationPermission()
    void checkIgnoringBatteryOptimization()
    await playerInitial({
      volume: settingState.setting['player.volume'],
      playRate: settingState.setting['player.playbackRate'],
      cacheSize: settingState.setting['player.cacheSize'] ? parseInt(settingState.setting['player.cacheSize']) : 0,
      isHandleAudioFocus: settingState.setting['player.isHandleAudioFocus'],
      isEnableAudioOffload: settingState.setting['player.isEnableAudioOffload'],
    })
  }

  global.lx.isPlayedStop &&= false
  pausedByUser = false
  waitingPlay = true
  resetRandomNextMusicInfo()

  if (global.lx.restorePlayInfo) {
    waitingPlay = false
    void handleRestorePlay(global.lx.restorePlayInfo)
    global.lx.restorePlayInfo = null
    return
  }

  const playMusicInfo = playerState.playMusicInfo
  const musicInfo = playMusicInfo.musicInfo

  if (!musicInfo) {
    waitingPlay = false
    return
  }

  // 不要 await setStop()：后台 RN bridge 可能卡住，导致下一首取链一直不开始。
  // stop 还会触发 queue-ended，和自动切歌叠在一起容易连跳。暂停即可，新资源加载后会替换队列。
  void setPause()
  global.app_event.pause()

  clearDelayNextTimeout()
  clearLoadTimeout()


  if (settingState.setting['player.togglePlayMethod'] == 'random' && !playMusicInfo.isTempPlay) addPlayedList(playMusicInfo as LX.Player.PlayMusicInfo)

  debouncePlay(musicInfo)
}

/**
 * 随机播放下用户手动点歌：把该曲从已播历史的旧位置拿掉（随后由 handlePlay 追加到末尾），
 * 并旋转随机队列。否则下一首会顺着已播列表把点过的旧历史再顺序播一遍，
 * 或从随机队列头部把点过的歌前面那些未播歌曲重来。
 * 上一首/下一首仍按已播列表游标行走，不受这里影响。
 */
const prepareManualListPlay = (
  listId: string,
  musicInfo: LX.Music.MusicInfo | LX.Download.ListItem | undefined,
  prevListId: string | null,
  prevMusicId: string | null | undefined,
) => {
  const resetPlayedList = settingState.setting['player.isAutoCleanPlayedList'] || prevListId != listId
  if (resetPlayedList) clearPlayedList()

  if (
    settingState.setting['player.togglePlayMethod'] != 'random' ||
    !musicInfo ||
    musicInfo.id === prevMusicId
  ) return

  // 点到已播过的歌时，先从旧位置移除，handlePlay 会重新追加到末尾，截断“前进”历史
  if (!resetPlayedList) {
    const existing = playerState.playedList.findIndex(m => m.musicInfo.id === musicInfo.id)
    if (existing >= 0) removePlayedList(existing)
  }
  jumpShuffleQueue(listId, musicInfo.id)
}

/**
 * 播放列表内歌曲
 * @param listId 列表id
 * @param id 歌曲id
 */
export const playListById = async(listId: string, id: string) => {
  const prevListId = playerState.playInfo.playerListId
  const prevMusicId = playerState.playMusicInfo.musicInfo?.id
  setPlayListId(listId)
  const musicInfo = getList(listId).find(m => m.id == id)
  if (!musicInfo) return
  setPlayMusicInfo(listId, musicInfo)
  prepareManualListPlay(listId, musicInfo, prevListId, prevMusicId)
  clearTempPlayeList()
  await handlePlay()
}

/**
 * 播放列表内歌曲
 * @param listId 列表id
 * @param index 播放的歌曲位置
 */
export const playList = async(listId: string, index: number) => {
  const prevListId = playerState.playInfo.playerListId
  const prevMusicId = playerState.playMusicInfo.musicInfo?.id
  setPlayListId(listId)
  const musicInfo = getList(listId)[index]
  setPlayMusicInfo(listId, musicInfo)
  prepareManualListPlay(listId, musicInfo, prevListId, prevMusicId)
  clearTempPlayeList()
  await handlePlay()
}

const handleToggleStop = async() => {
  await stop()
  setTimeout(() => {
    setPlayMusicInfo(null, null)
  })
}


const randomNextMusicInfo = {
  info: null as LX.Player.PlayMusicInfo | null,
  // 为哪一首“当前曲”算出的下一首；切歌后必须失效，避免预取把旧下一首写回来
  forId: null as string | null,
}
export const resetRandomNextMusicInfo = () => {
  randomNextMusicInfo.info = null
  randomNextMusicInfo.forId = null
}

const getUsableRandomNext = (
  currentListId: string,
  currentList: Array<{ id: string }>,
  currentId: string | undefined,
) => {
  const info = randomNextMusicInfo.info
  if (
    info &&
    randomNextMusicInfo.forId === currentId &&
    settingState.setting['player.togglePlayMethod'] === 'random' &&
    info.listId === currentListId &&
    currentList.some(item => item.id === info.musicInfo.id)
  ) return info
  if (info) resetRandomNextMusicInfo()
  return null
}

export const getNextPlayMusicInfo = async(): Promise<LX.Player.PlayMusicInfo | null> => {
  if (playerState.tempPlayList.length) { // 如果稍后播放列表存在歌曲则直接播放改列表的歌曲
    const playMusicInfo = playerState.tempPlayList[0]
    return playMusicInfo
  }

  if (playerState.playMusicInfo.musicInfo == null) return null

  const playMusicInfo = playerState.playMusicInfo
  const playInfo = playerState.playInfo
  // console.log(playInfo.playerListId)
  const currentListId = playInfo.playerListId
  if (!currentListId) return null
  const currentList = getList(currentListId)
  const startedForId = playMusicInfo.musicInfo.id

  const playedList = playerState.playedList
  if (playedList.length) { // 移除已播放列表内不存在原列表的歌曲
    let currentId: string
    if (playMusicInfo.isTempPlay) {
      const musicInfo = currentList[playInfo.playerPlayIndex]
      if (musicInfo) currentId = musicInfo.id
    } else {
      currentId = playMusicInfo.musicInfo.id
    }
    // 从已播放列表移除播放列表已删除的歌曲
    let index
    for (index = playedList.findIndex(m => m.musicInfo.id === currentId) + 1; index < playedList.length; index++) {
      const playMusicInfo = playedList[index]
      const currentId = playMusicInfo.musicInfo.id
      if (playMusicInfo.listId == currentListId && !currentList.some(m => m.id === currentId)) {
        removePlayedList(index)
        continue
      }
      break
    }

    if (index < playedList.length) return playedList[index]
  }

  // 预取会提前确定随机下一首；仅在仍为同一首当前曲、模式仍为随机且歌曲仍存在时复用
  const cachedNext = getUsableRandomNext(currentListId, currentList, startedForId)
  if (cachedNext) return cachedNext

  // const isCheckFile = findNum > 2 // 针对下载列表，如果超过两次都碰到无效歌曲，则过滤整个列表内的无效歌曲
  let { filteredList, playerIndex } = await filterList({ // 过滤已播放歌曲
    listId: currentListId,
    list: currentList,
    playedList,
    playerMusicInfo: currentList[playInfo.playerPlayIndex],
    isNext: true,
  })

  // 等待期间用户可能已手动点歌，丢弃过期结果，避免把旧下一首写回缓存
  if (playerState.playMusicInfo.musicInfo?.id !== startedForId) return null

  if (!filteredList.length) return null
  // let currentIndex: number = filteredList.indexOf(currentList[playInfo.playerPlayIndex])
  if (playerIndex == -1 && filteredList.length) playerIndex = 0
  let nextIndex = playerIndex

  let togglePlayMethod = settingState.setting['player.togglePlayMethod']
  switch (togglePlayMethod) {
    case 'listLoop':
      nextIndex = playerIndex === filteredList.length - 1 ? 0 : playerIndex + 1
      break
    case 'random':
      nextIndex = pickShuffledNextIndex(currentListId, filteredList)
      break
    case 'list':
      nextIndex = playerIndex === filteredList.length - 1 ? -1 : playerIndex + 1
      break
    case 'singleLoop':
      break
    default:
      return null
  }
  if (nextIndex < 0) return null

  const nextPlayMusicInfo = {
    musicInfo: filteredList[nextIndex],
    listId: currentListId,
    isTempPlay: false,
  }

  if (togglePlayMethod == 'random' && playerState.playMusicInfo.musicInfo?.id === startedForId) {
    randomNextMusicInfo.info = nextPlayMusicInfo
    randomNextMusicInfo.forId = startedForId
  }
  return nextPlayMusicInfo
}

// ============ 统一的下一首预取（合并自旧 preloadNextMusic 临播预取路径） ============
// 预取结果的内存缓存。优先复用持久缓存（经可用性校验），缓存缺失/失效时才用
// handleGetOnlineMusicUrl 强制刷新；刷新结果只进内存不落库，
// 避免提前落库导致后续（跨歌曲/跨会话）命中已失效的 URL。
const PREWARM_MUSIC_URL_TTL = 10 * 60 * 1000 // 10 分钟，超长歌曲会回退到正常取链
const PREWARM_REQUEST_TIMEOUT = 15_000
// 同一首「下一首」两次预取尝试的最小间隔：临播触发器在歌曲结尾每个进度事件都会调用，失败后需退避
const PREWARM_RETRY_INTERVAL = 10_000
// 触发层节流间隔：同一首当前曲短时间内最多触发一次完整预取流程，
// 避免进度事件反复执行 getNextPlayMusicInfo（大列表过滤有开销）
const PREWARM_TRIGGER_INTERVAL = 2_000
interface PrewarmMusicUrlCache {
  url: string
  expireAt: number
  quality: LX.Quality | null
}
const prewarmMusicUrlMap = new Map<string, PrewarmMusicUrlCache>()
/** 每个预取 key 的最近一次尝试时间，用于失败后的退避重试 */
const prewarmAttemptAtMap = new Map<string, number>()
/** 触发层节流状态：上次触发时针对的当前曲 id 与时间 */
let prewarmLastTriggerForId: string | null = null
let prewarmLastTriggerAt = 0

let prewarmSeq = 0

/**
 * 校验已缓存的 URL 是否仍可用：已被播放器本地缓存，或 HEAD 请求通过
 */
const isPrewarmUrlUsable = async(url: string): Promise<boolean> => {
  const [cached, available] = await Promise.all([
    isCached(url).catch(() => false),
    checkUrl(url).then(() => true).catch(() => false),
  ])
  return cached || available
}

/**
 * 统一的下一首预取入口（当前曲开播成功、歌曲临近结束时都会调用）。
 * 流程：
 * 1. 计算下一首（随机模式复用 randomNextMusicInfo 缓存）；
 * 2. 优先复用持久缓存中的 URL，经 isCached / HEAD 校验可用则直接进内存预热表；
 * 3. 缓存缺失或已失效时才 isRefresh 强制刷新，结果只进内存预热表。
 * 旧的 preloadNextMusic 路径（临播再走一遍 getMusicUrl + checkUrl + 失败重刷）已并入此处，
 * 一首歌播完时下一首 URL 最多只会拉一次。
 */
export const prewarmNextMusicUrl = () => {
  if (pausedByUser || global.lx.isPlayedStop) return
  const playMusicInfo = playerState.playMusicInfo
  if (!playMusicInfo.musicInfo) return
  // 切歌后允许立刻预取新的下一首；同一首歌在节流间隔内不重复触发
  const startedForId = playMusicInfo.musicInfo.id
  const triggerNow = Date.now()
  if (startedForId === prewarmLastTriggerForId && triggerNow - prewarmLastTriggerAt < PREWARM_TRIGGER_INTERVAL) return
  prewarmLastTriggerForId = startedForId
  prewarmLastTriggerAt = triggerNow
  // 过期序号的结果直接丢弃
  const seq = ++prewarmSeq
  // 预取前顺手清理过期条目，避免用户频繁切歌后缓存表持续增长。
  for (const [key, caching] of prewarmMusicUrlMap) {
    if (triggerNow >= caching.expireAt) prewarmMusicUrlMap.delete(key)
  }
  for (const [key, at] of prewarmAttemptAtMap) {
    if (triggerNow - at >= PREWARM_MUSIC_URL_TTL) prewarmAttemptAtMap.delete(key)
  }
  void getNextPlayMusicInfo().then(async(next) => {
    if (seq !== prewarmSeq || playerState.playMusicInfo.musicInfo?.id !== startedForId) return
    if (!next?.musicInfo || next.musicInfo.id === startedForId) return
    // 本地/下载歌曲的 URL 是本地路径，无需网络预取
    if ('progress' in next.musicInfo || next.musicInfo.source === 'local') return
    const nextMusicInfo = next.musicInfo
    const key = createGettingUrlId(nextMusicInfo)
    // 已存在且未过期则复用，避免重复请求
    const caching = prewarmMusicUrlMap.get(key)
    if (caching && Date.now() < caching.expireAt) return
    // 失败退避：临播触发器会反复调用，同一 key 的重试间隔至少 PREWARM_RETRY_INTERVAL
    const lastAttemptAt = prewarmAttemptAtMap.get(key)
    if (lastAttemptAt != null && Date.now() - lastAttemptAt < PREWARM_RETRY_INTERVAL) return
    prewarmAttemptAtMap.set(key, Date.now())
    try {
      // 1) 优先复用持久缓存：正常取链会写盘，这里校验仍可用就直接进内存预热表，省一次网络请求
      const targetQuality = getPlayQuality(settingState.setting['player.playQuality'], nextMusicInfo)
      const cachedUrl = await getStoreMusicUrl(nextMusicInfo, targetQuality).catch(() => '')
      if (cachedUrl && await isPrewarmUrlUsable(cachedUrl)) {
        if (seq !== prewarmSeq || playerState.playMusicInfo.musicInfo?.id !== startedForId) return
        prewarmMusicUrlMap.set(key, {
          url: cachedUrl,
          expireAt: Date.now() + PREWARM_MUSIC_URL_TTL,
          quality: targetQuality,
        })
        return
      }
      // 2) 持久缓存缺失/失效 → 强制刷新取新链（绕过持久缓存，避免把旧 URL 当成新预取结果）
      const request = handleGetOnlineMusicUrl({
        musicInfo: nextMusicInfo,
        onToggleSource: () => {},
        isRefresh: true,
        allowToggleSource: true,
      })
      const result = await new Promise<Awaited<typeof request>>((resolve, reject) => {
        const timer = BackgroundTimer.setTimeout(() => {
          reject(new Error(`prewarm request timeout (${PREWARM_REQUEST_TIMEOUT}ms)`))
        }, PREWARM_REQUEST_TIMEOUT)
        request.then((value) => {
          BackgroundTimer.clearTimeout(timer)
          resolve(value)
        }).catch((error) => {
          BackgroundTimer.clearTimeout(timer)
          reject(error)
        })
      })
      if (seq !== prewarmSeq || !result?.url) return
      prewarmMusicUrlMap.set(key, {
        url: result.url,
        expireAt: Date.now() + PREWARM_MUSIC_URL_TTL,
        quality: result.quality,
      })
    } catch (e) {
      // 预取失败不打扰当前播放，静默忽略（临播触发器会按退避间隔重试）
      console.log('prewarm next music url fail', e)
    }
  }).catch(() => {})
}

const handlePlayNext = async(playMusicInfo: LX.Player.PlayMusicInfo) => {
  setPlayMusicInfo(playMusicInfo.listId, playMusicInfo.musicInfo, playMusicInfo.isTempPlay)
  await handlePlay()
}
/**
 * 下一曲
 * @param isAutoToggle 是否自动切换
 * @returns
 */
export const playNext = async(isAutoToggle = false): Promise<void> => {
  if (playerState.tempPlayList.length) { // 如果稍后播放列表存在歌曲则直接播放改列表的歌曲
    const playMusicInfo = playerState.tempPlayList[0]
    removeTempPlayList(0)
    await handlePlayNext(playMusicInfo)
    return
  }

  const playMusicInfo = playerState.playMusicInfo
  const playInfo = playerState.playInfo
  if (playMusicInfo.musicInfo == null) return handleToggleStop()
  const startedForId = playMusicInfo.musicInfo.id

  // console.log(playInfo.playerListId)
  const currentListId = playInfo.playerListId
  if (!currentListId) return handleToggleStop()
  const currentList = getList(currentListId)

  const playedList = playerState.playedList

  if (playedList.length) { // 移除已播放列表内不存在原列表的歌曲
    let currentId: string
    if (playMusicInfo.isTempPlay) {
      const musicInfo = currentList[playInfo.playerPlayIndex]
      if (musicInfo) currentId = musicInfo.id
    } else {
      currentId = playMusicInfo.musicInfo.id
    }
    // 从已播放列表移除播放列表已删除的歌曲
    let index
    for (index = playedList.findIndex(m => m.musicInfo.id === currentId) + 1; index < playedList.length; index++) {
      const playMusicInfo = playedList[index]
      const currentId = playMusicInfo.musicInfo.id
      if (playMusicInfo.listId == currentListId && !currentList.some(m => m.id === currentId)) {
        removePlayedList(index)
        continue
      }
      break
    }

    if (index < playedList.length) {
      await handlePlayNext(playedList[index])
      return
    }
  }
  // 预取缓存只适用于仍为同一首当前曲、仍处于随机模式且歌曲未从当前歌单移除的情况。
  const cachedNext = getUsableRandomNext(currentListId, currentList, playMusicInfo.musicInfo.id)
  if (cachedNext) {
    await handlePlayNext(cachedNext)
    return
  }
  // const isCheckFile = findNum > 2 // 针对下载列表，如果超过两次都碰到无效歌曲，则过滤整个列表内的无效歌曲
  let { filteredList, playerIndex } = await filterList({ // 过滤已播放歌曲
    listId: currentListId,
    list: currentList,
    playedList,
    playerMusicInfo: currentList[playInfo.playerPlayIndex],
    isNext: true,
  })

  // 等待期间用户可能已手动点歌，避免把旧的下一首盖回去
  if (playerState.playMusicInfo.musicInfo?.id !== startedForId) return
  if (!filteredList.length) return handleToggleStop()
  // let currentIndex: number = filteredList.indexOf(currentList[playInfo.playerPlayIndex])
  if (playerIndex == -1 && filteredList.length) playerIndex = 0
  let nextIndex = playerIndex

  let togglePlayMethod = settingState.setting['player.togglePlayMethod']
  if (!isAutoToggle) {
    switch (togglePlayMethod) {
      case 'list':
      case 'singleLoop':
      case 'none':
        togglePlayMethod = 'listLoop'
    }
  }
  switch (togglePlayMethod) {
    case 'listLoop':
      nextIndex = playerIndex === filteredList.length - 1 ? 0 : playerIndex + 1
      break
    case 'random':
      nextIndex = pickShuffledNextIndex(currentListId, filteredList)
      break
    case 'list':
      nextIndex = playerIndex === filteredList.length - 1 ? -1 : playerIndex + 1
      break
    case 'singleLoop':
      break
    default:
      nextIndex = -1
      return
  }
  if (nextIndex < 0) return

  await handlePlayNext({
    musicInfo: filteredList[nextIndex],
    listId: currentListId,
    isTempPlay: false,
  })
}

/**
 * 上一曲
 */
export const playPrev = async(isAutoToggle = false): Promise<void> => {
  const playMusicInfo = playerState.playMusicInfo
  if (playMusicInfo.musicInfo == null) return handleToggleStop()
  const startedForId = playMusicInfo.musicInfo.id
  const playInfo = playerState.playInfo

  const currentListId = playInfo.playerListId
  if (!currentListId) return handleToggleStop()
  const currentList = getList(currentListId)

  const playedList = playerState.playedList
  if (playedList.length) {
    let currentId: string
    if (playMusicInfo.isTempPlay) {
      const musicInfo = currentList[playInfo.playerPlayIndex]
      if (musicInfo) currentId = musicInfo.id
    } else {
      currentId = playMusicInfo.musicInfo.id
    }
    // 从已播放列表移除播放列表已删除的歌曲
    let index
    for (index = playedList.findIndex(m => m.musicInfo.id === currentId) - 1; index > -1; index--) {
      const playMusicInfo = playedList[index]
      const currentId = playMusicInfo.musicInfo.id
      if (playMusicInfo.listId == currentListId && !currentList.some(m => m.id === currentId)) {
        removePlayedList(index)
        continue
      }
      break
    }

    if (index > -1) {
      await handlePlayNext(playedList[index])
      return
    }
  }

  // const isCheckFile = findNum > 2
  let { filteredList, playerIndex } = await filterList({ // 过滤已播放歌曲
    listId: currentListId,
    list: currentList,
    playedList,
    playerMusicInfo: currentList[playInfo.playerPlayIndex],
    isNext: false,
  })
  if (playerState.playMusicInfo.musicInfo?.id !== startedForId) return
  if (!filteredList.length) return handleToggleStop()

  // let currentIndex = filteredList.indexOf(currentList[playInfo.playerPlayIndex])
  if (playerIndex == -1 && filteredList.length) playerIndex = 0
  let nextIndex = playerIndex
  if (!playMusicInfo.isTempPlay) {
    let togglePlayMethod = settingState.setting['player.togglePlayMethod']
    if (!isAutoToggle) {
      switch (togglePlayMethod) {
        case 'list':
        case 'singleLoop':
        case 'none':
          togglePlayMethod = 'listLoop'
      }
    }
    switch (togglePlayMethod) {
      case 'random':
        nextIndex = getRandom(0, filteredList.length)
        break
      case 'listLoop':
      case 'list':
        nextIndex = playerIndex === 0 ? filteredList.length - 1 : playerIndex - 1
        break
      case 'singleLoop':
        break
      default:
        nextIndex = -1
        return
    }
    if (nextIndex < 0) return
  }


  await handlePlayNext({
    musicInfo: filteredList[nextIndex],
    listId: currentListId,
    isTempPlay: false,
  })
}

/**
 * 恢复播放
 */
export const play = () => {
  pausedByUser = false
  if (playerState.playMusicInfo.musicInfo == null) return
  if (isEmpty()) {
    if (createGettingUrlId(playerState.playMusicInfo.musicInfo) != global.lx.gettingUrlId) setMusicUrl(playerState.playMusicInfo.musicInfo)
    return
  }
  void setPlay()
}

/**
 * 暂停播放
 */
export const pause = async() => {
  pausedByUser = true
  waitingPlay = false
  await setPause()
}

/**
 * 停止播放
 */
export const stop = async() => {
  pausedByUser = true
  waitingPlay = false
  await setStop()
  setTimeout(() => {
    global.app_event.stop()
  })
}

/**
 * 歌曲自然结束时切下一首。合并 track-changed / queue-ended 的重复回调。
 */
export const playNextIfAuto = async() => {
  if (pausedByUser || global.lx.isPlayedStop) return false
  const now = Date.now()
  if (now - lastAutoToggleAt < 800) return false
  lastAutoToggleAt = now
  await playNext(true)
  return true
}

/**
 * 应用回到前台时，把后台被挂起的自动切歌/取链补上。
 */
export const recoverPlaybackIfNeeded = () => {
  if (pausedByUser || global.lx.isPlayedStop || !waitingPlay) return
  const musicInfo = playerState.playMusicInfo.musicInfo
  if (!musicInfo || global.lx.gettingUrlId) return
  setMusicUrl(musicInfo)
}

/**
 * 播放、暂停播放切换
 */
export const togglePlay = () => {
  global.lx.isPlayedStop &&= false
  if (playerState.isPlay) {
    void pause()
  } else {
    play()
  }
}

/**
 * 收藏当前播放的歌曲
 */
export const collectMusic = async(): Promise<boolean> => {
  if (!playerState.playMusicInfo.musicInfo) return false
  await addListMusics(LIST_IDS.LOVE, [
    'progress' in playerState.playMusicInfo.musicInfo
      ? playerState.playMusicInfo.musicInfo.metadata.musicInfo
      : playerState.playMusicInfo.musicInfo,
  ], settingState.setting['list.addMusicLocationType'])
  return true
}

/**
 * 取消收藏当前播放的歌曲
 */
export const uncollectMusic = async(): Promise<boolean> => {
  if (!playerState.playMusicInfo.musicInfo) return false
  await removeListMusics(LIST_IDS.LOVE, [
    'progress' in playerState.playMusicInfo.musicInfo
      ? playerState.playMusicInfo.musicInfo.metadata.musicInfo.id
      : playerState.playMusicInfo.musicInfo.id,
  ])
  return true
}

/**
 * 不喜欢当前播放的歌曲
 */
export const dislikeMusic = async() => {
  if (!playerState.playMusicInfo.musicInfo) return
  const minfo = 'progress' in playerState.playMusicInfo.musicInfo ? playerState.playMusicInfo.musicInfo.metadata.musicInfo : playerState.playMusicInfo.musicInfo
  await addDislikeInfo([{ name: minfo.name, singer: minfo.singer }])
  await playNext(true)
}

