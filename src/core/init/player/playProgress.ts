import { updateListMusicsDeferred } from '@/core/list'
import { setMaxplayTime, setNowPlayTime } from '@/core/player/progress'
import { setCurrentTime, getDuration, getPosition } from '@/plugins/player'
import { formatPlayTime2 } from '@/utils/common'
import { saveListMusics, savePlayInfo } from '@/utils/data'
import { throttleBackgroundTimer } from '@/utils/tools'
import BackgroundTimer from 'react-native-background-timer'
import playerState from '@/store/player/state'
import settingState from '@/store/setting/state'
import { onScreenStateChange } from '@/utils/nativeModules/utils'
import { AppState } from 'react-native'
import { prewarmNextMusicUrl } from '@/core/player/player'
import { allMusicList } from '@/utils/listManage'

const delaySavePlayInfo = throttleBackgroundTimer(() => {
  void savePlayInfo({
    time: playerState.progress.nowPlayTime,
    maxTime: playerState.progress.maxPlayTime,
    listId: playerState.playMusicInfo.listId!,
    index: playerState.playInfo.playIndex,
  })
}, 2000)

// 缺时长的补齐只改内存。同一首歌只补一次，整表写入延到空闲、切歌或退出。
const pendingIntervalListIds = new Set<string>()
let flushIntervalTimer: number | null = null

let flushingInterval: Promise<void> | null = null

const flushPendingInterval = async() => {
  if (flushingInterval) return flushingInterval
  flushingInterval = (async() => {
    const ids = [...pendingIntervalListIds]
    pendingIntervalListIds.clear()
    const listData = ids.flatMap(id => {
      const musics = allMusicList.get(id)
      return musics ? [{ id, musics }] : []
    })
    if (!listData.length) return
    await saveListMusics(listData)
  })().finally(() => {
    flushingInterval = null
  })
  return flushingInterval
}

const scheduleFlushPendingInterval = () => {
  if (flushIntervalTimer != null) return
  // 合并同一空闲窗口内的多次补齐，避免每首歌都立刻重写整张歌单
  flushIntervalTimer = BackgroundTimer.setTimeout(() => {
    flushIntervalTimer = null
    void flushPendingInterval()
  }, 30000)
}

export const flushPendingListInterval = async() => {
  if (flushIntervalTimer != null) {
    BackgroundTimer.clearTimeout(flushIntervalTimer)
    flushIntervalTimer = null
  }
  if (!pendingIntervalListIds.size) return flushingInterval ?? Promise.resolve()
  return flushPendingInterval()
}

