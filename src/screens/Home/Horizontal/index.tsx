import { View } from 'react-native'
import Aside from './Aside'
import PlayerBar from '@/components/player/PlayerBar'
import StatusBar from '@/components/common/StatusBar'
import Header from './Header'
import Main from './Main'
import { createStyle } from '@/utils/tools'
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

/**
 * 横屏首页。
 *
 * 三个主标签与辅助入口（排行榜/下载/设置）统一由左侧栏承载，
 * 不再同时显示底部标签栏 — 否则同一层级会出现两套主导航。
 * 迷你播放器仍贴底显示，设置页保持原有「隐藏播放器」规则。
 */
export default () => {
  const navActiveId = useNavActiveId()
  const isSettingPage = navActiveId == 'nav_setting'

  return (
    <>
      <StatusBar />
      <View style={styles.container}>
        <Aside />
        <View style={styles.content}>
          <Header />
          <Main />
          {!isSettingPage ? <PlayerBar isHome /> : null}
        </View>
      </View>
    </>
  )
}
