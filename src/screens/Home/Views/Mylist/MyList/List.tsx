import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  View,
  TouchableOpacity,
  FlatList,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type FlatListProps,
} from 'react-native'

import { Icon } from '@/components/common/Icon'
import Loading from '@/components/common/Loading'
import Text from '@/components/common/Text'
import { getPlaylistCoverTint, getPlaylistInitial } from '@/components/common/playlistCover'
import { useTheme } from '@/store/theme/hook'
import { useListFetching, useListMusicCount, useMyList } from '@/store/list/hook'
import { createStyle } from '@/utils/tools'
import { LIST_IDS, LIST_SCROLL_POSITION_KEY } from '@/config/constant'
import { getMusicListPosition, saveMusicListPosition } from '@/utils/data'
import { setActiveList } from '@/core/list'
import { navigations } from '@/navigation'
import commonState from '@/store/common/state'
import { type Position } from './ListMenu'
import { scaleSizeH, scaleSizeW, setSpText } from '@/utils/pixelRatio'
import { useI18n } from '@/lang'
import { useBottomInset } from '@/components/common/BottomInset'
import { useFontSize } from '@/store/common/hook'
import { getLibraryRowHeight } from './rowLayout'

type FlatListType = FlatListProps<LX.List.MyListInfo>

/**
 * 资料库列表（Phase 7）。
 *
 * 由三列小卡网格改为 iOS 资料库的列表形态：
 * 52dp 圆角封面 + 17/600 标题 + 13 歌曲数 + 从文字处起笔的发丝分隔线。
 * 行高由同一份计算同时喂给渲染与 `getItemLayout`，大字号变化时一起更新。
 */
const DESIGN = {
  contentPadding: 16,
  contentTop: 4,
  coverSize: 52,
  coverRadius: 8,
  rowHeight: 64,
  rowGap: 8,
  titleSize: 17,
  metaSize: 13,
  textGap: 2,
  separatorInset: 16 + 52 + 12,
}

const MORE_HIT_SLOP = { top: 8, bottom: 8, left: 8, right: 8 }

type ListFilter = 'all' | 'mine' | 'system'

/** iOS 分段控件的三个真实视图：全部列表 / 用户歌单 / 系统列表 */
const FILTER_OPTIONS = [
  { id: 'all', label: 'library_filter_all' },
  { id: 'mine', label: 'library_filter_mine' },
  { id: 'system', label: 'library_filter_system' },
] as const

const getListIcon = (id: string) => {
  switch (id) {
    case LIST_IDS.LOVE:
      return 'love'
    case LIST_IDS.DEFAULT:
      return 'play-outline'
    default:
      return 'album'
  }
}

interface RowMetrics {
  rowHeight: number
  coverSize: number
  coverRadius: number
  titleLineHeight: number
  metaLineHeight: number
  metaGap: number
  contentPadding: number
  contentTop: number
  separatorInset: number
}

/**
 * 资料库列表行。
 * 系统列表（默认/我喜欢）用固定图标，用户歌单用按稳定 id 派生的色块 + 首字，
 * 不为了封面去加载歌单内的歌曲，也不伪造「最近添加」。
 */
