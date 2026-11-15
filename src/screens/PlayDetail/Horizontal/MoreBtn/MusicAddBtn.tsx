import { useRef } from 'react'
import MusicAddModal, { type MusicAddModalType } from '@/components/MusicAddModal'
import playerState from '@/store/player/state'
import Btn from './Btn'
import { useI18n } from '@/lang'


export default () => {
  const t = useI18n()
  const musicAddModalRef = useRef<MusicAddModalType>(null)

  const handleShowMusicAddModal = () => {
    const musicInfo = playerState.playMusicInfo.musicInfo
    if (!musicInfo) return
    musicAddModalRef.current?.show({
      musicInfo: 'progress' in musicInfo ? musicInfo.metadata.musicInfo : musicInfo,
      isMove: false,
      listId: playerState.playMusicInfo.listId!,
    })
  }

  return (
    <>
      <Btn icon="add-music" label={t('list_add_title_first_add')} onPress={handleShowMusicAddModal} />
      <MusicAddModal ref={musicAddModalRef} />
    </>
  )
}
