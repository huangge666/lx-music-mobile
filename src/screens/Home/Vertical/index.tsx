import { useEffect, useRef } from 'react'
import { View } from 'react-native'
import Content from './Content'
import DrawerNav from './DrawerNav'
import PlayerBar from '@/components/player/PlayerBar'
import BottomBar from '../components/BottomBar'
import DrawerLayoutFixed, { type DrawerLayoutFixedType } from '@/components/common/DrawerLayoutFixed'
import { COMPONENT_IDS } from '@/config/constant'
import { useSettingValue } from '@/store/setting/hook'
import { scaleSizeW } from '@/utils/pixelRatio'
import { useNavActiveId } from '@/store/common/hook'

const MAX_DRAWER_WIDTH = scaleSizeW(300)

export default () => {
  const drawer = useRef<DrawerLayoutFixedType>(null)
  const drawerLayoutPosition = useSettingValue('common.drawerLayoutPosition')
  const navActiveId = useNavActiveId()
  const isDownloadPage = navActiveId == 'nav_download'
  const isSettingPage = navActiveId == 'nav_setting'

  useEffect(() => {
    const changeVisible = (visible: boolean) => {
      if (visible) {
        drawer.current?.openDrawer()
      } else {
        drawer.current?.closeDrawer()
      }
    }

    global.app_event.on('changeMenuVisible', changeVisible)
    return () => {
      global.app_event.off('changeMenuVisible', changeVisible)
    }
  }, [])

  // The drawer owns the complete vertical screen so its native panel also covers
  // the mini player and bottom tab bar instead of stopping at the content boundary.
  return (
    <DrawerLayoutFixed
      ref={drawer}
      widthPercentage={0.7}
      widthPercentageMax={MAX_DRAWER_WIDTH}
      visibleNavNames={[COMPONENT_IDS.home]}
      drawerPosition={drawerLayoutPosition}
      renderNavigationView={() => <DrawerNav />}
    >
      <Content />
      {!isDownloadPage && !isSettingPage
        ? (
            <View style={styles.dock} pointerEvents="box-none">
              {!isSettingPage ? <PlayerBar isHome floating /> : null}
              <BottomBar floating />
            </View>
          )
        : null}
    </DrawerLayoutFixed>
  )
}

const styles = {
  dock: {
    position: 'absolute' as const,
    left: 0,
    right: 0,
    bottom: 0,
  },
}