const ListRow = memo(({
  item,
  index,
  last,
  metrics,
  onPress,
  onShowMenu,
}: {
  item: LX.List.MyListInfo
  index: number
  last: boolean
  metrics: RowMetrics
  onPress: (item: LX.List.MyListInfo) => void
  onShowMenu: (item: LX.List.MyListInfo, index: number, position: Position) => void
}) => {
  const theme = useTheme()
  const t = useI18n()
  const moreButtonRef = useRef<TouchableOpacity>(null)
  const fetching = useListFetching(item.id)
  const count = useListMusicCount(item.id)
  const isSystemList = item.id == LIST_IDS.LOVE || item.id == LIST_IDS.DEFAULT
  const tint = getPlaylistCoverTint(item.id)
  const initial = isSystemList ? '' : getPlaylistInitial(item.name)
  const countLabel = count == null ? ' ' : t('list_music_count', { num: count })

  const handlePress = useCallback(() => { onPress(item) }, [item, onPress])

  const handleShowMenu = useCallback(() => {
    if (!moreButtonRef.current?.measure) return
    moreButtonRef.current.measure((fx, fy, width, height, pageX, pageY) => {
      onShowMenu(item, index, {
        x: Math.ceil(pageX),
        y: Math.ceil(pageY),
        w: Math.ceil(width),
        h: Math.ceil(height),
      })
    })
  }, [index, item, onShowMenu])

  return (
    <View style={{ height: metrics.rowHeight }}>
      <TouchableOpacity
        style={styles.row}
        onPress={handlePress}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={[item.name, countLabel.trim()].filter(Boolean).join(' · ')}
      >
        <View style={[styles.cover, {
          width: metrics.coverSize,
          height: metrics.coverSize,
          borderRadius: metrics.coverRadius,
          backgroundColor: tint.backgroundColor,
        }]}>
          {fetching
            ? <Loading color={tint.color} size={18} />
            : initial
              ? <Text style={styles.coverInitial} color={tint.color} numberOfLines={1}>{initial}</Text>
              : <Icon name={getListIcon(item.id)} size={Math.max(Math.round(metrics.coverSize * 0.4), 16)} color={tint.color} />}
        </View>
        <View style={styles.textCol}>
          <Text
            style={{ lineHeight: metrics.titleLineHeight }}
            size={DESIGN.titleSize}
            color={theme['c-font']}
            numberOfLines={1}
          >{item.name}</Text>
          {metrics.metaLineHeight > 0
            ? (
                <Text
                  style={{ lineHeight: metrics.metaLineHeight, marginTop: metrics.metaGap }}
                  size={DESIGN.metaSize}
                  color={theme['c-font-label']}
                  numberOfLines={1}
                >{countLabel}</Text>
              )
            : null}
        </View>
        <TouchableOpacity
          onPress={handleShowMenu}
          ref={moreButtonRef}
          style={styles.moreButton}
          hitSlop={MORE_HIT_SLOP}
          activeOpacity={0.6}
          accessibilityRole="button"
          accessibilityLabel={t('list_music_actions')}
        >
          <Icon name="dots-vertical" color={theme['c-font-label']} size={18} />
        </TouchableOpacity>
      </TouchableOpacity>
      {last
        ? null
        : (
            <View style={[styles.separator, {
              marginLeft: metrics.separatorInset,
              backgroundColor: theme['c-border-background'],
            }]} />
          )}
    </View>
  )
}, (prevProps, nextProps) => {
  return prevProps.item.id == nextProps.item.id &&
    prevProps.item.name == nextProps.item.name &&
    prevProps.index == nextProps.index &&
    prevProps.last == nextProps.last &&
    prevProps.metrics.rowHeight == nextProps.metrics.rowHeight &&
    prevProps.metrics.coverSize == nextProps.metrics.coverSize
})

