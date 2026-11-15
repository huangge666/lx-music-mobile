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
 * 四个主标签与设置由左侧栏承载，迷你播放器在核心页面贴底显示。
 */
export default () => {
  const navActiveId = useNavActiveId()
  const isStandalonePage = navActiveId == 'nav_setting'

  return (
    <>
      <StatusBar />
      <View style={styles.container}>
        <Aside />
        <View style={styles.content}>
          <Header />
          <Main />
          {!isStandalonePage ? <PlayerBar isHome /> : null}
        </View>
      </View>
    </>
  )
}
