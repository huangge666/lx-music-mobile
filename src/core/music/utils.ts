import musicSdk, { findMusic } from '@/utils/musicSdk'
import {
  // getOtherSource as getOtherSourceFromStore,
  // saveOtherSource as saveOtherSourceFromStore,
  getMusicUrl as getStoreMusicUrl,
  getPlayerLyric as getStoreLyric,
} from '@/utils/data'
import { langS2T, toNewMusicInfo, toOldMusicInfo } from '@/utils'
import { assertApiSupport } from '@/utils/tools'
import settingState from '@/store/setting/state'
import { requestMsg } from '@/utils/message'
import BackgroundTimer from 'react-native-background-timer'
import { apis } from '@/utils/musicSdk/api-source'
import { getActiveApiSources, isUserApiReady, getUserApiHandlers } from '@/core/apiSource'


const getOtherSourcePromises = new Map()
export const existTimeExp = /\[\d{1,2}:.*\d{1,4}\]/
/**
 * 换源搜索结果缓存
 * 使用字符串键（source_id）而非对象引用，确保同一首歌的不同实例也能命中缓存
 * 采用 LRU 策略：超过容量时淘汰最早的条目，而非全部清空
 */
const OTHER_SOURCE_CACHE_MAX = 30
const otherSourceCache = new Map<string, LX.Music.MusicInfoOnline[]>()

/** 生成换源缓存键 */
const getOtherSourceCacheKey = (musicInfo: LX.Music.MusicInfo | LX.Download.ListItem): string => {
  if ('progress' in musicInfo) return `local_${musicInfo.id}`
  return `${musicInfo.source}_${musicInfo.id}`
}

export const getOtherSource = async(musicInfo: LX.Music.MusicInfo | LX.Download.ListItem, isRefresh = false): Promise<LX.Music.MusicInfoOnline[]> => {
  // if (!isRefresh) {
  //   const cachedInfo = await getOtherSourceFromStore(musicInfo.id)
  //   if (cachedInfo.length) return cachedInfo
  // }
  const cacheKey = getOtherSourceCacheKey(musicInfo)
  if (!isRefresh && otherSourceCache.has(cacheKey)) {
    // LRU: 将命中的条目移到末尾（最近使用）
    const cached = otherSourceCache.get(cacheKey)!
    otherSourceCache.delete(cacheKey)
    otherSourceCache.set(cacheKey, cached)
    return cached
  }
  let key: string
  let searchMusicInfo: {
    name: string
    singer: string
    source: string
    albumName: string
    interval: string
  }
  if ('progress' in musicInfo) {
    key = `local_${musicInfo.id}`
    searchMusicInfo = {
      name: musicInfo.metadata.musicInfo.name,
      singer: musicInfo.metadata.musicInfo.singer,
      source: musicInfo.metadata.musicInfo.source,
      albumName: musicInfo.metadata.musicInfo.meta.albumName,
      interval: musicInfo.metadata.musicInfo.interval ?? '',
    }
  } else {
    key = `${musicInfo.source}_${musicInfo.id}`
    searchMusicInfo = {
      name: musicInfo.name,
      singer: musicInfo.singer,
      source: musicInfo.source,
      albumName: musicInfo.meta.albumName,
      interval: musicInfo.interval ?? '',
    }
  }
  if (getOtherSourcePromises.has(key)) return getOtherSourcePromises.get(key)

  const promise = new Promise<LX.Music.MusicInfoOnline[]>((resolve, reject) => {
    let timeout: null | number = BackgroundTimer.setTimeout(() => {
      timeout = null
      reject(new Error('find music timeout'))
    }, 12_000)
    findMusic(searchMusicInfo).then((otherSource) => {
      // LRU 淘汰：超过容量时删除最早的条目（Map 迭代顺序为插入顺序）
      if (otherSourceCache.size >= OTHER_SOURCE_CACHE_MAX) {
        const firstKey = otherSourceCache.keys().next().value
        if (firstKey !== undefined) otherSourceCache.delete(firstKey)
      }
      const source = otherSource.map(toNewMusicInfo) as LX.Music.MusicInfoOnline[]
      otherSourceCache.set(cacheKey, source)
      resolve(source)
    }).catch(reject).finally(() => {
      if (timeout) BackgroundTimer.clearTimeout(timeout)
    })
  }).then((otherSource) => {
    // if (otherSource.length) void saveOtherSourceFromStore(musicInfo.id, otherSource)
    return otherSource
  }).finally(() => {
    if (getOtherSourcePromises.has(key)) getOtherSourcePromises.delete(key)
  })
  getOtherSourcePromises.set(key, promise)
  return promise
}


