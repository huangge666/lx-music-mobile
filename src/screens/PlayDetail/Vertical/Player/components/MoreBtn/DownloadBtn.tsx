import { memo, useCallback } from 'react'
import { toast } from '@/utils/tools'
import { downloadMusicToLocal, isMusicDownloading } from '@/core/music/downloader'
import playerState from '@/store/player/state'
import Btn from './Btn'


/**
 * 沉浸式下载按钮
 * — 白色图标，贴合底部磨砂胶囊
 */
const DownloadBtn = () => {
  const handlePress = useCallback(async() => {
    const musicInfo = playerState.playMusicInfo.musicInfo
    if (!musicInfo) return
    const target = 'progress' in musicInfo ? musicInfo.metadata.musicInfo : musicInfo
    // 本地歌曲不支持下载
    if (target.source == 'local') {
      toast(global.i18n.t('download_failed'), 'long')
      return
    }
    if (isMusicDownloading(target)) {
      toast(global.i18n.t('download_start', { name: target.name }))
      return
    }
    try {
      const savePath = await downloadMusicToLocal(target)
      toast(global.i18n.t('download_success', { path: savePath }))
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err)
      toast(err instanceof Error && err.message ? err.message : global.i18n.t('download_failed'), 'long')
    }
  }, [])

  return <Btn icon="download-2" onPress={handlePress} />
}

export default memo(DownloadBtn)
