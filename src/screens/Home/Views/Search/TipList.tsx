import { useRef, useImperativeHandle, forwardRef, useEffect } from 'react'
import SearchTipList, { type SearchTipListProps as _SearchTipListProps, type SearchTipListType as _SearchTipListType } from '@/components/SearchTipList'
import Button from '@/components/common/Button'
import { createStyle } from '@/utils/tools'
import Text from '@/components/common/Text'
import { scaleSizeH } from '@/utils/pixelRatio'
import musicSdk from '@/utils/musicSdk'
import searchState from '@/store/search/state'
import { setSearchText, setTipList, setTipListInfo } from '@/core/search/search'
import { createTipSearch } from './tipSearch'

export const ITEM_HEIGHT = scaleSizeH(44)

export const debounceTipSearch = createTipSearch(async(keyword, source) => {
  const api = musicSdk[source]
  if (!('tipSearch' in api)) return []
  return await api.tipSearch.search(keyword) as string[]
})

export type SearchTipListProps = _SearchTipListProps<string>
export type SearchTipListType = _SearchTipListType<string>

interface TipListProps {
  onSearch: (keyword: string) => void
}
export interface TipListType {
  search: (keyword: string, height: number) => void
  show: (height: number) => void
  hide: () => void
}

export default forwardRef<TipListType, TipListProps>(({ onSearch }, ref) => {
  const searchTipListRef = useRef<SearchTipListType>(null)
  const visibleListRef = useRef(false)

  useEffect(() => () => {
    debounceTipSearch.cancel()
  }, [])

  const handleSearch = (keyword: string, height: number) => {
    searchTipListRef.current?.setHeight(height)
    visibleListRef.current = true
    setSearchText(keyword)
    const source = searchState.temp_source
    setTipListInfo(keyword, source)
    // 输入变化后立即清掉旧联想，避免短暂出现与当前输入无关的可点项。
    setTipList([])
    searchTipListRef.current?.setList([])
    debounceTipSearch(keyword, source, (list) => {
      if (!visibleListRef.current || keyword != searchState.tipListInfo.text || source != searchState.temp_source) return
      setTipList(list)
      searchTipListRef.current?.setList(list)
    })
  }

  const handleHide = () => {
    visibleListRef.current = false
    debounceTipSearch.cancel()
    searchTipListRef.current?.setList([])
  }

  useImperativeHandle(ref, () => ({
    search: handleSearch,
    show(height) {
      visibleListRef.current = true
      searchTipListRef.current?.setHeight(height)
      const info = searchState.tipListInfo
      if (info.text == searchState.searchText && info.source == searchState.temp_source && info.list.length) {
        searchTipListRef.current?.setList([...info.list])
      } else {
        handleSearch(searchState.searchText, height)
      }
    },
    hide: handleHide,
  }))

  const renderItem: SearchTipListProps['renderItem'] = ({ item, index }) => (
    <Button style={styles.item} onPress={() => { onSearch(item) }} key={index} accessibilityRole="button" accessibilityLabel={item}>
      <Text numberOfLines={1}>{item}</Text>
    </Button>
  )
  const getkey: SearchTipListProps['keyExtractor'] = (item, index) => String(index)
  const getItemLayout: SearchTipListProps['getItemLayout'] = (data, index) => ({ length: ITEM_HEIGHT, offset: ITEM_HEIGHT * index, index })

  return <SearchTipList
    ref={searchTipListRef}
    renderItem={renderItem}
    onPressBg={handleHide}
    keyExtractor={getkey}
    getItemLayout={getItemLayout}
  />
})

const styles = createStyle({
  item: {
    height: ITEM_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 15,
    paddingRight: 15,
  },
})
