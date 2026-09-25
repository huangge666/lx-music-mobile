import { forwardRef, memo, useEffect, useImperativeHandle, useState } from 'react'
import { Platform, TouchableOpacity, View, type NativeSyntheticEvent, type TextLayoutEventData } from 'react-native'
import { useI18n } from '@/lang'
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

const IMAGE_WIDTH = scaleSizeW(168)

/** 接口简介里的换行标签按真实换行展示，避免页面直接露出 br 标签。 */
const formatDescription = (desc: string) => desc
  .replace(/<br\s*\/?>/gi, '\n')
  .replace(/<\/p>\s*<p[^>]*>/gi, '\n')
  .replace(/<\/?p[^>]*>/gi, '')
  .replace(/&nbsp;/gi, ' ')
  .trim()

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
        <Image nativeID={`${NAV_SHEAR_NATIVE_IDS.songlistDetail_pic}_to_${info?.id ?? ''}`} url={pic} style={{ flex: 1, borderRadius: BorderRadius.large }} />
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
  total?: number
}

export default forwardRef<HeaderType, HeaderProps>(({ componentId }: { componentId: string }, ref) => {
  const theme = useTheme()
  const t = useI18n()
  const info = useListInfo()
  const [detailInfo, setDetailInfo] = useState<DetailInfo>({ name: '', desc: '', playCount: '', imgUrl: info?.img, total: 0 })
  const [descExpanded, setDescExpanded] = useState(false)
  const [descOverflow, setDescOverflow] = useState(false)
  const songCount = detailInfo.total || Number(info?.total) || 0
  const description = formatDescription(detailInfo.desc || info?.desc || '')

  useImperativeHandle(ref, () => ({
    setInfo(info) {
      setDetailInfo(info)
      setDescExpanded(false)
      setDescOverflow(false)
    },
  }), [])

  return (
    <View style={styles.container}>
      <View style={styles.ambientContent} pointerEvents="none">
        <View style={{ ...styles.ambientPrimary, backgroundColor: theme['c-primary-alpha-800'] }} />
        <View style={{ ...styles.ambientSecondary, backgroundColor: theme['c-primary-alpha-900'] }} />
      </View>
      <View style={styles.hero}>
        <Pic componentId={componentId} playCount={detailInfo.playCount} imgUrl={detailInfo.imgUrl} />
        <View style={styles.info} nativeID={NAV_SHEAR_NATIVE_IDS.songlistDetail_title}>
          <Text style={styles.title} numberOfLines={2}>{detailInfo.name || info?.name}</Text>
          {songCount > 0
            ? <Text style={styles.count} size={13} color={theme['c-font-label']}>{t('list_music_count', { num: songCount })}</Text>
            : null}
          {description
            ? (
                <TouchableOpacity
                  activeOpacity={descOverflow ? 0.7 : 1}
                  disabled={!descOverflow}
                  onPress={() => { setDescExpanded(expanded => !expanded) }}
                >
                  <Text
                    style={styles.description}
                    size={13}
                    color={theme['c-font-label']}
                    numberOfLines={descExpanded ? undefined : 2}
                    onTextLayout={(event: NativeSyntheticEvent<TextLayoutEventData>) => {
                      if (!descExpanded && event.nativeEvent.lines.length > 2) setDescOverflow(true)
                    }}
                  >
                    {description}
                    {descOverflow
                      ? <Text size={13} color={theme['c-primary']}>{'  '}{t(descExpanded ? 'collapse' : 'expand')}</Text>
                      : null}
                  </Text>
                </TouchableOpacity>
              )
            : null}
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
    paddingTop: 8,
    paddingBottom: 18,
    overflow: 'hidden',
  },
  ambientContent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 220,
    overflow: 'hidden',
  },
  ambientPrimary: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    top: -140,
    right: -70,
    opacity: 0.7,
  },
  ambientSecondary: {
    position: 'absolute',
    width: 190,
    height: 190,
    borderRadius: 95,
    top: 40,
    left: -100,
    opacity: 0.55,
  },
  hero: {
    alignItems: 'center',
    paddingTop: 6,
  },
  coverFrame: {
    width: IMAGE_WIDTH,
    height: IMAGE_WIDTH,
    flexGrow: 0,
    flexShrink: 0,
  },
  listItemImg: {
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
    width: '100%',
    paddingTop: 16,
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '700',
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  count: {
    marginTop: 4,
    fontWeight: '600',
  },
  description: {
    lineHeight: 19,
    marginTop: 6,
    textAlign: 'center',
  },
})
