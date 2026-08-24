import { httpGet } from '@/utils/request'
import { name } from '../../package.json'
import { downloadFile, stopDownload, temporaryDirectoryPath } from '@/utils/fs'
import { getSupportedAbis, installApk } from '@/utils/nativeModules/utils'
import { APP_PROVIDER_NAME } from '@/config/constant'

// fork：检查更新只看自己的仓库；GitHub 仓库 slug 仍保持 package.json 的 name（lx-music-mobile）
const FORK_OWNER = 'huangge666'
const FORK_REPO = name

const abis = [
  'arm64-v8a',
  'armeabi-v7a',
  'x86_64',
  'x86',
  'universal',
]

const address = [
  // jsdelivr 均显式锁定 @master 分支：不带分支时 CDN 会自行解析引用，
  // 可能命中旧 tag 或长期缓存的内容，导致发版后长时间检测不到新版本
  [`https://cdn.jsdelivr.net/gh/${FORK_OWNER}/${FORK_REPO}@master/publish/version.json`, 'direct'],
  [`https://fastly.jsdelivr.net/gh/${FORK_OWNER}/${FORK_REPO}@master/publish/version.json`, 'direct'],
  [`https://gcore.jsdelivr.net/gh/${FORK_OWNER}/${FORK_REPO}@master/publish/version.json`, 'direct'],
  [`https://raw.githubusercontent.com/${FORK_OWNER}/${FORK_REPO}/master/publish/version.json`, 'direct'],
]


// 单个地址最多尝试 2 次（首次 + 1 次重试）即切换下一个源：
// 原先同一地址重试 3 次、每次超时 10 秒，首个不可达地址会阻塞
// 半分钟以上才开始轮询其他源，表现为“无法检测到更新”
const MAX_RETRY_PER_URL = 1

const request = async(url, retryNum = 0) => {
  return new Promise((resolve, reject) => {
    // 追加时间戳参数绕过 CDN 缓存，确保拿到最新的 version.json
    const bustUrl = url + (url.includes('?') ? '&' : '?') + 't=' + Date.now()
    httpGet(bustUrl, {
      timeout: 10000,
    }, (err, resp, body) => {
      if (err || resp.statusCode != 200) {
        ++retryNum > MAX_RETRY_PER_URL
          ? reject(err || new Error(resp.statusMessage || resp.statusCode))
          : request(url, retryNum).then(resolve).catch(reject)
      } else resolve(body)
    })
  })
}

const getDirectInfo = async(url) => {
  return request(url).then(info => {
    if (info.version == null) throw new Error('failed')
    return info
  })
}

const getNpmPkgInfo = async(url) => {
  return request(url).then(json => {
    if (!json.versionInfo) throw new Error('failed')
    const info = JSON.parse(json.versionInfo)
    if (info.version == null) throw new Error('failed')
    return info
  })
}

export const getVersionInfo = async(index = 0) => {
  const [url, source] = address[index]
  let promise
  switch (source) {
    case 'direct':
      promise = getDirectInfo(url)
      break
    case 'npm':
      promise = getNpmPkgInfo(url)
      break
  }

  return promise.catch(async(err) => {
    index++
    if (index >= address.length) throw err
    return getVersionInfo(index)
  })
}

const getTargetAbi = async() => {
  const supportedAbis = await getSupportedAbis()
  for (const abi of abis) {
    if (supportedAbis.includes(abi)) return abi
  }
  return abis[abis.length - 1]
}
let downloadJobId = null
const noop = (total, download) => {}
let apkSavePath

export const downloadNewVersion = async(version, onDownload = noop) => {
  const abi = await getTargetAbi()
  const url = `https://github.com/${FORK_OWNER}/${FORK_REPO}/releases/download/v${version}/${FORK_REPO}-v${version}-${abi}.apk`
  let savePath = temporaryDirectoryPath + '/lx-music-mobile.apk'

  if (downloadJobId) stopDownload(downloadJobId)

  const { jobId, promise } = downloadFile(url, savePath, {
    progressInterval: 500,
    connectionTimeout: 20000,
    readTimeout: 30000,
    begin({ statusCode, contentLength }) {
      onDownload(contentLength, 0)
      // switch (statusCode) {
      //   case 200:
      //   case 206:
      //     break
      //   default:
      //     onDownload(null, contentLength, 0)
      //     break
      // }
    },
    progress({ contentLength, bytesWritten }) {
      onDownload(contentLength, bytesWritten)
    },
  })
  downloadJobId = jobId
  return promise.then(() => {
    apkSavePath = savePath
    return updateApp()
  })
}

export const updateApp = async() => {
  if (!apkSavePath) throw new Error('apk Save Path is null')
  await installApk(apkSavePath, APP_PROVIDER_NAME)
}
