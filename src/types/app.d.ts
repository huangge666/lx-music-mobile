/* eslint-disable no-var */
import type { AppEventTypes } from '@/event/appEvent'
import type { ListEventTypes } from '@/event/listEvent'
import type { DislikeEventTypes } from '@/event/dislikeEvent'
import type { StateEventTypes } from '@/event/stateEvent'
import type { I18n } from '@/lang/i18n'
import type { Buffer as _Buffer } from 'buffer'
import type { SettingScreenIds } from '@/screens/Home/Views/Setting'

// interface Process {
//   env: {
//     NODE_ENV: 'development' | 'production'
//   }
//   versions: {
//     app: string
//   }
// }
interface GlobalData {
  fontSize: number
  gettingUrlId: string

  // event_app: AppType
  // event_list: ListType

  playerStatus: {
    isInitialized: boolean
    isRegisteredService: boolean
    isIniting: boolean
  }
  restorePlayInfo: LX.Player.SavedPlayInfo | null
  isScreenKeepAwake: boolean
  isPlayedStop: boolean
  isEnableSyncLog: boolean
  isEnableUserApiLog: boolean
  playerTrackId: string

  qualityList: LX.QualityList
  apis: Partial<LX.UserApi.UserApiSources>
  apiInitPromise: [Promise<boolean>, boolean, (success: boolean) => void]

  /**
   * 多选源支持：每个用户源（userApi）独立存储其注册到的源对应的处理函数。
   * key 为 `apiId`，value 中再按 `LX.Source` 索引各源 handler。
   * 与旧的 `apis` 字段并存：旧的 `apis` 仍保留为合并视图，供未做多源适配的代码使用。
   */
  userApiApis: Record<string, Partial<LX.UserApi.UserApiSources>>
  /**
   * 多选源支持：每个用户源独立的音质列表。key 为 `apiId`。
   */
  userApiQualityList: Record<string, LX.QualityList>
  /**
   * 多选源支持：每个用户源独立的初始化 Promise + 解析器。
   * 元素结构与 `apiInitPromise` 类似：`[Promise<boolean>, boolean, (success: boolean) => void]`。
   * 当 setUserApi 串行初始化某个 apiId 时，会先在表中创建对应条目；
   * handleStateChange 在收到该 apiId 的状态时会调用解析器，从而推动队列往下走。
   */
  userApiInitPromises: Record<string, [Promise<boolean>, boolean, (success: boolean) => void]>

  jumpMyListPosition: boolean

  settingActiveId: SettingScreenIds

  /**
   * 首页是否正在滚动中，用于防止意外误触播放歌曲
   */
  homePagerIdle: boolean

  // windowInfo: {
  //   screenW: number
  //   screenH: number
  //   fontScale: number
  //   pixelRatio: number
  //   screenPxW: number
  //   screenPxH: number
  // }

  // syncKeyInfo: LX.Sync.KeyInfo
}


declare global {
  var isDev: boolean
  var lx: GlobalData
  var i18n: I18n
  var app_event: AppEventTypes
  var list_event: ListEventTypes
  var dislike_event: DislikeEventTypes
  var state_event: StateEventTypes

  var Buffer: typeof _Buffer

  module NodeJS {
    interface ProcessVersions {
      app: string
    }
  }
  // var process: Process
}
