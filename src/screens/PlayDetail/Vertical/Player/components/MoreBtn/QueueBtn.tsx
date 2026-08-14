import { memo, useCallback } from 'react'
import { pop } from '@/navigation'
import commonState from '@/store/common/state'
import Btn from './Btn'


/**
 * 播放队列入口
 * — 关闭详情页并跳转到当前列表中的播放位置
 * — 图标复用 list-order（队列感）
 */
const QueueBtn = () => {
  const handlePress = useCallback(() => {
    const id = commonState.componentIds.playDetail
    if (id) void pop(id)
    // 等页面退出动画后再跳转列表定位
    setTimeout(() => {
      global.app_event.jumpListPosition()
    }, 280)
  }, [])

  return <Btn icon="list-order" onPress={handlePress} />
}

export default memo(QueueBtn)
