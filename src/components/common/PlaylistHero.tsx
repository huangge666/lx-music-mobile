import { memo, useCallback, useMemo, useState, type ComponentProps, type ReactNode } from 'react'
import {
  StyleSheet,
  TouchableOpacity,
  View,
  type LayoutChangeEvent,
  type NativeSyntheticEvent,
  type StyleProp,
  type TextLayoutEventData,
  type ViewStyle,
} from 'react-native'

import Image from './Image'
import Loading from './Loading'
import Text from './Text'
import RecordArtwork from './RecordArtwork'
import { Icon } from './Icon'
import { getPlaylistCoverTint, getPlaylistInitial } from './playlistCover'
import { useTheme } from '@/store/theme/hook'
import { getOnAccentColor } from '@/theme/themes/palette'
import { BorderRadius } from '@/theme'
import { scaleSizeW } from '@/utils/pixelRatio'
import { createStyle } from '@/utils/tools'
import { useHorizontalMode } from '@/utils/hooks'

export type PlaylistHeroStatus = 'idle' | 'loading' | 'error'

export interface PlaylistHeroProps {
  title: string
  /** 封面地址；为空、加载失败时使用派生占位，不留空档 */
  coverUrl?: string | null
  /** 共享元素封面 id（在线歌单详情转场用） */
  coverNativeID?: string
  /** 共享元素标题 id */
  titleNativeID?: string
  /** 封面上的附加信息（例如播放量），由调用方提供渲染 */
  coverBadge?: ReactNode
  /** 无封面时的占位：按 seed 派生稳定色相 */
  placeholderSeed?: string
  /** 无封面时的占位文字（通常是标题首字），留空则只用图标 */
  placeholderText?: string
  placeholderIcon?: ComponentProps<typeof Icon>['name']
  /** 已本地化的次要信息，例如「32 首 · 作者 · kw」 */
  meta?: string | null
  description?: string | null
  expandText?: string
  collapseText?: string
  status?: PlaylistHeroStatus
  statusText?: string
  onRetry?: () => void
  /** 当前播放模式是否为随机，仅用于展示，不在这里切换模式 */
  shuffleActive?: boolean
  /** 播放/随机动作进行中，禁止重复点击 */
  busy?: boolean
  /** 数据不可用（例如空歌单）时禁用动作按钮 */
  disabled?: boolean
  isCollected?: boolean
  onPlay?: () => void
  onShuffle?: () => void
  onCollect?: () => void
  onMore?: () => void
  playLabel?: string
  shuffleLabel?: string
  collectLabel?: string
  moreLabel?: string
  style?: StyleProp<ViewStyle>
}

const COVER_RATIO = 0.56
const COVER_MIN = 128
const COVER_MAX = 210
const coverImageStyle = StyleSheet.absoluteFillObject

/** 次要操作使用独立的 48dp 热区，避免相邻按钮的点按区域重叠。 */
const CircleButton = ({
  icon,
  label,
  onPress,
  disabled,
  active,
  selected,
}: {
  icon: ComponentProps<typeof Icon>['name']
  label?: string
  onPress: () => void
  disabled?: boolean
  active?: boolean
  selected?: boolean
}) => {
  const theme = useTheme()
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.72}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled, selected: !!selected }}
      style={[
        styles.actionCircle,
        {
          backgroundColor: active ? theme['c-accent-soft'] : theme['c-primary-input-background'],
          opacity: disabled ? 0.5 : 1,
        },
      ]}
    >
      <Icon name={icon} size={20} color={active ? theme['c-accent'] : theme['c-font']} />
    </TouchableOpacity>
  )
}

/**
 * 歌单主视觉（我的歌单详情、在线歌单详情共用）。
 *
 * 只接收展示数据与回调，不订阅播放器或歌单 store；页面动作（播放全部、真实随机、收藏）
 * 留在各自的页面/动作层，两个详情页都能用同一套排版。
 * 组件本身用于歌曲 FlatList 的 ListHeaderComponent，随列表一起滚走，高度由列表外层 wrapper 测量。
 */
