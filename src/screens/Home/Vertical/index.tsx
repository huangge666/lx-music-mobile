import { useEffect, useRef } from 'react'
import Content from './Content'
import DrawerNav from './DrawerNav'
import PlayerBar from '@/components/player/PlayerBar'
import BottomBar from '../components/BottomBar'
import DrawerLayoutFixed, { type DrawerLayoutFixedType } from '@/components/common/DrawerLayoutFixed'
import { COMPONENT_IDS } from '@/config/constant'
import { useSettingValue } from '@/store/setting/hook'
import { scaleSizeW } from '@/utils/pixelRatio'

const MAX_DRAWER_WIDTH = scaleSizeW(300)

export default () => {
  const drawer = useRef<DrawerLayoutFixedType>(null)
  const drawerLayoutPosition = useSettingValue('common.drawerLayoutPosition')

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
      <PlayerBar isHome />
      <BottomBar />
    </DrawerLayoutFixed>
  )
}
