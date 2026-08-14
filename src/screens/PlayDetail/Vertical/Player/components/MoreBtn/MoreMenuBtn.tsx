import { memo, useCallback, useRef } from 'react'
import { TouchableOpacity } from 'react-native'
import { Icon } from '@/components/common/Icon'
import { useTheme } from '@/store/theme/hook'
import { createStyle } from '@/utils/tools'
import { MacTouchSize, MacIconSize } from '../../../../macOS'
import SettingPopup, { type SettingPopupType } from '@/screens/PlayDetail/components/SettingPopup'


/**
 * 现代简约「更多 / 设置」按钮
 * — 默认次要色（c-font-label）
 * — 点击弹出设置弹窗（歌词字号 / 歌词对齐 / 音量 / 播放速度等）
 *
 * 与顶栏 Header 里的「slider」图标呼应：这里保留次要色，Header 里的保持原色
 */
const BTN_WIDTH = MacTouchSize.medium
const BTN_ICON_SIZE = MacIconSize.md

const MoreMenuBtn = () => {
  const theme = useTheme()
  const popupRef = useRef<SettingPopupType>(null)

  const handlePress = useCallback(() => {
    popupRef.current?.show()
  }, [])

  return (
    <>
      <TouchableOpacity
        style={{ ...styles.btn, width: BTN_WIDTH, height: BTN_WIDTH }}
        activeOpacity={0.55}
        onPress={handlePress}
      >
        <Icon name="dots-vertical" color={theme['c-font-label']} size={BTN_ICON_SIZE} />
      </TouchableOpacity>
      <SettingPopup ref={popupRef} direction="vertical" />
    </>
  )
}

const styles = createStyle({
  btn: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: BTN_WIDTH / 2,
  },
})

export default memo(MoreMenuBtn)
