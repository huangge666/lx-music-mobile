import { View } from 'react-native'
import { Icon } from '@/components/common/Icon'
import { useTheme } from '@/store/theme/hook'
import { settingLayout } from './style'

/**
 * 设置行左侧圆形图标底
 */
export default ({ name }: { name: string }) => {
  const theme = useTheme()

  return (
    <View style={[
      settingLayout.iconBubble,
      {
        backgroundColor: theme.isDark
          ? 'rgba(255, 255, 255, 0.06)'
          : theme['c-primary-background'],
        borderColor: theme.isDark
          ? 'rgba(255, 255, 255, 0.08)'
          : theme['c-glass-border'],
        marginRight: 14,
      },
    ]}>
      <Icon name={name} size={18} color={theme['c-primary']} />
    </View>
  )
}
