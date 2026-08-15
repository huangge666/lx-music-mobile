import { View } from 'react-native'

import { createStyle } from '@/utils/tools'
import { useTheme } from '@/store/theme/hook'
import Text from '@/components/common/Text'
import { settingLayout, useSettingCardStyle } from './style'

/**
 * CyShineMusic 风格设置分组卡
 * — 标题在卡片内，小号字距拉开
 * — 大圆角 + 轻阴影
 * — 子项作为卡片内的行，不再各自套一层底板
 */
interface Props {
  title: string
  children: React.ReactNode | React.ReactNode[]
}

export default ({ title, children }: Props) => {
  const theme = useTheme()
  const cardStyle = useSettingCardStyle()

  return (
    <View style={[styles.container, settingLayout.card, cardStyle]}>
      <Text style={settingLayout.cardTitle} size={12} color={theme['c-font-label']}>{title}</Text>
      <View style={styles.content}>
        {children}
      </View>
    </View>
  )
}


const styles = createStyle({
  container: {},
  content: {
    gap: 0,
  },
})
