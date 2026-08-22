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
import { useNavActiveId } from '@/store/common/hook'


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
  const navActiveId = useNavActiveId()

  const playerComponent = useMemo(() => (
    <View style={{
      ...styles.container,
      // 迷你播放器位于底部组合栏上方，使用更轻的玻璃背景让下方内容保持可见。
      backgroundColor: theme['c-glass-background'].replace(/0\.80|0\.72/, '0.64'),
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

  if (isHome && navActiveId == 'nav_setting') return null
  return autoHidePlayBar && keyboardShown ? null : playerComponent
})


const styles = createStyle({
  container: {
    // 播放器本身保留少量外边距，内部则用水平内边距改善触控与视觉呼吸感。
    width: 'auto',
    // marginHorizontal: 10,
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderTopWidth: 0.5,
    borderBottomWidth: 0,
    borderBottom: 'none',
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
