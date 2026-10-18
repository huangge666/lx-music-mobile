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
import { BorderRadius } from '@/theme'
import { useI18n } from '@/lang'
import { useBottomInset } from '@/components/common/BottomInset'
import { useFontSize } from '@/store/common/hook'
import { getLibraryGridMetrics } from './gridLayout'

type FlatListType = FlatListProps<LX.List.MyListInfo>

// 设计基准值；实际像素在渲染时按当前应用字号换算，字号变化后几何一起更新
const DESIGN = {
  contentPadding: 16,
  columnGap: 12,
  // 100 在常见手机宽度下得到三列小卡（约屏宽 28%），放大屏/平板继续增列
  minCardWidth: 100,
  rowSpacing: 16,
  titleSize: 13,
  titleGap: 8,
  metaSize: 11,
  lineHeightRatio: 1.35,
  metaMinHeight: 26,
}

const MORE_HIT_SLOP = { top: 12, bottom: 12, left: 12, right: 12 }

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

interface CardMetrics {
  cardWidth: number
  titleGap: number
  titleBlockHeight: number
  titleLineHeight: number
  metaBlockHeight: number
  metaLineHeight: number
}
/**
 * 资料库封面卡片。
 * 系统列表（默认/我喜欢）用固定图标，用户歌单用按稳定 id 派生的色块 + 首字，
 * 不为了封面去加载歌单内的歌曲，也不伪造「最近添加」。
 */
const CardItem = memo(({
  item,
  index,
  metrics,
  onPress,
  onShowMenu,
}: {
  item: LX.List.MyListInfo
  index: number
  metrics: CardMetrics
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
    <View style={{ width: metrics.cardWidth }}>
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.78}
        accessibilityRole="button"
        accessibilityLabel={[item.name, countLabel.trim()].filter(Boolean).join(' · ')}
      >
        <View style={[styles.cover, {
          width: metrics.cardWidth,
          height: metrics.cardWidth,
          backgroundColor: tint.backgroundColor,
        }]}>
          {fetching
            ? <Loading color={tint.color} size={18} />
            : initial
              ? <Text style={styles.coverInitial} color={tint.color} numberOfLines={1}>{initial}</Text>
              : <Icon name={getListIcon(item.id)} size={Math.max(Math.round(metrics.cardWidth * 0.22), 16)} color={tint.color} />}
        </View>
        <View style={{ marginTop: metrics.titleGap, height: metrics.titleLineHeight }}>
          <Text
            style={{ lineHeight: metrics.titleLineHeight }}
            size={DESIGN.titleSize}
            color={theme['c-font']}
            numberOfLines={1}
          >{item.name}</Text>
        </View>
      </TouchableOpacity>
      <View style={[styles.metaRow, { height: metrics.metaBlockHeight }]}>
        <Text
          style={{ lineHeight: metrics.metaLineHeight, flexShrink: 1 }}
          size={DESIGN.metaSize}
          color={theme['c-font-label']}
          numberOfLines={1}
        >{countLabel}</Text>
        <TouchableOpacity
          onPress={handleShowMenu}
          ref={moreButtonRef}
          style={styles.moreButton}
          hitSlop={MORE_HIT_SLOP}
          activeOpacity={0.6}
          accessibilityRole="button"
          accessibilityLabel={t('list_music_actions')}
        >
          <Icon name="dots-vertical" color={theme['c-font-label']} size={16} />
        </TouchableOpacity>
      </View>
    </View>
  )
}, (prevProps, nextProps) => {
  return prevProps.item.id == nextProps.item.id &&
    prevProps.item.name == nextProps.item.name &&
    prevProps.index == nextProps.index &&
    prevProps.metrics.cardWidth == nextProps.metrics.cardWidth &&
    prevProps.metrics.titleBlockHeight == nextProps.metrics.titleBlockHeight &&
    prevProps.metrics.metaBlockHeight == nextProps.metrics.metaBlockHeight
})

