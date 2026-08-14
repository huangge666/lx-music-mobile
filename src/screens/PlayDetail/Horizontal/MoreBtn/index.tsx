import { createStyle } from '@/utils/tools'
import { View } from 'react-native'
import PlayModeBtn from './PlayModeBtn'
import MusicAddBtn from './MusicAddBtn'
import TimeoutExitBtn from './TimeoutExitBtn'
import { useTheme } from '@/store/theme/hook'
import { MacRadius, MacSpacing, MacShadow, getMacGlassBackground, getMacGlassBorder } from '../../macOS'


/**
 * macOS 风格侧边工具栏
 *
 * 左侧浮起一个紧凑的毛玻璃胶囊：
 *  ⌖   ← 定时关闭
 *  ♡   ← 收藏
 *  ⟲   ← 播放模式
 *
 * 圆角 22pt，纵向排列，每个按钮 36pt 触控
 */
export default () => {
  const theme = useTheme()
  const isDark = !!theme.isDark

  return (
    <View style={[
      styles.container,
      {
        backgroundColor: getMacGlassBackground(isDark),
        borderColor: getMacGlassBorder(isDark),
      },
      MacShadow.small,
    ]}>
      <TimeoutExitBtn />
      <MusicAddBtn />
      <PlayModeBtn />
    </View>
  )
}


const styles = createStyle({
  container: {
    flexShrink: 0,
    flexGrow: 0,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    height: 'auto',
    left: MacSpacing.sm,
    top: '50%',
    paddingVertical: MacSpacing.sm,
    paddingHorizontal: MacSpacing.xs,
    borderRadius: MacRadius.xl,
    borderWidth: 0.5,
    gap: MacSpacing.sm,
    zIndex: 1,
    transform: [{ translateY: -50 }],
  },
})
