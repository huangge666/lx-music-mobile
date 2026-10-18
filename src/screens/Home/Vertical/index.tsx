import { useEffect, useRef, useState } from 'react'
import Content from './Content'
import DrawerNav from './DrawerNav'
import HomeDock from '../components/HomeDock'
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
  // 下载和设置是覆盖页，不显示首页 Dock；排行榜保留迷你播放器但隐藏主标签栏。
  const showDock = !isDownloadPage && !isSettingPage

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

  // 抽屉覆盖完整竖屏；Dock 的实测高度同时作为内容列表的底部避让值。
  return (
    <DrawerLayoutFixed
      ref={drawer}
      visibleNavNames={[COMPONENT_IDS.home]}
      drawerPosition={drawerLayoutPosition}
      renderNavigationView={() => <DrawerNav />}
    >
      <BottomInsetContext.Provider value={showDock ? dockHeight : 0}>
        <Content />
        {showDock
          ? <HomeDock onLayout={({ nativeEvent }) => { setDockHeight(nativeEvent.layout.height) }} />
          : null}
      </BottomInsetContext.Provider>
    </DrawerLayoutFixed>
  )
}
