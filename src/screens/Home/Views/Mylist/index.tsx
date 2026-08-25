import { useCallback, useEffect, useRef, useState } from 'react'
import { View } from 'react-native'
import MusicList from './MusicList'
import MyList from './MyList'
import type { InitState as CommonState } from '@/store/common/state'
import commonState from '@/store/common/state'
import playerState from '@/store/player/state'
import { setActiveList } from '@/core/list'
import { createStyle } from '@/utils/tools'
import { useBackHandler } from '@/utils/hooks/useBackHandler'

export default () => {
  const [showPlaylists, setShowPlaylists] = useState(true)
  const showPlaylistsRef = useRef(showPlaylists)
  showPlaylistsRef.current = showPlaylists

  // 硬件返回键：在“我的”页的歌单详情时先返回上一级歌单列表，而不是退出应用。
  // 播放详情等已入栈页面优先处理返回（与设置页一致：仅 home 在栈上时才拦截）。
  useBackHandler(useCallback(() => {
    if (Object.keys(commonState.componentIds).length != 1) return false
    if (commonState.navActiveId != 'nav_love') return false
    if (showPlaylistsRef.current) return false
    global.app_event.changeLoveListVisible(true)
    return true
  }, []))

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
