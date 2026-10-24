import { useHorizontalMode } from '@/utils/hooks'
import Vertical from './Vertical'
import Horizontal from './Horizontal'

/**
 * 排行榜（Phase 7 起是第四个主标签，不再是「浏览」的覆盖页）。
 * 因此这里不再注册「系统返回回到浏览」的处理器：
 * 榜单抽屉的返回由 Vertical 自己处理，其余返回交给页面栈。
 */
export default () => {
  const isHorizontalMode = useHorizontalMode()

  return isHorizontalMode
    ? <Horizontal />
    : <Vertical />
}
