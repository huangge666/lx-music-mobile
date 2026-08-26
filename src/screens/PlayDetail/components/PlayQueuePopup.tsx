import { forwardRef, memo, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react'
import { FlatList, TouchableOpacity, View, type FlatListProps } from 'react-native'
import Popup, { type PopupType } from '@/components/common/Popup'
import Text from '@/components/common/Text'
import { Icon } from '@/components/common/Icon'
import { useTheme } from '@/store/theme/hook'
import { useI18n } from '@/lang'
import { createStyle } from '@/utils/tools'
import { scaleSizeH, scaleSizeW } from '@/utils/pixelRatio'
import { LIST_IDS, LIST_ITEM_HEIGHT } from '@/config/constant'
import { getListMusics } from '@/core/list'
import { playList } from '@/core/player/player'
import { usePlayInfo, usePlayMusicInfo, usePlayedList, useTempPlayList } from '@/store/player/hook'
import listState from '@/store/list/state'
import { BorderRadius } from '@/theme'
import CheckBox from '@/components/common/CheckBox'
import { getShuffledRemaining } from '@/core/player/shuffleQueue'

const ITEM_HEIGHT = scaleSizeH(LIST_ITEM_HEIGHT)

export interface PlayQueuePopupType {
  show: () => void
}

type Translate = ReturnType<typeof useI18n>
type QueueListProps = FlatListProps<LX.Music.MusicInfo>

const getListName = (listId: string | null, t: Translate) => {
  if (!listId) return ''
  switch (listId) {
    case LIST_IDS.TEMP:
      return t('list_name_temp')
    case LIST_IDS.DEFAULT:
      return t('list_name_default')
    case LIST_IDS.LOVE:
      return t('list_name_love')
    default:
      return listState.allList.find(l => l.id === listId)?.name ?? ''
  }
}

const getSnWidth = (listLength: number) => {
  const digits = String(Math.max(listLength, 1)).length
  return scaleSizeW(Math.max(digits, 2) * 10 + 16)
}

const buildRandomPlayOrder = (
  list: LX.Music.MusicInfo[],
  playedList: LX.Player.PlayMusicInfo[],
  currentId: string | null,
  listId: string | null,
): LX.Music.MusicInfo[] => {
  const byId = new Map(list.map(item => [item.id, item]))
  const used = new Set<string>()
  const ordered: LX.Music.MusicInfo[] = []

  for (const played of playedList) {
    const music = byId.get(played.musicInfo.id)
    if (!music || used.has(music.id)) continue
    ordered.push(music)
    used.add(music.id)
  }

  if (currentId) {
    const current = byId.get(currentId)
    if (current && !used.has(current.id)) {
      ordered.push(current)
      used.add(current.id)
    }
  }

  const remaining = list.filter(item => !used.has(item.id))
  return ordered.concat(listId ? getShuffledRemaining(listId, remaining) : remaining)
}

const toQueueMusic = (music: LX.Player.PlayMusic): LX.Music.MusicInfo | null => {
  if (!music) return null
  return 'progress' in music ? music.metadata.musicInfo : music
}

/** 稍后播放插到当前曲后面，并从原位置移除，避免重复 */
const insertPlayLaterAfterCurrent = (
  list: LX.Music.MusicInfo[],
  tempPlayList: LX.Player.PlayMusicInfo[],
  currentId: string | null,
): LX.Music.MusicInfo[] => {
  const later: LX.Music.MusicInfo[] = []
  const laterIds = new Set<string>()
  for (const item of tempPlayList) {
    const music = toQueueMusic(item.musicInfo)
    if (!music || music.id === currentId || laterIds.has(music.id)) continue
    later.push(music)
    laterIds.add(music.id)
  }
  if (!later.length) return list

  const next = list.filter(item => !laterIds.has(item.id))
  const currentIndex = currentId ? next.findIndex(item => item.id === currentId) : -1
  next.splice(currentIndex >= 0 ? currentIndex + 1 : 0, 0, ...later)
  return next
}

const QueueItem = memo(({ item, index, active, snWidth, onPress }: {
  item: LX.Music.MusicInfo
  index: number
  active: boolean
  snWidth: number
  onPress: (item: LX.Music.MusicInfo) => void
}) => {
  const theme = useTheme()
  const singer = item.meta.albumName ? `${item.singer} · ${item.meta.albumName}` : item.singer

  return (
    <TouchableOpacity
      style={{
        ...styles.listItem,
        height: ITEM_HEIGHT,
        backgroundColor: active ? theme['c-primary-background-hover'] : 'transparent',
      }}
      activeOpacity={0.6}
      onPress={() => { onPress(item) }}
    >
      <View style={{ ...styles.sn, width: snWidth }}>
        {
          active
            ? <Icon name="play-outline" size={13} color={theme['c-primary']} />
            : <Text style={styles.snText} size={12} color={theme['c-font-label']}>{index + 1}</Text>
        }
      </View>
      <View style={styles.itemInfo}>
        <Text color={active ? theme['c-primary'] : theme['c-font']} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.singer} size={12} color={active ? theme['c-primary-alpha-300'] : theme['c-font-label']} numberOfLines={1}>
          {singer}
        </Text>
      </View>
      {
        item.interval
          ? (
              <Text size={12} color={active ? theme['c-primary-alpha-400'] : theme['c-font-label']} numberOfLines={1}>
                {item.interval}
              </Text>
            )
          : null
      }
    </TouchableOpacity>
  )
}, (prevProps, nextProps) => {
  return prevProps.item === nextProps.item &&
    prevProps.index === nextProps.index &&
    prevProps.active === nextProps.active &&
    prevProps.snWidth === nextProps.snWidth &&
    prevProps.onPress === nextProps.onPress
})

