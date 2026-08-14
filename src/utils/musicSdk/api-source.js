import apiSourceInfo from './api-source-info'

// import temp_api_kw from './kw/api-temp'
// import test_api_kg from './kg/api-test'
// import test_api_kw from './kw/api-test'
// import test_api_tx from './tx/api-test'
// import test_api_wy from './wy/api-test'
// import test_api_mg from './mg/api-test'

// import direct_api_kg from './kg/api-direct'
// import direct_api_kw from './kw/api-direct'
// import direct_api_tx from './tx/api-direct'
// import direct_api_wy from './wy/api-direct'
// import direct_api_mg from './mg/api-direct'

import settingState from '@/store/setting/state'


const apiList = {
  // temp_api_kw,
  // // test_api_bd: require('./bd/api-test'),
  // test_api_kg,
  // test_api_kw,
  // test_api_tx,
  // test_api_wy,
  // test_api_mg,
  // direct_api_kg,
  // direct_api_kw,
  // direct_api_tx,
  // direct_api_wy,
  // direct_api_mg,
  // test_api_tx: require('./tx/api-test'),
  // test_api_wy: require('./wy/api-test'),
  // test_api_xm: require('./xm/api-test'),
}
const supportQuality = {}

for (const api of apiSourceInfo) {
  supportQuality[api.id] = api.supportQualitys
  // for (const source of Object.keys(api.supportQualitys)) {
  //   const path = `./${source}/api-${api.id}`
  //   console.log(path)
  //   apiList[`${api.id}_api_${source}`] = path
  // }
}

const getAPI = source => apiList[`${settingState.setting['common.apiSource']}_api_${source}`]

/**
 * 获取某源（LX.Source）的 handler 集合。
 *
 * 多选源支持：合并视图由 handleStateChange / recomputeApiViews 维护，
 * 即 `global.lx.apis[source]` 来自 `common.apiSourceList` 中所有已成功
 * 初始化的用户源的合并结果，列表中靠前的 apiId 优先级更高。
 *
 * 因此 `apis(source)` 优先读取该合并视图，再回退到内置源。
 */
const apis = source => {
  if (global.lx.apis && global.lx.apis[source]) return global.lx.apis[source]
  if (/^user_api/.test(settingState.setting['common.apiSource'])) return global.lx.apis?.[source]
  const api = getAPI(source)
  if (api) return api
  throw new Error('Api is not found')
}

export { apis, supportQuality }
