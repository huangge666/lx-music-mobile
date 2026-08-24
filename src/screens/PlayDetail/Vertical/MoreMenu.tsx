import { useRef, useImperativeHandle, forwardRef, useCallback } from 'react'
import { pop } from '@/navigation'
import { useI18n } from '@/lang'
import { useTheme } from '@/store/theme/hook'
import { shareMusic } from '@/utils/tools'
import playerState from '@/store/player/state'
import settingState from '@/store/setting/state'
import commonState from '@/store/common/state'
import { updateSetting } from '@/core/common'
import { toggleDesktopLyricLock } from '@/core/desktopLyric'
import ActionSheet, { type ActionSheetItem, type ActionSheetType } from '@/components/common/ActionSheet'
import MusicAddModal, { type MusicAddModalType } from '@/components/MusicAddModal'
import DesktopLyricEnable, { type DesktopLyricEnableType } from '@/components/DesktopLyricEnable'
import TimeoutExitEditModal, { type TimeoutExitEditModalType, useTimeInfo } from '@/components/TimeoutExitEditModal'
import SettingPopup, { type SettingPopupType } from '@/screens/PlayDetail/components/SettingPopup'

export interface MoreMenuType {
  show: () => void
}

const getPlayingMusicInfo = (): LX.Music.MusicInfo | null => {
  const musicInfo = playerState.playMusicInfo.musicInfo
  if (!musicInfo) return null
  return 'progress' in musicInfo ? musicInfo.metadata.musicInfo : musicInfo
}

const getHeaderSubtitle = (name: string, singer: string, album: string) => {
  if (singer && album) return `${singer} · ${album}`
  return singer || album || name
}

/**
 * 播放详情「更多」：歌曲 / 播放操作抽屉
 * 播放器设置（歌词字号、音量、倍速等）作为其中一项，不再占用 ⋯ 的全部语义
 */
export default forwardRef<MoreMenuType>((_, ref) => {
  const t = useI18n()
  const theme = useTheme()
  const timeInfo = useTimeInfo()
  const actionSheetRef = useRef<ActionSheetType>(null)
  const musicAddModalRef = useRef<MusicAddModalType>(null)
  const desktopLyricEnableRef = useRef<DesktopLyricEnableType>(null)
  const timeoutExitModalRef = useRef<TimeoutExitEditModalType>(null)
  const settingPopupRef = useRef<SettingPopupType>(null)

  const buildMenuItems = useCallback((): ActionSheetItem[] => {
    const hasMusic = !!getPlayingMusicInfo()
    const enabledLyric = settingState.setting['desktopLyric.enable']

    return [
      { action: 'add', disabled: !hasMusic, label: t('add_to'), icon: 'add-music' },
      { action: 'share', disabled: !hasMusic, label: t('copy_name'), icon: 'share' },
      { action: 'locate', disabled: !hasMusic, label: t('list_locate_playing'), icon: 'list-order' },
      {
        action: 'desktopLyric',
        label: t('setting_lyric_desktop'),
        icon: enabledLyric ? 'lyric-on' : 'lyric-off',
      },
      {
        action: 'desktopLyricLock',
        disabled: !enabledLyric,
        label: t('setting_lyric_desktop_lock'),
        icon: 'lyric-off',
      },
      {
        action: 'timeoutExit',
        label: t('timeout_exit_tip_off'),
        icon: 'music_time',
      },
      { action: 'setting', label: t('play_detail_setting_title'), icon: 'slider' },
    ]
  }, [t])

  useImperativeHandle(ref, () => ({
    show() {
      const musicInfo = playerState.musicInfo
      actionSheetRef.current?.show({
        header: {
          title: musicInfo.name || '',
          subtitle: getHeaderSubtitle(musicInfo.name, musicInfo.singer, musicInfo.album),
          icon: 'play-outline',
          iconBg: theme['c-primary-background'],
          iconColor: theme['c-primary'],
        },
        items: buildMenuItems(),
      })
    },
  }), [buildMenuItems, theme])

  const handleAction = useCallback((action: string) => {
    switch (action) {
      case 'add': {
        const musicInfo = getPlayingMusicInfo()
        if (!musicInfo) return
        musicAddModalRef.current?.show({
          musicInfo,
          isMove: false,
          listId: playerState.playMusicInfo.listId!,
        })
        break
      }
      case 'share': {
        const musicInfo = getPlayingMusicInfo()
        if (!musicInfo) return
        shareMusic(
          settingState.setting['common.shareType'],
          settingState.setting['download.fileName'],
          musicInfo,
        )
        break
      }
      case 'locate': {
        const id = commonState.componentIds.playDetail
        if (id) void pop(id)
        setTimeout(() => {
          global.app_event.jumpListPosition()
        }, 280)
        break
      }
      case 'desktopLyric':
        desktopLyricEnableRef.current?.setEnabled(!settingState.setting['desktopLyric.enable'])
        break
      case 'desktopLyricLock': {
        const isLock = !settingState.setting['desktopLyric.isLock']
        void toggleDesktopLyricLock(isLock).then(() => {
          updateSetting({ 'desktopLyric.isLock': isLock })
        })
        break
      }
      case 'timeoutExit':
        timeoutExitModalRef.current?.show()
        break
      case 'setting':
        settingPopupRef.current?.show()
        break
      default:
        break
    }
  }, [])

  return (
    <>
      <ActionSheet ref={actionSheetRef} onPress={handleAction} />
      <MusicAddModal ref={musicAddModalRef} />
      <DesktopLyricEnable ref={desktopLyricEnableRef} />
      <TimeoutExitEditModal ref={timeoutExitModalRef} timeInfo={timeInfo} />
      <SettingPopup ref={settingPopupRef} direction="vertical" />
    </>
  )
})
