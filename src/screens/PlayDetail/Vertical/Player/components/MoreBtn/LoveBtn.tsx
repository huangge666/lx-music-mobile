import { memo, useCallback, useEffect, useState } from 'react'
import { TouchableOpacity } from 'react-native'
import { Icon } from '@/components/common/Icon'
import { useTheme } from '@/store/theme/hook'
import { createStyle } from '@/utils/tools'
import {
  MacTouchSize,
  MacIconSize,
  MacAccentRed,
} from '../../../../macOS'
import { collectMusic, uncollectMusic } from '@/core/player/player'
import { usePlayerMusicInfo } from '@/store/player/hook'
import { getListMusicSync } from '@/utils/listManage'
import { LIST_IDS } from '@/config/constant'
import playerState from '@/store/player/state'


/**
 * 现代简约「喜欢 / 红心」按钮
 * — 默认次要色（c-font-label）
 * — 已喜欢时切换为红色（与主红色呼应）
 * — 通过订阅 myListMusicUpdate 事件，实时同步列表更新
 */
const BTN_WIDTH = MacTouchSize.medium
const BTN_ICON_SIZE = MacIconSize.md

/**
 * 从 listManage 的真实收藏列表判断是否已喜欢
 */
const checkIsLove = (musicId: string | null | undefined): boolean => {
  if (!musicId) return false
  // 真实收藏列表在 listManage.allMusicList；store/list/state.allMusicList 不会写入歌曲数据
  return getListMusicSync(LIST_IDS.LOVE).some(m => m.id == musicId)
}

const LoveBtn = () => {
  const theme = useTheme()
  const musicInfo = usePlayerMusicInfo()
  const [, setLoveVersion] = useState(0)
  // 仅用于触发组件重新渲染以重算 isLove（避免在 useMemo 内引用 setState 计数器）
  const forceUpdate = useCallback(() => {
    setLoveVersion(v => v + 1)
  }, [])

  // 监听我的列表歌曲变化（收藏 / 取消收藏时触发）
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
  const color = isLove ? MacAccentRed : theme['c-font-label']

  const handlePress = useCallback(() => {
    if (!playerState.playMusicInfo.musicInfo) return
    if (isLove) void uncollectMusic()
    else void collectMusic()
  }, [isLove])

  return (
    <TouchableOpacity
      style={{ ...styles.btn, width: BTN_WIDTH, height: BTN_WIDTH }}
      activeOpacity={0.55}
      onPress={handlePress}
    >
      <Icon name="love" color={color} size={BTN_ICON_SIZE} />
    </TouchableOpacity>
  )
}

const styles = createStyle({
  btn: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: BTN_WIDTH / 2,
  },
})

export default memo(LoveBtn)
