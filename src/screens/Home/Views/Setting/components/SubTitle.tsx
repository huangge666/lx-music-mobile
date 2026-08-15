import { memo } from 'react'
import { View } from 'react-native'

import { createStyle } from '@/utils/tools'
import Text from '@/components/common/Text'
import { useTheme } from '@/store/theme/hook'

/**
 * 卡片内的子分组标题
 * 不再套一层底板，内容直接落在 Section 卡片里
 */
export default memo(({ title, children }: {
  title: string
  children: React.ReactNode | React.ReactNode[]
  card?: boolean
}) => {
  const theme = useTheme()

  return (
    <View style={styles.container}>
      <Text style={styles.title} size={13} color={theme['c-font-label']}>{title}</Text>
      <View style={styles.content}>{children}</View>
    </View>
  )
})


const styles = createStyle({
  container: {
    marginTop: 8,
    marginBottom: 6,
  },
  title: {
    paddingHorizontal: 2,
    marginBottom: 10,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  content: {},
})