export default () => {
  // const updateMusicInfo = useCommit('list', 'updateMusicInfo')

  let updateTimeout: number | null = null

  let isScreenOn = true

  const getCurrentTime = () => {
    let id = playerState.musicInfo.id
    void getPosition().then(position => {
      // position === 0 是合法起点，不能当成无效进度丢掉
      if (position == null || id != playerState.musicInfo.id) return
      setNowPlayTime(position)
      if (!playerState.isPlay) return

      const duration = playerState.progress.maxPlayTime
      // 息屏后 UI 进度定时器会停，锁屏后台仍靠这条路径触发临播预取
      if (duration > 10 && duration - position < 10) prewarmNextMusicUrl()

      if (settingState.setting['player.isSavePlayTime'] && !playerState.playMusicInfo.isTempPlay && isScreenOn) {
        delaySavePlayInfo()
      }
    })
  }
  const getMaxTime = async() => {
    setMaxplayTime(await getDuration())

    if (playerState.playMusicInfo.musicInfo && 'source' in playerState.playMusicInfo.musicInfo && !playerState.playMusicInfo.musicInfo.interval) {
      // console.log(formatPlayTime2(playProgress.maxPlayTime))

      if (playerState.playMusicInfo.listId) {
        const listId = playerState.playMusicInfo.listId
        const interval = formatPlayTime2(playerState.progress.maxPlayTime)
        void updateListMusicsDeferred([{
          id: listId,
          musicInfo: {
            ...playerState.playMusicInfo.musicInfo,
            interval,
          },
        }]).then(() => {
          // 内存改完才登记，避免切歌时把还没补上时长的旧列表提前写回去
          pendingIntervalListIds.add(listId)
          scheduleFlushPendingInterval()
        })
      }
    }
  }

  const clearUpdateTimeout = () => {
    if (!updateTimeout) return
    BackgroundTimer.clearInterval(updateTimeout)
    updateTimeout = null
  }
  const startUpdateTimeout = () => {
    clearUpdateTimeout()
    // 锁屏也要跑：后台切歌依赖临播预取，停掉进度轮询后下一首 URL 经常还没准备好
    const interval = isScreenOn
      ? 1000 / settingState.setting['player.playbackRate']
      : 3000
    updateTimeout = BackgroundTimer.setInterval(() => {
      getCurrentTime()
    }, interval)
    getCurrentTime()
  }

  const setProgress = (time: number, maxTime?: number) => {
    if (!playerState.musicInfo.id) return
    // console.log('setProgress', time, maxTime)
    setNowPlayTime(time)
    void setCurrentTime(time)

    if (maxTime != null) setMaxplayTime(maxTime)

    // if (!isPlay) audio.play()
  }


  const handlePlay = () => {
    void getMaxTime()
    // prevProgressStatus = 'normal'
    // handleSetTaskBarState(playProgress.progress, prevProgressStatus)
    startUpdateTimeout()
  }
  const handlePause = () => {
    // prevProgressStatus = 'paused'
    // handleSetTaskBarState(playProgress.progress, prevProgressStatus)
    // clearBufferTimeout()
    clearUpdateTimeout()
  }

  const handleStop = () => {
    clearUpdateTimeout()
    setNowPlayTime(0)
    setMaxplayTime(0)
    // prevProgressStatus = 'none'
    // handleSetTaskBarState(playProgress.progress, prevProgressStatus)
  }

  const handleError = () => {
    // if (!restorePlayTime) restorePlayTime = getCurrentTime() // 记录出错的播放时间
    // console.log('handleError')
    // prevProgressStatus = 'error'
    // handleSetTaskBarState(playProgress.progress, prevProgressStatus)
    clearUpdateTimeout()
  }


  const handleSetPlayInfo = () => {
    // restorePlayTime = playProgress.nowPlayTime
    // void setCurrentTime(playerState.progress.nowPlayTime)
    // setMaxplayTime(playProgress.maxPlayTime)
    handlePause()
    void flushPendingListInterval()
    if (!playerState.playMusicInfo.isTempPlay) {
      void savePlayInfo({
        time: playerState.progress.nowPlayTime,
        maxTime: playerState.progress.maxPlayTime,
        listId: playerState.playMusicInfo.listId!,
        index: playerState.playInfo.playIndex,
      })
    }
  }

  // watch(() => playerState.progress.nowPlayTime, (newValue, oldValue) => {
  //   if (settingState.setting['player.isSavePlayTime'] && !playMusicInfo.isTempPlay) {
  //     delaySavePlayInfo({
  //       time: newValue,
  //       maxTime: playerState.progress.maxPlayTime,
  //       listId: playMusicInfo.listId as string,
  //       index: playInfo.playIndex,
  //     })
  //   }
  // })
  // watch(() => playerState.progress.maxPlayTime, maxPlayTime => {
  //   if (!playMusicInfo.isTempPlay) {
  //     delaySavePlayInfo({
  //       time: playerState.progress.nowPlayTime,
  //       maxTime: maxPlayTime,
  //       listId: playMusicInfo.listId as string,
  //       index: playInfo.playIndex,
  //     })
  //   }
  // })

  const handleConfigUpdated: typeof global.state_event.configUpdated = (keys, settings) => {
    if (keys.includes('player.playbackRate')) startUpdateTimeout()
  }

  const handleScreenStateChanged: Parameters<typeof onScreenStateChange>[0] = (state) => {
    isScreenOn = state == 'ON'
    if (playerState.isPlay) startUpdateTimeout()
  }

  // 修复在某些设备上屏幕状态改变事件未触发导致的进度条未更新的问题
  AppState.addEventListener('change', (state) => {
    if (state == 'active' && !isScreenOn) handleScreenStateChanged('ON')
  })

  global.app_event.on('play', handlePlay)
  global.app_event.on('pause', handlePause)
  global.app_event.on('stop', handleStop)
  global.app_event.on('error', handleError)
  global.app_event.on('setProgress', setProgress)
  // global.app_event.on(eventPlayerNames.restorePlay, handleRestorePlay)
  // global.app_event.on('playerLoadeddata', handleLoadeddata)
  // global.app_event.on('playerCanplay', handleCanplay)
  // global.app_event.on('playerWaiting', handleWating)
  // global.app_event.on('playerEmptied', handleEmpied)
  global.app_event.on('musicToggled', handleSetPlayInfo)
  global.state_event.on('configUpdated', handleConfigUpdated)

  onScreenStateChange(handleScreenStateChanged)
}
