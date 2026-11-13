const assert = require('node:assert/strict')
const { test } = require('node:test')
const { loadSource } = require('./load-source.cjs')

const setup = statuses => {
  const urls = []; const installs = []
  const api = loadSource('src/utils/version.js', {
    '@/utils/request': {},
    '@/utils': {},
    '../../package.json': { name: 'lx-music-mobile' },
    '@/config/constant': { APP_PROVIDER_NAME: 'test.provider' },
    '@/utils/fs': {
      temporaryDirectoryPath: '/cache',
      stopDownload() {},
      downloadFile(url) { urls.push(url); return { jobId: urls.length, promise: Promise.resolve({ statusCode: statuses.shift() }) } },
    },
    '@/utils/nativeModules/utils': { getSupportedAbis: async() => ['arm64-v8a'], installApk: async(path) => { installs.push(path) } },
  })
  return { api, urls, installs }
}

test('APK proxy HTTP failure retries the direct release before installing', async() => {
  const s = setup([404, 200])
  await s.api.downloadNewVersion('2.1.9')
  assert.equal(s.urls.length, 2)
  assert.equal(s.installs.length, 1)
})

test('APK HTTP failures never invoke the installer', async() => {
  const s = setup([404, 503])
  await assert.rejects(s.api.downloadNewVersion('2.1.9'), /503/)
  assert.equal(s.installs.length, 0)
})