const PlaylistHero = ({
  title,
  coverUrl,
  coverNativeID,
  titleNativeID,
  coverBadge,
  placeholderSeed,
  placeholderText,
  placeholderIcon,
  meta,
  description,
  expandText,
  collapseText,
  status = 'idle',
  statusText,
  onRetry,
  shuffleActive = false,
  busy = false,
  disabled: disabledProp = false,
  isCollected = false,
  onPlay,
  onShuffle,
  onCollect,
  onMore,
  playLabel,
  shuffleLabel,
  collectLabel,
  moreLabel,
  style,
}: PlaylistHeroProps) => {
  const theme = useTheme()
  const [width, setWidth] = useState(0)
  const landscape = useHorizontalMode()
  const [descExpanded, setDescExpanded] = useState(false)
  const [descOverflow, setDescOverflow] = useState(false)

  const handleLayout = useCallback((e: LayoutChangeEvent) => {
    const nextWidth = e.nativeEvent.layout.width
    setWidth(prev => Math.abs(prev - nextWidth) > 0.5 ? nextWidth : prev)
  }, [])

  // onLayout 得到的是实际尺寸，不能再交给 scaleSizeW/H 二次缩放
  // 横屏以有限的高度为预算，首屏必须同时露出歌曲，而不只是放大封面。
  const coverSize = width > 0
    ? landscape ? 104 : Math.round(Math.min(Math.max(width * COVER_RATIO, COVER_MIN), COVER_MAX))
    : 0

  const tint = useMemo(() => getPlaylistCoverTint(placeholderSeed ?? title), [placeholderSeed, title])
  const initial = placeholderText ?? getPlaylistInitial(title)
  // 强调色上的文字与内容区分开取色，保证浅色和深色按钮都有足够对比度。
  const onPrimaryColor = getOnAccentColor(theme.isDark)
  const disabled = busy || disabledProp || status === 'loading'
  const showLoading = status === 'loading'
  const showError = status === 'error'

  const handleDescOverflow = useCallback((e: NativeSyntheticEvent<TextLayoutEventData>) => {
    setDescOverflow(e.nativeEvent.lines.length > 2)
  }, [])

  return (
    <View style={[styles.container, landscape ? compactStyles.container : null, style]} onLayout={handleLayout}>
      <View style={styles.ambient} pointerEvents="none">
        <RecordArtwork seed={placeholderSeed ?? title} style={styles.ambientRecord} />
      </View>
      <View style={landscape || width > 580 ? styles.wide : null}>
        <View
        style={[
          styles.coverFrame,
          { width: coverSize, height: coverSize, borderColor: theme['c-glass-border'] },
        ]}
      >
        <View style={[styles.cover, { backgroundColor: tint.backgroundColor }]}>
          <RecordArtwork seed={placeholderSeed ?? title} style={StyleSheet.absoluteFill} />
          {placeholderIcon != null
            ? <Icon name={placeholderIcon} rawSize={Math.max(coverSize * 0.22, 18)} color={tint.color} />
            : initial
              ? <Text style={styles.coverInitial} color={tint.color} numberOfLines={1}>{initial}</Text>
              : <Icon name="music" rawSize={Math.max(coverSize * 0.22, 18)} color={tint.color} />}
          {coverUrl
            ? <Image url={coverUrl} nativeID={coverNativeID} style={coverImageStyle} />
            : null}
          {showLoading
            ? (
                <View style={styles.coverScrim}>
                  <Loading size={18} color="#fff" />
                </View>
              )
            : null}
          {coverBadge
            ? <View style={styles.coverBadge} pointerEvents="none">{coverBadge}</View>
            : null}
        </View>
        </View>

        <View style={[styles.info, landscape || width > 580 ? styles.wideInfo : null]}>
        <Text
          nativeID={titleNativeID}
          style={styles.title}
          size={landscape ? 23 : 28}
          accessibilityRole="header"
          color={theme['c-font']}
          numberOfLines={2}
        >{title}</Text>
        {meta
          ? <Text style={styles.meta} size={13} color={theme['c-font-label']} numberOfLines={2}>{meta}</Text>
          : null}
        {description
          ? (
              <View style={styles.descriptionWrap}>
                {/* Android 的截断文本只回报两行；独立测量全文才知道是否需要展开入口。 */}
                <Text style={styles.descriptionMeasure} size={14} accessible={false} importantForAccessibility="no-hide-descendants"
                  onTextLayout={handleDescOverflow}>{description}</Text>
                <Text
                  style={styles.description}
                  size={14}
                  color={theme['c-font-label']}
                  numberOfLines={descExpanded ? undefined : 2}
                >
                  {description}
                </Text>
                {descOverflow
                  ? (
                      <TouchableOpacity
                        style={styles.descriptionToggle}
                        activeOpacity={0.7}
                        onPress={() => { setDescExpanded(expanded => !expanded) }}
                        accessibilityRole="button"
                        accessibilityState={{ expanded: descExpanded }}
                      >
                        <Text size={14} color={theme['c-accent']}>{descExpanded ? collapseText : expandText}</Text>
                        <Icon name={descExpanded ? 'chevron-up' : 'chevron-down'} size={16} color={theme['c-accent']} />
                      </TouchableOpacity>
                    )
                  : null}
              </View>
            )
          : null}
        {showError && statusText
          ? (
              <TouchableOpacity
                onPress={onRetry}
                disabled={!onRetry}
                activeOpacity={0.7}
                accessibilityRole={onRetry ? 'button' : undefined}
              >
                <Text style={styles.statusText} size={13} color={theme['c-danger']} numberOfLines={2}>{statusText}</Text>
              </TouchableOpacity>
            )
          : null}
        </View>
      </View>

      <View style={[styles.actions, landscape ? compactStyles.actions : null]}>
        {onPlay
          ? (
              <TouchableOpacity
                onPress={onPlay}
                disabled={disabled}
                activeOpacity={0.78}
                accessibilityRole="button"
                accessibilityLabel={playLabel}
                accessibilityState={{ disabled }}
                style={[styles.playButton, {
                  backgroundColor: theme['c-accent'],
                  opacity: disabled ? 0.5 : 1,
                }]}
              >
                {busy
                  ? <Loading size={16} color={onPrimaryColor} />
                  : <Icon name="play" size={17} color={onPrimaryColor} />}
                {playLabel
                  ? <Text style={styles.playLabel} size={15} color={onPrimaryColor} numberOfLines={1}>{playLabel}</Text>
                  : null}
              </TouchableOpacity>
            )
          : null}
        {onShuffle
          ? (
              <CircleButton
                icon="list-random"
                label={shuffleLabel}
                onPress={onShuffle}
                disabled={disabled}
                active={shuffleActive}
                selected={shuffleActive}
              />
            )
          : null}
        {onCollect
          ? (
              <CircleButton
                icon="love"
                label={collectLabel}
                onPress={onCollect}
                disabled={busy}
                active={isCollected}
                selected={isCollected}
              />
            )
          : null}
        {onMore
          ? (
              <CircleButton
                icon="dots-vertical"
                label={moreLabel}
                onPress={onMore}
                disabled={busy}
              />
            )
          : null}
      </View>
    </View>
  )
}