export default ({ onShowMenu }: {
  onShowMenu: (info: { listInfo: LX.List.MyListInfo, index: number }, position: Position) => void
}) => {
  const flatListRef = useRef<FlatList>(null)
  const allList = useMyList()
  const theme = useTheme()
  const t = useI18n()
  const bottomInset = useBottomInset()
  const fontScale = useFontSize()
  const [width, setWidth] = useState(0)
  const [filter, setFilter] = useState<ListFilter>('all')
  const scrollOffsetRef = useRef(0)
  const firstScrollRef = useRef(false)
  const pendingOffsetRef = useRef<number | null>(null)
  const restoredRef = useRef(false)

  // 测量得到的宽度用于决定行内文字可用宽度，不再交给缩放工具二次换算
  const handleLayout = useCallback((e: LayoutChangeEvent) => {
    const nextWidth = e.nativeEvent.layout.width
    setWidth(prev => Math.abs(prev - nextWidth) > 0.5 ? nextWidth : prev)
  }, [])

  const metrics = useMemo(() => {
    const coverSize = Math.round(scaleSizeW(DESIGN.coverSize))
    const titleLineHeight = Math.round(setSpText(DESIGN.titleSize) * 1.25)
    const metaLineHeight = Math.round(setSpText(DESIGN.metaSize) * 1.25)
    const metaGap = Math.round(scaleSizeH(DESIGN.textGap))
    const verticalPadding = Math.round(scaleSizeH(DESIGN.rowGap))
    // 行高同时要容纳封面、两行文字和上下留白；大字号下跟随文字块一起变高
    const rowHeight = getLibraryRowHeight({
      coverSize,
      minRowHeight: Math.round(scaleSizeH(DESIGN.rowHeight)),
      verticalPadding,
      titleLineHeight,
      metaLineHeight,
      metaGap,
    })
    return {
      rowHeight,
      coverSize,
      coverRadius: Math.round(scaleSizeW(DESIGN.coverRadius)),
      titleLineHeight,
      metaLineHeight,
      metaGap,
      contentPadding: Math.round(scaleSizeW(DESIGN.contentPadding)),
      contentTop: Math.round(scaleSizeH(DESIGN.contentTop)),
      separatorInset: Math.round(scaleSizeW(DESIGN.separatorInset)),
    }
  // 应用字号变化时 setSpText 的结果才会变，fontScale 只用于触发重算
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [width, fontScale])

  const applyPendingOffset = useCallback(() => {
    const offset = pendingOffsetRef.current
    if (offset == null) return
    requestAnimationFrame(() => {
      if (pendingOffsetRef.current !== offset) return
      pendingOffsetRef.current = null
      flatListRef.current?.scrollToOffset({ offset, animated: false })
      scrollOffsetRef.current = offset
      firstScrollRef.current = true
    })
  }, [])

  useEffect(() => {
    if (restoredRef.current || width <= 0) return
    restoredRef.current = true
    // 布局记录缺失说明位置来自旧的列布局，像素无法换算，只重置资料库这一处
    void getMusicListPosition(LIST_SCROLL_POSITION_KEY, metrics.rowHeight, 1, { resetWhenLayoutUnknown: true }).then(offset => {
      if (offset <= 0) return
      pendingOffsetRef.current = offset
      applyPendingOffset()
    })
  }, [metrics.rowHeight, width, applyPendingOffset])

  const lists = useMemo(() => {
    if (filter == 'all') return allList
    if (filter == 'system') return allList.filter(item => item.id == LIST_IDS.DEFAULT || item.id == LIST_IDS.LOVE)
    return allList.filter(item => item.id != LIST_IDS.DEFAULT && item.id != LIST_IDS.LOVE)
  }, [allList, filter])

  const handleFilterChange = useCallback((next: ListFilter) => {
    if (next == filter) return
    setFilter(next)
    pendingOffsetRef.current = null
    scrollOffsetRef.current = 0
    firstScrollRef.current = true
    flatListRef.current?.scrollToOffset({ offset: 0, animated: false })
  }, [filter])

  const handleScroll = useCallback(({ nativeEvent }: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetY = nativeEvent.contentOffset.y
    scrollOffsetRef.current = offsetY
    if (firstScrollRef.current) {
      firstScrollRef.current = false
      return
    }
    // 分段筛选是临时视图，不覆盖「全部」列表保存的位置
    if (filter != 'all') return
    void saveMusicListPosition(LIST_SCROLL_POSITION_KEY, offsetY, metrics.rowHeight, 1)
  }, [metrics.rowHeight, filter])

  const handleToggleList = useCallback((item: LX.List.MyListInfo) => {
    setActiveList(item.id)
    const componentId = commonState.componentIds.home
    if (componentId) navigations.pushMylistDetailScreen(componentId)
  }, [])

  const showMenu = useCallback((listInfo: LX.List.MyListInfo, index: number, position: Position) => {
    onShowMenu({ listInfo, index }, position)
  }, [onShowMenu])

  const renderItem: FlatListType['renderItem'] = ({ item, index }) => (
    <ListRow
      item={item}
      // 菜单里的「在此之后新建列表」用的是完整列表下标，筛选视图不能改写它
      index={allList.indexOf(item)}
      last={index == lists.length - 1}
      metrics={metrics}
      onPress={handleToggleList}
      onShowMenu={showMenu}
    />
  )
  const getkey: FlatListType['keyExtractor'] = item => item.id
  const getItemLayout: FlatListType['getItemLayout'] = (data, index) => ({
    length: metrics.rowHeight,
    offset: metrics.rowHeight * index,
    index,
  })

  return (
    <View style={styles.container} onLayout={handleLayout}>
      {width == 0
        ? null
        : (
            <>
              {/* iOS 资料库分段控件：全部 / 我的歌单 / 系统列表 */}
              <View style={[styles.filterTrack, {
                marginHorizontal: metrics.contentPadding,
                backgroundColor: theme['c-primary-input-background'],
              }]}>
                {FILTER_OPTIONS.map(option => {
                  const active = filter == option.id
                  return (
                    <TouchableOpacity
                      key={option.id}
                      style={[styles.filterSegment, active
                        ? { backgroundColor: theme['c-card-background'], elevation: 2, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 2, shadowOffset: { width: 0, height: 1 } }
                        : null]}
                      activeOpacity={0.7}
                      accessibilityRole="tab"
                      accessibilityState={{ selected: active }}
                      onPress={() => { handleFilterChange(option.id) }}
                    >
                      <Text
                        size={13}
                        numberOfLines={1}
                        color={active ? theme['c-font'] : theme['c-font-label']}
                        style={active ? styles.filterTextActive : null}
                      >{t(option.label)}</Text>
                    </TouchableOpacity>
                  )
                })}
              </View>
              <FlatList
                ref={flatListRef}
                onScroll={handleScroll}
                scrollEventThrottle={16}
                style={styles.container}
                contentContainerStyle={[styles.content, {
                  paddingHorizontal: metrics.contentPadding,
                  paddingTop: metrics.contentTop,
                  paddingBottom: bottomInset + 24,
                }]}
                data={lists}
                maxToRenderPerBatch={9}
                windowSize={9}
                removeClippedSubviews={true}
                initialNumToRender={12}
                renderItem={renderItem}
                keyExtractor={getkey}
                getItemLayout={getItemLayout}
                onLayout={applyPendingOffset}
                onContentSizeChange={applyPendingOffset}
                ListEmptyComponent={(
                  <View style={styles.empty}>
                    <Text size={13} color={theme['c-font-label']}>{t('list_no_content')}</Text>
                  </View>
                )}
              />
            </>
          )}
    </View>
  )
}


const styles = createStyle({
  container: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
  },
  // iOS 分段控件：浅灰轨道 + 白色选中块
  filterTrack: {
    flexDirection: 'row',
    height: 34,
    marginTop: 4,
    marginBottom: 4,
    padding: 2,
    borderRadius: 9,
    alignItems: 'center',
  },
  filterSegment: {
    flex: 1,
    height: 30,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  filterTextActive: {
    fontWeight: '600',
  },
  empty: {
    paddingTop: 48,
    alignItems: 'center',
  },
  row: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  cover: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  coverInitial: {
    // createStyle 会对 fontSize 走 setSpText，这里写设计值，避免二次缩放
    fontSize: 22,
    includeFontPadding: false,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  textCol: {
    flex: 1,
    paddingLeft: 12,
    paddingRight: 8,
    justifyContent: 'center',
  },
  moreButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  separator: {
    height: 0.5,
  },
})
