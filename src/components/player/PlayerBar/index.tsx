import { memo, useMemo } from 'react'
import { View } from 'react-native'
import { useKeyboard } from '@/utils/hooks'

import Pic from './components/Pic'
import Title from './components/Title'
import PlayInfo from './components/PlayInfo'
import ControlBtn from './components/ControlBtn'
import { createStyle } from '@/utils/tools'
import { useTheme } from '@/store/theme/hook'
import { useSettingValue } from '@/store/setting/hook'


/**
 * 小播放栏（浮动迷你播放器）
 *
 * 设计原则：
 * — 大圆角药丸形（22pt），柔和、圆润、现代
 * — 紧凑布局：正圆封面 + 标题区 + 进度条/时间 + 控制按钮（圆播放按钮 + 次要色下一首）
 * — 柔和阴影 + 半透明玻璃底，轻拟物浮起感
 */
export default memo(({ isHome = false }: { isHome?: boolean }) => {
  const { keyboardShown } = useKeyboard()
  const theme = useTheme()
  const autoHidePlayBar = useSettingValue('common.autoHidePlayBar')

  const playerComponent = useMemo(() => (
    <View style={{
      ...styles.container,
      backgroundColor: theme['c-glass-background'],
      borderColor: theme['c-border-background'],
    }}>
      <View style={styles.left}>
        <Pic isHome={isHome} />
      </View>
      <View style={styles.center}>
        <Title isHome={isHome} />
        <PlayInfo isHome={isHome} />
      </View>
      <View style={styles.right}>
        <ControlBtn />
      </View>
    </View>
  ), [theme, isHome])

  return autoHidePlayBar && keyboardShown ? null : playerComponent
})


const styles = createStyle({
  container: {
    // 加大左右边距，让卡片在视觉上更聚拢、收窄，避免贴满屏幕两侧
    marginHorizontal: 28,
    marginTop: 4,
    marginBottom: 6,
    paddingVertical: 6,
    paddingLeft: 6,
    paddingRight: 4,
    // 大圆角卡片 — 比药丸形更收敛，圆度适中
    borderRadius: 16,
    borderWidth: 0.5,
    flexDirection: 'row',
    alignItems: 'center',
  },
  left: {
    flexGrow: 0,
    flexShrink: 0,
  },
  center: {
    flexDirection: 'column',
    flexGrow: 1,
    flexShrink: 1,
    paddingLeft: 10,
    paddingRight: 6,
    justifyContent: 'center',
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    flexGrow: 0,
    flexShrink: 0,
  },
})
