import { View, TouchableOpacity } from 'react-native'
import { useTheme } from '@/store/theme/hook'
import { useNavActiveId, useStatusbarHeight } from '@/store/common/hook'
import { useI18n } from '@/lang'
import { createStyle } from '@/utils/tools'
import { Icon } from '@/components/common/Icon'
import Text from '@/components/common/Text'
import StatusBar from '@/components/common/StatusBar'
import { useSettingActiveScreenId } from '@/store/setting/hook'
import { scaleSizeH } from '@/utils/pixelRatio'
import { HEADER_HEIGHT } from '@/config/constant'
import { type InitState as CommonState } from '@/store/common/state'
import DetailNav from '@/screens/Home/Views/Mylist/DetailNav'
import ImportSonglist from '@/screens/Home/Views/Mylist/MyList/ImportSonglist'
import { useMylistPlaylistsVisible } from '@/store/list/uiHook'
import { backToHomeTab, closeLeaderboard } from '@/core/common'
import { type SettingScreenIds } from '@/screens/Home/Views/Setting'
import { LeaderboardEntry, MoreButton } from '@/screens/Home/components/HeaderActions'

// 各主标签页头右侧的操作入口；主标签切换由底部标签栏承担，这里不再放导航菜单
const headerActions: Partial<Record<CommonState['navActiveId'], React.ReactNode>> = {
  // 资料库：导入歌单 + 打开只承载下载/设置的辅助抽屉
  nav_love: <><ImportSonglist /><MoreButton /></>,
  // 浏览：排行榜覆盖页入口
  nav_songlist: <LeaderboardEntry />,
}

type StandaloneNavId = Extract<CommonState['navActiveId'], 'nav_download' | 'nav_setting' | 'nav_top'>

/** 下载、设置与排行榜脱离主页分页，头部返回各自的上级。 */
const StandaloneHeader = ({
  id,
  settingScreenId,
}: {
  id: StandaloneNavId
  settingScreenId: SettingScreenIds | null
}) => {
  const theme = useTheme()
  const t = useI18n()
  const statusBarHeight = useStatusbarHeight()
  const isSettingScreen = id == 'nav_setting' && settingScreenId != null
  const title = isSettingScreen ? t(`setting_${settingScreenId}`) : t(id)
  const handleBack = id == 'nav_top'
    ? closeLeaderboard
    : isSettingScreen
      ? () => { global.app_event.closeSettingScreen() }
      : backToHomeTab

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
        <Icon color={theme['c-primary']} name="chevron-left" size={19} />
      </TouchableOpacity>
      <Text style={styles.standaloneTitle} size={22} color={theme['c-font']} numberOfLines={1}>{title}</Text>
    </View>
  )
}

/**
 * 主标签页头 — 左侧大标题，右侧当前页面的操作入口，内容背景保持透明。
 * 资料库进入歌单详情后由 DetailNav 接管这一行。
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
      height: scaleSizeH(HEADER_HEIGHT + 18) + statusBarHeight,
      paddingTop: statusBarHeight,
      backgroundColor: 'transparent',
    }}>
      {isMylistDetail
        ? <DetailNav />
        : (
            <>
              <View style={styles.left}>
                <Text style={styles.title} size={30} color={theme['c-font']} numberOfLines={1}>{t(id)}</Text>
              </View>
              {headerActions[id] ?? null}
            </>
          )}
    </View>
  )
}

const Header = () => {
  const settingScreenId = useSettingActiveScreenId()
  const id = useNavActiveId()
  const standaloneId = id == 'nav_download' || id == 'nav_setting' || id == 'nav_top' ? id : null

  return (
    <>
      <StatusBar />
      {standaloneId
        ? <StandaloneHeader id={standaloneId} settingScreenId={settingScreenId} />
        : <TabHeader />}
    </>
  )
}

export default Header


const styles = createStyle({
  container: {
    paddingRight: 16,
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
    width: 34,
    height: 34,
    marginLeft: 8,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  standaloneTitle: {
    flex: 1,
    paddingLeft: 12,
    paddingRight: 16,
    fontWeight: '700',
  },
  // Apple Music 风格标题 — 粗体、左对齐
  title: {
    paddingRight: 8,
    fontWeight: '700',
  },
})
