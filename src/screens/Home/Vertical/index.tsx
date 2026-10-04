import { useEffect, useRef, useState } from 'react'
import { View } from 'react-native'
import Content from './Content'
import DrawerNav from './DrawerNav'
import PlayerBar from '@/components/player/PlayerBar'
import BottomBar from '../components/BottomBar'
import DrawerLayoutFixed, { type DrawerLayoutFixedType } from '@/components/common/DrawerLayoutFixed'
import { COMPONENT_IDS } from '@/config/constant'
import { useSettingValue } from '@/store/setting/hook'
import { useNavActiveId } from '@/store/common/hook'
import { BottomInsetContext } from '@/components/common/BottomInset'

export default () => {
  const drawer = useRef<DrawerLayoutFixedType>(null)
  const [dockHeight, setDockHeight] = useState(0)
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
      visibleNavNames={[COMPONENT_IDS.home]}
      drawerPosition={drawerLayoutPosition}
      renderNavigationView={() => <DrawerNav />}
    >
      <BottomInsetContext.Provider value={isDownloadPage || isSettingPage ? 0 : dockHeight}>
        <Content />
      </BottomInsetContext.Provider>
      {!isDownloadPage && !isSettingPage
        ? (
            <View style={styles.dock} pointerEvents="box-none" onLayout={({ nativeEvent }) => { setDockHeight(nativeEvent.layout.height) }}>
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
