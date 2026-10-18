import { View, type LayoutChangeEvent } from 'react-native'

import GlassSurface from '@/components/common/GlassSurface'
import PlayerBar from '@/components/player/PlayerBar'
import BottomBar from './BottomBar'
import { useNavActiveId } from '@/store/common/hook'
import commonState from '@/store/common/state'
import { usePlayerMusicInfo } from '@/store/player/hook'
import { useSettingValue } from '@/store/setting/hook'
import { useKeyboard } from '@/utils/hooks'
import { createStyle } from '@/utils/tools'

interface HomeDockProps {
  onLayout?: (event: LayoutChangeEvent) => void
}

/**
 * 首页统一底部 Dock。
 * 播放器和标签栏只提供内容，玻璃材质与真实占用高度由这里统一管理。
 */
export default ({ onLayout }: HomeDockProps) => {
  const navActiveId = useNavActiveId()
  const musicInfo = usePlayerMusicInfo()
  const autoHidePlayBar = useSettingValue('common.autoHidePlayBar')
  const { keyboardShown } = useKeyboard()
  const showTabs = navActiveId != 'nav_top'
  const showPlayer = !!musicInfo.id && !(autoHidePlayBar && keyboardShown)
  const hasContent = showPlayer || showTabs

  return (
    <View
      pointerEvents="box-none"
      onLayout={onLayout}
      style={[styles.dock, !hasContent ? styles.emptyDock : null]}
    >
      {hasContent
        ? (
            <GlassSurface style={styles.surface}>
              {showPlayer
                ? <PlayerBar isHome embedded componentId={commonState.componentIds.home} />
                : null}
              {showTabs ? <BottomBar /> : null}
            </GlassSurface>
          )
        : null}
    </View>
  )
}

const styles = createStyle({
  dock: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 20,
  },
  emptyDock: {
    height: 0,
  },
  surface: {
    width: '100%',
    borderTopWidth: 0.5,
  },
})