export default ({ onShowMenu }: {
  onShowMenu: (info: { listInfo: LX.List.MyListInfo, index: number }, position: Position) => void
}) => {
  const flatListRef = useRef<FlatList>(null)
  const allList = useMyList()
  const bottomInset = useBottomInset()
  const fontScale = useFontSize()
  const [width, setWidth] = useState(0)
  const scrollOffsetRef = useRef(0)
  const firstScrollRef = useRef(false)
  const pendingOffsetRef = useRef<number | null>(null)
  const prevLayoutRef = useRef({ columns: 0, rowHeight: 0 })
  const restoredRef = useRef(false)

  // 测量得到的宽度直接用于列宽，不再交给缩放工具二次换算
  const handleLayout = useCallback((e: LayoutChangeEvent) => {
    const nextWidth = e.nativeEvent.layout.width
    setWidth(prev => Math.abs(prev - nextWidth) > 0.5 ? nextWidth : prev)
  }, [])

  const metrics = useMemo(() => {
    // 行高与字号一起换算：大字号下标题块变高，getItemLayout 用的是同一个值
    const titleLineHeight = Math.round(setSpText(DESIGN.titleSize) * DESIGN.lineHeightRatio)
    const metaLineHeight = Math.round(setSpText(DESIGN.metaSize) * DESIGN.lineHeightRatio)
    const metaBlockHeight = Math.max(metaLineHeight, Math.round(scaleSizeH(DESIGN.metaMinHeight)))
    const titleGap = Math.round(scaleSizeH(DESIGN.titleGap))
    // 标题只占一行（长标题截断），标题块高度含封面到标题的间距，渲染用同一个值
    const titleBlockHeight = titleGap + titleLineHeight
    return {
      ...getLibraryGridMetrics({
        width,
        contentPadding: scaleSizeW(DESIGN.contentPadding),
        columnGap: scaleSizeW(DESIGN.columnGap),
        minCardWidth: scaleSizeW(DESIGN.minCardWidth),
        rowSpacing: scaleSizeH(DESIGN.rowSpacing),
        titleBlockHeight,
        metaBlockHeight,
      }),
      titleGap,
      titleBlockHeight,
      titleLineHeight,
      metaBlockHeight,
      metaLineHeight,
    }
  // 应用字号变化时 setSpText 的结果才会变，fontScale 只用于触发重算
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [width, fontScale])

  const { columns, rowHeight, columnGap, rowSpacing, contentPadding } = metrics

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
    if (restoredRef.current || metrics.cardWidth <= 0) return
    restoredRef.current = true
    // 布局记录缺失说明位置来自旧的单列行列表，像素无法换算，只重置资料库这一处
    void getMusicListPosition(LIST_SCROLL_POSITION_KEY, rowHeight, columns, { resetWhenLayoutUnknown: true }).then(offset => {
      if (offset <= 0) return
      pendingOffsetRef.current = offset
      applyPendingOffset()
    })
  }, [metrics.cardWidth, rowHeight, columns, applyPendingOffset])

  useEffect(() => {
    const prev = prevLayoutRef.current
    if (prev.columns == columns && prev.rowHeight == rowHeight) return
    const firstItemIndex = prev.rowHeight > 0
      ? Math.floor(scrollOffsetRef.current / prev.rowHeight) * prev.columns
      : 0
    prevLayoutRef.current = { columns, rowHeight }
    // 列数变化会重建列表（FlatList 不支持原地改 numColumns），按真实行列换算回同一个首项
    if (prev.columns > 0 && prev.columns != columns) {
      pendingOffsetRef.current = Math.floor(firstItemIndex / columns) * rowHeight
      applyPendingOffset()
    }
  }, [columns, rowHeight, applyPendingOffset])

  const handleScroll = useCallback(({ nativeEvent }: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetY = nativeEvent.contentOffset.y
    scrollOffsetRef.current = offsetY
    if (firstScrollRef.current) {
      firstScrollRef.current = false
      return
    }
    void saveMusicListPosition(LIST_SCROLL_POSITION_KEY, offsetY, rowHeight, columns)
  }, [rowHeight, columns])

  const handleToggleList = useCallback((item: LX.List.MyListInfo) => {
    setActiveList(item.id)
    const componentId = commonState.componentIds.home
    if (componentId) navigations.pushMylistDetailScreen(componentId)
  }, [])

  const showMenu = useCallback((listInfo: LX.List.MyListInfo, index: number, position: Position) => {
    onShowMenu({ listInfo, index }, position)
  }, [onShowMenu])

  const renderItem: FlatListType['renderItem'] = ({ item, index }) => (
    <CardItem
      item={item}
      index={index}
      metrics={metrics}
      onPress={handleToggleList}
      onShowMenu={showMenu}
    />
  )
  const getkey: FlatListType['keyExtractor'] = item => item.id
  const getItemLayout: FlatListType['getItemLayout'] = (data, index) => {
    const rowIndex = Math.floor(index / Math.max(columns, 1))
    return { length: rowHeight, offset: rowHeight * rowIndex, index }
  }

  return (
    <View style={styles.container} onLayout={handleLayout}>
      {width == 0
        ? null
        : (
            <FlatList
              // numColumns 变化必须重建列表，RN 不支持原地修改
              key={`grid_${columns}`}
              ref={flatListRef}
              onScroll={handleScroll}
              scrollEventThrottle={16}
              style={styles.container}
              contentContainerStyle={[styles.content, {
                paddingHorizontal: contentPadding,
                paddingBottom: bottomInset + 16,
              }]}
              columnWrapperStyle={{ gap: columnGap, marginBottom: rowSpacing }}
              numColumns={columns}
              data={allList}
              maxToRenderPerBatch={9}
              windowSize={9}
              removeClippedSubviews={true}
              initialNumToRender={columns * 4}
              renderItem={renderItem}
              keyExtractor={getkey}
              getItemLayout={getItemLayout}
              onLayout={applyPendingOffset}
              onContentSizeChange={applyPendingOffset}
            />
          )}
    </View>
  )
}


const styles = createStyle({
  container: {
    flex: 1,
  },
  content: {
    paddingTop: 8,
  },
  cover: {
    borderRadius: BorderRadius.large,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  coverInitial: {
    // createStyle 会对 fontSize 走 setSpText，这里写设计值，避免二次缩放
    fontSize: 34,
    includeFontPadding: false,
    fontWeight: '700',
    letterSpacing: -1,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  moreButton: {
    width: 24,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
})
