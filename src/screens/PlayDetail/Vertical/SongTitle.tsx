import { memo, useCallback, useEffect, useRef, useState } from 'react'
import { View, TouchableOpacity } from 'react-native'
import Text from '@/components/common/Text'
import { Icon } from '@/components/common/Icon'
import { usePlayerMusicInfo } from '@/store/player/hook'
import { createStyle } from '@/utils/tools'
import { collectMusic, uncollectMusic } from '@/core/player/player'
import state from '@/store/list/state'
import { LIST_IDS } from '@/config/constant'
import playerState from '@/store/player/state'
import SettingPopup, { type SettingPopupType } from '@/screens/PlayDetail/components/SettingPopup'
import {
  Immersive,
  MacFontSize,
  MacIconSize,
  MacSpacing,
  MacTouchSize,
  MacAccentRed,
} from '../macOS'


const checkIsLove = (musicId: string | null | undefined): boolean => {
  if (!musicId) return false
  const list = state.allMusicList.get(LIST_IDS.LOVE)
  if (!list) return false
  return list.some(m => m.id == musicId)
}

/**
 * Apple Music 风格标题行
 * — 左：粗体歌名 + 浅色歌手
 * — 右：半透明圆钮 收藏 + 更多
 */
const SongTitle = () => {
  const musicInfo = usePlayerMusicInfo()
  const popupRef = useRef<SettingPopupType>(null)
  const [, setLoveVersion] = useState(0)

  const forceUpdate = useCallback(() => {
    setLoveVersion(v => v + 1)
  }, [])

  useEffect(() => {
    const handleChange = (ids: string[]) => {
      if (!ids.includes(LIST_IDS.LOVE)) return
      forceUpdate()
    }
    const handleMylistUpdated = () => {
      forceUpdate()
    }
    global.app_event.on('myListMusicUpdate', handleChange)
    global.state_event.on('mylistUpdated', handleMylistUpdated)
    return () => {
      global.app_event.off('myListMusicUpdate', handleChange)
      global.state_event.off('mylistUpdated', handleMylistUpdated)
    }
  }, [forceUpdate])

  const isLove = checkIsLove(musicInfo.id)

  const handleLove = useCallback(() => {
    if (!playerState.playMusicInfo.musicInfo) return
    if (isLove) uncollectMusic()
    else collectMusic()
  }, [isLove])

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
          <Icon
            name="love"
            color={isLove ? MacAccentRed : Immersive.text}
            size={MacIconSize.md}
          />
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
  // 标题旁操作 — 无圆形毛玻璃底，只留图标
  circleBtn: {
    width: BTN,
    height: BTN,
    borderRadius: BTN / 2,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
})

export default memo(SongTitle)
