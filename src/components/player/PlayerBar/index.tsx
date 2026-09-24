import { memo, useMemo } from 'react'
import { View } from 'react-native'
import { useKeyboard } from '@/utils/hooks'

import Pic from './components/Pic'
import Title from './components/Title'
import PlayInfo from './components/PlayInfo'
import ControlBtn from './components/ControlBtn'
import { createStyle } from '@/utils/tools'
import { useSettingValue } from '@/store/setting/hook'
import { useNavActiveId } from '@/store/common/hook'
import GlassSurface from '@/components/common/GlassSurface'

/**
 * 迷你播放器。
 * 首页竖屏是悬浮胶囊，其他页面仍贴在内容底部，避免详情页被左右留白截断。
 */
export default memo(({ isHome = false, floating = false }: { isHome?: boolean, floating?: boolean }) => {
  const { keyboardShown } = useKeyboard()
  const autoHidePlayBar = useSettingValue('common.autoHidePlayBar')
  const navActiveId = useNavActiveId()

  const playerComponent = useMemo(() => (
    <View style={floating ? styles.floatWrap : null}>
      <GlassSurface style={floating ? styles.floating : styles.docked}>
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
      </GlassSurface>
    </View>
  ), [floating, isHome])

  if (isHome && navActiveId == 'nav_setting') return null
  return autoHidePlayBar && keyboardShown ? null : playerComponent
})


const styles = createStyle({
  floatWrap: {
    paddingHorizontal: 14,
    paddingBottom: 8,
  },
  floating: {
    minHeight: 64,
    paddingVertical: 8,
    paddingLeft: 8,
    paddingRight: 10,
    borderRadius: 22,
    borderWidth: 0.5,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.16,
    shadowRadius: 18,
    elevation: 8,
  },
  docked: {
    width: 'auto',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderTopWidth: 0.5,
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
