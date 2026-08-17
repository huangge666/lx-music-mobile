import { forwardRef, memo, useEffect, useImperativeHandle, useState } from 'react'
import { Platform, View } from 'react-native'
import { BorderRadius } from '@/theme'
import ButtonBar from './ActionBar'
import { useNavigationComponentDidAppear } from '@/navigation'
import { NAV_SHEAR_NATIVE_IDS } from '@/config/constant'
import { scaleSizeW } from '@/utils/pixelRatio'
import { useTheme } from '@/store/theme/hook'
import Text, { AnimatedText } from '@/components/common/Text'
import { createStyle } from '@/utils/tools'
import Image from '@/components/common/Image'
import { useListInfo } from './state'
import { useAnimateOnecNumber } from '@/utils/hooks/useAnimateNumber'
import { useStatusbarHeight } from '@/store/common/hook'

const IMAGE_WIDTH = scaleSizeW(148)

const CountText = memo(({ count }: { count: string }) => {
  const [animFade] = useAnimateOnecNumber(0, 1, 250, false)
  const [animTranslateY] = useAnimateOnecNumber(10, 0, 250, false)
  return (
    <AnimatedText style={{
      ...styles.playCount,
      opacity: animFade,
      transform: [
        { translateY: animTranslateY },
      ],
    }} numberOfLines={ 1 }>{count}</AnimatedText>
  )
}, (prevProps, nextProps) => {
  return true
})

const Pic = ({ componentId, playCount, imgUrl }: {
  componentId: string
  playCount: string
  imgUrl?: string
}) => {
  const [pic, setPic] = useState(imgUrl)
  const [animated, setAnimated] = useState(false)
  const info = useListInfo()
  const theme = useTheme()
  useEffect(() => {
    if (animated) setPic(imgUrl)
  }, [imgUrl, animated])

  useNavigationComponentDidAppear(componentId, () => {
    setAnimated(true)
  })

  return (
    <View style={styles.coverFrame}>
      <View style={{ ...styles.listItemImg, width: IMAGE_WIDTH, height: IMAGE_WIDTH, backgroundColor: theme['c-card-background'] }}>
        <Image nativeID={`${NAV_SHEAR_NATIVE_IDS.songlistDetail_pic}_to_${info.id}`} url={pic} style={{ flex: 1, borderRadius: BorderRadius.large }} />
        {
          playCount && animated
            ? (
                <View style={styles.playCountContent}>
                  <View style={styles.playCountDot} />
                  <CountText count={playCount} />
                </View>
              )
            : null
        }
      </View>
      <View style={{ ...styles.coverGlow, backgroundColor: theme['c-primary-alpha-800'] }} />
    </View>
  )
}

export interface HeaderProps {
  componentId: string
}

export interface HeaderType {
  setInfo: (info: DetailInfo) => void
}
export interface DetailInfo {
  name: string
  desc: string
  playCount: string
  imgUrl?: string
}

export default forwardRef<HeaderType, HeaderProps>(({ componentId }: { componentId: string }, ref) => {
  const statusBarHeight = useStatusbarHeight()
  const theme = useTheme()
  const info = useListInfo()
  const [detailInfo, setDetailInfo] = useState<DetailInfo>({ name: '', desc: '', playCount: '', imgUrl: info.img })

  useImperativeHandle(ref, () => ({
    setInfo(info) {
      setDetailInfo(info)
    },
  }), [])

  return (
    <View style={{ ...styles.container, paddingTop: statusBarHeight + 16 }}>
      <View style={styles.ambientContent} pointerEvents="none">
        <View style={{ ...styles.ambientPrimary, backgroundColor: theme['c-primary-alpha-800'] }} />
        <View style={{ ...styles.ambientSecondary, backgroundColor: theme['c-primary-alpha-900'] }} />
      </View>
      <View style={styles.hero}>
        <Pic componentId={componentId} playCount={detailInfo.playCount} imgUrl={detailInfo.imgUrl} />
        <View style={styles.info} nativeID={NAV_SHEAR_NATIVE_IDS.songlistDetail_title}>
          <View style={{ ...styles.eyebrow, backgroundColor: theme['c-primary-background'], borderColor: theme['c-primary-alpha-700'] }}>
            <View style={{ ...styles.eyebrowDot, backgroundColor: theme['c-primary'] }} />
            <Text size={11} color={theme['c-primary-font']}>{info.source.toUpperCase()} · PLAYLIST</Text>
          </View>
          <Text style={styles.title} numberOfLines={2}>{detailInfo.name || info.name}</Text>
          <Text style={styles.description} size={13} color={theme['c-font-label']} numberOfLines={3}>{detailInfo.desc || info.desc}</Text>
        </View>
      </View>
      <ButtonBar />
    </View>
  )
})

const styles = createStyle({
  container: {
    position: 'relative',
    paddingHorizontal: 20,
    paddingBottom: 24,
    overflow: 'hidden',
  },
  ambientContent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 260,
    overflow: 'hidden',
  },
  ambientPrimary: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    top: -120,
    right: -70,
    opacity: 0.7,
  },
  ambientSecondary: {
    position: 'absolute',
    width: 190,
    height: 190,
    borderRadius: 95,
    top: 70,
    left: -100,
    opacity: 0.55,
  },
  hero: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingTop: 12,
  },
  coverFrame: {
    position: 'relative',
    width: IMAGE_WIDTH,
    height: IMAGE_WIDTH + 8,
    flexGrow: 0,
    flexShrink: 0,
  },
  coverGlow: {
    position: 'absolute',
    left: 15,
    right: 15,
    bottom: 0,
    height: 24,
    borderRadius: 18,
    opacity: 0.9,
  },
  listItemImg: {
    zIndex: 1,
    borderRadius: BorderRadius.large,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.24,
        shadowRadius: 18,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  playCountContent: {
    position: 'absolute',
    left: 10,
    bottom: 10,
    height: 27,
    paddingHorizontal: 10,
    borderRadius: 14,
    backgroundColor: 'rgba(8, 8, 10, 0.66)',
    flexDirection: 'row',
    alignItems: 'center',
  },
  playCountDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    marginRight: 6,
    backgroundColor: '#fff',
  },
  playCount: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
  },
  info: {
    flexGrow: 1,
    flexShrink: 1,
    paddingLeft: 18,
    paddingBottom: 4,
    alignItems: 'flex-start',
  },
  eyebrow: {
    minHeight: 25,
    borderRadius: 13,
    borderWidth: 0.5,
    paddingHorizontal: 9,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  eyebrowDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    marginRight: 6,
  },
  title: {
    fontSize: 25,
    lineHeight: 31,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  description: {
    lineHeight: 19,
    marginTop: 8,
  },
})
