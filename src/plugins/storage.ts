import AsyncStorage from '@react-native-async-storage/async-storage'
import { log } from '@/utils/log'

const partKeyPrefix = '@___PART___'
const partKeyArrPrefix = '@___PART_A___'
const partKeyPrefixRxp = /^@___PART___/
const partKeyArrPrefixRxp = /^@___PART_A___/
const keySplit = ','
const limit = 500000

// NextStorage 会并发执行原生调用；分片的读取、写入和回收必须作为一组串行完成。
let storageTask: Promise<unknown> = Promise.resolve()
const withStorageLock = async<T>(run: () => Promise<T>): Promise<T> => {
  const task = storageTask.then(run)
  storageTask = task.catch(() => {})
  return task
}

const isPartMarker = (value: string | null): value is string => {
  return !!value && (partKeyPrefixRxp.test(value) || partKeyArrPrefixRxp.test(value))
}

const buildData = (key: string, value: any, datas: Array<[string, string]>) => {
  let valueStr = JSON.stringify(value)
  if (valueStr.length <= limit) {
    datas.push([key, valueStr])
    return
  }

  const partKeys = []
  for (let i = 0; i * limit < valueStr.length; i++) {
    let partKey = `${partKeyArrPrefix}${key}${i}`
    partKeys.push(partKey)
    datas.push([partKey, valueStr.substring(i * limit, (i + 1) * limit)])
  }
  datas.push([key, partKeyArrPrefix + JSON.stringify(partKeys)])
}

const getPartKeys = (value: string | null): string[] => {
  if (!isPartMarker(value)) return []
  return partKeyPrefixRxp.test(value)
    ? value.replace(partKeyPrefixRxp, '').split(keySplit)
    : JSON.parse(value.replace(partKeyArrPrefixRxp, '')) as string[]
}

const saveEntries = async(keys: string[], entries: Array<[string, string]>) => {
  if (!entries.length) return
  const stored = await AsyncStorage.multiGet(keys)
  const oldPartKeys = stored.flatMap(([, value]) => getPartKeys(value))
  // Android multiSet 是事务：先提交主键和新分片，失败时旧歌单仍然完整。
  await AsyncStorage.multiSet(entries)
  const retainedKeys = new Set(entries.map(([key]) => key))
  const obsoleteKeys = oldPartKeys.filter(key => !retainedKeys.has(key))
  if (obsoleteKeys.length) {
    // 数据已经提交；回收失败只留下无引用分片，不应把成功保存报告成失败。
    await AsyncStorage.multiRemove(obsoleteKeys).catch((e: Error) => {
      log.warn('storage chunk cleanup:', e.message)
    })
  }
}

// 1.4.0 之前的数据分片存储方式，存在key的内容与分隔符冲突的问题
// 1.4.0 开始改用数组存储，不再使用分隔符的方式
const handleGetDataOld = async<T>(partKeys: string): Promise<T> => {
  const keys = partKeys.replace(partKeyPrefixRxp, '').split(keySplit)

  return AsyncStorage.multiGet(keys).then(datas => {
    return JSON.parse(datas.map(data => data[1]).join(''))
  })
}

const handleGetData = async<T>(partKeys: string): Promise<T> => {
  if (partKeys.startsWith(partKeyPrefix)) return handleGetDataOld<T>(partKeys)

  const keys = JSON.parse(partKeys.replace(partKeyArrPrefixRxp, '')) as string[]
  return AsyncStorage.multiGet(keys).then(datas => {
    return JSON.parse(datas.map(data => data[1]).join(''))
  })
}

export const saveData = async(key: string, value: any) => {
  const datas: Array<[string, string]> = []
  buildData(key, value, datas)

  try {
    await withStorageLock(async() => saveEntries([key], datas))
  } catch (e: any) {
    // saving error
    log.error('storage error[saveData]:', key, e.message)
    throw e
  }
}

export const getData = async<T = unknown>(key: string): Promise<T | null> => withStorageLock(async() => {
  let value: string | null
  try {
    value = await AsyncStorage.getItem(key)
  } catch (e: any) {
    // error reading value
    log.error('storage error[getData]:', key, e.message)
    throw e
  }
  if (isPartMarker(value)) {
    return handleGetData<T>(value)
  } else if (value == null) return value
  return JSON.parse(value)
})

