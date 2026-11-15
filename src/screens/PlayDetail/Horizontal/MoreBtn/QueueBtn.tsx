import { useRef } from 'react'
import Btn from './Btn'
import PlayQueuePopup, { type PlayQueuePopupType } from '../../components/PlayQueuePopup'
import { useI18n } from '@/lang'


/**
 * 横屏当前播放列表按钮
 */
export default () => {
  const t = useI18n()
  const popupRef = useRef<PlayQueuePopupType>(null)

  return (
    <>
      <Btn icon="playlist" label={t('play_detail_queue')} onPress={() => { popupRef.current?.show() }} />
      <PlayQueuePopup ref={popupRef} />
    </>
  )
}
