import { memo, useEffect, useMemo, useState } from 'react'
import { View, StyleSheet, Image as RNImage } from 'react-native'
import ImageBackground from '@/components/common/ImageBackground'
import { defaultHeaders } from '@/components/common/Image'
import { usePlayerMusicInfo } from '@/store/player/hook'
import { useWindowSize } from '@/utils/hooks'
import { scaleSizeAbsHR } from '@/utils/pixelRatio'
import { Immersive } from '../../macOS'
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg'
import RecordArtwork from '@/components/common/RecordArtwork'

// 大模糊 — 封面色块自然铺满
const BLUR_RADIUS = Math.max(scaleSizeAbsHR(48), 28)

/**
 * 沉浸式封面氛围背景
 * — 仅一层均匀轻遮罩，保证白字可读
 * — 不再单独压暗底部，避免下半操作区看起来像一块底板
 */
export default memo(() => {
  const musicInfo = usePlayerMusicInfo()
  const { width, height } = useWindowSize()
  const [pic, setPic] = useState(musicInfo.pic)

  useEffect(() => { setPic(musicInfo.pic) }, [musicInfo.pic])

  const source = useMemo(() => {
    if (!pic) return null
    if (typeof pic == 'number') {
      return RNImage.resolveAssetSource(pic)
    }
    const uri = pic.startsWith('/') ? 'file://' + pic : pic
    return { uri, headers: defaultHeaders }
  }, [pic])

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {source
        ? (
            <ImageBackground
              style={{ width, height, backgroundColor: Immersive.fallback }}
              source={source}
              resizeMode="cover"
              blurRadius={BLUR_RADIUS}
              imageStyle={styles.image}
            >
              {/* 全屏均匀轻遮罩 — 无分区、无硬边 */}
              <View style={styles.overlay} />
            </ImageBackground>
          )
        : (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: Immersive.fallback }]}>
              <RecordArtwork seed={musicInfo.id ?? 'lx-player'} style={{ ...StyleSheet.absoluteFillObject, opacity: 0.16 }} />
            </View>
          )}
      <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" pointerEvents="none">
        <Defs>
          <LinearGradient id="player-scrim" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#0D1B10" stopOpacity={0.45} />
            <Stop offset="0.45" stopColor="#0D1B10" stopOpacity={0.56} />
            <Stop offset="1" stopColor="#0D1B10" stopOpacity={0.96} />
          </LinearGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#player-scrim)" />
      </Svg>
    </View>
  )
})

const styles = StyleSheet.create({
  image: {
    transform: [{ scale: 1.28 }],
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    // 比原先更轻，封面色更通透；且整屏一致，下半不会像面板
    backgroundColor: 'rgba(13,27,16,0.25)',
  },
})
