import { memo, useCallback, useEffect, useRef, useState } from 'react'
import { StyleSheet, View, TouchableOpacity } from 'react-native'
import Text from '@/components/common/Text'
import { Icon } from '@/components/common/Icon'
import { usePlayerMusicInfo } from '@/store/player/hook'
import { useI18n } from '@/lang'
import { toast } from '@/utils/tools'
import { collectMusic, uncollectMusic } from '@/core/player/player'
import { getListMusicSync } from '@/utils/listManage'
import { LIST_IDS } from '@/config/constant'
import MoreMenu, { type MoreMenuType } from './MoreMenu'
import {
  Immersive,
  MacFontSize,
  MacIconSize,
  MacSpacing,
} from '../macOS'


const checkIsLove = (musicId: string | null | undefined): boolean => {
  if (!musicId) return false
  // 真实收藏列表在 listManage.allMusicList；store/list/state.allMusicList 不会写入歌曲数据
  return getListMusicSync(LIST_IDS.LOVE).some(m => m.id == musicId)
}

/**
 * 沉浸式标题行
 * — 左：粗体歌名 + 浅色歌手
 * — 右：半透明圆钮 收藏 + 更多（歌曲操作抽屉）
 * — 收藏按钮已收藏时用心形实心填充，读屏同时给出选中态；无当前曲目时整行禁用
 */
const SongTitle = ({ compact = false }: { compact?: boolean }) => {
  const t = useI18n()
  const musicInfo = usePlayerMusicInfo()
  const moreMenuRef = useRef<MoreMenuType>(null)
  const [isLove, setIsLove] = useState(() => checkIsLove(musicInfo.id))
  const [savingLove, setSavingLove] = useState(false)
  const savingLoveRef = useRef(false)
  const currentMusicIdRef = useRef(musicInfo.id)
  currentMusicIdRef.current = musicInfo.id
  const hasTrack = !!musicInfo.id

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
    if (!musicInfo.id || savingLoveRef.current) return

    const musicId = musicInfo.id
    const nextIsLove = !isLove
    // 同一写入完成前不接收第二次点按；旧歌曲的异步回调不能改写新歌曲的收藏状态。
    savingLoveRef.current = true
    setSavingLove(true)
    setIsLove(nextIsLove)
    void (nextIsLove ? collectMusic() : uncollectMusic()).then((success) => {
      if (currentMusicIdRef.current != musicId) return
      setIsLove(checkIsLove(musicId))
      if (!success) return
      toast(global.i18n.t(nextIsLove ? 'collect_success' : 'list_edit_action_tip_remove_success'))
    }).catch((err: unknown) => {
      if (currentMusicIdRef.current != musicId) return
      setIsLove(checkIsLove(musicId))
      toast(err instanceof Error && err.message ? err.message : global.i18n.t('list_edit_action_tip_add_failed'))
    }).finally(() => {
      savingLoveRef.current = false
      setSavingLove(false)
    })
  }, [isLove, musicInfo.id])

  const handleMore = useCallback(() => {
    moreMenuRef.current?.show()
  }, [])

  return (
    <View style={[styles.container, compact ? styles.compact : null]}>
      <View style={styles.textCol}>
        <Text
          style={styles.name}
          size={compact ? 19 : 26}
          color={Immersive.text}
          numberOfLines={1}
          accessibilityLabel={musicInfo.name ? musicInfo.name : undefined}
        >
          {musicInfo.name || ''}
        </Text>
        <Text
          style={styles.singer}
          size={compact ? 12 : MacFontSize.body}
          color={Immersive.textSecondary}
          numberOfLines={1}
        >
          {musicInfo.singer || ''}
        </Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.circleBtn, hasTrack && !savingLove ? null : styles.disabled]}
          activeOpacity={0.7}
          onPress={handleLove}
          disabled={!hasTrack || savingLove}
          accessibilityRole="button"
          accessibilityLabel={t('collect')}
          accessibilityState={{ selected: isLove, disabled: !hasTrack || savingLove, busy: savingLove }}
        >
          <Icon
            name={isLove ? 'heart' : 'love'}
            color={isLove ? Immersive.accent : Immersive.text}
            fill={isLove ? Immersive.accent : 'none'}
            rawSize={MacIconSize.md}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.circleBtn, hasTrack ? null : styles.disabled]}
          activeOpacity={0.7}
          onPress={handleMore}
          disabled={!hasTrack}
          accessibilityRole="button"
          accessibilityLabel={t('play_detail_action_more')}
          accessibilityState={{ disabled: !hasTrack }}
        >
          <Icon name="dots-vertical" color={Immersive.text} rawSize={MacIconSize.md} />
        </TouchableOpacity>
      </View>

      <MoreMenu ref={moreMenuRef} />
    </View>
  )
}

const BTN = 48

const styles = StyleSheet.create({
  container: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: MacSpacing.xxl,
    // 封面与标题之间留白更舒适
    paddingTop: 16,
    paddingBottom: MacSpacing.md,
  },
  textCol: {
    flex: 1,
    flexShrink: 1,
    paddingRight: MacSpacing.md,
    justifyContent: 'center',
  },
  compact: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 2,
  },
  name: {
    fontWeight: '700',
    letterSpacing: -0.6,
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
  // 无当前曲目：置灰但仍占位
  disabled: {
    opacity: 0.35,
  },
})

export default memo(SongTitle)
