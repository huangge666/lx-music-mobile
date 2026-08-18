import { memo, useRef } from 'react'
import { View, TouchableOpacity } from 'react-native'
import Text from '@/components/common/Text'
import Badge, { type BadgeType } from '@/components/common/Badge'
import { Icon } from '@/components/common/Icon'
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
 * Apple Music 风格列表项
 *
 * 视觉特征：
 * — 左侧序号（次要色、较小字体）
 * — 歌名 15pt + 歌手/专辑 12pt 次要色
 * — 右侧时长 + 更多按钮
 * — 选中态：圆角浅色背景
 * — 行间无分隔线，靠间距区分（Apple Music 风格）
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

  return (
    <View style={{ ...styles.listItem, width: rowInfo.rowWidth, height: ITEM_HEIGHT, backgroundColor: isSelected ? theme['c-primary-background-hover'] : 'rgba(0,0,0,0)' }}>
      <TouchableOpacity style={styles.listItemLeft} onPress={() => { onPress(item, index) }} onLongPress={() => { onLongPress(item, index) }} activeOpacity={0.6}>
        {/* Apple Music 风格序号 — 居中、次要色 */}
        <Text style={styles.sn} size={15} color={theme['c-font-label']} numberOfLines={1}>{index + 1}</Text>
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
  // Apple Music 风格序号 — 固定宽度、居中对齐，宽度足够容纳4位数序号
  sn: {
    width: 44,
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
