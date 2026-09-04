import { prewarmNextMusicUrl, resetRandomNextMusicInfo } from '@/core/player/player'

/**
 * 下一首预取的「触发器」。
 *
 * 预取本体已统一到 player.ts 的 prewarmNextMusicUrl（当前曲开播成功即预取，
 * 内部优先复用持久缓存 + 可用性校验，失败按 key 退避重试）。
 * 这里只保留两类触发时机，不再有独立的取链逻辑：
 * 1. 歌曲临近结束（剩余 < 10s）时再触发一次预取，
 *    覆盖开播时预取已过期（如超长歌曲）或失败的情况；
 * 2. 播放模式变化时使随机下一首缓存失效并重新预取。
 * 重复调用是安全的：prewarmNextMusicUrl 内部有触发节流、缓存命中去重与失败退避。
 */
export default () => {
  const handleConfigUpdated: typeof global.state_event.configUpdated = (keys, settings) => {
    if (!keys.includes('player.togglePlayMethod')) return
    // 播放模式变化后「下一首」会变，丢弃旧的随机下一首缓存并重新预取
    resetRandomNextMusicInfo()
    prewarmNextMusicUrl()
  }

  const handlePlayProgressChanged: typeof global.state_event.playProgressChanged = (progress) => {
    const duration = progress.maxPlayTime
    // 剩余不足 10s 时触发临播预取；不会产生重复网络请求（见 prewarmNextMusicUrl 内部去重）
    if (duration > 10 && duration - progress.nowPlayTime < 10) prewarmNextMusicUrl()
  }

  global.state_event.on('configUpdated', handleConfigUpdated)
  global.state_event.on('playProgressChanged', handlePlayProgressChanged)
}
