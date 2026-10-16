import { View, TouchableOpacity } from 'react-native'
import { useNavActiveId, useStatusbarHeight } from '@/store/common/hook'
import { useTheme } from '@/store/theme/hook'
import { useI18n } from '@/lang'
import { createStyle } from '@/utils/tools'
import Text from '@/components/common/Text'
import StatusBar from '@/components/common/StatusBar'
import { scaleSizeH } from '@/utils/pixelRatio'
import { HEADER_HEIGHT as _HEADER_HEIGHT } from '@/config/constant'
import { type InitState as CommonState } from '@/store/common/state'
import SearchTypeSelector from '@/screens/Home/Views/Search/SearchTypeSelector'
import DetailNav from '@/screens/Home/Views/Mylist/DetailNav'
import ImportSonglist from '@/screens/Home/Views/Mylist/MyList/ImportSonglist'
import { useMylistPlaylistsVisible } from '@/store/list/uiHook'
import { Icon } from '@/components/common/Icon'
import { backToHomeTab, closeLeaderboard } from '@/core/common'
import { LeaderboardEntry } from '@/screens/Home/components/HeaderActions'

// 横屏侧栏常驻，下载/设置入口由侧栏承担，页头只保留当前页面的操作
const headerActions: Partial<Record<CommonState['navActiveId'], React.ReactNode>> = {
  nav_search: <SearchTypeSelector />,
  // “我的”页头部提供导入歌单入口（歌单页“打开歌单”的同款交互，改为直接导入）
  nav_love: <ImportSonglist />,
  // 浏览页的排行榜入口，与竖屏保持同一入口语义
  nav_songlist: <LeaderboardEntry />,
}

const HEADER_HEIGHT = _HEADER_HEIGHT * 0.8

type StandaloneNavId = Extract<CommonState['navActiveId'], 'nav_download' | 'nav_setting' | 'nav_top'>

/** 下载、设置与排行榜使用独立返回栏，保持旋转前后的导航语义一致。 */
const StandaloneHeader = ({ id }: { id: StandaloneNavId }) => {
  const theme = useTheme()
  const t = useI18n()
  const statusBarHeight = useStatusbarHeight()
  const handleBack = id == 'nav_top' ? closeLeaderboard : backToHomeTab

  return (
    <View style={{
      ...styles.container,
      height: scaleSizeH(HEADER_HEIGHT) + statusBarHeight,
      paddingTop: statusBarHeight,
      backgroundColor: theme['c-content-background'],
    }}>
      <TouchableOpacity
        style={[styles.backBtn, { backgroundColor: theme['c-primary-background'] }]}
        onPress={handleBack}
        activeOpacity={0.6}
        accessibilityRole="button"
        accessibilityLabel={t('back')}
      >
        <Icon color={theme['c-primary']} name="chevron-left" size={17} />
      </TouchableOpacity>
      <Text style={styles.standaloneTitle} size={18} color={theme['c-font']} numberOfLines={1}>{t(id)}</Text>
    </View>
  )
}

/**
 * Apple Music iPad 风格 Header
 *
 * — 不透明内容背景，与内容层统一
 * — 18pt 粗体大标题 + 当前页面操作
 */
const TabHeader = () => {
  const theme = useTheme()
  const id = useNavActiveId()
  const t = useI18n()
  const statusBarHeight = useStatusbarHeight()
  const playlistsVisible = useMylistPlaylistsVisible()
  const isMylistDetail = id == 'nav_love' && !playlistsVisible

  return (
    <View style={{
      ...styles.container,
      height: scaleSizeH(HEADER_HEIGHT) + statusBarHeight,
      paddingTop: statusBarHeight,
      backgroundColor: theme['c-content-background'],
    }}>
      {isMylistDetail
        ? <DetailNav titleSize={18} />
        : (
            <>
              <View style={styles.left}>
                <Text style={styles.leftTitle} size={18} color={theme['c-font']} numberOfLines={1}>{t(id)}</Text>
              </View>
              {headerActions[id] ?? null}
            </>
          )}
    </View>
  )
}

const Header = () => {
  const id = useNavActiveId()
  const standaloneId = id == 'nav_download' || id == 'nav_setting' || id == 'nav_top' ? id : null

  return (
    <>
      <StatusBar />
      {standaloneId
        ? <StandaloneHeader id={standaloneId} />
        : <TabHeader />}
    </>
  )
}


const styles = createStyle({
  container: {
    paddingRight: 5,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  left: {
    flex: 1,
    flexDirection: 'row',
    paddingLeft: 16,
    alignItems: 'center',
    height: '100%',
  },
  backBtn: {
    width: 30,
    height: 30,
    marginLeft: 8,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  standaloneTitle: {
    flex: 1,
    paddingLeft: 10,
    paddingRight: 16,
    fontWeight: '700',
  },
  // Apple Music 风格大标题 — 粗体
  leftTitle: {
    paddingRight: 8,
    fontWeight: '700',
  },
})

export default Header
