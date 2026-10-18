import { memo } from 'react'

import Badge from '@/components/common/Badge'
import MusicRow, { type MusicRowPosition } from '@/components/common/MusicRow'
import { type RowInfo } from '@/utils/tools'

/** Local-song adapter: preserves ranking, source and menu contracts. */
export default memo(({ item, index, activeIndex, onPress, onShowMenu, onLongPress, selectedIdSet, rowInfo, isShowAlbumName, isShowInterval, snWidth, rowHeight }: {
  item: LX.Music.MusicInfo
  index: number
  activeIndex: number
  onPress: (item: LX.Music.MusicInfo, index: number) => void
  onLongPress: (item: LX.Music.MusicInfo, index: number) => void
  onShowMenu: (item: LX.Music.MusicInfo, index: number, position: { x: number, y: number, w: number, h: number }) => void
  selectedIdSet: ReadonlySet<string>
  rowInfo: RowInfo
  isShowAlbumName: boolean
  isShowInterval: boolean
  snWidth: number
  rowHeight: number
}) => {
  const active = activeIndex == index
  const singer = `${item.singer}${isShowAlbumName && item.meta.albumName ? ` · ${item.meta.albumName}` : ''}`

  const handleShowMenu = (position: MusicRowPosition) => {
    onShowMenu(item, index, position)
  }

  return <MusicRow
    title={item.name}
    subtitle={singer}
    duration={isShowInterval ? item.interval : null}
    active={active}
    selected={selectedIdSet.has(item.id)}
    rank={index + 1}
    rankWidth={snWidth}
    metadata={<Badge>{item.source.toUpperCase()}</Badge>}
    metadataKey={item.source}
    width={rowInfo.rowWidth}
    height={rowHeight}
    onPress={() => { onPress(item, index) }}
    onLongPress={() => { onLongPress(item, index) }}
    onPressMore={handleShowMenu}
  />
}, (prevProps, nextProps) => {
  const prevActive = prevProps.activeIndex == prevProps.index
  const nextActive = nextProps.activeIndex == nextProps.index
  const sameItem = prevProps.item.id === nextProps.item.id &&
    prevProps.item.name === nextProps.item.name &&
    prevProps.item.singer === nextProps.item.singer &&
    prevProps.item.source === nextProps.item.source &&
    prevProps.item.interval === nextProps.item.interval &&
    prevProps.item.meta.albumName === nextProps.item.meta.albumName
  return !!(sameItem &&
    prevProps.index === nextProps.index &&
    prevProps.snWidth === nextProps.snWidth &&
    prevProps.rowInfo === nextProps.rowInfo &&
    prevProps.isShowAlbumName === nextProps.isShowAlbumName &&
    prevProps.isShowInterval === nextProps.isShowInterval &&
    prevProps.rowHeight === nextProps.rowHeight &&
    prevActive === nextActive &&
    nextProps.selectedIdSet.has(nextProps.item.id) == prevProps.selectedIdSet.has(prevProps.item.id)
  )
})
