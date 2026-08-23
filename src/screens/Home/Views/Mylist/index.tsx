import { useEffect, useRef, useState } from 'react'
import { View } from 'react-native'
import MusicList from './MusicList'
import MyList from './MyList'
import type { InitState as CommonState } from '@/store/common/state'
import playerState from '@/store/player/state'
import { setActiveList } from '@/core/list'
import { createStyle } from '@/utils/tools'

export default () => {
  const [showPlaylists, setShowPlaylists] = useState(true)
  const showPlaylistsRef = useRef(showPlaylists)
  showPlaylistsRef.current = showPlaylists

  useEffect(() => {
    const listId = playerState.playMusicInfo.listId
    if (global.lx?.jumpMyListPosition && listId) setActiveList(listId)

    const changeVisible = (visible: boolean) => {
      setShowPlaylists(visible)
    }
    const handleNav = (id: CommonState['navActiveId']) => {
      if (id != 'nav_love') return
      if (global.lx?.jumpMyListPosition) {
        const playingListId = playerState.playMusicInfo.listId
        if (playingListId) setActiveList(playingListId)
        global.app_event.changeLoveListVisible(false)
      } else {
        global.app_event.changeLoveListVisible(true)
      }
    }
    const handleJump = () => {
      const playingListId = playerState.playMusicInfo.listId
      if (playingListId) setActiveList(playingListId)
      if (!showPlaylistsRef.current) return
      if (global.lx) global.lx.jumpMyListPosition = true
      global.app_event.changeLoveListVisible(false)
    }

    global.app_event.on('changeLoveListVisible', changeVisible)
    global.state_event.on('navActiveIdUpdated', handleNav)
    global.app_event.on('jumpListPosition', handleJump)

    return () => {
      global.app_event.off('changeLoveListVisible', changeVisible)
      global.state_event.off('navActiveIdUpdated', handleNav)
      global.app_event.off('jumpListPosition', handleJump)
    }
  }, [])

  return (
    <View style={styles.container}>
      {showPlaylists ? <MyList /> : <MusicList />}
    </View>
  )
}

const styles = createStyle({
  container: {
    flex: 1,
  },
})
