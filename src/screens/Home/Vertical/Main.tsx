import { useCallback, useEffect, useMemo, useRef, useState, type ComponentRef, type ComponentType } from 'react'
import { View } from 'react-native'
import Search from '../Views/Search'
import SongList from '../Views/SongList'
import Mylist from '../Views/Mylist'
import Leaderboard from '../Views/Leaderboard'
import Download from '../Views/Download'
import Setting from '../Views/Setting'
import commonState, { type InitState as CommonState } from '@/store/common/state'
import { createStyle } from '@/utils/tools'
import PagerView, { type PageScrollStateChangedNativeEvent, type PagerViewOnPageSelectedEvent } from 'react-native-pager-view'
import { setNavActiveId } from '@/core/common'
import settingState from '@/store/setting/state'
import { useNavActiveId } from '@/store/common/hook'
import { useTheme } from '@/store/theme/hook'
import {
  getMainNavIdAt,
  getMainNavIndex,
  isMainNavId,
  MAIN_NAV_MENUS,
  normalizeNavId,
  type MAIN_NAV_ID_Type,
} from '@/config/constant'

const hideKeys = [
  'list.isShowAlbumName',
  'list.isShowInterval',
  'theme.fontShadow',
] as Readonly<Array<keyof LX.AppSetting>>

const PAGE_COMPONENTS: Record<MAIN_NAV_ID_Type, ComponentType> = {
  nav_songlist: SongList,
  nav_top: Leaderboard,
  nav_love: Mylist,
  nav_search: Search,
}

/**
 * 首页分页内容。
 * 首次被选中时挂载，之后保持挂载以保留搜索内容、榜单选择与列表滚动位置；
 * 进入设置页（以及停留在设置页时的主题、语言、关键列表配置变化）时卸载，
 * 返回时按新设置重新挂载。
 */
const PagerPage = ({ id }: { id: MAIN_NAV_ID_Type }) => {
  const [visible, setVisible] = useState(commonState.navActiveId == id)
  const Page = PAGE_COMPONENTS[id]
  const component = useMemo(() => <Page />, [Page])
  useEffect(() => {
    let currentId: CommonState['navActiveId'] = commonState.navActiveId
    const handleNavIdUpdate = (nextId: CommonState['navActiveId']) => {
      currentId = nextId
      if (nextId == id) {
        requestAnimationFrame(() => {
          setVisible(true)
        })
      }
    }
    const handleHide = () => {
      if (currentId != 'nav_setting') return
      setVisible(false)
    }
    const handleConfigUpdated = (keys: Array<keyof LX.AppSetting>) => {
      if (keys.some(k => hideKeys.includes(k))) handleHide()
    }
    global.state_event.on('navActiveIdUpdated', handleNavIdUpdate)
    global.state_event.on('themeUpdated', handleHide)
    global.state_event.on('languageChanged', handleHide)
    global.state_event.on('configUpdated', handleConfigUpdated)

    return () => {
      global.state_event.off('navActiveIdUpdated', handleNavIdUpdate)
      global.state_event.off('themeUpdated', handleHide)
      global.state_event.off('languageChanged', handleHide)
      global.state_event.off('configUpdated', handleConfigUpdated)
    }
  }, [id])

  return visible ? component : null
}

const Main = () => {
  const navActiveId = useNavActiveId()
  const theme = useTheme()
  const pagerViewRef = useRef<ComponentRef<typeof PagerView>>(null)
  // 覆盖页打开时（例如旋转后重建）用进入前的主标签作初始页，不能把覆盖页当成初始页
  const initialTabId = isMainNavId(navActiveId) ? navActiveId : normalizeNavId(commonState.lastNavActiveId)
  const activeIndexRef = useRef<number>(getMainNavIndex(initialTabId))

  const onPageSelected = useCallback(({ nativeEvent }: PagerViewOnPageSelectedEvent) => {
    // 覆盖页盖住分页器时，原生页面事件不能顶掉当前覆盖页
    if (!isMainNavId(commonState.navActiveId)) return
    const id = getMainNavIdAt(nativeEvent.position)
    if (!id) return
    activeIndexRef.current = nativeEvent.position
    if (commonState.navActiveId != id) setNavActiveId(id)
  }, [])

  const onPageScrollStateChanged = useCallback(({ nativeEvent }: PageScrollStateChangedNativeEvent) => {
    const idle = nativeEvent.pageScrollState == 'idle'
    if (global.lx.homePagerIdle != idle) global.lx.homePagerIdle = idle
  }, [])

  useEffect(() => {
    const handleUpdate = (id: CommonState['navActiveId']) => {
      pagerViewRef.current?.setScrollEnabled(
        isMainNavId(id) && settingState.setting['common.homePageScroll'],
      )
      if (!isMainNavId(id)) return
      const index = getMainNavIndex(id)
      if (activeIndexRef.current == index) return
      activeIndexRef.current = index
      pagerViewRef.current?.setPageWithoutAnimation(index)
    }
    const handleConfigUpdate = (keys: Array<keyof LX.AppSetting>, setting: Partial<LX.AppSetting>) => {
      if (!keys.includes('common.homePageScroll')) return
      // 与切换导航同一条件：覆盖页打开时，配置变化也不能重新打开底层分页手势
      pagerViewRef.current?.setScrollEnabled(
        !!setting['common.homePageScroll'] && isMainNavId(commonState.navActiveId),
      )
    }
    global.state_event.on('navActiveIdUpdated', handleUpdate)
    global.state_event.on('configUpdated', handleConfigUpdate)
    return () => {
      global.state_event.off('navActiveIdUpdated', handleUpdate)
      global.state_event.off('configUpdated', handleConfigUpdate)
    }
  }, [])

  useEffect(() => {
    pagerViewRef.current?.setScrollEnabled(
      isMainNavId(navActiveId) && settingState.setting['common.homePageScroll'],
    )
  }, [navActiveId])

  const component = useMemo(() => (
    <View style={styles.container}>
      <PagerView ref={pagerViewRef}
        initialPage={activeIndexRef.current}
        offscreenPageLimit={1}
        onPageSelected={onPageSelected}
        onPageScrollStateChanged={onPageScrollStateChanged}
        scrollEnabled={settingState.setting['common.homePageScroll']}
        style={styles.pagerView}
      >
        {MAIN_NAV_MENUS.map(menu => (
          <View collapsable={false} key={menu.id} style={styles.pageStyle}>
            <PagerPage id={menu.id} />
          </View>
        ))}
      </PagerView>
      {/* 下载与设置是覆盖页：盖住分页层，底层分页手势同时在事件里关闭。 */}
      {navActiveId == 'nav_download'
        ? (
            <View key="nav_download" style={[styles.overlay, { backgroundColor: theme['c-content-background'] }]}>
              <Download />
            </View>
          )
        : null}
      {navActiveId == 'nav_setting'
        ? (
            <View key="nav_setting" style={[styles.overlay, { backgroundColor: theme['c-grouped-background'] }]}>
              <Setting />
            </View>
          )
        : null}
    </View>
  ), [navActiveId, onPageScrollStateChanged, onPageSelected, theme])

  return component
}

const styles = createStyle({
  container: {
    flex: 1,
  },
  pagerView: {
    flex: 1,
    overflow: 'hidden',
  },
  pageStyle: {
    // alignItems: 'center',
    // padding: 20,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
})


export default Main
