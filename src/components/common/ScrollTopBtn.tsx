import { memo } from 'react'
import { Platform, TouchableOpacity } from 'react-native'
import { Icon } from '@/components/common/Icon'
import { useI18n } from '@/lang'
import { useTheme } from '@/store/theme/hook'
import { createStyle } from '@/utils/tools'

export interface ScrollTopBtnProps {
  visible: boolean
  onPress: () => void
}

/**
 * 列表回到顶部的圆形悬浮按钮。
 * 由调用方按滚动距离控制 visible，避免停在顶部时挡住内容。
 */
export default memo(({ visible, onPress }: ScrollTopBtnProps) => {
  const t = useI18n()
  const theme = useTheme()

  if (!visible) return null

  return (
    <TouchableOpacity
      activeOpacity={0.82}
      accessibilityRole="button"
      accessibilityLabel={t('list_scroll_top')}
      onPress={onPress}
      style={{
        ...styles.btn,
        backgroundColor: theme['c-glass-background'],
        borderColor: theme['c-glass-border'],
      }}
    >
      <Icon name="chevron-up" size={18} color={theme['c-accent']} />
    </TouchableOpacity>
  )
})

const styles = createStyle({
  btn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 0.5,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 14,
      },
      android: {
        elevation: 8,
      },
    }),
  },
})
