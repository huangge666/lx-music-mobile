import { useRef, useImperativeHandle, forwardRef, useCallback } from 'react'
import { useI18n } from '@/lang'
import { hasDislike } from '@/core/dislikeList'
import ActionSheet, { type ActionSheetItem, type ActionSheetType } from '@/components/common/ActionSheet'

export interface SelectInfo {
  musicInfo: LX.Music.MusicInfoOnline
  selectedList: LX.Music.MusicInfoOnline[]
  index: number
  single: boolean
}

export interface Position {
  w: number
  h: number
  x: number
  y: number
  menuWidth?: number
  menuHeight?: number
}

export interface ListMenuProps {
  onPlay: (selectInfo: SelectInfo) => void
  onPlayLater: (selectInfo: SelectInfo) => void
  onDownload: (selectInfo: SelectInfo) => void
  onAdd: (selectInfo: SelectInfo) => void
  onCopyName: (selectInfo: SelectInfo) => void
  onMusicSourceDetail: (selectInfo: SelectInfo) => void
  onDislikeMusic: (selectInfo: SelectInfo) => void
}

export interface ListMenuType {
  show: (selectInfo: SelectInfo, position?: Position) => void
}

const initSelectInfo = {}

const getMusicSubtitle = (musicInfo: LX.Music.MusicInfoOnline) => {
  const albumName = musicInfo.meta.albumName
  return albumName ? `${musicInfo.singer} · ${albumName}` : musicInfo.singer
}

export default forwardRef<ListMenuType, ListMenuProps>((props, ref) => {
  const t = useI18n()
  const actionSheetRef = useRef<ActionSheetType>(null)
  const selectInfoRef = useRef<SelectInfo>(initSelectInfo as SelectInfo)

  const buildMenuItems = useCallback((musicInfo: LX.Music.MusicInfoOnline): ActionSheetItem[] => {
    return [
      { action: 'play', label: t('play'), icon: 'play' },
      { action: 'playLater', label: t('play_later'), icon: 'nextMusic' },
      { action: 'download', label: t('nav_download'), icon: 'download-2' },
      { action: 'add', label: t('add_to'), icon: 'add-music' },
      { action: 'copyName', label: t('copy_name'), icon: 'share' },
      { action: 'musicSourceDetail', label: t('music_source_detail'), icon: 'album' },
      { action: 'dislike', label: t('dislike'), disabled: hasDislike(musicInfo), icon: 'eraser' },
    ]
  }, [t])

  useImperativeHandle(ref, () => ({
    show(selectInfo) {
      selectInfoRef.current = selectInfo
      actionSheetRef.current?.show({
        header: {
          title: selectInfo.musicInfo.name,
          subtitle: getMusicSubtitle(selectInfo.musicInfo),
          icon: 'play-outline',
        },
        items: buildMenuItems(selectInfo.musicInfo),
      })
    },
  }), [buildMenuItems])

  const handleMenuPress = useCallback((action: string) => {
    const selectInfo = selectInfoRef.current
    switch (action) {
      case 'play':
        props.onPlay(selectInfo)
        break
      case 'playLater':
        props.onPlayLater(selectInfo)
        break
      case 'download':
        props.onDownload(selectInfo)
        break
      case 'add':
        props.onAdd(selectInfo)
        break
      case 'copyName':
        props.onCopyName(selectInfo)
        break
      case 'musicSourceDetail':
        props.onMusicSourceDetail(selectInfo)
        break
      case 'dislike':
        props.onDislikeMusic(selectInfo)
        break
      default:
        break
    }
  }, [props])

  return <ActionSheet ref={actionSheetRef} onPress={handleMenuPress} />
})
