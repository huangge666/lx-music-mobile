import { TouchableOpacity } from 'react-native'
import { Icon } from '@/components/common/Icon'
import { createStyle } from '@/utils/tools'
import { useTheme } from '@/store/theme/hook'
import { MacTouchSize, MacIconSize } from '../../macOS'


/**
 * macOS 风格横屏工具栏按钮
 *
 * — 40pt 触控区（侧边栏紧凑布局）
 * — 22pt 图标尺寸
 * — 圆形反馈
 */
export const BTN_WIDTH = MacTouchSize.small
export const BTN_ICON_SIZE = MacIconSize.md

export default ({ icon, color, onPress }: {
  icon: string
  color?: string
  onPress: () => void
}) => {
  const theme = useTheme()
  return (
    <TouchableOpacity
      style={{ ...styles.cotrolBtn, width: BTN_WIDTH, height: BTN_WIDTH }}
      activeOpacity={0.55}
      onPress={onPress}
    >
      <Icon name={icon} color={color ?? theme['c-font-label']} size={BTN_ICON_SIZE} />
    </TouchableOpacity>
  )
}

const styles = createStyle({
  cotrolBtn: {
    marginBottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: BTN_WIDTH / 2,
  },
})
