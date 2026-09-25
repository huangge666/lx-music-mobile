import { importUserApi } from '@/core/userApi'
import { state as userApiState } from '@/store/userApi'
import { httpFetch } from '@/utils/request'

/**
 * 音源管理弹窗里可手动选择导入的内置源。
 * 使用 GitHub 原始地址；请求层会自行解包并尝试可用镜像。
 */
export const BUILTIN_USER_APIS = [
  {
    id: 'lx',
    nameKey: 'setting_source_builtin_lx',
    url: 'https://raw.githubusercontent.com/pdone/lx-music-source/main/lx/latest.js',
  },
  {
    id: 'huanyin',
    nameKey: 'setting_source_builtin_huanyin',
    url: 'https://raw.githubusercontent.com/pdone/lx-music-source/main/huanyin/latest.js',
  },
  {
    id: 'changqing',
    nameKey: 'setting_source_builtin_changqing',
    url: 'https://raw.githubusercontent.com/pdone/lx-music-source/main/changqing/latest.js',
  },
] as const

export type BuiltinUserApi = typeof BUILTIN_USER_APIS[number]
export type BuiltinUserApiId = BuiltinUserApi['id']

const BUILTIN_USER_API_MAX_SIZE = 9_000_000
export const USER_API_IMPORT_LIMIT = 20

const isUserApiScript = (script: unknown): script is string => {
  return typeof script == 'string' &&
    script.length > 0 &&
    script.length <= BUILTIN_USER_API_MAX_SIZE &&
    /^\/\*[\S|\s]+?\*\//.test(script)
}

export const findImportedBuiltinUserApi = (source: BuiltinUserApi) => {
  return userApiState.list.find(api => api.homepage == source.url)
}

/** 按链接下载脚本并导入。已存在时不重复添加。 */
export const importBuiltinUserApi = async(source: BuiltinUserApi) => {
  if (findImportedBuiltinUserApi(source)) return
  const script = await httpFetch(source.url).promise.then(resp => resp.body)
  if (!isUserApiScript(script)) throw new Error('invalid builtin user api script')
  await importUserApi(script)
}
