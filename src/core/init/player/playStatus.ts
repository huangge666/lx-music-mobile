import { updateMetaData } from '@/plugins/player'
import playerState from '@/store/player/state'

export default () => {
  let playing = false
  const setButtons = () => {
    if (!playerState.playMusicInfo.musicInfo) return
    void updateMetaData(playerState.musicInfo, playerState.isPlay)
  }
  const handlePlay = () => {
    if (playing) return
    playing = true
    setButtons()
  }
  const handlePause = () => {
    if (!playing) return
    playing = false
    setButtons()
  }
  // 原生队列无缝切歌时一直处于 Playing，play 事件会被上面的 early-return 丢掉，
  // 锁屏/通知栏就会一直显示上一首。切歌必须强制刷 metadata。
  const handleMusicToggled = () => {
    if (!playerState.playMusicInfo.musicInfo) return
    void updateMetaData(playerState.musicInfo, playerState.isPlay, true)
  }
  global.app_event.on('play', handlePlay)
  global.app_event.on('pause', handlePause)
  global.app_event.on('stop', handlePause)
  global.app_event.on('musicToggled', handleMusicToggled)
  return async() => {
    setButtons()
  }
}
