import { memo } from 'react'

import Badge, { type BadgeType } from '@/components/common/Badge'
import MusicRow, { type MusicRowPosition } from '@/components/common/MusicRow'
import { useI18n } from '@/lang'
import { type RowInfo } from '@/utils/tools'

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

const getQualityKey = (item: LX.Music.MusicInfoOnline) => {
  const qualitys = item.meta._qualitys
  return `${!!qualitys.flac24bit}|${!!qualitys.flac}|${!!qualitys.ape}|${!!qualitys['320k']}`
}

/** Online-song adapter: keeps source/menu/selection semantics outside MusicRow. */
export default memo(({ item, index, active, showSource, onPress, onLongPress, onShowMenu, selectedList, rowInfo, isShowAlbumName, isShowInterval, rowHeight }: {
  item: LX.Music.MusicInfoOnline
  index: number
  active: boolean
  showSource?: boolean
  onPress: (item: LX.Music.MusicInfoOnline, index: number) => void
  onLongPress: (item: LX.Music.MusicInfoOnline, index: number) => void
  onShowMenu: (item: LX.Music.MusicInfoOnline, index: number, position: { x: number, y: number, w: number, h: number }) => void
  selectedList: LX.Music.MusicInfoOnline[]
  rowInfo: RowInfo
  isShowAlbumName: boolean
  isShowInterval: boolean
  rowHeight: number
}) => {
  const t = useI18n()
  const tagInfo = useQualityTag(item)
  const singer = `${item.singer}${isShowAlbumName && item.meta.albumName ? ` · ${item.meta.albumName}` : ''}`
  const metadata = (
    <>
      {tagInfo.type ? <Badge type={tagInfo.type}>{tagInfo.text}</Badge> : null}
      {showSource ? <Badge type="tertiary">{item.source}</Badge> : null}
    </>
  )

  const handleShowMenu = (position: MusicRowPosition) => {
    onShowMenu(item, index, position)
  }

  return <MusicRow
    title={item.name}
    subtitle={singer}
    coverUrl={item.meta.picUrl}
    duration={isShowInterval ? item.interval : null}
    active={active}
    selected={selectedList.includes(item)}
    metadata={metadata}
    metadataKey={`${getQualityKey(item)}|${showSource ? item.source : ''}`}
    width={rowInfo.rowWidth}
    height={rowHeight}
    onPress={() => { onPress(item, index) }}
    onLongPress={() => { onLongPress(item, index) }}
    onPressMore={handleShowMenu}
    accessibilityLabel={`${item.name} · ${item.singer}${active ? ` · ${t('play_detail_queue')}` : ''}`}
    moreAccessibilityLabel={t('list_music_actions', { name: item.name })}
  />
}, (prevProps, nextProps) => {
  const sameItem = prevProps.item.id === nextProps.item.id &&
    prevProps.item.name === nextProps.item.name &&
    prevProps.item.singer === nextProps.item.singer &&
    prevProps.item.source === nextProps.item.source &&
    prevProps.item.interval === nextProps.item.interval &&
    prevProps.item.meta.albumName === nextProps.item.meta.albumName &&
    prevProps.item.meta.picUrl === nextProps.item.meta.picUrl &&
    getQualityKey(prevProps.item) === getQualityKey(nextProps.item)
  return !!(sameItem &&
    prevProps.index === nextProps.index &&
    prevProps.active === nextProps.active &&
    prevProps.showSource === nextProps.showSource &&
    prevProps.rowInfo === nextProps.rowInfo &&
    prevProps.isShowAlbumName === nextProps.isShowAlbumName &&
    prevProps.isShowInterval === nextProps.isShowInterval &&
    prevProps.rowHeight === nextProps.rowHeight &&
    nextProps.selectedList.includes(nextProps.item) == prevProps.selectedList.includes(prevProps.item)
  )
})
