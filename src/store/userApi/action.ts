import { state } from './state'
import { event } from './event'

export const setStatus = (apiId: string, status: LX.UserApi.UserApiStatus['status'], message?: LX.UserApi.UserApiStatus['message']) => {
  if (!state.status[apiId]) state.status[apiId] = { status: false, message: '' }
  state.status[apiId].status = status
  state.status[apiId].message = message

  event.status_changed({ apiId, status, message })
}


export const setUserApiList = (list: LX.UserApi.UserApiInfo[]) => {
  state.list = list

  event.list_changed([...list])
}

export const addUserApi = (info: LX.UserApi.UserApiInfo) => {
  state.list.push(info)

  event.list_changed([...state.list])
}


export const setUserApiAllowShowUpdateAlert = (id: string, enable: boolean) => {
  const targetIndex = state.list.findIndex(api => api.id == id)
  if (targetIndex < 0) return
  state.list[targetIndex].allowShowUpdateAlert = enable
  state.list.splice(targetIndex, 1, { ...state.list[targetIndex] })

  event.list_changed([...state.list])
}
