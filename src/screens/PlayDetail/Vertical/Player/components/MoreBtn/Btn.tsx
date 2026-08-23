import { TouchableOpacity } from 'react-native'
import { Icon } from '@/components/common/Icon'
import { createStyle } from '@/utils/tools'
import { Immersive, MacTouchSize, MacIconSize } from '../../../../macOS'


/**
 * 沉浸式工具栏按钮
 * — 44pt 触控
 * — 默认白色，可覆盖激活色
 */
export const BTN_WIDTH = MacTouchSize.medium
export const BTN_ICON_SIZE = MacIconSize.md

export default ({ icon, color, onPress, onLongPress }: {
  icon: string
  color?: string
  onPress: () => void
  onLongPress?: () => void
}) => {
  return (
    <TouchableOpacity
      style={{
        ...styles.controlBtn,
        width: BTN_WIDTH,
        height: BTN_WIDTH,
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        borderWidth: 0.5,
        borderColor: 'rgba(255, 255, 255, 0.14)',
      }}
      activeOpacity={0.65}
      onPress={onPress}
      onLongPress={onLongPress}
    >
      <Icon name={icon} color={color ?? Immersive.text} size={BTN_ICON_SIZE} />
    </TouchableOpacity>
  )
}

const styles = createStyle({
  controlBtn: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: BTN_WIDTH / 2,
  },
})
