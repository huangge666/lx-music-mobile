import { memo, useMemo } from 'react'
import { createStyle } from '@/utils/tools'
import { useTheme } from '@/store/theme/hook'
import Text from './Text'
import { BorderRadius } from '@/theme'

/**
 * Apple Music 风格 Badge
 *
 * 类型：
 * — normal: 主色文字
 * — secondary: 次要色文字
 * — tertiary: 第三色文字
 *
 * 视觉：小号文字 + 极小圆角，无背景填充（Apple Music 的品质标签风格）
 */
const styles = createStyle({
  text: {
    marginRight: 5,
    fontWeight: '500',
    alignSelf: 'center',
  },
})

export type BadgeType = 'normal' | 'secondary' | 'tertiary'

export default memo(({ type = 'normal', children }: {
  type?: BadgeType
  children: string
}) => {
  const theme = useTheme()
  const colors = useMemo(() => {
    const colors = { textColor: '' }
    switch (type) {
      case 'normal':
        colors.textColor = theme['c-badge-primary']
        break
      case 'secondary':
        colors.textColor = theme['c-badge-secondary']
        break
      case 'tertiary':
        colors.textColor = theme['c-badge-tertiary']
        break
    }
    return colors
  }, [type, theme])

  return <Text style={styles.text} size={10} color={colors.textColor}>{children}</Text>
})
