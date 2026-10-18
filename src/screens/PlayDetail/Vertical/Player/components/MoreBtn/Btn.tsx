import { TouchableOpacity } from 'react-native'
import { Icon } from '@/components/common/Icon'
import { createStyle } from '@/utils/tools'
import { Immersive, MacTouchSize, MacIconSize } from '../../../../macOS'


/**
 * 沉浸式工具栏按钮
 * — 44pt 触控
 * — 默认白色，可覆盖激活色
 * — 传入 label 时提供本地化读屏文字、选中态与禁用态，禁用态用低透明度表达
 */
export const BTN_WIDTH = MacTouchSize.medium
export const BTN_ICON_SIZE = MacIconSize.md

export default ({ icon, color, label, disabled, selected, onPress, onLongPress }: {
  icon: string
  color?: string
  /** 本地化读屏文字（必填，界面语言随 i18n 变化） */
  label: string
  disabled?: boolean
  selected?: boolean
  onPress: () => void
  onLongPress?: () => void
}) => {
  return (
    <TouchableOpacity
      style={[
        {
          ...styles.controlBtn,
          width: BTN_WIDTH,
          height: BTN_WIDTH,
          backgroundColor: 'rgba(255, 255, 255, 0.08)',
          borderWidth: 0.5,
          borderColor: 'rgba(255, 255, 255, 0.14)',
        },
        disabled ? styles.disabled : null,
      ]}
      activeOpacity={0.65}
      onPress={onPress}
      onLongPress={onLongPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled, selected: !!selected }}
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
  // 不可用：图标降到半透明，仍保留位置避免功能栏跳动
  disabled: {
    opacity: 0.35,
  },
})
