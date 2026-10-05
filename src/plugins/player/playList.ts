import TrackPlayer, { RepeatMode, State } from 'react-native-track-player'
import BackgroundTimer from 'react-native-background-timer'
import { defaultUrl } from '@/config'
// import { action as playerAction } from '@/store/modules/player'
import settingState from '@/store/setting/state'
import playerState from '@/store/player/state'


const list: LX.Player.Track[] = []

// 锁屏后台时 RN bridge 偶发不返回。单次原生调用必须有上限，否则 playPromise 堵死后续切歌。
const NATIVE_CALL_TIMEOUT = 5000
const withNativeTimeout = async <T>(promise: Promise<T>): Promise<T | undefined> => {
  let timer: number | null = null
  try {
    return await Promise.race([
      promise,
      new Promise<undefined>((resolve) => {
        timer = BackgroundTimer.setTimeout(() => {
          resolve(undefined)
        }, NATIVE_CALL_TIMEOUT)
      }),
    ])
  } finally {
    if (timer != null) BackgroundTimer.clearTimeout(timer)
  }
}

const defaultUserAgent = 'Mozilla/5.0 (Linux; Android 10; Pixel 3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.79 Mobile Safari/537.36'
const httpRxp = /^(https?:\/\/.+|\/.+)/

export const state = {
  isPlaying: false,
  prevDuration: -1,
}

const formatMusicInfo = (musicInfo: LX.Player.PlayMusic) => {
  return 'progress' in musicInfo ? {
    id: musicInfo.id,
    pic: musicInfo.metadata.musicInfo.meta.picUrl,
    name: musicInfo.metadata.musicInfo.name,
    singer: musicInfo.metadata.musicInfo.singer,
    album: musicInfo.metadata.musicInfo.meta.albumName,
  } : {
    id: musicInfo.id,
    pic: musicInfo.meta.picUrl,
    name: musicInfo.name,
    singer: musicInfo.singer,
    album: musicInfo.meta.albumName,
  }
}

const getCurrentFullLyric = (targetId: string | null) => {
  return (settingState.setting['player.isShowBluetoothFullLyric'] && targetId &&
      playerState.musicInfo.id == targetId && playerState.musicInfo.lrc)
    ? playerState.musicInfo.lrc
    : undefined
}

const buildTracks = (musicInfo: LX.Player.PlayMusic, url?: LX.Player.Track['url'], duration?: LX.Player.Track['duration']): LX.Player.Track[] => {
  const mInfo = formatMusicInfo(musicInfo)
  const track = [] as LX.Player.Track[]
  const isShowNotificationImage = settingState.setting['player.isShowNotificationImage']
  const album = mInfo.album || undefined
  const artwork = isShowNotificationImage && mInfo.pic && httpRxp.test(mInfo.pic) ? mInfo.pic : undefined
  const lyric = getCurrentFullLyric(mInfo.id)
  if (url) {
    track.push({
      id: `${mInfo.id}__//${Math.random()}__//${url}`,
      url,
      title: mInfo.name || 'Unknow',
      artist: mInfo.singer || 'Unknow',
      album,
      artwork,
      userAgent: defaultUserAgent,
      musicId: mInfo.id,
      lyric,
      // original: { ...musicInfo },
      duration,
    })
  }
  track.push({
    id: `${mInfo.id}__//${Math.random()}__//default`,
    url: defaultUrl,
    title: mInfo.name || 'Unknow',
    artist: mInfo.singer || 'Unknow',
    album,
    artwork,
    musicId: mInfo.id,
    lyric,
    // original: { ...musicInfo },
    duration: 0,
  })
  return track
  // console.log('buildTrack', musicInfo.name, url)
}
// const buildTrack = (musicInfo: LX.Player.PlayMusic, url: LX.Player.Track['url'], duration?: LX.Player.Track['duration']): LX.Player.Track => {
//   const mInfo = formatMusicInfo(musicInfo)
//   const isShowNotificationImage = settingState.setting['player.isShowNotificationImage']
//   const album = mInfo.album || undefined
//   const artwork = isShowNotificationImage && mInfo.pic && httpRxp.test(mInfo.pic) ? mInfo.pic : undefined
//   return url
//     ? {
//         id: `${mInfo.id}__//${Math.random()}__//${url}`,
//         url,
//         title: mInfo.name || 'Unknow',
//         artist: mInfo.singer || 'Unknow',
//         album,
//         artwork,
//         userAgent: defaultUserAgent,
//         musicId: `${mInfo.id}`,
//         original: { ...musicInfo },
//         duration,
//       }
//     : {
//         id: `${mInfo.id}__//${Math.random()}__//default`,
//         url: defaultUrl,
//         title: mInfo.name || 'Unknow',
//         artist: mInfo.singer || 'Unknow',
//         album,
//         artwork,
//         musicId: `${mInfo.id}`,
//         original: { ...musicInfo },
//         duration: 0,
//       }
// }

