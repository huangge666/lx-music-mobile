import { View, type StyleProp, type ViewStyle } from 'react-native'

import { useTheme } from '@/store/theme/hook'

interface Props {
  children?: React.ReactNode
  style?: StyleProp<ViewStyle>
  /** 高光条贴在顶部还是左侧，用于横向栏和竖向面板 */
  highlight?: 'top' | 'left' | 'none'
}

/**
 * 液态玻璃表面：半透底色 + 辅色柔光 + 一条高光。
 * 不依赖原生模糊，浅色和深色共用同一结构。
 */
export default ({ children, style, highlight = 'top' }: Props) => {
  const theme = useTheme()

  return (
    <View style={[{
      backgroundColor: theme['c-glass-background'],
      borderColor: theme['c-glass-border'],
      overflow: 'hidden',
    }, style]}>
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: theme['c-glass-fluid-glow'],
        }}
      />
      {highlight == 'none'
        ? null
        : (
            <View
              pointerEvents="none"
              style={highlight == 'left'
                ? {
                    position: 'absolute',
                    top: 0,
                    bottom: 0,
                    left: 0,
                    width: 1,
                    backgroundColor: theme['c-glass-highlight'],
                  }
                : {
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 1,
                    backgroundColor: theme['c-glass-highlight'],
                  }}
            />
          )}
      {children}
    </View>
  )
}