export const buildLyricInfo = async(lyricInfo: MakeOptional<LX.Player.LyricInfo, 'rawlrcInfo'>): Promise<LX.Player.LyricInfo> => {
  if (!settingState.setting['player.isS2t']) {
    // @ts-expect-error
    if (lyricInfo.rawlrcInfo) return lyricInfo
    return { ...lyricInfo, rawlrcInfo: { ...lyricInfo } }
  }

  if (settingState.setting['player.isS2t']) {
    const tasks = [
      lyricInfo.lyric ? langS2T(lyricInfo.lyric) : Promise.resolve(''),
      lyricInfo.tlyric ? langS2T(lyricInfo.tlyric) : Promise.resolve(''),
      lyricInfo.rlyric ? langS2T(lyricInfo.rlyric) : Promise.resolve(''),
      lyricInfo.lxlyric ? langS2T(lyricInfo.lxlyric) : Promise.resolve(''),
    ]
    if (lyricInfo.rawlrcInfo) {
      tasks.push(lyricInfo.lyric ? langS2T(lyricInfo.lyric) : Promise.resolve(''))
      tasks.push(lyricInfo.tlyric ? langS2T(lyricInfo.tlyric) : Promise.resolve(''))
      tasks.push(lyricInfo.rlyric ? langS2T(lyricInfo.rlyric) : Promise.resolve(''))
      tasks.push(lyricInfo.lxlyric ? langS2T(lyricInfo.lxlyric) : Promise.resolve(''))
    }
    return Promise.all(tasks).then(([lyric, tlyric, rlyric, lxlyric, lyric_raw, tlyric_raw, rlyric_raw, lxlyric_raw]) => {
      const rawlrcInfo = lyric_raw ? {
        lyric: lyric_raw,
        tlyric: tlyric_raw,
        rlyric: rlyric_raw,
        lxlyric: lxlyric_raw,
      } : {
        lyric,
        tlyric,
        rlyric,
        lxlyric,
      }
      return {
        lyric,
        tlyric,
        rlyric,
        lxlyric,
        rawlrcInfo,
      }
    })
  }

  // @ts-expect-error
  return lyricInfo.rawlrcInfo ? lyricInfo : { ...lyricInfo, rawlrcInfo: { ...lyricInfo } }
}

export const getCachedLyricInfo = async(musicInfo: LX.Music.MusicInfo): Promise<LX.Player.LyricInfo | null> => {
  let lrcInfo = await getStoreLyric(musicInfo)
  // lrcInfo = {}
  if (existTimeExp.test(lrcInfo.lyric) && lrcInfo.tlyric != null) {
    // if (musicInfo.lrc.startsWith('\ufeff[id:$00000000]')) {
    //   let str = musicInfo.lrc.replace('\ufeff[id:$00000000]\n', '')
    //   commit('setLrc', { musicInfo, lyric: str, tlyric: musicInfo.tlrc, lxlyric: musicInfo.tlrc })
    // } else if (musicInfo.lrc.startsWith('[id:$00000000]')) {
    //   let str = musicInfo.lrc.replace('[id:$00000000]\n', '')
    //   commit('setLrc', { musicInfo, lyric: str, tlyric: musicInfo.tlrc, lxlyric: musicInfo.tlrc })
    // }

    // if (lrcInfo.lxlyric == null) {
    //   switch (musicInfo.source) {
    //     case 'kg':
    //     case 'kw':
    //     case 'mg':
    //       break
    //     default:
    //       return lrcInfo
    //   }
    // } else
    if (lrcInfo.rlyric == null) {
      if (!['wy', 'kg'].includes(musicInfo.source)) return lrcInfo
    } else return lrcInfo
  }
  return null
}

