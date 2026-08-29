import { httpGet } from '@/utils/request'
import { compareAppVersion } from '@/utils'
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

const rawVersionUrl = `https://raw.githubusercontent.com/${FORK_OWNER}/${FORK_REPO}/master/publish/version.json`

// 新鲜源：直连 GitHub raw + gh-proxy 加速镜像（与 APK 下载同款代理，实时回源）。
// jsDelivr 对 gh 文件按路径长期缓存，?t= 无法刷新，发版后可能长时间仍返回
// 旧 version.json，导致“已是最新”误判，因此只能作为兜底。
const FRESH_ADDRESS = [
  rawVersionUrl,
  `https://v4.gh-proxy.org/${rawVersionUrl}`,
  `https://gh-proxy.org/${rawVersionUrl}`,
]
const FALLBACK_ADDRESS = [
  `https://cdn.jsdelivr.net/gh/${FORK_OWNER}/${FORK_REPO}@master/publish/version.json`,
  `https://fastly.jsdelivr.net/gh/${FORK_OWNER}/${FORK_REPO}@master/publish/version.json`,
  `https://gcore.jsdelivr.net/gh/${FORK_OWNER}/${FORK_REPO}@master/publish/version.json`,
]


// 单个地址最多尝试 2 次（首次 + 1 次重试）
const MAX_RETRY_PER_URL = 1

const request = async(url, retryNum = 0) => {
  return new Promise((resolve, reject) => {
    // GitHub raw 带时间戳可减少中间代理缓存；jsDelivr 按路径缓存，查询参数无效
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

const fetchVersion = (url, source) => {
  switch (source) {
    case 'direct':
      return getDirectInfo(url)
    case 'npm':
      return getNpmPkgInfo(url)
    default:
      return Promise.reject(new Error('unknown source'))
  }
}

// 任一 promise 成功即 resolve，全部失败才 reject（手动实现竞速成功，
// 避免依赖 Promise.any 的运行时兼容性）
const raceSuccess = (promises) => new Promise((resolve, reject) => {
  let pending = promises.length
  let lastErr = null
  if (pending === 0) {
    reject(new Error('no urls'))
    return
  }
  promises.forEach(p => {
    p.then(resolve, err => {
      lastErr = err
      if (--pending === 0) reject(lastErr)
    })
  })
})

const pickLatest = (a, b) => (compareAppVersion(a.version, b.version) < 0 ? b : a)

// 新鲜源竞速：raw 直连与 gh-proxy 镜像回源同一文件，内容一致，
// 任一成功立即返回，无需等待被墙/超时的其余源
const fetchFreshInfo = () => raceSuccess(FRESH_ADDRESS.map(url => fetchVersion(url, 'direct')))

// 兜底源：jsDelivr 全部完成后取版本号最高的结果（多 CDN 缓存新旧不一）
const fetchFallbackInfo = async() => {
  const results = await Promise.allSettled(FALLBACK_ADDRESS.map(url => fetchVersion(url, 'direct')))
  const infos = results
    .filter(r => r.status == 'fulfilled')
    .map(r => r.value)
  if (infos.length === 0) {
    throw results[0]?.reason ?? new Error('failed')
  }
  return infos.reduce(pickLatest)
}

// 优先走新鲜源保证拿到真实最新版本；全部失败（如代理不可用）才降级 jsDelivr
export const getVersionInfo = async() => {
  try {
    return await fetchFreshInfo()
  } catch (err) {
    return fetchFallbackInfo()
  }
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

// GitHub Releases 下载加速代理：国内直连 github.com 下载 APK 较慢或超时，
// 优先通过 gh-proxy 加速下载，失败时回退直连地址
const GH_PROXY_PREFIX = 'https://v4.gh-proxy.org/'

export const downloadNewVersion = async(version, onDownload = noop) => {
  const abi = await getTargetAbi()
  const directUrl = `https://github.com/${FORK_OWNER}/${FORK_REPO}/releases/download/v${version}/${FORK_REPO}-v${version}-${abi}.apk`
  // 加速代理的格式为：https://v4.gh-proxy.org/<原始 GitHub 地址>
  const urls = [GH_PROXY_PREFIX + directUrl, directUrl]
  let savePath = temporaryDirectoryPath + '/lx-music-mobile.apk'

  if (downloadJobId) stopDownload(downloadJobId)

  // 依次尝试各下载地址（加速源优先，直连兜底），任一成功即返回
  const tryDownload = (urlIndex = 0) => {
    if (urlIndex >= urls.length) return Promise.reject(new Error('all download url failed'))
    const { jobId, promise } = downloadFile(urls[urlIndex], savePath, {
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
    return promise.catch(err => {
      // 当前地址失败（超时/不可达），切换到下一个下载地址重试
      if (urlIndex + 1 >= urls.length) throw err
      return tryDownload(urlIndex + 1)
    })
  }

  return tryDownload().then(() => {
    apkSavePath = savePath
    return updateApp()
  })
}

export const updateApp = async() => {
  if (!apkSavePath) throw new Error('apk Save Path is null')
  await installApk(apkSavePath, APP_PROVIDER_NAME)
}
