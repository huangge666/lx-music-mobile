import { View, type ViewStyle } from 'react-native'

import { createStyle } from '@/utils/tools'
import { useTheme } from '@/store/theme/hook'
import { settingLayout } from './style'

/**
 * 卡片内的浅色内嵌容器，用于音源列表等成组内容
 */
interface Props {
  children: React.ReactNode | React.ReactNode[]
  style?: ViewStyle
}

export default ({ children, style }: Props) => {
  const theme = useTheme()

  return (
    <View style={[
      settingLayout.inset,
      styles.card,
      {
        backgroundColor: theme.isDark
          ? 'rgba(255, 255, 255, 0.04)'
          : 'rgba(118, 118, 128, 0.06)',
        borderWidth: 0.5,
        borderColor: theme['c-border-background'],
      },
      style,
    ]}>
      {children}
    </View>
  )
}

const styles = createStyle({
  card: {
    marginBottom: 4,
  },
})
