import { memo, useEffect, useRef } from 'react'
import { View, TouchableOpacity, FlatList, type NativeScrollEvent, type NativeSyntheticEvent, type FlatListProps } from 'react-native'

import { Icon } from '@/components/common/Icon'

import { useTheme } from '@/store/theme/hook'
import { useListFetching, useListMusicCount, useMyList } from '@/store/list/hook'
import { createStyle } from '@/utils/tools'
import { LIST_IDS, LIST_SCROLL_POSITION_KEY } from '@/config/constant'
import { getListPosition, saveListPosition } from '@/utils/data'
import { setActiveList } from '@/core/list'
import Text from '@/components/common/Text'
import { type Position } from './ListMenu'
import { scaleSizeH, scaleSizeW } from '@/utils/pixelRatio'
import Loading from '@/components/common/Loading'
import { BorderRadius, BorderWidths } from '@/theme'
import { useI18n } from '@/lang'

type FlatListType = FlatListProps<LX.List.MyListInfo>

const ITEM_HEIGHT = scaleSizeH(72)
const COVER_SIZE = scaleSizeW(44)

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

const ListItem = memo(({ item, index, onPress, onShowMenu }: {
  onPress: (item: LX.List.MyListInfo) => void
  index: number
  item: LX.List.MyListInfo
  onShowMenu: (item: LX.List.MyListInfo, index: number, position: { x: number, y: number, w: number, h: number }) => void
}) => {
  const theme = useTheme()
  const t = useI18n()
  const moreButtonRef = useRef<TouchableOpacity>(null)
  const fetching = useListFetching(item.id)
  const count = useListMusicCount(item.id)
  const isLove = item.id == LIST_IDS.LOVE
  const coverBg = isLove ? theme['c-primary-background'] : theme['c-card-background']
  const coverColor = isLove ? theme['c-primary'] : theme['c-font-label']

  const handleShowMenu = () => {
    if (moreButtonRef.current?.measure) {
      moreButtonRef.current.measure((fx, fy, width, height, px, py) => {
        onShowMenu(item, index, { x: Math.ceil(px), y: Math.ceil(py), w: Math.ceil(width), h: Math.ceil(height) })
      })
    }
  }

  return (
    <View style={{
      ...styles.listItem,
      height: ITEM_HEIGHT,
      borderBottomColor: theme['c-border-background'],
    }}>
      <TouchableOpacity style={styles.main} onPress={() => { onPress(item) }} activeOpacity={0.6}>
        <View style={{
          ...styles.cover,
          width: COVER_SIZE,
          height: COVER_SIZE,
          backgroundColor: coverBg,
        }}>
          {
            fetching
              ? <Loading color={coverColor} size={16} />
              : <Icon name={getListIcon(item.id)} size={18} color={coverColor} />
          }
        </View>
        <View style={styles.info}>
          <Text style={styles.title} size={16} color={theme['c-font']} numberOfLines={1}>{item.name}</Text>
          <Text size={12} color={theme['c-font-label']} numberOfLines={1}>
            {count == null ? ' ' : t('list_music_count', { num: count })}
          </Text>
        </View>
      </TouchableOpacity>
      <TouchableOpacity onPress={handleShowMenu} ref={moreButtonRef} style={styles.listMoreBtn} activeOpacity={0.6}>
        <Icon name="dots-vertical" color={theme['c-font-label']} size={16} />
      </TouchableOpacity>
    </View>
  )
}, (prevProps, nextProps) => {
  return !!(prevProps.item === nextProps.item &&
    prevProps.index === nextProps.index &&
    prevProps.item.name == nextProps.item.name
  )
})


export default ({ onShowMenu }: {
  onShowMenu: (info: { listInfo: LX.List.MyListInfo, index: number }, position: Position) => void
}) => {
  const flatListRef = useRef<FlatList>(null)
  const allList = useMyList()

  const handleToggleList = (item: LX.List.MyListInfo) => {
    setActiveList(item.id)
    global.app_event.changeLoveListVisible(false)
  }


  const handleScroll = ({ nativeEvent }: NativeSyntheticEvent<NativeScrollEvent>) => {
    void saveListPosition(LIST_SCROLL_POSITION_KEY, nativeEvent.contentOffset.y)
  }

  const showMenu = (listInfo: LX.List.MyListInfo, index: number, position: Position) => {
    onShowMenu({ listInfo, index }, position)
  }

  useEffect(() => {
    void getListPosition(LIST_SCROLL_POSITION_KEY).then((offset) => {
      flatListRef.current?.scrollToOffset({ offset, animated: false })
    })
  }, [])

  const renderItem: FlatListType['renderItem'] = ({ item, index }) => (
    <ListItem
      key={item.id}
      item={item}
      index={index}
      onPress={handleToggleList}
      onShowMenu={showMenu}
    />
  )
  const getkey: FlatListType['keyExtractor'] = item => item.id
  const getItemLayout: FlatListType['getItemLayout'] = (data, index) => {
    return { length: ITEM_HEIGHT, offset: ITEM_HEIGHT * index, index }
  }

  return (
    <FlatList
      ref={flatListRef}
      onScroll={handleScroll}
      style={styles.container}
      contentContainerStyle={styles.content}
      data={allList}
      maxToRenderPerBatch={9}
      windowSize={9}
      removeClippedSubviews={true}
      initialNumToRender={18}
      renderItem={renderItem}
      keyExtractor={getkey}
      getItemLayout={getItemLayout}
    />
  )
}


const styles = createStyle({
  container: {
    flex: 1,
  },
  content: {
    paddingTop: 4,
    paddingBottom: 16,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 16,
    paddingRight: 4,
    borderBottomWidth: BorderWidths.hairline,
  },
  main: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: '100%',
  },
  cover: {
    borderRadius: BorderRadius.medium,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  info: {
    flexGrow: 1,
    flexShrink: 1,
    paddingLeft: 12,
    paddingRight: 8,
    justifyContent: 'center',
  },
  title: {
    fontWeight: '600',
    marginBottom: 3,
  },
  listMoreBtn: {
    height: '100%',
    width: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
})
