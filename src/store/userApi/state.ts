
interface InitState {
  list: LX.UserApi.UserApiInfo[]
  status: Record<string, LX.UserApi.UserApiStatus>
  apis: Partial<LX.UserApi.UserApiSources>
}
const state: InitState = {
  list: [],
  status: {},
  apis: {},
}


export {
  state,
}
