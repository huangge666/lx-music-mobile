import { useRef, useImperativeHandle, forwardRef, useState, useEffect } from 'react'
import SearchTipList, { type SearchTipListProps as _SearchTipListProps, type SearchTipListType } from '@/components/SearchTipList'
import { debounce } from '@/utils'
import { searchListMusic } from './listAction'
import Button from '@/components/common/Button'
import { createStyle } from '@/utils/tools'
import Text from '@/components/common/Text'
import { useTheme } from '@/store/theme/hook'
import { View } from 'react-native'
import { scaleSizeH } from '@/utils/pixelRatio'
import { getListMusics } from '@/core/list'
import listState from '@/store/list/state'

type SearchTipListProps = _SearchTipListProps<LX.Music.MusicInfo>
interface ListMusicSearchProps {
  onScrollToInfo: (info: LX.Music.MusicInfo) => void
}
export const ITEM_HEIGHT = scaleSizeH(46)

export interface ListMusicSearchType {
  search: (keyword: string, height: number) => void
  hide: () => void
}

export default forwardRef<ListMusicSearchType, ListMusicSearchProps>(({ onScrollToInfo }, ref) => {
  const searchTipListRef = useRef<SearchTipListType<LX.Music.MusicInfo>>(null)
  const [visible, setVisible] = useState(false)
  const currentKeywordRef = useRef('')
  const requestRef = useRef(0)
  const debounceSearchList = useRef(debounce((text: string, list: LX.List.ListMusics, callback: (list: LX.List.ListMusics) => void) => {
    callback(searchListMusic(list, text))
  }, 200)).current
  const theme = useTheme()

  const handleShowList = (keyword: string, height: number, request: number) => {
    if (request != requestRef.current) return
    searchTipListRef.current?.setHeight(height)
    currentKeywordRef.current = keyword
    const id = listState.activeListId
    if (keyword) {
      void getListMusics(id).then(list => {
        if (request != requestRef.current) return
        debounceSearchList(keyword, list, (list) => {
          if (request != requestRef.current) return
          searchTipListRef.current?.setList(list)
        })
      })
    } else {
      searchTipListRef.current?.setList([])
    }
  }

  useImperativeHandle(ref, () => ({
    search(keyword, height) {
      const request = ++requestRef.current
      if (visible) handleShowList(keyword, height, request)
      else {
        setVisible(true)
        requestAnimationFrame(() => {
          handleShowList(keyword, height, request)
        })
      }
    },
    hide() {
      requestRef.current++
      currentKeywordRef.current = ''
      searchTipListRef.current?.setList([])
    },
  }))

  useEffect(() => {
    const updateList = (id: string) => {
      const request = ++requestRef.current
      if (!currentKeywordRef.current) return
      void getListMusics(listState.activeListId).then(list => {
        if (request != requestRef.current) return
        debounceSearchList(currentKeywordRef.current, list, (list) => {
          if (request != requestRef.current) return
          searchTipListRef.current?.setList(list)
        })
      })
    }
    const handleChange = (ids: string[]) => {
      if (!ids.includes(listState.activeListId)) return
      updateList(listState.activeListId)
    }

    global.state_event.on('mylistToggled', updateList)
    global.app_event.on('myListMusicUpdate', handleChange)

    return () => {
      // 请求序号失效，禁止卸载或关闭后的慢回包重新弹出搜索面板。
      // eslint-disable-next-line react-hooks/exhaustive-deps
      requestRef.current++
      global.state_event.off('mylistToggled', updateList)
      global.app_event.off('myListMusicUpdate', handleChange)
    }
  }, [debounceSearchList])

  const renderItem = ({ item, index }: { item: LX.Music.MusicInfo, index: number }) => {
    return (
      <Button style={styles.item} onPress={() => { onScrollToInfo(item) }} key={index}>
        <View style={styles.itemName}>
          <Text numberOfLines={1}>{item.name}</Text>
          <Text style={styles.subName} numberOfLines={1} size={12} color={theme['c-font-label']}>{item.singer} ({item.meta.albumName})</Text>
        </View>
        <Text style={styles.itemSource} size={12} color={theme['c-font-label']}>{item.source}</Text>
      </Button>
    )
  }
  const getkey: SearchTipListProps['keyExtractor'] = item => item.id
  const getItemLayout: SearchTipListProps['getItemLayout'] = (data, index) => {
    return { length: ITEM_HEIGHT, offset: ITEM_HEIGHT * index, index }
  }

  return (
    visible
      ? <SearchTipList
          ref={searchTipListRef}
          renderItem={renderItem}
          onPressBg={() => {
            requestRef.current++
            currentKeywordRef.current = ''
            searchTipListRef.current?.setList([])
          }}
          keyExtractor={getkey}
          getItemLayout={getItemLayout}
        />
      : null
  )
})


const styles = createStyle({
  item: {
    height: ITEM_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 15,
    paddingRight: 15,
    // backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  itemName: {
    flexGrow: 1,
    flexShrink: 1,
  },
  subName: {
    marginTop: 2,
  },
  itemSource: {
    flexGrow: 0,
    flexShrink: 0,
  },
})

