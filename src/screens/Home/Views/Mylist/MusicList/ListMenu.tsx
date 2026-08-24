import { useRef, useImperativeHandle, forwardRef, useCallback } from 'react'
import { useI18n } from '@/lang'
import { hasDislike } from '@/core/dislikeList'
import { existsFile } from '@/utils/fs'
import ActionSheet, { type ActionSheetItem, type ActionSheetType } from '@/components/common/ActionSheet'

export interface SelectInfo {
  musicInfo: LX.Music.MusicInfo
  selectedList: LX.Music.MusicInfo[]
  index: number
  listId: string
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
  onMove: (selectInfo: SelectInfo) => void
  onEditMetadata: (selectInfo: SelectInfo) => void
  onCopyName: (selectInfo: SelectInfo) => void
  onChangePosition: (selectInfo: SelectInfo) => void
  onToggleSource: (selectInfo: SelectInfo) => void
  onMusicSourceDetail: (selectInfo: SelectInfo) => void
  onDislikeMusic: (selectInfo: SelectInfo) => void
  onRemove: (selectInfo: SelectInfo) => void
}

export interface ListMenuType {
  show: (selectInfo: SelectInfo, position?: Position) => void
}

const initSelectInfo = {}

const hasEditMetadata = async(musicInfo: LX.Music.MusicInfo) => {
  if (musicInfo.source != 'local') return false
  return existsFile(musicInfo.meta.filePath)
}

const getMusicSubtitle = (musicInfo: LX.Music.MusicInfo) => {
  const albumName = musicInfo.meta.albumName
  return albumName ? `${musicInfo.singer} · ${albumName}` : musicInfo.singer
}

export default forwardRef<ListMenuType, ListMenuProps>((props, ref) => {
  const t = useI18n()
  const actionSheetRef = useRef<ActionSheetType>(null)
  const selectInfoRef = useRef<SelectInfo>(initSelectInfo as SelectInfo)

  const buildMenuItems = useCallback((musicInfo: LX.Music.MusicInfo, editMetadata = false): ActionSheetItem[] => {
    const items: ActionSheetItem[] = [
      { action: 'play', label: t('play'), icon: 'play' },
      { action: 'playLater', label: t('play_later'), icon: 'nextMusic' },
      { action: 'download', disabled: musicInfo.source == 'local', label: t('nav_download'), icon: 'download-2' },
      { action: 'add', label: t('add_to'), icon: 'add-music' },
      { action: 'move', label: t('move_to'), icon: 'add_folder' },
      { action: 'changePosition', label: t('change_position'), icon: 'list-order' },
      { action: 'toggleSource', label: t('toggle_source'), icon: 'available_updates' },
      { action: 'copyName', label: t('copy_name'), icon: 'share' },
      { action: 'musicSourceDetail', disabled: musicInfo.source == 'local', label: t('music_source_detail'), icon: 'album' },
      { action: 'dislike', disabled: hasDislike(musicInfo), label: t('dislike'), icon: 'eraser' },
      { action: 'remove', label: t('delete'), icon: 'remove', danger: true },
    ]
    if (musicInfo.source == 'local') {
      items.splice(5, 0, { action: 'editMetadata', disabled: !editMetadata, label: t('edit_metadata'), icon: 'slider' })
    }
    return items
  }, [t])

  const showSheet = useCallback((selectInfo: SelectInfo, editMetadata = false) => {
    actionSheetRef.current?.show({
      header: {
        title: selectInfo.musicInfo.name,
        subtitle: getMusicSubtitle(selectInfo.musicInfo),
        icon: 'play-outline',
      },
      items: buildMenuItems(selectInfo.musicInfo, editMetadata),
    })
  }, [buildMenuItems])

  useImperativeHandle(ref, () => ({
    show(selectInfo) {
      selectInfoRef.current = selectInfo
      showSheet(selectInfo, false)
      if (selectInfo.musicInfo.source != 'local') return
      void hasEditMetadata(selectInfo.musicInfo).then((editMetadata) => {
        if (selectInfoRef.current.musicInfo !== selectInfo.musicInfo) return
        showSheet(selectInfo, editMetadata)
      })
    },
  }), [showSheet])

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
      case 'move':
        props.onMove(selectInfo)
        break
      case 'editMetadata':
        props.onEditMetadata(selectInfo)
        break
      case 'copyName':
        props.onCopyName(selectInfo)
        break
      case 'changePosition':
        props.onChangePosition(selectInfo)
        break
      case 'toggleSource':
        props.onToggleSource(selectInfo)
        break
      case 'musicSourceDetail':
        props.onMusicSourceDetail(selectInfo)
        break
      case 'dislike':
        props.onDislikeMusic(selectInfo)
        break
      case 'remove':
        props.onRemove(selectInfo)
        break
      default:
        break
    }
  }, [props])

  return <ActionSheet ref={actionSheetRef} onPress={handleMenuPress} />
})