export const getOnlineOtherSourceMusicUrlByLocal = async(musicInfo: LX.Music.MusicInfoLocal, isRefresh: boolean): Promise<{
  url: string
  quality: LX.Quality
  isFromCache: boolean
}> => {
  if (!await global.lx.apiInitPromise[0]) throw new Error('source init failed')

  const quality = '128k'

  const cachedUrl = await getStoreMusicUrl(musicInfo, quality)
  if (cachedUrl && !isRefresh) return { url: cachedUrl, quality, isFromCache: true }

  let reqPromise
  try {
    reqPromise = apis('local').getMusicUrl(toOldMusicInfo(musicInfo), null).promise
  } catch (err: any) {
    reqPromise = Promise.reject(err)
  }

  return reqPromise.then(({ url }: { url: string }) => {
    return { url, quality, isFromCache: false }
  })
}

export const getOnlineOtherSourceLyricByLocal = async(musicInfo: LX.Music.MusicInfoLocal, isRefresh: boolean): Promise<{
  lyricInfo: LX.Music.LyricInfo
  isFromCache: boolean
}> => {
  if (!await global.lx.apiInitPromise[0]) throw new Error('source init failed')

  const lyricInfo = await getCachedLyricInfo(musicInfo)
  if (lyricInfo && !isRefresh) return { lyricInfo, isFromCache: true }

  let reqPromise
  try {
    reqPromise = apis('local').getLyric(toOldMusicInfo(musicInfo)).promise
  } catch (err: any) {
    reqPromise = Promise.reject(err)
  }

  return reqPromise.then((lyricInfo: LX.Music.LyricInfo) => {
    return { lyricInfo, isFromCache: false }
  })
}

export const getOnlineOtherSourcePicByLocal = async(musicInfo: LX.Music.MusicInfoLocal): Promise<{
  url: string
}> => {
  if (!await global.lx.apiInitPromise[0]) throw new Error('source init failed')

  let reqPromise
  try {
    reqPromise = apis('local').getPic(toOldMusicInfo(musicInfo)).promise
  } catch (err: any) {
    reqPromise = Promise.reject(err)
  }

  return reqPromise.then((url: string) => {
    return { url }
  })
}

export const TRY_QUALITYS_LIST = ['flac24bit', 'flac', '320k'] as const
type TryQualityType = typeof TRY_QUALITYS_LIST[number]
export const getPlayQuality = (highQuality: LX.Quality, musicInfo: LX.Music.MusicInfoOnline): LX.Quality => {
  let type: LX.Quality = '128k'
  if (TRY_QUALITYS_LIST.includes(highQuality as TryQualityType)) {
    let list = global.lx.qualityList[musicInfo.source]

    let t = TRY_QUALITYS_LIST
      .slice(TRY_QUALITYS_LIST.indexOf(highQuality as TryQualityType))
      .find(q => musicInfo.meta._qualitys[q] && list?.includes(q))

    if (t) type = t
  }
  return type
}

/**
 * 逐级降低音质的完整列表（从高到低）
 * 用于换源时逐级尝试，确保不会因为单一音质不可用就跳过整个源
 */
const QUALITY_FALLBACK_LIST: LX.Quality[] = ['flac24bit', 'flac', 'ape', 'wav', '320k', '192k', '128k']

/**
 * 获取指定音质及其以下的可用降级音质列表
 * @param startQuality 起始音质
 * @param musicInfo 歌曲信息
 * @returns 从起始音质逐级降低的可用音质列表
 */
const getQualityFallbacks = (startQuality: LX.Quality, musicInfo: LX.Music.MusicInfoOnline): LX.Quality[] => {
  const list = global.lx.qualityList[musicInfo.source]
  const startIdx = QUALITY_FALLBACK_LIST.indexOf(startQuality)
  // 如果起始音质不在列表中，直接返回 128k
  if (startIdx < 0) return ['128k']
  // 从起始音质开始，逐级向下筛选该源支持的音质
  return QUALITY_FALLBACK_LIST.slice(startIdx).filter(q => musicInfo.meta._qualitys[q] && (!list || list.includes(q)))
}

