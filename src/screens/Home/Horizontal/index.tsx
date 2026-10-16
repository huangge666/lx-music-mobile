import { View } from 'react-native'
import Aside from './Aside'
import PlayerBar from '@/components/player/PlayerBar'
import StatusBar from '@/components/common/StatusBar'
import Header from './Header'
import Main from './Main'
import { createStyle } from '@/utils/tools'
import BottomBar from '../components/BottomBar'
import { useNavActiveId } from '@/store/common/hook'

const styles = createStyle({
  container: {
    flex: 1,
    flexDirection: 'row',
  },
  content: {
    flex: 1,
    overflow: 'hidden',
  },
})

export default () => {
  const navActiveId = useNavActiveId()
  const isDownloadPage = navActiveId == 'nav_download'
  const isSettingPage = navActiveId == 'nav_setting'
  // 排行榜是覆盖页，横屏同样隐藏主标签栏；辅助入口仍由常驻侧栏承担
  const isLeaderboardPage = navActiveId == 'nav_top'

  return (
    <>
      <StatusBar />
      <View style={styles.container}>
        <Aside />
        <View style={styles.content}>
          <Header />
          <Main />
          {!isSettingPage ? <PlayerBar isHome /> : null}
          {!isDownloadPage && !isSettingPage && !isLeaderboardPage ? <BottomBar /> : null}
        </View>
      </View>
    </>
  )
}
