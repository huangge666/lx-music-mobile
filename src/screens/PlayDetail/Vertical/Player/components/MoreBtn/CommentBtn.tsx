import Btn from './Btn'
import { navigations } from '@/navigation'
import { useI18n } from '@/lang'
import { usePlayMusicInfo } from '@/store/player/hook'
import commonState from '@/store/common/state'


/**
 * 沉浸式评论按钮 — 评论页需要当前歌曲，没有曲目时置灰
 */
export default () => {
  const t = useI18n()
  const { musicInfo } = usePlayMusicInfo()

  const handleShowCommentScreen = () => {
    navigations.pushCommentScreen(commonState.componentIds.playDetail!)
  }

  return (
    <Btn
      icon="comment"
      label={t('play_detail_action_comment')}
      disabled={!musicInfo}
      onPress={handleShowCommentScreen}
    />
  )
}
