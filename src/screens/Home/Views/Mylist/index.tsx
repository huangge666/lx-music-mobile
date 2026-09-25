import { useEffect } from 'react'
import { View } from 'react-native'
import MyList from './MyList'
import type { InitState as CommonState } from '@/store/common/state'
import playerState from '@/store/player/state'
import { setActiveList } from '@/core/list'
import { createStyle } from '@/utils/tools'

export default () => {
  useEffect(() => {
    const listId = playerState.playMusicInfo.listId
    if (global.lx?.jumpMyListPosition && listId) setActiveList(listId)

    const handleNav = (id: CommonState['navActiveId']) => {
      if (id != 'nav_love') return
      if (!global.lx?.jumpMyListPosition) return
      const playingListId = playerState.playMusicInfo.listId
      if (playingListId) setActiveList(playingListId)
    }
    const handleJump = () => {
      const playingListId = playerState.playMusicInfo.listId
      if (playingListId) setActiveList(playingListId)
      if (global.lx) global.lx.jumpMyListPosition = true
    }

    global.state_event.on('navActiveIdUpdated', handleNav)
    global.app_event.on('jumpListPosition', handleJump)

    return () => {
      global.state_event.off('navActiveIdUpdated', handleNav)
      global.app_event.off('jumpListPosition', handleJump)
    }
  }, [])

  return (
    <View style={styles.container}>
      <MyList />
    </View>
  )
}

const styles = createStyle({
  container: {
    flex: 1,
  },
})