export const isTempTrack = (trackId: string) => /\/\/default$/.test(trackId)


export const getCurrentTrackId = async() => {
  const currentTrackIndex = await TrackPlayer.getCurrentTrack()
  return list[currentTrackIndex]?.id
}
/**
 * 用原生队列下标同步取 track id。
 * Android 的 playback-track-changed 只回传下标（nextTrack: int），而 list 与原生队列严格同步，
 * 这里直接映射即可，省掉一次 bridge 往返 —— 后台切歌瞬间 bridge 可能很慢，能少一次就少一次。
 */
export const getTrackIdByIndex = (index: unknown): string | undefined => {
  if (typeof index != 'number' || index < 0) return undefined
  return list[index]?.id as string | undefined
}
export const getCurrentTrack = async() => {
  const currentTrackIndex = await TrackPlayer.getCurrentTrack()
  return list[currentTrackIndex]
}

export const updateMetaData = async(musicInfo: LX.Player.MusicInfo, isPlay: boolean, force = false) => {
  if (!force && isPlay == state.isPlaying) {
    const duration = await TrackPlayer.getDuration()
    if (state.prevDuration != duration) {
      state.prevDuration = duration
      const trackInfo = await getCurrentTrack()
      if (trackInfo && musicInfo) {
        delayUpdateMusicInfo(musicInfo)
      }
    }
  } else {
    const [duration, trackInfo] = await Promise.all([TrackPlayer.getDuration(), getCurrentTrack()])
    state.prevDuration = duration
    if (trackInfo && musicInfo) {
      delayUpdateMusicInfo(musicInfo)
    }
  }
}

let queueGen = 0
let playPromise = Promise.resolve()
let actionId = Math.random()
let enqueueSeq = 0

export const initTrackInfo = async(musicInfo: LX.Player.PlayMusic, mInfo: LX.Player.MusicInfo) => {
  queueGen++
  const tracks = buildTracks(musicInfo)
  await TrackPlayer.add(tracks).then(() => list.push(...tracks))
  const queue = await TrackPlayer.getQueue() as LX.Player.Track[]
  await TrackPlayer.skip(queue.findIndex(t => t.id == tracks[0].id))
  delayUpdateMusicInfo(mInfo)
}

const syncListFromQueue = async() => {
  const queue = ((await withNativeTimeout(TrackPlayer.getQueue())) ?? []) as LX.Player.Track[]
  list.length = 0
  list.push(...queue)
  return queue
}

/**
 * 把「已经取好链的下一首」追加到当前真实轨后面。
 * 当前曲结束时 ExoPlayer 自己切到下一首，不再依赖 JS 在切歌瞬间醒着取链。
 * 必须等当前曲的 handlePlayMusic 完成，否则会被它的 remove 把刚入队的下一首清掉。
 */
const doEnqueueNext = async(currentMusicId: string, tracks: LX.Player.Track[], isValid: () => boolean) => {
  if (!isValid()) return undefined
  const currentIndex = await withNativeTimeout(TrackPlayer.getCurrentTrack())
  if (currentIndex == null) return undefined
  const queue = ((await withNativeTimeout(TrackPlayer.getQueue())) ?? []) as LX.Player.Track[]
  if (!isValid()) return undefined
  const current = queue[currentIndex]
  // 调用方已等过上一轮 playPromise。这里再 await playPromise 会等自己，死锁。
  if (!current || current.musicId !== currentMusicId) return undefined
  // 已经停在占位轨上就来不及做原生无缝切歌，交给 JS 取链路径
  if (isTempTrack(current.id as string)) return undefined

  // URL 与歌曲都相同就保留原轨；重新 add 会丢掉原生已准备的缓冲。
  const queuedNext = queue[currentIndex + 1]
  if (queuedNext?.musicId === tracks[0].musicId && queuedNext.url === tracks[0].url) {
    await syncListFromQueue()
    return isValid() ? queuedNext.id as string : undefined
  }
  // 查询期间歌曲可能自然结束；不能继续按旧下标删除正在播放的新轨。
  if (await withNativeTimeout(TrackPlayer.getCurrentTrack()) !== currentIndex || !isValid()) return undefined
  const removeIdx: number[] = []
  for (let i = currentIndex + 1; i < queue.length; i++) removeIdx.push(i)
  if (removeIdx.length) await withNativeTimeout(TrackPlayer.remove(removeIdx))
  if (!isValid()) {
    await syncListFromQueue()
    return undefined
  }
  await withNativeTimeout(TrackPlayer.add(tracks))
  void TrackPlayer.setRepeatMode(RepeatMode.Off)
  const updatedQueue = await syncListFromQueue()
  // 超时不是写入成功，只有原生队列实际包含新轨时才能报告已准备。
  return isValid() && updatedQueue.some(track => track.id === tracks[0].id)
    ? tracks[0].id as string
    : undefined
}

