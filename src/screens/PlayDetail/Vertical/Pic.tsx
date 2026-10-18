import { useCallback, useEffect, useMemo, useState } from 'react'
import { View, TouchableOpacity, Platform, type LayoutChangeEvent } from 'react-native'
import { createStyle } from '@/utils/tools'
import { usePlayerMusicInfo } from '@/store/player/hook'
import { useWindowSize } from '@/utils/hooks'
import { NAV_SHEAR_NATIVE_IDS } from '@/config/constant'
import { useNavigationComponentDidAppear } from '@/navigation'
import { HEADER_HEIGHT } from './components/Header'
import Image from '@/components/common/Image'
import { Icon } from '@/components/common/Icon'
import { useI18n } from '@/lang'
import { useStatusbarHeight } from '@/store/common/hook'
import commonState from '@/store/common/state'
import { Immersive, MacSpacing } from '../macOS'
import { fitCoverSize, getCoverRadius, getPreferredCoverSize } from './coverSize'


/**
 * Apple Music 风格大封面
 * — 尺寸由页面实测可用空间决定（设计比例只作上限），小屏/大字号不会挤出控制区
 * — 大圆角矩形 + 深色长投影营造立体悬浮感
 * — 无封面或封面加载失败时用同尺寸占位，保持共享元素的落点稳定
 * — 点击切换到歌词页（必填 onPress）
 */
export default ({ componentId, onPress }: {
  componentId: string
  /** 点击封面 → 切换歌词页 */
  onPress: () => void
}) => {
  const t = useI18n()
  const musicInfo = usePlayerMusicInfo()
  const { width: winWidth, height: winHeight } = useWindowSize()
  const statusBarHeight = useStatusbarHeight()

  const [animated, setAnimated] = useState(!!commonState.componentIds.playDetail)
  const [pic, setPic] = useState(musicInfo.pic)
  // 封面加载失败后不再继续等图，直接落到占位，避免留一块空白
  const [failed, setFailed] = useState(false)
  // 封面容器实测尺寸：flex:1 的容器由剩余空间决定，不会反过来被封面撑大
  const [box, setBox] = useState<{ width: number, height: number } | null>(null)

  useEffect(() => {
    if (animated) setPic(musicInfo.pic)
  }, [musicInfo.pic, animated])

  useEffect(() => {
    setFailed(false)
  }, [pic])

  useNavigationComponentDidAppear(componentId, () => {
    setAnimated(true)
  })

  const handleLayout = useCallback(({ nativeEvent }: LayoutChangeEvent) => {
    const { width, height } = nativeEvent.layout
    setBox(prev => {
      if (prev && Math.abs(prev.width - width) < 1 && Math.abs(prev.height - height) < 1) return prev
      return { width, height }
    })
  }, [])

  const preferredSize = useMemo(
    () => getPreferredCoverSize(winWidth, winHeight, statusBarHeight, HEADER_HEIGHT),
    [statusBarHeight, winHeight, winWidth],
  )
  // 首帧（含共享元素转场捕获）先用设计基准值，实测后再按可用空间收敛
  const size = box
    ? fitCoverSize(preferredSize, box.width, box.height, MacSpacing.xxl, MacSpacing.md)
    : preferredSize
  const radius = getCoverRadius(size)

  const shadowStyle = useMemo(() => {
    return Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: Math.round(size * 0.06) },
        shadowOpacity: 0.45,
        shadowRadius: Math.max(24, Math.round(size * 0.1)),
      },
      android: {
        elevation: animated && size > 0 ? 18 : 0,
        // Android elevation 阴影色
        shadowColor: '#000',
      },
      default: {},
    }) as object
  }, [animated, size])

  const coverStyle = useMemo(() => ({ width: size, height: size, borderRadius: radius }), [radius, size])
  const showCover = !failed && !!pic && size > 0

  return (
    <View style={styles.container} onLayout={handleLayout}>
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={onPress}
        disabled={size <= 0}
        accessibilityRole="button"
        accessibilityLabel={t('player_show_lyrics')}
        style={[styles.shadowWrap, { borderRadius: radius }, shadowStyle]}
      >
        {showCover
          ? (
              <Image
                url={pic}
                nativeID={NAV_SHEAR_NATIVE_IDS.playDetail_pic}
                style={coverStyle}
                onError={() => { setFailed(true) }}
              />
            )
          : null}
        {/* 占位与真实封面同尺寸：无封面/坏图时不改变控制区位置，也不会留下空洞 */}
        {showCover
          ? null
          : (
              <View style={[styles.placeholder, coverStyle]}>
                <Icon
                  name="music"
                  color={Immersive.textTertiary}
                  rawSize={Math.max(24, Math.round(size * 0.26))}
                />
              </View>
            )}
      </TouchableOpacity>
    </View>
  )
}

const styles = createStyle({
  container: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shadowWrap: {
    // iOS 阴影要靠自身背景才有形状；封面本身是贴图，这里只兜一层透明底
    backgroundColor: 'transparent',
  },
  placeholder: {
    backgroundColor: Immersive.glass,
    borderWidth: 0.5,
    borderColor: Immersive.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