export default memo(PlaylistHero)

const styles = createStyle({
  container: {
    position: 'relative',
    width: '100%',
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 28,
    overflow: 'hidden',
  },
  ambient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 320,
    overflow: 'hidden',
  },
  ambientRecord: {
    position: 'absolute',
    width: 320,
    height: 320,
    top: -20,
    right: -150,
    opacity: 0.08,
  },
  coverFrame: {
    alignSelf: 'flex-start',
    borderRadius: BorderRadius.large,
    borderWidth: 0.5,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.24,
    shadowRadius: 18,
  },
  cover: {
    flex: 1,
    borderRadius: BorderRadius.large,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  coverInitial: {
    // createStyle 会对 fontSize 走 setSpText，这里写设计值，避免二次缩放
    fontSize: 42,
    fontWeight: '700',
    letterSpacing: -1,
    includeFontPadding: false,
  },
  coverScrim: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(8, 8, 10, 0.4)',
  },
  coverBadge: {
    position: 'absolute',
    left: 10,
    bottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  info: {
    paddingTop: 20,
    alignItems: 'flex-start',
  },
  wide: { flexDirection: 'row', alignItems: 'center', gap: 28 },
  wideInfo: { flex: 1, paddingTop: 0 },
  title: {
    fontWeight: '800',
    letterSpacing: -0.9,
  },
  meta: {
    marginTop: 5,
    fontWeight: '500',
  },
  descriptionWrap: { width: '100%' },
  descriptionMeasure: { position: 'absolute', left: 0, right: 0, opacity: 0, lineHeight: 21 },
  description: {
    lineHeight: 21,
    marginTop: 10,
  },
  descriptionToggle: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
  },
  statusText: {
    marginTop: 8,
    fontWeight: '600',
  },
  actions: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 10,
    paddingTop: 20,
  },
  playButton: {
    flexGrow: 1,
    flexShrink: 1,
    maxWidth: scaleSizeW(300),
    minHeight: 48,
    paddingHorizontal: 18,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  playLabel: {
    fontWeight: '700',
  },
  actionCircle: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
})

// 原生 onLayout 的尺寸是 dp；横屏紧凑布局不再按屏幕宽度放大。
const compactStyles = StyleSheet.create({
  container: { paddingTop: 8, paddingBottom: 16 },
  actions: { paddingTop: 12 },
})
