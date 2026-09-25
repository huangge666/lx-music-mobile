import { useEffect } from 'react'
import { View } from 'react-native'

import PageContent from '@/components/PageContent'
import StatusBar from '@/components/common/StatusBar'
import PlayerBar from '@/components/player/PlayerBar'
import DetailNav from '@/screens/Home/Views/Mylist/DetailNav'
import MusicList from '@/screens/Home/Views/Mylist/MusicList'
import { setComponentId } from '@/core/common'
import { COMPONENT_IDS } from '@/config/constant'
import { useStatusbarHeight } from '@/store/common/hook'
import { useTheme } from '@/store/theme/hook'
import { createStyle } from '@/utils/tools'
import { pop } from '@/navigation'

/**
 * 我的歌单详情独立页。
 * 不显示首页底部标签栏，返回时关闭本页并回到歌单列表。
 */
export default ({ componentId }: { componentId: string }) => {
  const theme = useTheme()
  const statusBarHeight = useStatusbarHeight()

  useEffect(() => {
    setComponentId(COMPONENT_IDS.mylistDetail, componentId)
    return () => {
      global.app_event.changeLoveListVisible(true)
    }
  }, [componentId])

  useEffect(() => {
    const backToPlaylists = (visible: boolean) => {
      if (visible) void pop(componentId)
    }
    global.app_event.on('changeLoveListVisible', backToPlaylists)
    return () => {
      global.app_event.off('changeLoveListVisible', backToPlaylists)
    }
  }, [componentId])

  return (
    <PageContent>
      <View style={{
        ...styles.header,
        height: 56 + statusBarHeight,
        paddingTop: statusBarHeight,
        backgroundColor: theme['c-content-background'],
      }}>
        <StatusBar />
        <DetailNav />
      </View>
      <MusicList />
      <PlayerBar />
    </PageContent>
  )
}

const styles = createStyle({
  header: {
    flexGrow: 0,
    flexShrink: 0,
  },
})
