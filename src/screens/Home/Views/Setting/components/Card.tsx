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
          ? 'rgba(255, 255, 255, 0.06)'
          : 'rgba(118, 118, 128, 0.08)',
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
