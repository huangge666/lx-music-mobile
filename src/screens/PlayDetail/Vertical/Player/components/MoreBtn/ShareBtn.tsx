import { memo, useCallback } from 'react'
import { TouchableOpacity } from 'react-native'
import { Icon } from '@/components/common/Icon'
import { useTheme } from '@/store/theme/hook'
import { createStyle, shareMusic } from '@/utils/tools'
import { MacTouchSize, MacIconSize } from '../../../../macOS'
import playerState from '@/store/player/state'
import settingState from '@/store/setting/state'


/**
 * 现代简约分享按钮
 * — 默认次要色（c-font-label）
 * — 复用全局 shareMusic 工具
 */
const BTN_WIDTH = MacTouchSize.medium
const BTN_ICON_SIZE = MacIconSize.md

const ShareBtn = () => {
  const theme = useTheme()

  const handlePress = useCallback(() => {
    const musicInfo = playerState.playMusicInfo.musicInfo
    if (!musicInfo) return
    const target = 'progress' in musicInfo ? musicInfo.metadata.musicInfo : musicInfo
    shareMusic(
      settingState.setting['common.shareType'],
      settingState.setting['download.fileName'],
      target,
    )
  }, [])

  return (
    <TouchableOpacity
      style={{ ...styles.btn, width: BTN_WIDTH, height: BTN_WIDTH }}
      activeOpacity={0.55}
      onPress={handlePress}
    >
      <Icon name="share" color={theme['c-font-label']} size={BTN_ICON_SIZE} />
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

export default memo(ShareBtn)