/**
 * 播放详情「当前播放」底部抽屉
 * 展示 playerListId 对应的播放列表，打开时滚到正在播放的歌曲
 */
export default forwardRef<PlayQueuePopupType>((_, ref) => {
  const t = useI18n()
  const theme = useTheme()
  const [visible, setVisible] = useState(false)
  const popupRef = useRef<PopupType>(null)
  const flatListRef = useRef<FlatList<LX.Music.MusicInfo>>(null)
  const pendingScrollRef = useRef(false)
  const playInfo = usePlayInfo()
  const playMusicInfo = usePlayMusicInfo()
  const playedList = usePlayedList()
  const tempPlayList = useTempPlayList()
  const [list, setList] = useState<LX.Music.MusicInfo[]>([])
  const [listName, setListName] = useState('')
  const [loaded, setLoaded] = useState(false)
  const [originalOrder, setOriginalOrder] = useState(false)

  const loadQueue = useCallback(async(listId: string | null) => {
    if (!listId) {
      setList([])
      setListName('')
      setLoaded(true)
      return
    }
    setListName(getListName(listId, t))
    const musics = await getListMusics(listId)
    setList([...musics])
    setLoaded(true)
  }, [t])

  useImperativeHandle(ref, () => ({
    show() {
      pendingScrollRef.current = true
      if (visible) {
        void loadQueue(playInfo.playerListId)
        popupRef.current?.setVisible(true)
        return
      }
      setVisible(true)
      requestAnimationFrame(() => {
        popupRef.current?.setVisible(true)
      })
    },
  }), [loadQueue, playInfo.playerListId, visible])

  useEffect(() => {
    if (!visible) return
    void loadQueue(playInfo.playerListId)
  }, [loadQueue, playInfo.playerListId, visible])

  useEffect(() => {
    if (!visible) return
    const handleChange = (ids: string[]) => {
      const listId = playInfo.playerListId
      if (!listId || !ids.includes(listId)) return
      void loadQueue(listId)
    }
    global.app_event.on('myListMusicUpdate', handleChange)
    return () => {
      global.app_event.off('myListMusicUpdate', handleChange)
    }
  }, [loadQueue, playInfo.playerListId, visible])

  const displayList = useMemo(() => {
    const currentId = playMusicInfo.musicInfo?.id ?? null
    const currentMusic = playMusicInfo.musicInfo ? toQueueMusic(playMusicInfo.musicInfo) : null
    let next = originalOrder
      ? [...list]
      : buildRandomPlayOrder(list, playedList, currentId, playInfo.playerListId)
    if (currentMusic && !next.some(item => item.id === currentMusic.id)) {
      next = [currentMusic, ...next]
    }
    return insertPlayLaterAfterCurrent(next, tempPlayList, currentId)
  }, [list, originalOrder, playInfo.playerListId, playMusicInfo.musicInfo, playedList, tempPlayList])

  const activeIndex = useMemo(() => {
    const currentId = playMusicInfo.musicInfo?.id
    if (!currentId) return -1
    return displayList.findIndex(item => item.id === currentId)
  }, [displayList, playMusicInfo.musicInfo?.id])

  const snWidth = useMemo(() => getSnWidth(displayList.length), [displayList.length])

  // 仅在打开抽屉或切换排序时滚到当前曲，避免切歌时打断用户浏览
  useEffect(() => {
    if (!visible || !pendingScrollRef.current || !loaded) return
    if (!displayList.length || activeIndex < 0) {
      pendingScrollRef.current = false
      return
    }
    const timer = setTimeout(() => {
      pendingScrollRef.current = false
      flatListRef.current?.scrollToIndex({
        index: activeIndex,
        viewPosition: 0.35,
        animated: false,
      })
    }, 60)
    return () => { clearTimeout(timer) }
  }, [activeIndex, displayList, loaded, visible])

  const handlePress = useCallback((item: LX.Music.MusicInfo) => {
    const listId = playInfo.playerListId
    if (!listId) return
    const index = list.findIndex(music => music.id === item.id)
    if (index < 0) return
    void playList(listId, index)
  }, [list, playInfo.playerListId])

  const handleOriginalOrderChange = useCallback((check: boolean) => {
    pendingScrollRef.current = true
    setOriginalOrder(check)
  }, [])

  const renderItem = useCallback<NonNullable<QueueListProps['renderItem']>>(({ item, index }) => (
    <QueueItem
      item={item}
      index={index}
      active={index === activeIndex}
      snWidth={snWidth}
      onPress={handlePress}
    />
  ), [activeIndex, handlePress, snWidth])

  const keyExtractor = useCallback<NonNullable<QueueListProps['keyExtractor']>>((item) => item.id, [])
  const getItemLayout = useCallback<NonNullable<QueueListProps['getItemLayout']>>((_data, index) => ({
    length: ITEM_HEIGHT,
    offset: ITEM_HEIGHT * index,
    index,
  }), [])

  const handleScrollToIndexFailed = useCallback<NonNullable<QueueListProps['onScrollToIndexFailed']>>(({ index }) => {
    flatListRef.current?.scrollToOffset({
      offset: Math.max(0, index * ITEM_HEIGHT),
      animated: false,
    })
  }, [])

  const subtitle = listName
    ? `${listName} · ${t('list_music_count', { num: displayList.length })}`
    : t('list_music_count', { num: displayList.length })

  if (!visible) return null

  return (
    <Popup ref={popupRef} title={t('play_detail_queue')} subtitle={subtitle}>
      <View style={styles.container}>
        <View style={styles.toolbar}>
          <CheckBox
            check={originalOrder}
            label={t('play_detail_queue_original_order')}
            onChange={handleOriginalOrderChange}
            size={0.9}
            marginRight={0}
          />
        </View>
        {
          displayList.length
            ? (
                <FlatList
                  ref={flatListRef}
                  style={styles.list}
                  data={displayList}
                  renderItem={renderItem}
                  keyExtractor={keyExtractor}
                  getItemLayout={getItemLayout}
                  onScrollToIndexFailed={handleScrollToIndexFailed}
                  extraData={activeIndex}
                  initialNumToRender={16}
                  maxToRenderPerBatch={8}
                  windowSize={8}
                  removeClippedSubviews
                />
              )
            : loaded
              ? (
                  <View style={styles.empty}>
                    <Text color={theme['c-font-label']}>{t('play_detail_queue_empty')}</Text>
                  </View>
                )
              : null
        }
      </View>
    </Popup>
  )
})

const styles = createStyle({
  container: {
    flexGrow: 1,
    flexShrink: 1,
    minHeight: 360,
  },
  toolbar: {
    flexGrow: 0,
    flexShrink: 0,
    paddingHorizontal: 18,
    paddingTop: 4,
    paddingBottom: 8,
  },
  list: {
    flexGrow: 1,
    flexShrink: 1,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 16,
    borderRadius: BorderRadius.normal,
    marginHorizontal: 8,
  },
  sn: {
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  snText: {
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
    includeFontPadding: false,
  },
  itemInfo: {
    flexGrow: 1,
    flexShrink: 1,
    paddingRight: 8,
  },
  singer: {
    marginTop: 2,
  },
  empty: {
    minHeight: 220,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
})
