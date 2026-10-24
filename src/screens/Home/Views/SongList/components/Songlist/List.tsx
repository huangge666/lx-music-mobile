import { useRef, useState, useMemo, forwardRef, useImperativeHandle } from 'react'
import { FlatList, View, RefreshControl, type FlatListProps } from 'react-native'

import ListItem from './ListItem'
import Featured from './Featured'
// import { navigations } from '@/navigation'
import { type ListInfoItem } from '@/store/songlist/state'
import { useLayout } from '@/utils/hooks'
import { useTheme } from '@/store/theme/hook'
import { useI18n } from '@/lang'
import { scaleSizeW } from '@/utils/pixelRatio'
import { createStyle } from '@/utils/tools'
import Text from '@/components/common/Text'
import ListState from '@/components/common/ListState'
import { useBottomInset } from '@/components/common/BottomInset'
type FlatListType = FlatListProps<ListInfoItem>

// 与资料库封面网格统一：左右内容间距 16、列间距 12
const CONTENT_PADDING = scaleSizeW(16)
// const MAX_WIDTH = scaleSizeW(110)
const MIN_WIDTH = scaleSizeW(120)
const GAP = scaleSizeW(12)

export interface ListProps {
  onRefresh: () => void
  onLoadMore: () => void
  onOpenDetail: (item: ListInfoItem, index: number) => void
  search?: boolean
}
export type Status = 'loading' | 'refreshing' | 'end' | 'error' | 'idle'

export interface ListType {
  setList: (list: ListInfoItem[], showSource?: boolean) => void
  setStatus: (val: Status) => void
}

