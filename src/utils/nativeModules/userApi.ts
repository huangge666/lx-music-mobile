import { NativeEventEmitter, NativeModules } from 'react-native'

const { UserApiModule } = NativeModules

const loadScriptInfoMap = new Map<string, LX.UserApi.UserApiInfo>()
export const loadScript = (info: LX.UserApi.UserApiInfo & { script: string }) => {
  loadScriptInfoMap.set(info.id, info)
  UserApiModule.loadScript({
    id: info.id,
    name: info.name,
    description: info.description,
    version: info.version ?? '',
    author: info.author ?? '',
    homepage: info.homepage ?? '',
    script: info.script,
  })
}

export interface SendResponseParams {
  apiId: string
  requestKey: string
  error: string | null
  response: {
    statusCode: number
    statusMessage: string
    headers: Record<string, string>
    body: any
  } | null
}
export interface SendActions {
  request: LX.UserApi.UserApiRequestParams
  response: SendResponseParams
}
export const sendAction = <T extends keyof SendActions>(action: T, data: SendActions[T]) => {
  const apiId = 'apiId' in data ? data.apiId : ''
  UserApiModule.sendAction(apiId, action, JSON.stringify(data))
}

// export const clearAppCache = CacheModule.clearAppCache as () => Promise<void>

export interface InitParams {
  status: boolean
  errorMessage: string
  info: LX.UserApi.UserApiInfo
}

export interface ResponseParams {
  status: boolean
  errorMessage?: string
  requestKey: string
  result: any
}
export interface UpdateInfoParams {
  name: string
  log: string
  updateUrl: string
}
export interface RequestParams {
  requestKey: string
  url: string
  options: {
    method: string
    data: any
    timeout: number
    headers: any
    binary: boolean
  }
}
export type CancelRequestParams = string

export interface Actions {
  init: InitParams
  request: RequestParams
  cancelRequest: CancelRequestParams
  response: ResponseParams
  showUpdateAlert: UpdateInfoParams
  log: string
}
export type ActionsEvent =
  | { action: 'request', apiId: string, data: RequestParams }
  | { [K in Exclude<keyof Actions, 'request'>]: { action: K, data: Actions[K] } }[Exclude<keyof Actions, 'request'>]

export const onScriptAction = (handler: (event: ActionsEvent) => void): () => void => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  const eventEmitter = new NativeEventEmitter(UserApiModule)
  const eventListener = eventEmitter.addListener('api-action', event => {
    if (event.data) event.data = JSON.parse(event.data as string)
    const apiId = typeof event.apiId == 'string' ? event.apiId : ''
    const apiInfo = apiId ? loadScriptInfoMap.get(apiId as string) : null
    if (event.action == 'init') {
      if (event.data.info) event.data.info = { ...apiInfo, ...event.data.info, id: apiId || apiInfo?.id }
      else event.data.info = { ...apiInfo, id: apiId || apiInfo?.id }
    } else if (event.action == 'showUpdateAlert') {
      if (!apiInfo?.allowShowUpdateAlert) return
    }
    handler(event as ActionsEvent)
  })

  return () => {
    eventListener.remove()
  }
}

export const destroy = (apiId?: string) => {
  if (apiId) {
    UserApiModule.destroy(apiId)
    loadScriptInfoMap.delete(apiId)
    return
  }

  // 兼容未重新安装原生包的旧版本：旧版 UserApiModule 只有 destroy()，
  // 直接调用 destroyAll 会在启动切换到内置源时触发 "is not a function"。
  if (typeof UserApiModule.destroyAll == 'function') {
    UserApiModule.destroyAll()
  } else if (typeof UserApiModule.destroy == 'function') {
    UserApiModule.destroy()
  }
  loadScriptInfoMap.clear()
}
