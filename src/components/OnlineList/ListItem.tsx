import { memo, useRef } from 'react'
import { View, TouchableOpacity } from 'react-native'
import Text from '@/components/common/Text'
import Badge, { type BadgeType } from '@/components/common/Badge'
import { Icon } from '@/components/common/Icon'
import Image from '@/components/common/Image'
import { useI18n } from '@/lang'
import { useTheme } from '@/store/theme/hook'
import { scaleSizeH } from '@/utils/pixelRatio'
import { LIST_ITEM_HEIGHT } from '@/config/constant'
import { createStyle, type RowInfo } from '@/utils/tools'

export const ITEM_HEIGHT = scaleSizeH(LIST_ITEM_HEIGHT)

const useQualityTag = (musicInfo: LX.Music.MusicInfoOnline) => {
  const t = useI18n()
  let info: { type: BadgeType | null, text: string } = { type: null, text: '' }
  if (musicInfo.meta._qualitys.flac24bit) {
    info.type = 'secondary'
    info.text = t('quality_lossless_24bit')
  } else if (musicInfo.meta._qualitys.flac ?? musicInfo.meta._qualitys.ape) {
    info.type = 'secondary'
    info.text = t('quality_lossless')
  } else if (musicInfo.meta._qualitys['320k']) {
    info.type = 'tertiary'
    info.text = t('quality_high_quality')
  }

  return info
}

/**
 * 通栏歌曲行：小封面、歌名、歌手、时长和更多操作。
 * 不给每一行单独套卡片，避免列表被切成一块一块。
 */
export default memo(({ item, index, showSource, onPress, onLongPress, onShowMenu, selectedList, rowInfo, isShowAlbumName, isShowInterval }: {
  item: LX.Music.MusicInfoOnline
  index: number
  showSource?: boolean
  onPress: (item: LX.Music.MusicInfoOnline, index: number) => void
  onLongPress: (item: LX.Music.MusicInfoOnline, index: number) => void
  onShowMenu: (item: LX.Music.MusicInfoOnline, index: number, position: { x: number, y: number, w: number, h: number }) => void
  selectedList: LX.Music.MusicInfoOnline[]
  rowInfo: RowInfo
  isShowAlbumName: boolean
  isShowInterval: boolean
}) => {
  const theme = useTheme()

  const isSelected = selectedList.includes(item)

  const moreButtonRef = useRef<TouchableOpacity>(null)
  const handleShowMenu = () => {
    if (moreButtonRef.current?.measure) {
      moreButtonRef.current.measure((fx, fy, width, height, px, py) => {
        onShowMenu(item, index, { x: Math.ceil(px), y: Math.ceil(py), w: Math.ceil(width), h: Math.ceil(height) })
      })
    }
  }
  const tagInfo = useQualityTag(item)

  const singer = `${item.singer}${isShowAlbumName && item.meta.albumName ? ` · ${item.meta.albumName}` : ''}`
  const coverUrl = item.meta.picUrl

  return (
    <View style={{
      ...styles.listItem,
      width: rowInfo.rowWidth,
      height: ITEM_HEIGHT,
      backgroundColor: isSelected ? theme['c-accent-soft'] : 'transparent',
    }}>
      <TouchableOpacity style={styles.listItemLeft} onPress={() => { onPress(item, index) }} onLongPress={() => { onLongPress(item, index) }} activeOpacity={0.6}>
        {coverUrl
          ? (
              <View style={styles.coverWrap}>
                <Image url={coverUrl} style={styles.cover} />
              </View>
            )
          : null}
        <View style={styles.itemInfo}>
          {/* 歌名 — 主文字色 */}
          <Text numberOfLines={1} color={theme['c-font']}>{item.name}</Text>
          <View style={styles.listItemSingle}>
            { tagInfo.type ? <Badge type={tagInfo.type}>{tagInfo.text}</Badge> : null }
            { showSource ? <Badge type="tertiary">{item.source}</Badge> : null }
            {/* 歌手/专辑 — 次要色较小字体 */}
            <Text style={styles.listItemSingleText} size={12} color={theme['c-font-label']} numberOfLines={1}>{singer}</Text>
          </View>
        </View>
        {
          isShowInterval ? (
            <Text size={12} color={theme['c-font-label']} numberOfLines={1}>{item.interval}</Text>
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
    nextProps.selectedList.includes(nextProps.item) == prevProps.selectedList.includes(nextProps.item)
  )
})

const styles = createStyle({
  listItem: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    paddingLeft: 16,
    paddingRight: 4,
    alignItems: 'center',
  },
  coverWrap: {
    width: 40,
    height: 40,
    marginRight: 12,
    flexGrow: 0,
    flexShrink: 0,
  },
  cover: {
    width: 40,
    height: 40,
    borderRadius: 8,
  },
  listItemLeft: {
    flex: 1,
    flexGrow: 1,
    flexShrink: 1,
    flexDirection: 'row',
    alignItems: 'center',
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