/** 单个源请求的超时时间（毫秒），防止某个源挂起阻塞整条换源链 */
const SOURCE_REQUEST_TIMEOUT = 15_000
/** 换源递归的最大尝试次数，防止极端情况下无限递归 */
const MAX_TOGGLE_ATTEMPTS = 10

/**
 * 为请求 Promise 添加超时保护
 * 超时后 reject，避免某个无响应的源阻塞后续换源尝试
 */
const withTimeout = <T>(promise: Promise<T>, ms: number, label: string): Promise<T> => {
  return new Promise<T>((resolve, reject) => {
    const timer = BackgroundTimer.setTimeout(() => {
      reject(new Error(`${label} timeout (${ms}ms)`))
    }, ms)
    promise.then((result) => {
      BackgroundTimer.clearTimeout(timer)
      resolve(result)
    }).catch((err) => {
      BackgroundTimer.clearTimeout(timer)
      reject(err)
    })
  })
}

/**
 * 多选源回退：当主源的 handler 不支持某平台或请求失败时，
 * 遍历其他已初始化的用户 API 源，尝试用它们的 handler 获取 URL。
 * 这解决了多源模式下主源不支持原始平台导致搜索结果被跳过的问题。
 * @returns URL 和实际音质，或 null 表示所有备用用户源均失败
 */
const tryOtherUserApiForMusicUrl = async(musicInfo: LX.Music.MusicInfoOnline, targetQuality: LX.Quality): Promise<{ url: string, type: LX.Quality } | null> => {
  const activeList = getActiveApiSources()
  const primaryApiId = settingState.setting['common.apiSource']
  const userApiIds = activeList.filter(id => /^user_api/.test(id) && id != primaryApiId)
  if (userApiIds.length < 1) return null

  const oldMusicInfo = toOldMusicInfo(musicInfo) as LX.Music.MusicInfo

  for (const apiId of userApiIds) {
    if (!isUserApiReady(apiId)) continue
    const handlers = getUserApiHandlers(apiId, musicInfo.source)
    if (!handlers?.getMusicUrl) continue
    const getMusicUrlHandler = handlers.getMusicUrl
    try {
      const result = await withTimeout<{ url: string, type: LX.Quality }>(
        getMusicUrlHandler(oldMusicInfo, targetQuality).promise,
        SOURCE_REQUEST_TIMEOUT,
        `user api ${apiId} for ${musicInfo.source}`,
      )
      if (result.url) {
        console.log('tryOtherUserApiForMusicUrl: success with', apiId, 'for source', musicInfo.source)
        return result
      }
    } catch (e) {
      console.log('tryOtherUserApiForMusicUrl: failed with', apiId, e)
    }
  }
  return null
}

