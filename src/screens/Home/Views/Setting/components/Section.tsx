import { View, type ViewStyle } from 'react-native'

import { createStyle } from '@/utils/tools'
import { useTheme } from '@/store/theme/hook'
import Text from '@/components/common/Text'
import { settingLayout, useSettingCardStyle } from './style'

/**
 * 设置分组卡（Phase 6A）
 * — 标题在卡片内，小号字距拉开
 * — 实色卡片 + 中性发丝线，不再叠玻璃、阴影和顶部高光
 * — 子项作为卡片内的行，不再各自套一层底板
 */
interface Props {
  title?: string
  style?: ViewStyle
  children: React.ReactNode | React.ReactNode[]
}

export default ({ title, style, children }: Props) => {
  const theme = useTheme()
  const cardStyle = useSettingCardStyle()

  return (
    <View style={[
      styles.container,
      settingLayout.card,
      cardStyle,
      title ? null : styles.cardNoTitle,
      style,
    ]}>
      {title
        ? <Text style={settingLayout.cardTitle} size={13} color={theme['c-font-label']}>{title}</Text>
        : null}
      <View style={styles.content}>
        {children}
      </View>
    </View>
  )
}


const styles = createStyle({
  container: {},
  cardNoTitle: {
    paddingTop: 6,
    paddingBottom: 6,
  },
  content: {
    gap: 0,
  },
})
