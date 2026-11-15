import { View } from 'react-native'
import { useNavActiveId, useStatusbarHeight } from '@/store/common/hook'
import { useTheme } from '@/store/theme/hook'
import { useI18n } from '@/lang'
import { createStyle } from '@/utils/tools'
import Text from '@/components/common/Text'
import StatusBar from '@/components/common/StatusBar'
import { scaleSizeH } from '@/utils/pixelRatio'
import { HEADER_HEIGHT as _HEADER_HEIGHT, isMainNavId } from '@/config/constant'
import { type InitState as CommonState } from '@/store/common/state'
import DetailNav from '@/screens/Home/Views/Mylist/DetailNav'
import ImportSonglist from '@/screens/Home/Views/Mylist/MyList/ImportSonglist'
import { useMylistPlaylistsVisible } from '@/store/list/uiHook'
import GlassIconButton from '@/components/common/GlassIconButton'
import { backToHomeTab } from '@/core/common'
import EditorialTitle from '../components/EditorialTitle'
import { SourceButton } from '../components/HeaderActions'

// 横屏侧栏承载主导航与设置，页头提供导入与音源快捷入口。
const headerActions: Partial<Record<CommonState['navActiveId'], React.ReactNode>> = {
  // “我的”页头部提供导入歌单入口（歌单页“打开歌单”的同款交互，改为直接导入）
  nav_love: <ImportSonglist />,
  nav_songlist: <SourceButton />,
  nav_search: <SourceButton />,
}

const HEADER_HEIGHT = _HEADER_HEIGHT * 0.8

type StandaloneNavId = Extract<CommonState['navActiveId'], 'nav_setting'>

/** 设置使用独立返回栏，保持旋转前后的导航语义一致。 */
const StandaloneHeader = ({ id }: { id: StandaloneNavId }) => {
  const theme = useTheme()
  const t = useI18n()
  const statusBarHeight = useStatusbarHeight()
  const handleBack = backToHomeTab

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
        onPress={handleBack}
      />
      <Text style={styles.standaloneTitle} size={18} color={theme['c-font']} numberOfLines={1}>{t(id)}</Text>
    </View>
  )
}

/** 杂志式标题与当前页面操作共用一行。 */
const TabHeader = () => {
  const id = useNavActiveId()
  const statusBarHeight = useStatusbarHeight()
  const playlistsVisible = useMylistPlaylistsVisible()
  const isMylistDetail = id == 'nav_love' && !playlistsVisible

  return (
    <View style={{
      ...styles.container,
      minHeight: Math.max(68, scaleSizeH(HEADER_HEIGHT)) + statusBarHeight,
      paddingTop: statusBarHeight,
      backgroundColor: 'transparent',
    }}>
      {isMylistDetail
        ? <DetailNav titleSize={18} />
        : (
            <>
              <View style={styles.left}>
                {isMainNavId(id) ? <EditorialTitle id={id} compact /> : null}
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
    paddingVertical: 10,
  },
  standaloneTitle: {
    flex: 1,
    paddingLeft: 10,
    paddingRight: 16,
    fontWeight: '700',
  },
})

export default Header
