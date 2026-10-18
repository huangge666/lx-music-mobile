import { View, type ViewStyle } from 'react-native'

import { createStyle } from '@/utils/tools'
import { useTheme } from '@/store/theme/hook'
import { settingLayout } from './style'

/**
 * 卡片内的次级容器（音源列表等成组内容）。
 * Phase 6A：改用中性填充底 + 发丝线，不再用玻璃底，避免和卡片实色底叠成两层半透明。
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
      { backgroundColor: theme['c-primary-input-background'] },
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
