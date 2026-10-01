import { useEffect, useRef } from 'react'
import settingState from '@/store/setting/state'
import Content from './Content'
import TagList from './TagList'
import DrawerLayoutFixed, { type DrawerLayoutFixedType } from '@/components/common/DrawerLayoutFixed'
import { COMPONENT_IDS } from '@/config/constant'
import type { InitState as CommonState } from '@/store/common/state'

export default () => {
  const drawer = useRef<DrawerLayoutFixedType>(null)

  useEffect(() => {
    const handleFixDrawer = (id: CommonState['navActiveId']) => {
      if (id == 'nav_songlist') drawer.current?.fixWidth()
    }
    const handleShow = () => {
      requestAnimationFrame(() => {
        drawer.current?.openDrawer()
      })
    }
    const handleHide = () => {
      drawer.current?.closeDrawer()
    }

    global.state_event.on('navActiveIdUpdated', handleFixDrawer)
    global.app_event.on('showSonglistTagList', handleShow)
    global.app_event.on('hideSonglistTagList', handleHide)

    return () => {
      global.state_event.off('navActiveIdUpdated', handleFixDrawer)
      global.app_event.off('showSonglistTagList', handleShow)
      global.app_event.off('hideSonglistTagList', handleHide)
    }
  }, [])

  const navigationView = () => <TagList />

  return (
    <DrawerLayoutFixed
      ref={drawer}
      visibleNavNames={[COMPONENT_IDS.home]}
      drawerPosition={settingState.setting['common.drawerLayoutPosition']}
      renderNavigationView={navigationView}
    >
      <Content />
    </DrawerLayoutFixed>
  )
}
