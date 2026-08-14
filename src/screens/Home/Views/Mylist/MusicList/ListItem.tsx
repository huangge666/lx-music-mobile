import { memo, useRef } from 'react'
import { View, TouchableOpacity } from 'react-native'
import { LIST_ITEM_HEIGHT } from '@/config/constant'
import { Icon } from '@/components/common/Icon'
import { createStyle, type RowInfo } from '@/utils/tools'
import { useTheme } from '@/store/theme/hook'
import { useAssertApiSupport } from '@/store/common/hook'
import { scaleSizeH } from '@/utils/pixelRatio'
import Text from '@/components/common/Text'
import Badge from '@/components/common/Badge'

export const ITEM_HEIGHT = scaleSizeH(LIST_ITEM_HEIGHT)


/**
 * Apple Music 风格我的列表项
 *
 * 视觉特征：
 * — 播放中：主色播放图标替代序号
 * — 歌名 15pt 主色（播放中）/ 默认色
 * — 歌手 12pt 次要色
 * — 圆角选中态
 * — 更多按钮用次要色图标
 */
export default memo(({ item, index, activeIndex, onPress, onShowMenu, onLongPress, selectedList, rowInfo, isShowAlbumName, isShowInterval }: {
  item: LX.Music.MusicInfo
  index: number
  activeIndex: number
  onPress: (item: LX.Music.MusicInfo, index: number) => void
  onLongPress: (item: LX.Music.MusicInfo, index: number) => void
  onShowMenu: (item: LX.Music.MusicInfo, index: number, position: { x: number, y: number, w: number, h: number }) => void
  selectedList: LX.Music.MusicInfo[]
  rowInfo: RowInfo
  isShowAlbumName: boolean
  isShowInterval: boolean
}) => {
  const theme = useTheme()

  const isSelected = selectedList.includes(item)
  const isSupported = useAssertApiSupport(item.source)
  const moreButtonRef = useRef<TouchableOpacity>(null)
  const handleShowMenu = () => {
    if (moreButtonRef.current?.measure) {
      moreButtonRef.current.measure((fx, fy, width, height, px, py) => {
        onShowMenu(item, index, { x: Math.ceil(px), y: Math.ceil(py), w: Math.ceil(width), h: Math.ceil(height) })
      })
    }
  }
  const active = activeIndex == index

  const singer = `${item.singer}${isShowAlbumName && item.meta.albumName ? ` · ${item.meta.albumName}` : ''}`

  return (
    <View style={{ ...styles.listItem, width: rowInfo.rowWidth, height: ITEM_HEIGHT, backgroundColor: isSelected ? theme['c-primary-background-hover'] : 'rgba(0,0,0,0)', opacity: isSupported ? 1 : 0.5 }}>
      <TouchableOpacity style={styles.listItemLeft} onPress={() => { onPress(item, index) }} onLongPress={() => { onLongPress(item, index) }} activeOpacity={0.6}>
        {/* Apple Music 风格 — 播放中显示主色图标，否则显示序号 */}
        {
          active
            ? <Icon style={styles.sn} name="play-outline" size={13} color={theme['c-primary']} />
            : <Text style={styles.sn} size={15} color={theme['c-font-label']}>{index + 1}</Text>
        }
        <View style={styles.itemInfo}>
          <Text color={active ? theme['c-primary'] : theme['c-font']} numberOfLines={1}>{item.name}</Text>
          <View style={styles.listItemSingle}>
            <Badge>{item.source.toUpperCase()}</Badge>
            <Text style={styles.listItemSingleText} size={12} color={active ? theme['c-primary-alpha-300'] : theme['c-font-label']} numberOfLines={1}>
              {singer}
            </Text>
          </View>
        </View>
        {
          isShowInterval ? (
            <Text size={12} color={active ? theme['c-primary-alpha-400'] : theme['c-font-label']} numberOfLines={1}>{item.interval}</Text>
          ) : null
        }
      </TouchableOpacity>
      <TouchableOpacity onPress={handleShowMenu} ref={moreButtonRef} style={styles.moreButton} activeOpacity={0.6}>
        <Icon name="dots-vertical" style={{ color: theme['c-font-label'] }} size={14} />
      </TouchableOpacity>
    </View>
  )
}, (prevProps, nextProps) => {
  return !!(prevProps.item === nextProps.item &&
    prevProps.index === nextProps.index &&
    prevProps.isShowAlbumName === nextProps.isShowAlbumName &&
    prevProps.isShowInterval === nextProps.isShowInterval &&
    prevProps.activeIndex != nextProps.index &&
    nextProps.activeIndex != nextProps.index &&
    nextProps.selectedList.includes(nextProps.item) == prevProps.selectedList.includes(nextProps.item)
  )
})


const styles = createStyle({
  listItem: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    paddingRight: 4,
    alignItems: 'center',
  },
  listItemLeft: {
    flex: 1,
    flexGrow: 1,
    flexShrink: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  sn: {
    width: 36,
    textAlign: 'center',
    paddingLeft: 4,
    paddingRight: 4,
  },
  itemInfo: {
    flexGrow: 1,
    flexShrink: 1,
    paddingRight: 4,
  },
  listItemSingle: {
    paddingTop: 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  listItemSingleText: {
    flexGrow: 0,
    flexShrink: 1,
    fontWeight: '400',
  },
  moreButton: {
    height: '80%',
    paddingLeft: 12,
    paddingRight: 12,
    justifyContent: 'center',
  },
})
