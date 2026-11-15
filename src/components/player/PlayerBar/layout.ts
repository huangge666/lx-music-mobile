import { PixelRatio } from 'react-native'
import { setSpText } from '@/utils/pixelRatio'

/** 封面、两行文字与 48dp 操作热区共用高度；大字号增加槽位，不裁切文本。 */
export const getMiniPlayerHeight = (wide = false) => Math.max(
  wide ? 62 : 56,
  Math.ceil((setSpText(14) * 1.2 + setSpText(12) * 1.2) * PixelRatio.getFontScale()) + 16,
)
