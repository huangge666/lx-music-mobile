import { memo, useCallback } from 'react'
import { toast } from '@/utils/tools'
import { downloadMusicToLocal, isMusicDownloading } from '@/core/music/downloader'
import { useI18n } from '@/lang'
import { usePlayMusicInfo } from '@/store/player/hook'
import Btn from './Btn'


/** 从播放信息里取可下载的歌曲（下载队列项把原始歌曲放在 metadata 里） */
const getDownloadTarget = (musicInfo: LX.Player.PlayMusic | undefined | null): LX.Music.MusicInfoOnline | null => {
  if (!musicInfo) return null
  const target = 'progress' in musicInfo ? musicInfo.metadata.musicInfo : musicInfo
  if (!target || target.source == 'local') return null
  return target
}

/**
 * 沉浸式下载按钮
 * — 白色图标，贴合底部磨砂胶囊
 * — 无当前曲目或本地歌曲时直接禁用（置灰），不弹误导性的失败提示
 */
const DownloadBtn = () => {
  const t = useI18n()
  const { musicInfo } = usePlayMusicInfo()
  const target = getDownloadTarget(musicInfo)
  const disabled = !target

  const handlePress = useCallback(async() => {
    if (!target) return
    if (isMusicDownloading(target)) {
      toast(t('download_start', { name: target.name }))
      return
    }
    try {
      const savePath = await downloadMusicToLocal(target)
      toast(t('download_success', { path: savePath }))
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err)
      toast(err instanceof Error && err.message ? err.message : t('download_failed'), 'long')
    }
  }, [t, target])

  return <Btn icon="download-2" label={t('play_detail_action_download')} disabled={disabled} onPress={handlePress} />
}

export default memo(DownloadBtn)
