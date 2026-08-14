// import { useLrcPlay } from '@/plugins/lyric'
import { useStatusText } from '@/store/player/hook'
import Text from '@/components/common/Text'
import { useTheme } from '@/store/theme/hook'
import { MacFontSize } from '../../macOS'


/**
 * macOS 风格横屏状态文本
 *
 * — 13pt 系统字体
 * — c-450 灰阶（不抢夺焦点）
 * — 单行截断
 */
export default () => {
  const theme = useTheme()
  const statusText = useStatusText()

  return (
    <Text numberOfLines={1} size={MacFontSize.footnote} color={theme['c-450']}>
      {statusText}
    </Text>
  )
}