export const enqueueNextMusic = async(
  currentMusicId: string,
  musicInfo: LX.Player.PlayMusic,
  url: string,
  isRequestValid: () => boolean = () => true,
): Promise<string | undefined> => {
  const tracks = buildTracks(musicInfo, url)
  const seq = ++enqueueSeq
  const requestedAction = actionId
  // 立即接到串行链尾，不能等 finally 回调才赋值，否则并发调用会共用旧链尾。
  const task = playPromise.then(async() => {
    const gen = queueGen
    return doEnqueueNext(currentMusicId, tracks, () =>
      seq === enqueueSeq && requestedAction === actionId && gen === queueGen && isRequestValid())
  }).catch(() => undefined)
  playPromise = task.then(() => {})
  return task
}


const handlePlayMusic = async(musicInfo: LX.Player.PlayMusic, url: string, time: number) => {
// console.log(tracks, time)
  queueGen++
  const currentTrackIndex = await withNativeTimeout(TrackPlayer.getCurrentTrack())
  let queue = ((await withNativeTimeout(TrackPlayer.getQueue())) ?? []) as LX.Player.Track[]
  const queuedNext = currentTrackIndex == null ? undefined : queue[currentTrackIndex + 1]
  // 手动下一首仍经过上层的选曲/取链校验，但不重建已预入队的相同资源。
  const canReuse = time === 0 && queuedNext?.musicId === musicInfo.id && queuedNext.url === url
  const tracks = canReuse ? [queuedNext] : buildTracks(musicInfo, url)
  const track = tracks[0]
  // 先改 trackId，避免 skip 过程中 PlaybackState 仍按占位轨把 Connecting/Playing 丢掉
  global.lx.playerTrackId = track.id
  if (!canReuse) {
    await withNativeTimeout(TrackPlayer.add(tracks))
    queue = await syncListFromQueue()
  } else {
    list.length = 0
    list.push(...queue)
  }
  const skipIndex = queue.findIndex(t => t.id == track.id)
  if (skipIndex < 0) return
  try {
    const skipped = await withNativeTimeout(TrackPlayer.skip(skipIndex).then(() => true))
    if (!skipped) return
  } catch { return }
  void TrackPlayer.setRepeatMode(RepeatMode.Off)

  if (!isTempTrack(track.id as string)) {
    if (time) void TrackPlayer.seekTo(time)
    if (global.lx.restorePlayInfo && currentTrackIndex == null) {
      void TrackPlayer.pause()
      global.lx.restorePlayInfo = null
    } else {
      // waitForBuffer 时 play() 可能一直不 resolve，不能 await 堵住后续切歌
      void TrackPlayer.play().catch(() => {})
    }
    global.app_event.playerLoadstart()
  }

  if (skipIndex > 0) {
    // 只清理目标之前的旧轨，保留后续缓冲与兜底轨；完成后再开放下一次队列操作。
    await withNativeTimeout(TrackPlayer.remove(Array.from({ length: skipIndex }, (_, i) => i)))
    await syncListFromQueue()
  }
}
export const playMusic = (musicInfo: LX.Player.PlayMusic, url: string, time: number) => {
  const id = actionId = Math.random()
  playPromise = playPromise.then(async() => {
    if (id != actionId) return
    await handlePlayMusic(musicInfo, url, time)
  }).catch((err: unknown) => { console.log('play queue failed', err) })
}

