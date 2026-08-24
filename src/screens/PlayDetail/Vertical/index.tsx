import { memo, useEffect, useState, useCallback } from 'react'
import { View, AppState } from 'react-native'

import Header from './components/Header'
import AlbumBackground from './components/AlbumBackground'
import Player from './Player'
import Pic from './Pic'
import SongTitle from './SongTitle'
import Lyric from './Lyric'
import { screenkeepAwake, screenUnkeepAwake } from '@/utils/nativeModules/utils'
import commonState, { type InitState as CommonState } from '@/store/common/state'
import { createStyle } from '@/utils/tools'


/**
 * 高端沉浸式播放详情页（竖屏 / Apple Music 风格）
 *
 *  ┌──────────────────────────────────┐
 *  │  ∨                          [封面] │  歌词态右侧封面可点回
 *  │         [ 大圆角封面 ]            │  点击 → 歌词页
 *  │  歌名                    ♡  ⋮    │
 *  │  进度 / 切歌 / 功能栏             │
 *  └──────────────────────────────────┘
 */
export default memo(({ componentId }: { componentId: string }) => {
  // false=封面，true=歌词；点击封面进入歌词，顶栏封面缩略图 / 歌词顶栏点回封面
  const [showLyric, setShowLyric] = useState(false)

  const openLyric = useCallback(() => {
    setShowLyric(true)
  }, [])
  const closeLyric = useCallback(() => {
    setShowLyric(false)
  }, [])

  // 屏幕常亮
  useEffect(() => {
    const handleComponentIdsChange = (ids: CommonState['componentIds']) => {
      if (ids.comment) screenUnkeepAwake()
      else if (AppState.currentState == 'active') screenkeepAwake()
    }

    screenkeepAwake()

    const appstateListener = AppState.addEventListener('change', (state) => {
      switch (state) {
        case 'active':
          if (!commonState.componentIds.comment) screenkeepAwake()
          break
        case 'background':
          screenUnkeepAwake()
          break
      }
    })

    global.state_event.on('componentIdsUpdated', handleComponentIdsChange)

    return () => {
      global.state_event.off('componentIdsUpdated', handleComponentIdsChange)
      appstateListener.remove()
      screenUnkeepAwake()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <View style={styles.root}>
      <AlbumBackground />
      <Header showLyric={showLyric} onBackToCover={closeLyric} />
      <View style={styles.container}>
        {/* 上半：封面 或 歌词（点击封面进入歌词） */}
        <View style={styles.topSection}>
          {showLyric
            ? (
                <View style={styles.lyricWrapper}>
                  <Lyric onPress={closeLyric} />
                </View>
              )
            : <Pic componentId={componentId} onPress={openLyric} />}
        </View>

        {/* 下半：标题 + 控制（始终可见） */}
        <View style={styles.bottomSection}>
          <SongTitle />
          <Player />
        </View>
      </View>
    </View>
  )
})

const styles = createStyle({
  root: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  container: {
    flex: 1,
    flexDirection: 'column',
  },
  topSection: {
    flex: 1,
    flexGrow: 1,
    flexShrink: 1,
    minHeight: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lyricWrapper: {
    flex: 1,
    width: '100%',
    minHeight: 0,
  },
  bottomSection: {
    flexGrow: 0,
    flexShrink: 0,
    flexDirection: 'column',
    // 下半操作区整体透明，不盖任何底板
    backgroundColor: 'transparent',
  },
})
