import { useRef } from 'react'
import Btn from './Btn'
import PlayQueuePopup, { type PlayQueuePopupType } from '../../components/PlayQueuePopup'


/**
 * 横屏当前播放列表按钮
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
