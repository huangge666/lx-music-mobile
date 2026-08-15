// import { setUserApi as setUserApiAction } from '@renderer/utils/ipc'
import musicSdk from '@/utils/musicSdk'
// import apiSourceInfo from '@renderer/utils/musicSdk/api-source-info'
import { updateSetting } from './common'
import settingState from '@/store/setting/state'
import { destroyUserApi, setUserApi } from './userApi'
import { state as userApiState } from '@/store/userApi'

export const USER_API_SOURCE_LIMIT = 5
const isUserApi = (apiId: string) => /^user_api/.test(apiId)
const getConfiguredUserApiSources = () => {
  // 清理旧逻辑可能写入的内置源和重复项，避免界面只显示 4 项时
  // 配置数组实际已有 5 项，从而被上限判断错误拦截。
  return [...new Set(settingState.setting['common.apiSourceList'].filter(isUserApi))]
}

const resetApiInitPromise = () => {
  if (!global.lx.apiInitPromise[1]) return
  global.lx.apiInitPromise[0] = new Promise(resolve => {
    global.lx.apiInitPromise[1] = false
    global.lx.apiInitPromise[2] = (result: boolean) => {
      global.lx.apiInitPromise[1] = true
      resolve(result)
    }
  })
}

/**
 * 返回当前启用的源列表。没有多选配置时，兼容旧版的单源设置。
 */
export const getActiveApiSources = () => {
  const sourceList = getConfiguredUserApiSources()
  return sourceList.length ? sourceList : [settingState.setting['common.apiSource']].filter(Boolean)
}

/**
 * Native 层一次只能装载一个脚本，故所有用户源必须串行初始化。
 * 每个源都拥有独立 Promise，初始化回调据此准确归属到对应的源。
 */
let userApiInitQueue = Promise.resolve()
export const enqueueUserApiInit = (apiId: string) => {
  if (!isUserApi(apiId) || global.lx.userApiInitPromises[apiId]) return

  let resolveInit: (success: boolean) => void = () => {}
  const promise = new Promise<boolean>(resolve => {
    resolveInit = resolve
  })
  // 标记 Promise 的拒绝路径已处理，避免队列异常变成未处理的异步错误。
  const initPromise = promise.catch(() => false)
  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  global.lx.userApiInitPromises[apiId] = [initPromise, false, success => {
    global.lx.userApiInitPromises[apiId][1] = true
    resolveInit(success)
  }]

  userApiInitQueue = userApiInitQueue
    .catch(() => {})
    .then(async() => {
      try {
        await setUserApi(apiId)
      } catch (err) {
        console.log(err)
        const initState = global.lx.userApiInitPromises[apiId]
        if (initState && !initState[1]) initState[2](false)
      }
      await initPromise
    })
}

export const isUserApiReady = (apiId: string) => {
  const initState = global.lx.userApiInitPromises[apiId]
  return !!initState?.[1] && global.lx.userApiApis[apiId] != null
}
// UserApiSources 描述脚本元数据；运行时 handler 由初始化阶段动态注册，
// 因此这里返回最小的可调用结构，避免将元数据类型误用于请求函数。
export const getUserApiHandlers = (apiId: string, source: LX.Source): {
  getMusicUrl?: (songInfo: LX.Music.MusicInfo, type: LX.Quality) => { promise: Promise<{ type: LX.Quality, url: string }> }
} | undefined => global.lx.userApiApis[apiId]?.[source] as any

/**
 * 切换一个自定义源的启用状态，并确保数量上限在状态写入前生效。
 */
export const toggleApiSourceEnabled = (apiId: string) => {
  // 多选操作只以显式列表计数，不能使用 getActiveApiSources 的单源兼容回退，
  // 否则旧的 common.apiSource 会被额外算作一个已选项。
  const activeList = getConfiguredUserApiSources().filter(id => userApiState.list.some(api => api.id == id))
  const index = activeList.indexOf(apiId)

  // 必须在修改任何 Promise 状态前检查上限。此前这里先重置 apiInitPromise，
  // 超限后又直接返回，导致播放流程永久等待一个不会被 resolve 的 Promise。
  if (index < 0 && activeList.length >= USER_API_SOURCE_LIMIT) return false

  const nextList = index > -1
    ? activeList.filter(id => id != apiId)
    : [...activeList, apiId]
  const previousPrimaryId = activeList[0] ?? ''
  const nextPrimaryId = nextList[0] ?? ''

  updateSetting({
    'common.apiSource': nextPrimaryId,
    'common.apiSourceList': nextList,
  })

  if (index < 0) {
    // 只有首次选择（主源从无到有）时，播放流程才需要等待初始化。
    // 增加第二至第五个备用源不应阻塞当前主源的歌曲链接请求。
    if (!previousPrimaryId) resetApiInitPromise()
    enqueueUserApiInit(apiId)
  }

  if (previousPrimaryId != nextPrimaryId) {
    global.lx.apis = global.lx.userApiApis[nextPrimaryId] ?? {}
    global.lx.qualityList = global.lx.userApiQualityList[nextPrimaryId] ?? {}
    requestAnimationFrame(() => {
      global.state_event.apiSourceUpdated(nextPrimaryId)
    })
  }
  return true
}


export const setApiSource = (apiId: string) => {
  resetApiInitPromise()
  if (isUserApi(apiId)) {
    // 统一进入串行初始化队列，确保主源也拥有独立的 ready 状态，
    // 同时避免启动流程和手动切换流程走两套不同的加载逻辑。
    enqueueUserApiInit(apiId)
  } else {
    // @ts-expect-error
    global.lx.qualityList = musicSdk.supportQuality[apiId] ?? {}
    destroyUserApi()
    if (!global.lx.apiInitPromise[1]) global.lx.apiInitPromise[2](true)
    // apiSource.value = apiId
    // void setUserApiAction(apiId)
  }

  if (apiId != settingState.setting['common.apiSource']) {
    updateSetting({ 'common.apiSource': apiId })
    requestAnimationFrame(() => {
      global.state_event.apiSourceUpdated(apiId)
    })
  }
}