export const getOnlineOtherSourceMusicUrl = async({ musicInfos, quality, onToggleSource, isRefresh, retryedSource = [], currentMusicInfo, qualityFallbacks, attemptCount = 0, isAborted, excludeMusicIds = [] }: {
  musicInfos: LX.Music.MusicInfoOnline[]
  quality?: LX.Quality
  onToggleSource: (musicInfo?: LX.Music.MusicInfoOnline) => void
  isRefresh: boolean
  retryedSource?: LX.OnlineSource[]
  /** 当前正在尝试的源（音质降级重试时传入） */
  currentMusicInfo?: LX.Music.MusicInfoOnline
  /** 当前源剩余的待尝试音质列表（逐级降级用） */
  qualityFallbacks?: LX.Quality[]
  /** 当前递归尝试次数（内部使用，防止无限递归） */
  attemptCount?: number
  /** 中止检查回调：返回 true 时停止换源（如用户已切歌） */
  isAborted?: () => boolean
  /** 需要排除的歌曲 ID 列表（如原始源上已失败的同一首歌） */
  excludeMusicIds?: string[]
}): Promise<{
  url: string
  musicInfo: LX.Music.MusicInfoOnline
  quality: LX.Quality
  isFromCache: boolean
}> => {
  if (!await global.lx.apiInitPromise[0]) throw new Error('source init failed')

  // 检查是否已中止（用户切歌、停止播放等场景）
  if (isAborted?.()) throw new Error('toggle source aborted')
  // 防止极端情况下无限递归
  if (attemptCount >= MAX_TOGGLE_ATTEMPTS) throw new Error('toggle source max attempts reached')

  let musicInfo: LX.Music.MusicInfoOnline | null = null
  let itemQuality: LX.Quality | null = null
  let remainingFallbacks: LX.Quality[] = []

  if (currentMusicInfo && qualityFallbacks?.length) {
    // 继续尝试当前源的下一个降级音质
    musicInfo = currentMusicInfo
    itemQuality = qualityFallbacks[0]
    remainingFallbacks = qualityFallbacks.slice(1)
  } else {
    // 选取下一个可用源
    // eslint-disable-next-line no-cond-assign
    while (musicInfo = (musicInfos.shift()!)) {
      // 跳过已排除的歌曲条目（如原始源上已失败的同一首歌）
      if (excludeMusicIds.includes(musicInfo.id)) continue
      if (retryedSource.includes(musicInfo.source)) continue
      retryedSource.push(musicInfo.source)
      if (!assertApiSupport(musicInfo.source)) continue
      // 逐级降低音质：不再因为单一音质不可用就跳过整个源，
      // 而是从目标音质开始逐级向下查找该源支持的可用音质
      const targetQuality = quality ?? getPlayQuality(settingState.setting['player.playQuality'], musicInfo)
      const fallbacks = getQualityFallbacks(targetQuality, musicInfo)
      if (!fallbacks.length) continue
      itemQuality = fallbacks[0]
      remainingFallbacks = fallbacks.slice(1)

      console.log('try toggle to: ', musicInfo.source, musicInfo.name, musicInfo.singer, musicInfo.interval, 'quality:', itemQuality)
      onToggleSource(musicInfo)
      break
    }
    if (!musicInfo || !itemQuality) throw new Error(global.i18n.t('toggle_source_failed'))
  }

  const cachedUrl = await getStoreMusicUrl(musicInfo, itemQuality)
  if (cachedUrl && !isRefresh) return { url: cachedUrl, musicInfo, quality: itemQuality, isFromCache: true }

  let reqPromise
  try {
    reqPromise = musicSdk[musicInfo.source].getMusicUrl(toOldMusicInfo(musicInfo), itemQuality).promise
  } catch (err: any) {
    reqPromise = Promise.reject(err)
  }
  // 为每个源的请求添加超时保护，防止某个源无响应阻塞整条换源链
  // eslint-disable-next-line @typescript-eslint/promise-function-async
  return withTimeout<{ url: string, type: LX.Quality }>(reqPromise, SOURCE_REQUEST_TIMEOUT, `source ${musicInfo.source}`).then(({ url, type }) => {
    return { musicInfo, url, quality: type, isFromCache: false }
    // eslint-disable-next-line @typescript-eslint/promise-function-async
  }).catch(async(err: any) => {
    if (err.message == requestMsg.tooManyRequests) throw err
    console.log(err)

    // 多源模式下主源可能不支持当前平台，先尝试其他已初始化用户源的同平台 handler。
    // 备用源返回成功后直接结束当前条目，避免误跳到其他平台。
    const otherApiResult = await tryOtherUserApiForMusicUrl(musicInfo, itemQuality)
    if (otherApiResult) {
      return { musicInfo, url: otherApiResult.url, quality: otherApiResult.type, isFromCache: false }
    }

    // 如果当前源还有剩余音质可尝试，先降级音质再试
    if (remainingFallbacks.length) {
      console.log('quality fallback, trying next quality:', remainingFallbacks[0], 'for source:', musicInfo.source)
      return getOnlineOtherSourceMusicUrl({ musicInfos, quality, onToggleSource, isRefresh, retryedSource, currentMusicInfo: musicInfo, qualityFallbacks: remainingFallbacks, attemptCount: attemptCount + 1, isAborted, excludeMusicIds })
    }
    // 当前源所有音质都失败了，切换到下一个源
    return getOnlineOtherSourceMusicUrl({ musicInfos, quality, onToggleSource, isRefresh, retryedSource, attemptCount: attemptCount + 1, isAborted, excludeMusicIds })
  })
}

