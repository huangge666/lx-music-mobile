import { TouchableOpacity } from 'react-native'
import { Icon } from '@/components/common/Icon'
import { createStyle } from '@/utils/tools'
import { Immersive } from '../../macOS'


export const BTN_WIDTH = 48
export const BTN_ICON_SIZE = 22

export default ({ icon, color, label, onPress }: {
  icon: string
  color?: string
  label: string
  onPress: () => void
}) => {
  return (
    <TouchableOpacity
      style={{ ...styles.cotrolBtn, width: BTN_WIDTH, height: BTN_WIDTH }}
      activeOpacity={0.55}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Icon name={icon} color={color ?? Immersive.text} rawSize={BTN_ICON_SIZE} />
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
