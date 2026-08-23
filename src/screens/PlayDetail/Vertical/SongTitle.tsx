import { memo, useCallback, useEffect, useRef, useState } from 'react'
import { View, TouchableOpacity } from 'react-native'
import Text from '@/components/common/Text'
import { Icon, IconMaterialCommunityIcons } from '@/components/common/Icon'
import { usePlayerMusicInfo } from '@/store/player/hook'
import { useTheme } from '@/store/theme/hook'
import { createStyle, toast } from '@/utils/tools'
import { scaleSizeW } from '@/utils/pixelRatio'
import { collectMusic, uncollectMusic } from '@/core/player/player'
import { getListMusicSync } from '@/utils/listManage'
import { LIST_IDS } from '@/config/constant'
import SettingPopup, { type SettingPopupType } from '@/screens/PlayDetail/components/SettingPopup'
import {
  Immersive,
  MacFontSize,
  MacIconSize,
  MacSpacing,
  MacTouchSize,
} from '../macOS'


const checkIsLove = (musicId: string | null | undefined): boolean => {
  if (!musicId) return false
  // 真实收藏列表在 listManage.allMusicList；store/list/state.allMusicList 不会写入歌曲数据
  return getListMusicSync(LIST_IDS.LOVE).some(m => m.id == musicId)
}

/**
 * Apple Music 风格标题行
 * — 左：粗体歌名 + 浅色歌手
 * — 右：半透明圆钮 收藏 + 更多
 */
const SongTitle = () => {
  const theme = useTheme()
  const musicInfo = usePlayerMusicInfo()
  const popupRef = useRef<SettingPopupType>(null)
  const [isLove, setIsLove] = useState(() => checkIsLove(musicInfo.id))

  const syncLoveState = useCallback(() => {
    setIsLove(checkIsLove(musicInfo.id))
  }, [musicInfo.id])

  // 歌曲切换或收藏列表从其他入口更新时，以真实列表状态校准按钮。
  useEffect(() => {
    syncLoveState()
  }, [syncLoveState])

  useEffect(() => {
    const handleChange = (ids: string[]) => {
      if (!ids.includes(LIST_IDS.LOVE)) return
      syncLoveState()
    }
    const handleMylistUpdated = () => {
      syncLoveState()
    }
    global.app_event.on('myListMusicUpdate', handleChange)
    global.state_event.on('mylistUpdated', handleMylistUpdated)
    return () => {
      global.app_event.off('myListMusicUpdate', handleChange)
      global.state_event.off('mylistUpdated', handleMylistUpdated)
    }
  }, [syncLoveState])

  const handleLove = useCallback(() => {
    if (!musicInfo.id) return

    const nextIsLove = !isLove
    // 收藏写入是异步操作，先更新视觉状态，确保按下后立即变色。
    setIsLove(nextIsLove)
    void (nextIsLove ? collectMusic() : uncollectMusic()).then((success) => {
      if (!success) {
        setIsLove(isLove)
        return
      }
      toast(global.i18n.t(nextIsLove ? 'collect_success' : 'list_edit_action_tip_remove_success'))
    }).catch((err: unknown) => {
      setIsLove(isLove)
      toast(err instanceof Error && err.message ? err.message : global.i18n.t('list_edit_action_tip_add_failed'))
    })
  }, [isLove, musicInfo.id])

  const handleMore = useCallback(() => {
    popupRef.current?.show()
  }, [])

  return (
    <View style={styles.container}>
      <View style={styles.textCol}>
        <Text
          style={styles.name}
          size={MacFontSize.title}
          color={Immersive.text}
          numberOfLines={1}
        >
          {musicInfo.name || ''}
        </Text>
        <Text
          style={styles.singer}
          size={MacFontSize.body}
          color={Immersive.textSecondary}
          numberOfLines={1}
        >
          {musicInfo.singer || ''}
        </Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.circleBtn} activeOpacity={0.7} onPress={handleLove}>
          {isLove ? (
            <IconMaterialCommunityIcons
              name="heart"
              color={theme['c-primary']}
              size={scaleSizeW(MacIconSize.md)}
            />
          ) : (
            <Icon
              name="love"
              color={Immersive.text}
              size={MacIconSize.md}
            />
          )}
        </TouchableOpacity>
        <TouchableOpacity style={styles.circleBtn} activeOpacity={0.7} onPress={handleMore}>
          <Icon name="dots-vertical" color={Immersive.text} size={MacIconSize.md} />
        </TouchableOpacity>
      </View>

      <SettingPopup ref={popupRef} direction="vertical" />
    </View>
  )
}

const BTN = MacTouchSize.medium

const styles = createStyle({
  container: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: MacSpacing.xxl,
    // 封面与标题之间留白更舒适
    paddingTop: MacSpacing.xxl,
    paddingBottom: MacSpacing.md,
  },
  textCol: {
    flex: 1,
    flexShrink: 1,
    paddingRight: MacSpacing.md,
    justifyContent: 'center',
  },
  name: {
    fontWeight: '700',
    letterSpacing: 0.1,
  },
  singer: {
    marginTop: 4,
    letterSpacing: 0.15,
    fontWeight: '400',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: MacSpacing.sm,
  },
  // 标题旁操作 — 水光微圆底
  circleBtn: {
    width: BTN,
    height: BTN,
    borderRadius: BTN / 2,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
})

export default memo(SongTitle)