// let musicId = null
// let duration = 0
let prevArtwork: string | undefined
const updateMetaInfo = async(mInfo: LX.Player.MusicInfo) => {
  const isShowNotificationImage = settingState.setting['player.isShowNotificationImage']
  // const mInfo = formatMusicInfo(musicInfo)
  // console.log('+++++updateMusicPic+++++', track.artwork, track.duration)

  // if (track.musicId == musicId) {
  //   if (global.playInfo.musicInfo.img != null) artwork = global.playInfo.musicInfo.img
  //   if (track.duration != null) duration = global.playInfo.duration
  // } else {
  //   musicId = track.musicId
  //   artwork = global.playInfo.musicInfo.img
  //   duration = global.playInfo.duration || 0
  // }
  // console.log('+++++updateMetaInfo+++++', mInfo.name)
  state.isPlaying = await TrackPlayer.getState() == State.Playing
  let artwork = isShowNotificationImage ? mInfo.pic ?? prevArtwork : undefined
  if (mInfo.pic) prevArtwork = mInfo.pic
  let title: string
  let artist: string
  if (playerState.lastLyric == null) {
    title = mInfo.name ?? 'Unknow'
    artist = mInfo.singer ?? 'Unknow'
  } else {
    title = playerState.lastLyric
    artist = `${mInfo.name}${mInfo.singer ? ` - ${mInfo.singer}` : ''}`
  }
  await TrackPlayer.updateNowPlayingMetadata({
    title,
    artist,
    album: mInfo.album ?? undefined,
    artwork,
    duration: state.prevDuration || 0,
    lyric: getCurrentFullLyric(mInfo.id),
  }, state.isPlaying)
}


// 解决快速切歌导致的通知栏歌曲信息与当前播放歌曲对不上的问题
const debounceUpdateMetaInfoTools = {
  updateMetaPromise: Promise.resolve(),
  musicInfo: null as LX.Player.MusicInfo | null,
  debounce(fn: (musicInfo: LX.Player.MusicInfo) => void | Promise<void>) {
    // let delayTimer = null
    let isDelayRun = false
    let timer: number | null = null
    let _musicInfo: LX.Player.MusicInfo | null = null
    return (musicInfo: LX.Player.MusicInfo) => {
      // console.log('debounceUpdateMetaInfoTools', musicInfo)
      if (timer) {
        BackgroundTimer.clearTimeout(timer)
        timer = null
      }
      // if (delayTimer) {
      //   BackgroundTimer.clearTimeout(delayTimer)
      //   delayTimer = null
      // }
      if (isDelayRun) {
        _musicInfo = musicInfo
        timer = BackgroundTimer.setTimeout(() => {
          timer = null
          let musicInfo = _musicInfo
          _musicInfo = null
          if (!musicInfo) return
          // isDelayRun = false
          void fn(musicInfo)
        }, 500)
      } else {
        isDelayRun = true
        void fn(musicInfo)
        BackgroundTimer.setTimeout(() => {
          // delayTimer = null
          isDelayRun = false
        }, 500)
      }
    }
  },
  init() {
    return this.debounce(async(musicInfo: LX.Player.MusicInfo) => {
      this.musicInfo = musicInfo
      return this.updateMetaPromise.then(() => {
        // console.log('run')
        if (this.musicInfo?.id === musicInfo.id) {
          this.updateMetaPromise = updateMetaInfo(musicInfo)
        }
      })
    })
  },
}

export const delayUpdateMusicInfo = debounceUpdateMetaInfoTools.init()

// export const delayUpdateMusicInfo = ((fn, delay = 800) => {
//   let delayTimer = null
//   let isDelayRun = false
//   let timer = null
//   let _track = null
//   return track => {
//     _track = track
//     if (timer) {
//       BackgroundTimer.clearTimeout(timer)
//       timer = null
//     }
//     if (isDelayRun) {
//       if (delayTimer) {
//         BackgroundTimer.clearTimeout(delayTimer)
//         delayTimer = null
//       }
//       timer = BackgroundTimer.setTimeout(() => {
//         timer = null
//         let track = _track
//         _track = null
//         isDelayRun = false
//         fn(track)
//       }, delay)
//     } else {
//       isDelayRun = true
//       fn(track)
//       delayTimer = BackgroundTimer.setTimeout(() => {
//         delayTimer = null
//         isDelayRun = false
//       }, 500)
//     }
//   }
// })(track => {
//   console.log('+++++delayUpdateMusicPic+++++', track.artwork)
//   updateMetaInfo(track)
// })
