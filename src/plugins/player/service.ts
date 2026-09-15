/* eslint-disable @typescript-eslint/no-misused-promises */
import TrackPlayer, { State as TPState, Event as TPEvent, RepeatMode } from 'react-native-track-player'
import BackgroundTimer from 'react-native-background-timer'
// import { store } from '@/store'
// import { action as playerAction, STATUS } from '@/store/modules/player'
import { isTempId, isEmpty } from './utils'
// import { play as lrcPlay, pause as lrcPause } from '@/core/lyric'
import { exitApp } from '@/core/common'
import { getCurrentTrackId, getTrackIdByIndex } from './playList'
import { isPausedByUser, isWaitingPlay, pause, play, playNext, playNextIfAuto, playPrev } from '@/core/player/player'

let isInitialized = false

// let retryTrack: LX.Player.Track | null = null
// let retryGetUrlId: string | null = null
// let retryGetUrlNum = 0
// let errorTime = 0
// let prevDuration = 0
// let isPlaying = false

// 销毁播放器并退出
const handleExitApp = async(reason: string) => {
  global.lx.isPlayedStop = false
  exitApp(reason)
}


const registerPlaybackService = async() => {
  if (isInitialized) return

  console.log('reg services...')
  TrackPlayer.addEventListener(TPEvent.RemotePlay, () => {
    // console.log('remote-play')
    play()
  })

  TrackPlayer.addEventListener(TPEvent.RemotePause, () => {
    // console.log('remote-pause')
    void pause()
  })

  TrackPlayer.addEventListener(TPEvent.RemoteNext, () => {
    // console.log('remote-next')
    void playNext()
  })

  TrackPlayer.addEventListener(TPEvent.RemotePrevious, () => {
    // console.log('remote-previous')
    void playPrev()
  })

  TrackPlayer.addEventListener(TPEvent.RemoteStop, () => {
    // console.log('remote-stop')
    void handleExitApp('Remote Stop')
  })

  // TrackPlayer.addEventListener(TPEvent.RemoteDuck, async({ permanent, paused, ducking }) => {
  //   console.log('remote-duck')
  //   if (paused) {
  //     store.dispatch(playerAction.setStatus({ status: STATUS.pause, text: '已暂停' }))
  //     lrcPause()
  //   } else {
  //     store.dispatch(playerAction.setStatus({ status: STATUS.playing, text: '播放中...' }))
  //     TrackPlayer.getPosition().then(position => {
  //       lrcPlay(position * 1000)
  //     })
  //   }
  // })

  TrackPlayer.addEventListener(TPEvent.PlaybackError, async(err: any) => {
    console.log('playback-error', err)
    global.app_event.error()
    global.app_event.playerError()
  })

  TrackPlayer.addEventListener(TPEvent.RemoteSeek, async({ position }) => {
    global.app_event.setProgress(position as number)
  })

  TrackPlayer.addEventListener(TPEvent.PlaybackState, async info => {
    if (global.lx.gettingUrlId || isTempId()) return
    // let currentIsPlaying = false

    switch (info.state) {
      case TPState.None:
        // console.log('state', 'State.NONE')
        break
      case TPState.Ready:
      case TPState.Stopped:
      case TPState.Paused:
        global.app_event.playerPause()
        global.app_event.pause()
        break
      case TPState.Playing:
        global.app_event.playerPlaying()
        global.app_event.play()
        break
      case TPState.Buffering:
        global.app_event.pause()
        global.app_event.playerWaiting()
        break
      case TPState.Connecting:
        global.app_event.playerLoadstart()
        break
      default:
        // console.log('playback-state', info)
        break
    }
    if (global.lx.isPlayedStop) return handleExitApp('Timeout Exit')

    // console.log('currentIsPlaying', currentIsPlaying, global.lx.playInfo.isPlaying)
    // void updateMetaData(global.lx.store_playMusicInfo.musicInfo, currentIsPlaying)
  })
  const dummyIdRxp = /\/\/default$/
  /**
   * 占位静音轨续播，维持前台播放服务。
   * 用原生 repeat=Track 让占位轨自己循环，而不是靠 JS 每 2 秒 seekTo+play 续一次：
   * Android 后台/灭屏时 JS 随时可能被冻结，续不上播放就会彻底停下，
   * 进程随即被降级为 cached 并被冻结，之后取链要等回到前台才继续 ——
   * 表现就是「下一首不加载，进前台才开始加载」。交给原生循环后，
   * 整个等待取链期间只需要在切歌瞬间唤醒一次 JS（把新轨 skip 进队列）。
   * 真实轨开始播放时由 handlePlayMusic 把 repeat 重置回 Off，避免新歌被单曲循环。
   */
  const keepDummyAlive = () => {
    // 用户主动暂停/停止后不能自己复活播放
    if (isPausedByUser() || global.lx.isPlayedStop) return
    console.log('keep placeholder track alive, repeat=one')
    void TrackPlayer.setRepeatMode(RepeatMode.Track).catch(() => {})
    void TrackPlayer.seekTo(0).catch(() => {})
    void TrackPlayer.play().catch(() => {})
  }
  const handleAutoEnd = () => {
    if (global.lx.isPlayedStop) {
      void handleExitApp('Timeout Exit')
      return
    }
    keepDummyAlive()
    if (isWaitingPlay() || global.lx.gettingUrlId) return
    console.log('auto end: play next')
    // 取链异常不能让占位轨「只响不切」：loadTimeout / 回前台恢复会兜底重试
    void playNextIfAuto().catch((err) => {
      console.log('auto play next fail', err)
    })
    global.app_event.playerEnded()
    global.app_event.playerEmptied()
  }

  TrackPlayer.addEventListener(TPEvent.PlaybackTrackChanged, info => {
    // console.log('PlaybackTrackChanged====>', info)
    if (info.track == null) return
    if (global.lx.isPlayedStop) {
      void handleExitApp('Timeout Exit')
      return
    }

    const nextTrack = (info as { nextTrack?: string | number }).nextTrack
    // iOS 回传的是 track id，直接用
    if (typeof nextTrack === 'string') {
      global.lx.playerTrackId = nextTrack
      if (dummyIdRxp.test(nextTrack)) handleAutoEnd()
      return
    }

    // Android 回传的是下标（MusicManager.onTrackUpdate 只 putInt），list 与原生队列同步，可同步映射
    const nextId = getTrackIdByIndex(nextTrack)
    if (nextId) {
      global.lx.playerTrackId = nextId
      if (dummyIdRxp.test(nextId)) handleAutoEnd()
      return
    }

    // list 还没跟上时再退回 bridge + 定时器：不要无限等 getCurrentTrack，后台 bridge 卡住时切歌不会开始
    void getCurrentTrackId().then(id => {
      if (id) global.lx.playerTrackId = id
      if (isEmpty()) handleAutoEnd()
    })
    BackgroundTimer.setTimeout(() => {
      if (isWaitingPlay() || global.lx.gettingUrlId) return
      if (isEmpty()) handleAutoEnd()
    }, 1500)
  //   // if (!info.nextTrack) return
  //   // if (info.track) {
  //   //   const track = info.track.substring(0, info.track.lastIndexOf('__//'))
  //   //   const nextTrack = info.track.substring(0, info.nextTrack.lastIndexOf('__//'))
  //   //   console.log(nextTrack, track)
  //   //   if (nextTrack == track) return
  //   // }
  //   // const track = await TrackPlayer.getTrack(info.nextTrack)
  //   // if (!track) return
  //   // let newTrack
  //   // if (track.url == defaultUrl) {
  //   //   TrackPlayer.pause().then(async() => {
  //   //     isRefreshUrl = true
  //   //     retryGetUrlId = track.id
  //   //     retryGetUrlNum = 0
  //   //     try {
  //   //       newTrack = await updateTrackUrl(track)
  //   //       console.log('++++newTrack++++', newTrack)
  //   //     } catch (error) {
  //   //       console.log('error', error)
  //   //       if (error.message != '跳过播放') TrackPlayer.skipToNext()
  //   //       isRefreshUrl = false
  //   //       retryGetUrlId = null
  //   //       return
  //   //     }
  //   //     retryGetUrlId = null
  //   //     isRefreshUrl = false
  //   //     console.log(await TrackPlayer.getQueue(), null, 2)
  //   //     await TrackPlayer.play()
  //   //   })
  //   // }
  //   // store.dispatch(playerAction.playNext())
  })
  // TrackPlayer.addEventListener('playback-queue-ended', async info => {
  //   // console.log('playback-queue-ended', info)
  //   store.dispatch(playerAction.playNext())
  //   // if (!info.nextTrack) return
  //   // const track = await TrackPlayer.getTrack(info.nextTrack)
  //   // if (!track) return
  //   // // if (track.url == defaultUrl) {
  //   // //   TrackPlayer.pause()
  //   // //   getMusicUrl(track.original).then(url => {
  //   // //     TrackPlayer.updateMetadataForTrack(info.nextTrack, {
  //   // //       url,
  //   // //     })
  //   // //     TrackPlayer.play()
  //   // //   })
  //   // // }
  //   // if (!track.artwork) {
  //   //   getMusicPic(track.original).then(url => {
  //   //     console.log(url)
  //   //     TrackPlayer.updateMetadataForTrack(info.nextTrack, {
  //   //       artwork: url,
  //   //     })
  //   //   })
  //   // }
  // })
  TrackPlayer.addEventListener(TPEvent.PlaybackQueueEnded, (info) => {
    // 正在取链：继续撑住占位轨，取链完成后由 handlePlayMusic 把新轨 skip 进来
    if (isWaitingPlay() || global.lx.gettingUrlId) {
      keepDummyAlive()
      return
    }
    // 停在占位轨上（队列真正播完）时也必须续播：直接 return 会让播放停下，
    // 进程被降级冻结后只能等回前台，正是「下一首不加载」的症状。
    if (isEmpty()) {
      keepDummyAlive()
      void playNextIfAuto().catch(() => {})
      return
    }
    // 当前曲在原轨上播完、还没切到占位轨：补一次结束处理
    const position = typeof info?.position === 'number' ? info.position : 0
    if (position < 1) return
    handleAutoEnd()
  })
  // TrackPlayer.addEventListener('playback-destroy', async() => {
  //   console.log('playback-destroy')
  //   store.dispatch(playerAction.destroy())
  // })
  isInitialized = true
}


export default () => {
  if (global.lx.playerStatus.isRegisteredService) return
  console.log('handle registerPlaybackService...')
  TrackPlayer.registerPlaybackService(() => registerPlaybackService)
  global.lx.playerStatus.isRegisteredService = true
}
