import { View } from 'react-native'

import { createStyle } from '@/utils/tools'
import { useTheme } from '@/store/theme/hook'
import Text from '@/components/common/Text'
import { BorderRadius } from '@/theme'

/**
 * Apple Music / iOS Settings 风格 Section 分组
 *
 * 视觉特征：
 * — 区段标题：全大写次要色小号文字（Apple 设置页风格）
 * — 无左边框竖线（旧 Material 风格已移除）
 * — 内容区正常排列，由子组件自行处理圆角卡片
 */
interface Props {
  title: string
  children: React.ReactNode | React.ReactNode[]
}

export default ({ title, children }: Props) => {
  const theme = useTheme()

  return (
    <View style={styles.container}>
      {/* Apple 风格区段标题 — 次要色、小号、左缩进 */}
      <Text style={styles.title} size={13} color={theme['c-font-label']}>{title}</Text>
      <View style={styles.content}>
        {children}
      </View>
    </View>
  )
}


const styles = createStyle({
  container: {
    marginBottom: 24,
  },
  title: {
    paddingLeft: 16,
    paddingBottom: 8,
    paddingTop: 8,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  content: {},
})