/**
 * 获取在线音乐URL
 */
export const handleGetOnlineMusicUrl = async({ musicInfo, quality, onToggleSource, isRefresh, allowToggleSource, isAborted }: {
  musicInfo: LX.Music.MusicInfoOnline
  quality?: LX.Quality
  isRefresh: boolean
  allowToggleSource: boolean
  onToggleSource: (musicInfo?: LX.Music.MusicInfoOnline) => void
  /** 中止检查回调：返回 true 时停止换源（如用户已切歌） */
  isAborted?: () => boolean
}): Promise<{
  url: string
  musicInfo: LX.Music.MusicInfoOnline
  quality: LX.Quality
  isFromCache: boolean
}> => {
  if (!await global.lx.apiInitPromise[0]) throw new Error('source init failed')
  // console.log(musicInfo.source)
  const targetQuality = quality ?? getPlayQuality(settingState.setting['player.playQuality'], musicInfo)

  let reqPromise
  try {
    reqPromise = musicSdk[musicInfo.source].getMusicUrl(toOldMusicInfo(musicInfo), targetQuality).promise
  } catch (err: any) {
    reqPromise = Promise.reject(err)
  }
  return reqPromise.then(({ url, type }: { url: string, type: LX.Quality }) => {
    return { musicInfo, url, quality: type, isFromCache: false }
  }).catch(async(err: any) => {
    console.log(err)
    if (!allowToggleSource || err.message == requestMsg.tooManyRequests) throw err

    // 第一步：在原始源上尝试音质降级
    // 歌曲在原始平台存在但当前音质不可用时，先尝试降低音质获取
    const fallbacks = getQualityFallbacks(targetQuality, musicInfo)
    if (fallbacks.length > 1) {
      // fallbacks[0] 是当前已失败的音质，从第二个开始尝试
      const remainingFallbacks = fallbacks.slice(1)
      console.log('original source quality fallback, trying:', remainingFallbacks[0], 'for source:', musicInfo.source)
      try {
        const result = await getOnlineOtherSourceMusicUrl({
          musicInfos: [],
          quality,
          onToggleSource,
          isRefresh,
          retryedSource: [],
          currentMusicInfo: musicInfo,
          qualityFallbacks: remainingFallbacks,
          isAborted,
        })
        return result
      } catch (fallbackErr: any) {
        // 音质降级也失败了，继续进入换源搜索
        console.log('original source quality fallback failed:', fallbackErr.message)
      }
    }

    // 第二步：搜索其他源（包括原始平台的其他条目）
    onToggleSource()
    // eslint-disable-next-line @typescript-eslint/promise-function-async
    return getOtherSource(musicInfo).then(otherSource => {
      // console.log('find otherSource', otherSource.length)
      if (otherSource.length) {
        return getOnlineOtherSourceMusicUrl({
          musicInfos: [...otherSource],
          onToggleSource,
          quality,
          isRefresh,
          // 不再预先排除原始源，允许搜索到原始平台的其他条目
          retryedSource: [],
          // 排除已失败的同一首歌条目，避免重复请求
          excludeMusicIds: [musicInfo.id],
          isAborted,
        })
      }
      throw err
    })
  })
}


