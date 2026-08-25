import { forwardRef, useImperativeHandle, useRef, useState } from 'react'
import Popup, { type PopupType } from '@/components/common/Popup'
import { toast } from '@/utils/tools'
import List from './List'
import { useI18n } from '@/lang'
import { addListMusics, moveListMusics } from '@/core/list'
import settingState from '@/store/setting/state'

export interface SelectInfo {
  musicInfo: LX.Music.MusicInfo | null
  listId: string
  isMove: boolean
  // single: boolean
}
const initSelectInfo = {}

export interface MusicAddModalProps {
  onAdded?: () => void
}
export interface MusicAddModalType {
  show: (info: SelectInfo) => void
}

export default forwardRef<MusicAddModalType, MusicAddModalProps>(({ onAdded }, ref) => {
  const t = useI18n()
  const popupRef = useRef<PopupType>(null)
  const [selectInfo, setSelectInfo] = useState<SelectInfo>(initSelectInfo as SelectInfo)

  useImperativeHandle(ref, () => ({
    show(info) {
      setSelectInfo(info)

      requestAnimationFrame(() => {
        popupRef.current?.setVisible(true)
      })
    },
  }))

  const handleHide = () => {
    requestAnimationFrame(() => {
      setSelectInfo({ ...selectInfo, musicInfo: null })
    })
  }

  const handleSelect = (listInfo: LX.List.MyListInfo) => {
    popupRef.current?.setVisible(false)
    if (selectInfo.isMove) {
      void moveListMusics(selectInfo.listId, listInfo.id,
        [selectInfo.musicInfo!],
        settingState.setting['list.addMusicLocationType'],
      ).then(() => {
        onAdded?.()
        toast(t('list_edit_action_tip_move_success'))
      }).catch(() => {
        toast(t('list_edit_action_tip_move_failed'))
      })
    } else {
      void addListMusics(listInfo.id,
        [selectInfo.musicInfo!],
        settingState.setting['list.addMusicLocationType'],
      ).then(() => {
        onAdded?.()
        toast(t('list_edit_action_tip_add_success'))
      }).catch(() => {
        toast(t('list_edit_action_tip_add_failed'))
      })
    }
  }

  const title = t(selectInfo.isMove ? 'list_add_title_first_move' : 'list_add_title_first_add') + t('list_add_title_last')

  return (
    <Popup
      ref={popupRef}
      title={title}
      subtitle={selectInfo.musicInfo?.name}
      onHide={handleHide}
    >
      {
        selectInfo.musicInfo
          ? <List musicInfo={selectInfo.musicInfo} onPress={handleSelect} />
          : null
      }
    </Popup>
  )
})