export const removeData = async(key: string) => withStorageLock(async() => {
  let value: string | null
  try {
    value = await AsyncStorage.getItem(key)
  } catch (e: any) {
    // error reading value
    log.error('storage error[removeData]:', key, e.message)
    throw e
  }
  if (isPartMarker(value)) {
    if (partKeyPrefixRxp.test(value)) {
      let partKeys = value.replace(partKeyPrefixRxp, '').split(keySplit)
      partKeys.push(key)
      try {
        await AsyncStorage.multiRemove(partKeys)
      } catch (e: any) {
        // remove error
        log.error('storage error[removeData]:', key, e.message)
        throw e
      }
      return
    } else if (partKeyArrPrefixRxp.test(value)) {
      let partKeys = JSON.parse(value.replace(partKeyArrPrefixRxp, '')) as string[]
      partKeys.push(key)
      try {
        await AsyncStorage.multiRemove(partKeys)
      } catch (e: any) {
        // remove error
        log.error('storage error[removeData]:', key, e.message)
        throw e
      }
      return
    }
  }

  try {
    await AsyncStorage.removeItem(key)
  } catch (e: any) {
    // remove error
    log.error('storage error[removeData]:', key, e.message)
    throw e
  }
})

export const getAllKeys = async() => withStorageLock(async() => {
  let keys
  try {
    keys = await AsyncStorage.getAllKeys()
  } catch (e: any) {
    // read key error
    log.error('storage error[getAllKeys]:', e.message)
    throw e
  }

  return keys
})


export const getDataMultiple = async<T extends readonly string[]>(keys: T) => withStorageLock(async() => {
  type RawData = { [K in keyof T]: [T[K], string | null] }
  let datas: RawData
  try {
    datas = await AsyncStorage.multiGet(keys) as RawData
  } catch (e: any) {
    // read error
    log.error('storage error[getDataMultiple]:', e.message)
    throw e
  }
  const promises: Array<Promise<ReadonlyArray<[unknown | null]>>> = []
  for (const [, value] of datas) {
    if (isPartMarker(value)) {
      promises.push(handleGetData(value))
    } else {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      promises.push(Promise.resolve(value ? JSON.parse(value) : value))
    }
  }
  return Promise.all(promises).then(values => {
    return datas.map(([key], index) => ([key, values[index]])) as { [K in keyof T]: [T[K], unknown] }
  })
})

export const saveDataMultiple = async(datas: Array<[string, any]>) => {
  const allData: Array<[string, string]> = []
  for (const [key, value] of datas) {
    buildData(key, value, allData)
  }
  try {
    await withStorageLock(async() => saveEntries([...new Set(datas.map(([key]) => key))], allData))
  } catch (e: any) {
    // save error
    log.error('storage error[saveDataMultiple]:', e.message)
    throw e
  }
}


export const removeDataMultiple = async(keys: string[]) => withStorageLock(async() => {
  if (!keys.length) return
  const datas = await AsyncStorage.multiGet(keys)
  let allKeys = []
  for (const [key, value] of datas) {
    allKeys.push(key)
    if (isPartMarker(value)) {
      if (partKeyPrefixRxp.test(value)) {
        allKeys.push(...value.replace(partKeyPrefixRxp, '').split(keySplit))
      } else if (partKeyArrPrefixRxp.test(value)) {
        allKeys.push(...JSON.parse(value.replace(partKeyArrPrefixRxp, '')) as string[])
      }
    }
  }
  try {
    await AsyncStorage.multiRemove(allKeys)
  } catch (e: any) {
    // remove error
    log.error('storage error[removeDataMultiple]:', e.message)
    throw e
  }
})

export const clearAll = async() => withStorageLock(async() => {
  try {
    await AsyncStorage.clear()
  } catch (e: any) {
    // clear error
    log.error('storage error[clearAll]:', e.message)
    throw e
  }
})

export { useAsyncStorage } from '@react-native-async-storage/async-storage'
