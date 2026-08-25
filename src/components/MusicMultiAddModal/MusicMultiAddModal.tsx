import { forwardRef, useImperativeHandle, useRef, useState } from 'react'
import Popup, { type PopupType } from '@/components/common/Popup'
import { toast } from '@/utils/tools'
import List from '../MusicAddModal/List'
import { useI18n } from '@/lang'
import { addListMusics, moveListMusics } from '@/core/list'
import settingState from '@/store/setting/state'

export interface SelectInfo {
  selectedList: LX.Music.MusicInfo[]
  listId: string
  isMove: boolean
  // single: boolean
}
const initSelectInfo = { selectedList: [], listId: '', isMove: false }

export interface MusicMultiAddModalProps {
  onAdded?: () => void
}
export interface MusicMultiAddModalType {
  show: (info: SelectInfo) => void
}

export default forwardRef<MusicMultiAddModalType, MusicMultiAddModalProps>(({ onAdded }, ref) => {
  const t = useI18n()
  const popupRef = useRef<PopupType>(null)
  const [selectInfo, setSelectInfo] = useState<SelectInfo>(initSelectInfo)

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
      setSelectInfo({ ...selectInfo, selectedList: [] })
    })
  }

  const handleSelect = (listInfo: LX.List.MyListInfo) => {
    popupRef.current?.setVisible(false)
    if (selectInfo.isMove) {
      void moveListMusics(selectInfo.listId, listInfo.id,
        [...selectInfo.selectedList],
        settingState.setting['list.addMusicLocationType'],
      ).then(() => {
        onAdded?.()
        toast(t('list_edit_action_tip_move_success'))
      }).catch(() => {
        toast(t('list_edit_action_tip_move_failed'))
      })
    } else {
      void addListMusics(listInfo.id,
        [...selectInfo.selectedList],
        settingState.setting['list.addMusicLocationType'],
      ).then(() => {
        onAdded?.()
        toast(t('list_edit_action_tip_add_success'))
      }).catch(() => {
        toast(t('list_edit_action_tip_add_failed'))
      })
    }
  }

  const title = `${t(selectInfo.isMove ? 'list_multi_add_title_first_move' : 'list_multi_add_title_first_add')}${selectInfo.selectedList.length}${t('list_multi_add_title_last')}`

  return (
    <Popup ref={popupRef} title={title} onHide={handleHide}>
      {
        selectInfo.selectedList.length
          ? <List excludeListId={selectInfo.listId} onPress={handleSelect} />
          : null
      }
    </Popup>
  )
})