export default forwardRef<ListType, ListProps>(({ onRefresh, onLoadMore, onOpenDetail, search = false }, ref) => {
  const flatListRef = useRef<FlatList>(null)
  const [currentList, setList] = useState<ListInfoItem[]>([])
  const [showSource, setShowSource] = useState(false)
  const [status, setStatus] = useState<Status>('idle')
  const { onLayout, width } = useLayout()
  const theme = useTheme()
  const t = useI18n()
  const bottomInset = useBottomInset()
  // console.log('render songlist')

  useImperativeHandle(ref, () => ({
    setList(list, showSource = false) {
      // rawListRef.current = list
      setList(list)
      setShowSource(showSource)
    },
    setStatus(val) {
      setStatus(val)
    },
  }))

  const handleLoadMore = () => {
    if (status != 'idle') return
    onLoadMore()
  }

  const renderItem: FlatListType['renderItem'] = ({ item, index }) => (
    <ListItem
      item={item}
      index={index}
      width={rowInfo.width}
      showSource={showSource}
      onPress={onOpenDetail}
    />
  )
  const getkey: FlatListType['keyExtractor'] = item => item.id
  // const getItemLayout: FlatListType['getItemLayout'] = (data, index) => {
  //   return { length: ITEM_HEIGHT, offset: ITEM_HEIGHT * index, index }
  // }
  const refreshControl = useMemo(() => (
    <RefreshControl
      colors={[theme['c-accent']]}
      // progressBackgroundColor={theme.primary}
      refreshing={status == 'refreshing'}
      onRefresh={onRefresh} />
  ), [status, onRefresh, theme])
  const footerComponent = useMemo(() => {
    let label: FooterLabel
    switch (status) {
      case 'refreshing': return null
      case 'loading':
        label = 'list_loading'
        break
      case 'end':
        label = 'list_end'
        break
      case 'error':
        label = 'list_error'
        break
      case 'idle':
        label = null
        break
    }
    return (
      <View style={{ width: '100%' }}>
        <Footer label={currentList.length ? label : null} onLoadMore={onLoadMore} />
      </View>
    )
  }, [onLoadMore, status, currentList.length])


  // const itemWidth = useMemo(() => {
  //   let itemWidth = Math.max(Math.trunc(width * 0.125), MAX_WIDTH)
  //   // if (itemWidth < )
  // }, [width])
  // const computedItemWidth = useMemo(() => {
  //   let w = width - GAP
  //   let n = width / (MIN_WIDTH + GAP)
  //   if (n > 10) n = 10
  //   return Math.floor(w / n)
  // }, [width])
  // console.log(Math.trunc(width * 0.125), itemWidth)
  // console.log(itemWidth, MIN_WIDTH, GAP, width)
  const rowInfo = useMemo(() => {
    const available = Math.max(width - CONTENT_PADDING * 2, 0)
    let n = Math.floor((available + GAP) / (MIN_WIDTH + GAP))
    if (!Number.isFinite(n) || n < 2) n = 2
    if (n > 10) n = 10
    // 列宽与列数、间距出自同一份计算，避免卡片被 content 的左右 pading 挤出屏幕
    return {
      num: n,
      width: available > 0 ? (available - GAP * (n - 1)) / n : 0,
    }
  }, [width])
  // console.log(rowNum)
  const list = useMemo(() => {
    const list = [...currentList]
    let whiteItemNum = (list.length % rowInfo.num)
    if (whiteItemNum > 0) whiteItemNum = rowInfo.num - whiteItemNum
    for (let i = 0; i < whiteItemNum; i++) {
      list.push({
        id: `white__${i}`,
        play_count: '',
        author: '',
        name: '',
        img: '',
        desc: '',
        // @ts-expect-error
        source: '',
      })
    }
    return list
  }, [currentList, rowInfo])

  // 编辑式精选货架：只取有封面且有真实来源的前几张，不构造假数据
  const featured = useMemo(() => currentList.filter(item => item.img && item.source).slice(0, 5), [currentList])
  const headerComponent = useMemo(() => (
    <View>
      <Featured items={featured} width={width - CONTENT_PADDING * 2} onOpenDetail={onOpenDetail} />
      {featured.length
        ? (
            <Text style={styles.gridTitle} size={22} color={theme['c-font']}>{t('browse_all_playlists')}</Text>
          )
        : null}
    </View>
  ), [featured, onOpenDetail, t, theme, width])
  // console.log(listInfo.list.map((item) => item.id))

  return (
    <View style={styles.container} onLayout={onLayout}>
      {
        width == 0
          ? null
          : (
              <FlatList
                key={String(rowInfo.num)}
                ref={flatListRef}
                style={styles.list}
                contentContainerStyle={[styles.listContent, { paddingHorizontal: CONTENT_PADDING, paddingBottom: bottomInset + 16 }]}
                columnWrapperStyle={{ gap: GAP }}
                numColumns={rowInfo.num}
                data={list}
                maxToRenderPerBatch={4}
                // updateCellsBatchingPeriod={80}
                windowSize={8}
                removeClippedSubviews={true}
                // initialNumToRender={12}
                renderItem={renderItem}
                keyExtractor={getkey}
                // getItemLayout={getItemLayout}
                // onRefresh={onRefresh}
                // refreshing={refreshing}
                onEndReachedThreshold={0.6}
                onEndReached={handleLoadMore}
                refreshControl={refreshControl}
                ListHeaderComponent={headerComponent}
                ListFooterComponent={footerComponent}
                ListEmptyComponent={<ListState status={status} search={search} onRetry={onRefresh} />}
              />
            )
      }
    </View>
  )
})

type FooterLabel = 'list_loading' | 'list_end' | 'list_error' | null
const Footer = ({ label, onLoadMore }: {
  label: FooterLabel
  onLoadMore: () => void
}) => {
  const theme = useTheme()
  const t = useI18n()
  const handlePress = () => {
    if (label != 'list_error') return
    onLoadMore()
  }
  return (
    label
      ? (
          <View>
            <Text onPress={handlePress} style={styles.footer} color={theme['c-font-label']}>{t(label)}</Text>
          </View>
        )
      : null
  )
}


const styles = createStyle({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingTop: 6,
    paddingBottom: 12,
  },
  gridTitle: {
    fontWeight: '700',
    letterSpacing: -0.4,
    paddingTop: 18,
    paddingBottom: 10,
  },
  footer: {
    textAlign: 'center',
    padding: 10,
  },
})