export const getOnlineOtherSourcePicUrl = async({ musicInfos, onToggleSource, isRefresh, retryedSource = [], excludeMusicIds = [] }: {
  musicInfos: LX.Music.MusicInfoOnline[]
  onToggleSource: (musicInfo?: LX.Music.MusicInfoOnline) => void
  isRefresh: boolean
  retryedSource?: LX.OnlineSource[]
  /** 需要排除的歌曲 ID 列表（如原始源上已失败的同一首歌） */
  excludeMusicIds?: string[]
}): Promise<{
  url: string
  musicInfo: LX.Music.MusicInfoOnline
  isFromCache: boolean
}> => {
  let musicInfo: LX.Music.MusicInfoOnline | null = null
  // eslint-disable-next-line no-cond-assign
  while (musicInfo = (musicInfos.shift()!)) {
    // 跳过已排除的歌曲条目
    if (excludeMusicIds.includes(musicInfo.id)) continue
    if (retryedSource.includes(musicInfo.source)) continue
    retryedSource.push(musicInfo.source)
    // if (!assertApiSupport(musicInfo.source)) continue
    console.log('try toggle to: ', musicInfo.source, musicInfo.name, musicInfo.singer, musicInfo.interval)
    onToggleSource(musicInfo)
    break
  }
  if (!musicInfo) throw new Error(global.i18n.t('toggle_source_failed'))

  if (musicInfo.meta.picUrl && !isRefresh) return { musicInfo, url: musicInfo.meta.picUrl, isFromCache: true }

  let reqPromise
  try {
    reqPromise = musicSdk[musicInfo.source].getPic(toOldMusicInfo(musicInfo))
  } catch (err: any) {
    reqPromise = Promise.reject(err)
  }
  // retryedSource.includes(musicInfo.source)
  // 添加超时保护，防止某个源无响应阻塞封面换源链
  return withTimeout<string>(reqPromise, SOURCE_REQUEST_TIMEOUT, `pic source ${musicInfo.source}`).then((url) => {
    return { musicInfo, url, isFromCache: false }
    // eslint-disable-next-line @typescript-eslint/promise-function-async
  }).catch((err: any) => {
    console.log(err)
    return getOnlineOtherSourcePicUrl({ musicInfos, onToggleSource, isRefresh, retryedSource, excludeMusicIds })
  })
}

/**
 * 获取在线歌曲封面
 */
export const handleGetOnlinePicUrl = async({ musicInfo, isRefresh, onToggleSource, allowToggleSource }: {
  musicInfo: LX.Music.MusicInfoOnline
  onToggleSource: (musicInfo?: LX.Music.MusicInfoOnline) => void
  isRefresh: boolean
  allowToggleSource: boolean
}): Promise<{
  url: string
  musicInfo: LX.Music.MusicInfoOnline
  isFromCache: boolean
}> => {
  // console.log(musicInfo.source)
  let reqPromise
  try {
    reqPromise = musicSdk[musicInfo.source].getPic(toOldMusicInfo(musicInfo))
  } catch (err) {
    reqPromise = Promise.reject(err)
  }
  return reqPromise.then((url: string) => {
    return { musicInfo, url, isFromCache: false }
  }).catch(async(err: any) => {
    console.log(err)
    if (!allowToggleSource) throw err
    onToggleSource()
    // eslint-disable-next-line @typescript-eslint/promise-function-async
    return getOtherSource(musicInfo).then(otherSource => {
      // console.log('find otherSource', otherSource.length)
      if (otherSource.length) {
        return getOnlineOtherSourcePicUrl({
          musicInfos: [...otherSource],
          onToggleSource,
          isRefresh,
          // 不再预先排除原始源，允许搜索到原始平台的其他条目
          retryedSource: [],
          // 排除已失败的同一首歌条目，避免重复请求
          excludeMusicIds: [musicInfo.id],
        })
      }
      throw err
    })
  })
}


