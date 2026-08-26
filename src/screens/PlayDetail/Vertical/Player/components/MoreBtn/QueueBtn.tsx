import { useRef } from 'react'
import Btn from './Btn'
import PlayQueuePopup, { type PlayQueuePopupType } from '../../../../components/PlayQueuePopup'


/**
 * 当前播放列表按钮
 * 从底部弹出抽屉查看并切换当前播放列表
 */
export default () => {
  const popupRef = useRef<PlayQueuePopupType>(null)

  return (
    <>
      <Btn icon="playlist" onPress={() => { popupRef.current?.show() }} />
      <PlayQueuePopup ref={popupRef} />
    </>
  )
}
