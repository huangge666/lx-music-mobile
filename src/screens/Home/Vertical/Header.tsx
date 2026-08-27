import { View, TouchableOpacity } from 'react-native'
import { useTheme } from '@/store/theme/hook'
import { useNavActiveId, useStatusbarHeight } from '@/store/common/hook'
import { useI18n } from '@/lang'
import { createStyle } from '@/utils/tools'
import { Icon } from '@/components/common/Icon'
import Text from '@/components/common/Text'
import StatusBar from '@/components/common/StatusBar'
import { useSettingValue } from '@/store/setting/hook'
import { scaleSizeH } from '@/utils/pixelRatio'
import { HEADER_HEIGHT } from '@/config/constant'
import { type InitState as CommonState } from '@/store/common/state'
import SearchTypeSelector from '@/screens/Home/Views/Search/SearchTypeSelector'
import DetailNav from '@/screens/Home/Views/Mylist/DetailNav'
import { useMylistPlaylistsVisible } from '@/store/list/uiHook'

// Apple Music 各页面对应的大标题文案
const headerComponents: Partial<Record<CommonState['navActiveId'], React.ReactNode>> = {
  nav_search: <SearchTypeSelector />,
}

/**
 * 左侧式 Header — 不透明内容背景风格
 * 菜单按钮 + 大标题，与内容层背景统一
 */
const LeftHeader = () => {
  const theme = useTheme()
  const id = useNavActiveId()
  const t = useI18n()
  const statusBarHeight = useStatusbarHeight()
  const playlistsVisible = useMylistPlaylistsVisible()
  const isMylistDetail = id == 'nav_love' && !playlistsVisible

  const openMenu = () => {
    global.app_event.changeMenuVisible(true)
  }

  return (
    <View style={{
      ...styles.container,
      height: scaleSizeH(HEADER_HEIGHT) + statusBarHeight,
      paddingTop: statusBarHeight,
      backgroundColor: theme['c-content-background'],
    }}>
      {isMylistDetail
        ? <DetailNav />
        : (
            <>
              <View style={styles.left}>
                <TouchableOpacity style={styles.menuBtn} onPress={openMenu} activeOpacity={0.6}>
                  <Icon color={theme['c-primary']} name="menu" size={20} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.titleBtn} onPress={openMenu} activeOpacity={0.6}>
                  <Text style={styles.title} size={22} color={theme['c-font']}>{t(id)}</Text>
                </TouchableOpacity>
              </View>
              {headerComponents[id] ?? null}
            </>
          )}
    </View>
  )
}

/**
 * 右侧式 Header — 抽屉在右边时的镜像布局
 */
const RightHeader = () => {
  const theme = useTheme()
  const t = useI18n()
  const id = useNavActiveId()
  const statusBarHeight = useStatusbarHeight()
  const playlistsVisible = useMylistPlaylistsVisible()
  const isMylistDetail = id == 'nav_love' && !playlistsVisible

  const openMenu = () => {
    global.app_event.changeMenuVisible(true)
  }
  return (
    <View style={{
      ...styles.container,
      height: scaleSizeH(HEADER_HEIGHT) + statusBarHeight,
      paddingTop: statusBarHeight,
      backgroundColor: theme['c-content-background'],
    }}>
      {isMylistDetail
        ? <DetailNav />
        : (
            <>
              <View style={styles.rightLeft}>
                <TouchableOpacity style={styles.titleBtn} onPress={openMenu} activeOpacity={0.6}>
                  <Text style={styles.titleRight} size={22} color={theme['c-font']}>{t(id)}</Text>
                </TouchableOpacity>
              </View>
              {headerComponents[id] ?? null}
              <TouchableOpacity style={styles.menuBtn} onPress={openMenu} activeOpacity={0.6}>
                <Icon color={theme['c-primary']} name="menu" size={20} />
              </TouchableOpacity>
            </>
          )}
    </View>
  )
}

const Header = () => {
  const drawerLayoutPosition = useSettingValue('common.drawerLayoutPosition')

  return (
    <>
      <StatusBar />
      {
        drawerLayoutPosition == 'left'
          ? <LeftHeader />
          : <RightHeader />
      }
    </>
  )
}

export default Header


const styles = createStyle({
  container: {
    paddingRight: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  left: {
    flex: 1,
    flexDirection: 'row',
    paddingLeft: 4,
    alignItems: 'center',
    height: '100%',
  },
  rightLeft: {
    flex: 1,
    flexDirection: 'row',
    paddingRight: 8,
    alignItems: 'center',
    height: '100%',
  },
  menuBtn: {
    width: HEADER_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  titleBtn: {
    flex: 1,
    height: '100%',
    justifyContent: 'center',
  },
  // Apple Music 风格标题 — 粗体、左对齐
  title: {
    paddingLeft: 10,
    paddingRight: 12,
    fontWeight: '700',
  },
  titleRight: {
    paddingLeft: 16,
    paddingRight: 8,
    fontWeight: '700',
  },
})
