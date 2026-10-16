import { useCallback } from 'react'
import { useHorizontalMode } from '@/utils/hooks'
import Vertical from './Vertical'
import Horizontal from './Horizontal'
import { useBackHandler } from '@/utils/hooks/useBackHandler'
import commonState from '@/store/common/state'
import { closeLeaderboard } from '@/core/common'
// import { AppColors } from '@/theme'

export default () => {
  const isHorizontalMode = useHorizontalMode()

  // 排行榜是「浏览」的覆盖页：系统返回回到浏览。
  // 榜单抽屉打开时，由 Vertical 里更晚注册的处理器先关闭抽屉；
  // BackHandler 按注册逆序派发，返回 true 后不会再走到这里。
  useBackHandler(useCallback(() => {
    // 歌单/播放详情压在栈顶时交给它们处理，不抢返回
    if (Object.keys(commonState.componentIds).length > 1) return false
    if (commonState.navActiveId != 'nav_top') return false
    closeLeaderboard()
    return true
  }, []))

  return isHorizontalMode
    ? <Horizontal />
    : <Vertical />
}
