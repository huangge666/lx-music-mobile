import { StyleSheet, TouchableOpacity } from 'react-native'
import { Icon } from '@/components/common/Icon'
import { Immersive } from '../../macOS'

export const BTN_WIDTH = 48
export const BTN_ICON_SIZE = 20

export default ({ icon, size, color, label, onPress, onLongPress }: {
  icon: string
  size?: number
  color?: string
  label: string
  onPress: () => void
  onLongPress?: () => void
}) => {
  return (
    <TouchableOpacity style={styles.cotrolBtn} activeOpacity={0.65} onPress={onPress} onLongPress={onLongPress} accessibilityRole="button" accessibilityLabel={label}>
      <Icon name={icon} color={color ?? Immersive.text} rawSize={size ?? BTN_ICON_SIZE} />
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  cotrolBtn: {
    width: BTN_WIDTH,
    height: BTN_WIDTH,
    borderRadius: BTN_WIDTH / 2,
    backgroundColor: Immersive.glass,
    justifyContent: 'center',
    alignItems: 'center',
  },
})
