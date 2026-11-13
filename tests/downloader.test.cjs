const assert = require('node:assert/strict')
const { test } = require('node:test')
const { loadSource, deferred, flush } = require('./load-source.cjs')

const music = id => ({ id, source: 'kw', name: 'Same title', singer: 'Singer', meta: {} })
const setup = (getMusicUrl = async() => 'https://audio.test/song.mp3') => {
  const downloads = []
  const stopped = []
  const removed = []
  const api = loadSource('src/core/music/downloader.ts', {
    'react-native': { Platform: { OS: 'android' }, Linking: { openSettings: async() => {} } },
    './index': { getMusicUrl },
    './online': { getPicUrl: async() => '', getLyricInfo: async() => ({}) },
    './utils': { getPlayQuality: () => '128k' },
    '@/store/setting/state': { setting: { 'download.fileName': '歌名 - 歌手' } },
    '@/utils/fs': {
      temporaryDirectoryPath: '/cache',
      ensureMusicDownloadDirectory: async() => '/downloads',
      existsMusicDownloadTarget: async() => false,
      removeMusicDownloadTarget: async(path) => { removed.push(path) },
      scanMusicDownloadFile: async() => {},
      downloadFile(url, path, options) {
        const jobId = downloads.length + 1
        const task = deferred()
        downloads.push({ jobId, path, task, options })
        return { jobId, promise: task.promise }
      },
      stopDownload(jobId) {
        stopped.push(jobId)
        downloads.find(item => item.jobId === jobId).task.reject(new Error('stopped'))
      },
    },
    '@/utils/common': { filterFileName: name => name },
    '@/utils': { sizeFormate: size => String(size) },
    '@/utils/tools': { requestStoragePermission: async() => true, toast() {}, confirmDialog: async() => false },
    '@/utils/localMediaMetadata': { writeLyric: async() => {}, writePic: async() => {} },
    '@/utils/lrcTools': { buildLyrics: () => '' },
  }, { app_event: { downloadListUpdate() {} }, i18n: { t: key => key } })
  return { api, downloads, stopped, removed }
}

test('two simultaneous downloads with the same title reserve different paths', async() => {
  const s = setup()
  const a = s.api.downloadMusicToLocal(music('a'))
  const b = s.api.downloadMusicToLocal(music('b'))
  await flush()
  assert.equal(s.downloads.length, 2)
  assert.notEqual(s.downloads[0].path, s.downloads[1].path)
  for (const item of s.downloads) item.task.resolve({ statusCode: 200, bytesWritten: 100 })
  await Promise.all([a, b])
})

test('cancel while resolving the URL never starts a native download', async() => {
  const url = deferred()
  const s = setup(() => url.promise)
  const task = s.api.downloadMusicToLocal(music('a'))
  const rejected = assert.rejects(task, /download_cancelled/)
  await flush()
  const removal = s.api.removeDownloadTask('kw:a', true)
  url.resolve('https://audio.test/song.mp3')
  await Promise.all([removal, rejected])
  assert.equal(s.downloads.length, 0)
  assert.equal(s.api.getDownloadTasks().length, 0)
})

test('cancel before HTTP begin stops the native job and then removes its file', async() => {
  const s = setup()
  const task = s.api.downloadMusicToLocal(music('a'))
  const rejected = assert.rejects(task, /stopped/)
  await flush()
  await s.api.removeDownloadTask('kw:a', true)
  await rejected
  assert.deepEqual(s.stopped, [1])
  assert.deepEqual(s.removed, [s.downloads[0].path])
})

test('cancel a queued task immediately settles it without waiting for an active slot', async() => {
  const s = setup()
  const active = ['a', 'b'].map(id => s.api.downloadMusicToLocal(music(id)))
  const queued = s.api.downloadMusicToLocal(music('c'))
  const rejected = assert.rejects(queued, /download_cancelled/)
  await flush()
  await s.api.removeDownloadTask('kw:c')
  await rejected
  assert.equal(s.downloads.length, 2)
  for (const item of s.downloads) item.task.resolve({ statusCode: 200, bytesWritten: 100 })
  await Promise.all(active)
})

test('HTTP failure is retryable and duplicate clicks share the same native job', async() => {
  const s = setup()
  const first = s.api.downloadMusicToLocal(music('a'))
  const duplicate = s.api.downloadMusicToLocal(music('a'))
  const rejected = Promise.all([assert.rejects(first, /503/), assert.rejects(duplicate, /503/)])
  await flush()
  assert.equal(s.downloads.length, 1)
  s.downloads[0].task.resolve({ statusCode: 503, bytesWritten: 0 })
  await rejected
  const retry = s.api.retryDownloadTask('kw:a')
  await flush()
  s.downloads[1].task.resolve({ statusCode: 200, bytesWritten: 100 })
  await retry
  assert.equal(s.api.getDownloadTasks()[0].status, 'completed')
})