export const getOnlineOtherSourceLyricInfo = async({ musicInfos, onToggleSource, isRefresh, retryedSource = [], excludeMusicIds = [] }: {
  musicInfos: LX.Music.MusicInfoOnline[]
  onToggleSource: (musicInfo?: LX.Music.MusicInfoOnline) => void
  isRefresh: boolean
  retryedSource?: LX.OnlineSource[]
  /** 需要排除的歌曲 ID 列表（如原始源上已失败的同一首歌） */
  excludeMusicIds?: string[]
}): Promise<{
  lyricInfo: LX.Music.LyricInfo | LX.Player.LyricInfo
  musicInfo: LX.Music.MusicInfoOnline
  isFromCache: boolean
}> => {
  let musicInfo: LX.Music.MusicInfoOnline | null = null
  // eslint-disable-next-line no-cond-assign
  while (musicInfo = (musicInfos.shift()!)) {
    // 跳过已排除的歌曲条目
    if (excludeMusicIds.includes(musicInfo.id)) continue
    if (retryedSource.includes(musicInfo.source)) continue
    retryedSource.push(musicInfo.source)
    // if (!assertApiSupport(musicInfo.source)) continue
    console.log('try toggle to: ', musicInfo.source, musicInfo.name, musicInfo.singer, musicInfo.interval)
    onToggleSource(musicInfo)
    break
  }
  if (!musicInfo) throw new Error(global.i18n.t('toggle_source_failed'))

  if (!isRefresh) {
    const lyricInfo = await getCachedLyricInfo(musicInfo)
    if (lyricInfo) return { musicInfo, lyricInfo, isFromCache: true }
  }

  let reqPromise
  try {
    // TODO: remove any type
    reqPromise = (musicSdk[musicInfo.source].getLyric(toOldMusicInfo(musicInfo)) as any).promise
  } catch (err: any) {
    reqPromise = Promise.reject(err)
  }
  // retryedSource.includes(musicInfo.source)
  // 添加超时保护，防止某个源无响应阻塞歌词换源链
  return withTimeout<LX.Music.LyricInfo>(reqPromise, SOURCE_REQUEST_TIMEOUT, `lyric source ${musicInfo.source}`).then(async(lyricInfo) => {
    return existTimeExp.test(lyricInfo.lyric) ? {
      lyricInfo,
      musicInfo,
      isFromCache: false,
    } : Promise.reject(new Error('failed'))
    // eslint-disable-next-line @typescript-eslint/promise-function-async
  }).catch((err: any) => {
    console.log(err)
    return getOnlineOtherSourceLyricInfo({ musicInfos, onToggleSource, isRefresh, retryedSource, excludeMusicIds })
  })
}

/**
 * 获取在线歌词信息
 */
export const handleGetOnlineLyricInfo = async({ musicInfo, onToggleSource, isRefresh, allowToggleSource }: {
  musicInfo: LX.Music.MusicInfoOnline
  onToggleSource: (musicInfo?: LX.Music.MusicInfoOnline) => void
  isRefresh: boolean
  allowToggleSource: boolean
}): Promise<{
  musicInfo: LX.Music.MusicInfoOnline
  lyricInfo: LX.Music.LyricInfo | LX.Player.LyricInfo
  isFromCache: boolean
}> => {
  // console.log(musicInfo.source)
  let reqPromise
  try {
    // TODO: remove any type
    reqPromise = (musicSdk[musicInfo.source].getLyric(toOldMusicInfo(musicInfo)) as any).promise
  } catch (err) {
    reqPromise = Promise.reject(err)
  }
  return reqPromise.then(async(lyricInfo: LX.Music.LyricInfo) => {
    return existTimeExp.test(lyricInfo.lyric) ? {
      musicInfo,
      lyricInfo,
      isFromCache: false,
    } : Promise.reject(new Error('failed'))
  }).catch(async(err: any) => {
    console.log(err)
    if (!allowToggleSource) throw err

    onToggleSource()
    // eslint-disable-next-line @typescript-eslint/promise-function-async
    return getOtherSource(musicInfo).then(otherSource => {
      // console.log('find otherSource', otherSource.length)
      if (otherSource.length) {
        return getOnlineOtherSourceLyricInfo({
          musicInfos: [...otherSource],
          onToggleSource,
          isRefresh,
          // 不再预先排除原始源，允许搜索到原始平台的其他条目
          retryedSource: [],
          // 排除已失败的同一首歌条目，避免重复请求
          excludeMusicIds: [musicInfo.id],
        })
      }
      throw err
    })
  })
}
