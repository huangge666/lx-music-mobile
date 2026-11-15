import { View } from 'react-native'
import { useTheme } from '@/store/theme/hook'
import { useNavActiveId, useStatusbarHeight } from '@/store/common/hook'
import { useI18n } from '@/lang'
import { createStyle } from '@/utils/tools'
import GlassIconButton from '@/components/common/GlassIconButton'
import Text from '@/components/common/Text'
import StatusBar from '@/components/common/StatusBar'
import { scaleSizeH } from '@/utils/pixelRatio'
import { HEADER_HEIGHT, isMainNavId } from '@/config/constant'
import { type InitState as CommonState } from '@/store/common/state'
import DetailNav from '@/screens/Home/Views/Mylist/DetailNav'
import ImportSonglist from '@/screens/Home/Views/Mylist/MyList/ImportSonglist'
import { useMylistPlaylistsVisible } from '@/store/list/uiHook'
import { backToHomeTab } from '@/core/common'
import { MoreButton, SourceButton } from '@/screens/Home/components/HeaderActions'
import EditorialTitle from '../components/EditorialTitle'

// 各主标签页头右侧的操作入口；主标签切换由底部标签栏承担，这里不再放导航菜单
const headerActions: Partial<Record<CommonState['navActiveId'], React.ReactNode>> = {
  nav_love: <><ImportSonglist /><MoreButton /></>,
  nav_songlist: <><SourceButton /><MoreButton /></>,
  nav_search: <><SourceButton /><MoreButton /></>,
  nav_download: <MoreButton />,
}

type StandaloneNavId = Extract<CommonState['navActiveId'], 'nav_setting'>

/** 设置独立返回此前的主标签。 */
const StandaloneHeader = ({ id }: { id: StandaloneNavId }) => {
  const theme = useTheme()
  const t = useI18n()
  const statusBarHeight = useStatusbarHeight()

  return (
    <View style={{
      ...styles.container,
      height: scaleSizeH(HEADER_HEIGHT) + statusBarHeight,
      paddingTop: statusBarHeight,
      backgroundColor: id == 'nav_setting' ? theme['c-grouped-background'] : theme['c-content-background'],
    }}>
      <GlassIconButton
        style={{ marginLeft: 8 }}
        name="chevron-left"
        label={t('back')}
        onPress={backToHomeTab}
      />
      <Text style={styles.standaloneTitle} size={22} color={theme['c-font']} numberOfLines={1}>{t(id)}</Text>
    </View>
  )
}

/**
 * 主标签页头 — 左侧大标题，右侧当前页面的操作入口，内容背景保持透明。
 * 资料库进入歌单详情后由 DetailNav 接管这一行。
 */
const TabHeader = () => {
  const id = useNavActiveId()
  const statusBarHeight = useStatusbarHeight()
  const playlistsVisible = useMylistPlaylistsVisible()
  const isMylistDetail = id == 'nav_love' && !playlistsVisible

  return (
    <View style={{
      ...styles.container,
      minHeight: Math.max(88, scaleSizeH(HEADER_HEIGHT + 32)) + statusBarHeight,
      paddingTop: statusBarHeight,
      backgroundColor: 'transparent',
    }}>
      {isMylistDetail
        ? <DetailNav />
        : (
            <>
              <View style={styles.left}>
                {isMainNavId(id) ? <EditorialTitle id={id} /> : null}
              </View>
              {headerActions[id] ?? null}
            </>
          )}
    </View>
  )
}

const Header = () => {
  const id = useNavActiveId()
  const standaloneId = id == 'nav_setting' ? id : null

  return (
    <>
      <StatusBar />
      {standaloneId
        ? <StandaloneHeader id={standaloneId} />
        : <TabHeader />}
    </>
  )
}

export default Header


const styles = createStyle({
  container: {
    paddingRight: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  left: {
    flex: 1,
    flexDirection: 'row',
    paddingLeft: 24,
    alignItems: 'center',
    paddingVertical: 12,
  },
  standaloneTitle: {
    flex: 1,
    paddingLeft: 12,
    paddingRight: 16,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
})
