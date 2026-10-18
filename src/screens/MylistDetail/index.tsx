import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { View } from 'react-native'

import PageContent from '@/components/PageContent'
import StatusBar from '@/components/common/StatusBar'
import PlayerBar from '@/components/player/PlayerBar'
import PlaylistHero from '@/components/common/PlaylistHero'
import DetailNav from '@/screens/Home/Views/Mylist/DetailNav'
import MusicList from '@/screens/Home/Views/Mylist/MusicList'
import { handlePlay, handleShufflePlay } from '@/screens/Home/Views/Mylist/MusicList/listAction'
import { setComponentId } from '@/core/common'
import { COMPONENT_IDS, LIST_IDS, MUSIC_TOGGLE_MODE } from '@/config/constant'
import { useStatusbarHeight } from '@/store/common/hook'
import { useTheme } from '@/store/theme/hook'
import { useActiveListId, useActiveListName, useListFetching, useListMusicCount } from '@/store/list/hook'
import { useSettingValue } from '@/store/setting/hook'
import { useI18n } from '@/lang'
import { createStyle, toast } from '@/utils/tools'
import { pop } from '@/navigation'

/**
 * 我的歌单详情独立页。
 * 不显示首页底部标签栏，返回时关闭本页并回到歌单列表。
 * 主视觉作为歌曲列表的 ListHeaderComponent，与歌曲一起滚动；返回栏留在列表外。
 */
export default ({ componentId }: { componentId: string }) => {
  const theme = useTheme()
  const t = useI18n()
  const statusBarHeight = useStatusbarHeight()
  const activeListId = useActiveListId()
  const activeListName = useActiveListName()
  const musicCount = useListMusicCount(activeListId)
  const fetching = useListFetching(activeListId)
  const togglePlayMethod = useSettingValue('player.togglePlayMethod')
  const [busy, setBusy] = useState(false)
  const isMountedRef = useRef(true)

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

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

  const handlePlayAll = useCallback(() => {
    if (busy || !musicCount) return
    // 沿用现有「播放全部」动作与当前播放模式，不在这里强制改模式
    handlePlay(activeListId, 0)
  }, [activeListId, busy, musicCount])

  const handleShuffle = useCallback(() => {
    if (busy || !musicCount) return
    setBusy(true)
    void handleShufflePlay(activeListId)
      .catch((err: unknown) => {
        console.error(err)
        if (isMountedRef.current) toast(t('playlist_shuffle_failed'))
      })
      .finally(() => {
        if (isMountedRef.current) setBusy(false)
      })
  }, [activeListId, busy, musicCount, t])

  const hero = useMemo(() => (
    <PlaylistHero
      title={activeListName}
      placeholderSeed={activeListId}
      placeholderIcon={activeListId == LIST_IDS.LOVE ? 'love' : activeListId == LIST_IDS.DEFAULT ? 'play-outline' : undefined}
      meta={musicCount == null ? null : t('list_music_count', { num: musicCount })}
      status={fetching ? 'loading' : 'idle'}
      shuffleActive={togglePlayMethod == MUSIC_TOGGLE_MODE.random}
      busy={busy}
      disabled={!musicCount}
      playLabel={t('play_all')}
      shuffleLabel={t('play_list_random')}
      onPlay={handlePlayAll}
      onShuffle={handleShuffle}
    />
  ), [activeListId, activeListName, busy, fetching, handlePlayAll, handleShuffle, musicCount, t, togglePlayMethod])

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
      <MusicList ListHeaderComponent={hero} />
      <PlayerBar componentId={componentId} />
    </PageContent>
  )
}

const styles = createStyle({
  header: {
    flexGrow: 0,
    flexShrink: 0,
  },
})
